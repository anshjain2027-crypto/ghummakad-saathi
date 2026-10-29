import { NextResponse, type NextRequest } from "next/server";
import { asService, one } from "@/lib/db";
import { verifyDodoWebhook } from "@/lib/payments/dodo";
import { fulfillOrder, markOrderStatus, recordPaymentEvent } from "@/lib/payments/orders";

/**
 * Dodo Payments webhook (Standard Webhooks). Signature is verified over the
 * raw body; every event id is stored once (replays are no-ops); access is
 * granted only via the idempotent fulfillOrder().
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  let event;
  try {
    event = verifyDodoWebhook(raw, request.headers);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const eventId = request.headers.get("webhook-id") ?? `${event.type}:${event.data?.payment_id ?? "unknown"}`;
  const claimedOrderId = String(event.data?.metadata?.order_id ?? "");
  const order = /^[0-9a-f-]{36}$/i.test(claimedOrderId)
    ? await asService((q) => one<{ id: string; status: string }>(q, `select id, status from public.payment_order where id = $1 and provider = 'dodo'`, [claimedOrderId]))
    : undefined;

  const { duplicate } = await recordPaymentEvent({
    provider: "dodo",
    eventId,
    orderId: order?.id ?? null,
    type: event.type,
    signatureValid: true,
    payload: event,
  });
  if (duplicate) return NextResponse.json({ ok: true, duplicate: true });
  if (!order) return NextResponse.json({ ok: true, ignored: "no matching order" });

  try {
    if (event.type === "payment.succeeded" && event.data.status === "succeeded") {
      await fulfillOrder(order.id, {
        providerPaymentId: event.data.payment_id,
        paidAt: new Date(event.timestamp ?? Date.now()),
        source: "webhook",
        amountPaise: event.data.total_amount,
        productId: event.data.product_cart?.[0]?.product_id ?? null,
      });
    } else if (event.type === "payment.failed") {
      await markOrderStatus(order.id, "failed", "Provider reported failure");
    } else if (event.type === "payment.cancelled") {
      await markOrderStatus(order.id, "cancelled", "Provider reported cancellation");
    } else if (event.type === "payment.processing") {
      await markOrderStatus(order.id, "pending", null);
    }
  } catch (e) {
    console.error("dodo webhook", e);
    // 200 so the provider doesn't hammer us with a payload we've already logged; reconciliation picks it up.
    return NextResponse.json({ ok: false, logged: true });
  }
  return NextResponse.json({ ok: true });
}
