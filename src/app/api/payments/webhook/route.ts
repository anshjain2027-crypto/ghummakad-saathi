import { NextResponse, type NextRequest } from "next/server";
import { asService, one } from "@/lib/db";
import { getDodoPayment, verifyDodoWebhook } from "@/lib/payments/dodo";
import { fulfillOrder, markOrderStatus, recordPaymentEvent } from "@/lib/payments/orders";

/**
 * Dodo Payments webhook (Standard Webhooks; signed content is
 * `webhook-id.webhook-timestamp.raw_body`, verified by the standardwebhooks lib
 * over the RAW body).
 *
 * Order of operations follows Dodo's guidance:
 *  1. verify signature,
 *  2. do the durable work (fulfillOrder is idempotent and row-locked, so a
 *     redelivered event can never grant twice),
 *  3. only then record the event id and return 2xx.
 * If step 2 fails we return 5xx and record nothing, so Dodo retries and the
 * retry is not swallowed as a "duplicate".
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
    ? await asService((q) => one<{ id: string }>(q, `select id from public.payment_order where id = $1 and provider = 'dodo'`, [claimedOrderId]))
    : undefined;

  try {
    if (order) {
      if (event.type === "payment.succeeded" && event.data.status === "succeeded") {
        // Some payloads omit product_cart; fetch the authoritative payment if so.
        let productId = event.data.product_cart?.[0]?.product_id ?? null;
        if (!productId && event.data.payment_id) {
          const p = await getDodoPayment(event.data.payment_id);
          productId = p.product_cart?.[0]?.product_id ?? null;
        }
        await fulfillOrder(order.id, {
          providerPaymentId: event.data.payment_id,
          paidAt: new Date(event.timestamp ?? Date.now()),
          source: "webhook",
          amountPaise: event.data.total_amount,
          productId,
        });
      } else if (event.type === "payment.failed") {
        await markOrderStatus(order.id, "failed", "Provider reported failure");
      } else if (event.type === "payment.cancelled") {
        await markOrderStatus(order.id, "cancelled", "Provider reported cancellation");
      } else if (event.type === "payment.processing") {
        await markOrderStatus(order.id, "pending", null);
      }
    }
    await recordPaymentEvent({
      provider: "dodo",
      eventId,
      orderId: order?.id ?? null,
      type: event.type,
      signatureValid: true,
      payload: event,
    });
  } catch (e) {
    console.error("dodo webhook processing failed; asking Dodo to retry", e);
    return NextResponse.json({ error: "processing failed" }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}
