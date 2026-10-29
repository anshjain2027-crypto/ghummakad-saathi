import "server-only";
import { randomUUID } from "node:crypto";
import { config } from "@/lib/config";
import { asService, one, type Queryable } from "@/lib/db";
import { hmacHex, safeEqualHex } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { entitlementWindow, priceFor, TIER_UPGRADE_PAISE, type Tier } from "@/lib/pricing";
import { PreferencesSchema } from "@/lib/planner/schema";
import { latestEntitlement } from "@/lib/data/trips";
import { createDodoCheckout, dodoProductFor, getDodoPayment, type DodoPurpose } from "./dodo";

export type Purpose = DodoPurpose;
export type OrderStatus = "created" | "pending" | "paid" | "failed" | "cancelled";

export type Order = {
  id: string;
  userId: string;
  draftId: string | null;
  tripId: string | null;
  purpose: Purpose;
  tier: Tier;
  travellers: number;
  amountPaise: number;
  provider: "dodo" | "mock";
  providerOrderId: string | null;
  checkoutSessionId: string | null;
  status: OrderStatus;
  failureReason: string | null;
};

type OrderRow = {
  id: string; user_id: string; draft_id: string | null; trip_id: string | null; purpose: Purpose; tier: Tier; travellers: number;
  amount_paise: number; provider: "dodo" | "mock"; provider_order_id: string | null; checkout_session_id: string | null;
  status: OrderStatus; failure_reason: string | null;
};

const toOrder = (r: OrderRow): Order => ({
  id: r.id, userId: r.user_id, draftId: r.draft_id, tripId: r.trip_id, purpose: r.purpose, tier: r.tier, travellers: r.travellers,
  amountPaise: r.amount_paise, provider: r.provider, providerOrderId: r.provider_order_id, checkoutSessionId: r.checkout_session_id,
  status: r.status, failureReason: r.failure_reason,
});

export const paymentProvider: "dodo" | "mock" = config.dodo ? "dodo" : "mock";

export class PaymentError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

/**
 * Creates (or reuses) an order whose amount is computed HERE from the
 * server-side traveller count — never from the client. Re-clicking "Unlock"
 * reuses the open order instead of creating a second charge.
 */
export async function createOrder(args: {
  userId: string;
  email: string;
  name: string;
  purpose: Purpose;
  draftId?: string;
  tripId?: string;
}): Promise<{ order: Order; redirectUrl: string } | { alreadyPaid: true; tripId: string }> {
  const prepared = await asService<{ alreadyPaid: true; tripId: string } | { order: Order; fresh: boolean }>(async (q) => {
    let travellers: number;
    let tier: Tier;
    let amountPaise: number;

    if (args.purpose === "trip_purchase") {
      if (!args.draftId) throw new PaymentError("bad_request", "Missing trip draft.");
      const draft = await one<{ id: string; preferences: unknown; selected_destination_id: string | null; owner_id: string | null }>(
        q,
        `select id, preferences, selected_destination_id, owner_id from public.trip_draft where id = $1 for update`,
        [args.draftId],
      );
      if (!draft || draft.owner_id !== args.userId) throw new PaymentError("not_found", "We couldn't find that trip draft.");
      if (!draft.selected_destination_id) throw new PaymentError("bad_request", "Choose a destination first.");
      const existingTrip = await one<{ id: string }>(q, `select id from public.trip_plan where draft_id = $1`, [draft.id]);
      if (existingTrip) return { alreadyPaid: true as const, tripId: existingTrip.id };
      const prefs = PreferencesSchema.parse(typeof draft.preferences === "string" ? JSON.parse(draft.preferences) : draft.preferences);
      travellers = prefs.travellers;
      ({ tier, amountPaise } = priceFor(travellers));
    } else {
      if (!args.tripId) throw new PaymentError("bad_request", "Missing trip.");
      const trip = await one<{ id: string; owner_id: string; travellers: number; preferences: unknown }>(
        q,
        `select id, owner_id, travellers, preferences from public.trip_plan where id = $1 for update`,
        [args.tripId],
      );
      if (!trip || trip.owner_id !== args.userId) throw new PaymentError("not_found", "Trip not found.");
      const ent = await latestEntitlement(q, trip.id);
      if (args.purpose === "tier_upgrade") {
        if (!ent || !ent.editable) throw new PaymentError("bad_request", "Upgrades apply to an active editing window.");
        if (ent.tier === "group") throw new PaymentError("bad_request", "This trip already covers 5 or more travellers.");
        tier = "group";
        travellers = Math.max(5, trip.travellers);
        amountPaise = TIER_UPGRADE_PAISE;
      } else {
        if (ent?.editable) throw new PaymentError("bad_request", "Your editing window is still active.");
        tier = ent?.tier ?? priceFor(trip.travellers).tier;
        travellers = trip.travellers;
        amountPaise = priceFor(tier === "group" ? Math.max(5, travellers) : Math.min(4, travellers)).amountPaise;
      }
    }

    const open = await one<OrderRow>(
      q,
      `select * from public.payment_order
       where user_id = $1 and purpose = $2 and coalesce(draft_id::text, '') = coalesce($3, '') and coalesce(trip_id::text, '') = coalesce($4, '')
         and tier = $5 and status in ('created', 'pending') and created_at > now() - interval '20 hours'
       order by created_at desc limit 1`,
      [args.userId, args.purpose, args.draftId ?? null, args.tripId ?? null, tier],
    );
    if (open && open.amount_paise === amountPaise) return { order: toOrder(open), fresh: false };

    const created = await one<OrderRow>(
      q,
      `insert into public.payment_order (user_id, draft_id, trip_id, purpose, tier, travellers, amount_paise, provider, idempotency_key)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [args.userId, args.draftId ?? null, args.tripId ?? null, args.purpose, tier, travellers, amountPaise, paymentProvider, randomUUID()],
    );
    return { order: toOrder(created!), fresh: true };
  });

  if ("alreadyPaid" in prepared) return prepared;
  const { order } = prepared;

  if (order.provider === "mock") {
    return { order, redirectUrl: `/checkout/demo?order=${order.id}` };
  }

  // Dodo: one hosted checkout session per order; reuse while it is still open.
  const productId = await dodoProductFor(order.purpose, order.tier);
  if (!productId) throw new PaymentError("config", "Payments are not fully set up yet (missing Dodo product). Please try again later.");
  const returnUrl = `${config.appUrl}/checkout/return?order=${order.id}`;
  const cancelUrl = `${config.appUrl}/checkout/return?order=${order.id}&cancelled=1`;
  const session = await createDodoCheckout({
    orderId: order.id,
    productId,
    email: args.email,
    name: args.name,
    returnUrl,
    cancelUrl,
    purpose: order.purpose,
  });
  await asService((q) =>
    q.query(
      `update public.payment_order set checkout_session_id = $2, provider_order_id = $2, status = 'pending', updated_at = now() where id = $1`,
      [order.id, session.sessionId],
    ),
  );
  return { order: { ...order, checkoutSessionId: session.sessionId, status: "pending" }, redirectUrl: session.checkoutUrl };
}

export async function getOrderForUser(orderId: string, userId: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const row = await asService((q) => one<OrderRow>(q, `select * from public.payment_order where id = $1 and user_id = $2`, [orderId, userId]));
  return row ? toOrder(row) : null;
}

export async function tripIdForOrder(orderId: string): Promise<string | null> {
  const r = await asService((q) =>
    one<{ trip_id: string | null }>(
      q,
      `select coalesce(o.trip_id, t.id) as trip_id from public.payment_order o left join public.trip_plan t on t.draft_id = o.draft_id
       where o.id = $1`,
      [orderId],
    ),
  );
  return r?.trip_id ?? null;
}

/**
 * The ONLY place access is granted. Idempotent: called by the return page,
 * the webhook and reconciliation; whichever arrives first wins, the rest are
 * no-ops. Row lock + unique constraints prevent duplicate entitlements.
 */
export async function fulfillOrder(
  orderId: string,
  evidence: { providerPaymentId: string; paidAt: Date; source: "return" | "webhook" | "reconcile" | "demo"; amountPaise: number; productId?: string | null },
): Promise<{ tripId: string; created: boolean }> {
  return asService(async (q) => {
    const order = await one<OrderRow>(q, `select * from public.payment_order where id = $1 for update`, [orderId]);
    if (!order) throw new PaymentError("not_found", "Order not found");

    if (order.status === "paid") {
      const tripId = order.trip_id ?? (await one<{ id: string }>(q, `select id from public.trip_plan where draft_id = $1`, [order.draft_id]))?.id;
      return { tripId: tripId!, created: false };
    }

    // Amount and product must match what WE priced. Merchant-of-record
    // checkouts may present local currency to the buyer, so for Dodo we
    // verify the product we sold, and for demo payments the exact paise.
    if (order.provider === "dodo") {
      const expected = await dodoProductFor(order.purpose, order.tier, q);
      if (!expected || evidence.productId !== expected) {
        await markOrder(q, orderId, "failed", "Product mismatch on provider payment");
        throw new PaymentError("mismatch", "Payment did not match this order.");
      }
    } else if (evidence.amountPaise !== order.amount_paise) {
      await markOrder(q, orderId, "failed", "Amount mismatch");
      throw new PaymentError("mismatch", "Payment amount did not match this order.");
    }

    const window = entitlementWindow(evidence.paidAt);
    let tripId: string;

    if (order.purpose === "trip_purchase") {
      const draft = await one<{ preferences: unknown; selected_destination_id: string }>(
        q,
        `select preferences, selected_destination_id from public.trip_draft where id = $1`,
        [order.draft_id],
      );
      if (!draft) throw new PaymentError("not_found", "Draft missing for paid order");
      const prefs = typeof draft.preferences === "string" ? JSON.parse(draft.preferences) : draft.preferences;
      const trip = await one<{ id: string }>(
        q,
        `insert into public.trip_plan (owner_id, draft_id, destination_id, preferences, travellers)
         values ($1, $2, $3, $4, $5)
         on conflict (draft_id) do update set updated_at = now() returning id`,
        [order.user_id, order.draft_id, draft.selected_destination_id, JSON.stringify(prefs), order.travellers],
      );
      tripId = trip!.id;
      await q.query(
        `insert into public.trip_entitlement (trip_id, user_id, payment_order_id, tier, paid_at, edit_expires_at)
         values ($1, $2, $3, $4, $5, $6) on conflict (payment_order_id) do nothing`,
        [tripId, order.user_id, order.id, order.tier, window.paidAt.toISOString(), window.editExpiresAt.toISOString()],
      );
    } else if (order.purpose === "tier_upgrade") {
      tripId = order.trip_id!;
      const current = await latestEntitlement(q, tripId);
      if (!current) throw new PaymentError("bad_request", "No entitlement to upgrade");
      // Same window, larger tier. The upgrade never resets or extends the 30 days.
      await q.query(
        `insert into public.trip_entitlement (trip_id, user_id, payment_order_id, tier, paid_at, edit_expires_at)
         values ($1, $2, $3, 'group', $4, $5) on conflict (payment_order_id) do nothing`,
        [tripId, order.user_id, order.id, current.paidAt.toISOString(), current.editExpiresAt.toISOString()],
      );
    } else {
      tripId = order.trip_id!;
      await q.query(
        `insert into public.trip_entitlement (trip_id, user_id, payment_order_id, tier, paid_at, edit_expires_at)
         values ($1, $2, $3, $4, $5, $6) on conflict (payment_order_id) do nothing`,
        [tripId, order.user_id, order.id, order.tier, window.paidAt.toISOString(), window.editExpiresAt.toISOString()],
      );
    }

    await q.query(
      `update public.payment_order set status = 'paid', paid_at = $2, provider_payment_id = $3, trip_id = coalesce(trip_id, $4),
         updated_at = now() where id = $1`,
      [orderId, evidence.paidAt.toISOString(), evidence.providerPaymentId, tripId],
    );
    await audit(q, null, "payment.fulfilled", "payment_order", orderId, { source: evidence.source, purpose: order.purpose });
    return { tripId, created: true };
  });
}

async function markOrder(q: Queryable, orderId: string, status: OrderStatus, reason: string | null) {
  await q.query(
    `update public.payment_order set status = $2, failure_reason = $3, updated_at = now() where id = $1 and status <> 'paid'`,
    [orderId, status, reason],
  );
}

export async function markOrderStatus(orderId: string, status: "failed" | "cancelled" | "pending", reason: string | null) {
  await asService((q) => markOrder(q, orderId, status, reason));
}

/**
 * Called from the Dodo return URL. The query string is NOT trusted: we fetch
 * the payment from Dodo server-side and check status, our order id in
 * metadata, and the product before granting anything.
 */
export async function confirmDodoReturn(order: Order, paymentId: string | null) {
  if (!paymentId) return { state: "pending" as const };
  const payment = await getDodoPayment(paymentId);
  if (String(payment.metadata?.order_id ?? "") !== order.id) {
    throw new PaymentError("mismatch", "This payment belongs to a different order.");
  }
  if (payment.status === "succeeded") {
    const res = await fulfillOrder(order.id, {
      providerPaymentId: payment.payment_id,
      paidAt: payment.created_at ? new Date(payment.created_at) : new Date(),
      source: "return",
      amountPaise: payment.total_amount,
      productId: payment.product_cart?.[0]?.product_id ?? null,
    });
    return { state: "paid" as const, tripId: res.tripId };
  }
  if (payment.status === "failed" || payment.status === "cancelled") {
    await markOrderStatus(order.id, payment.status === "failed" ? "failed" : "cancelled", `Provider status: ${payment.status}`);
    return { state: payment.status as "failed" | "cancelled" };
  }
  await markOrderStatus(order.id, "pending", null);
  return { state: "pending" as const };
}

// ───────────── Demo gateway (no money moves) ─────────────
// Mirrors a real provider: the "gateway" signs a payment result with a
// server secret and the app verifies that signature before fulfilling.

export function demoSignature(orderId: string, paymentId: string, amountPaise: number, status: string): string {
  return hmacHex(`${config.sessionSecret}:demo-gateway`, `${orderId}|${paymentId}|${amountPaise}|${status}`);
}

export function verifyDemoSignature(orderId: string, paymentId: string, amountPaise: number, status: string, sig: string): boolean {
  return safeEqualHex(sig, demoSignature(orderId, paymentId, amountPaise, status));
}

export async function recordPaymentEvent(args: {
  provider: string;
  eventId: string;
  orderId: string | null;
  type: string;
  signatureValid: boolean;
  payload: unknown;
}): Promise<{ duplicate: boolean }> {
  return asService(async (q) => {
    const row = await one<{ id: string }>(
      q,
      `insert into public.payment_event (provider, provider_event_id, order_id, event_type, signature_valid, payload)
       values ($1, $2, $3, $4, $5, $6) on conflict (provider, provider_event_id) do nothing returning id`,
      [args.provider, args.eventId.slice(0, 200), args.orderId, args.type.slice(0, 80), args.signatureValid, JSON.stringify(args.payload)],
    );
    return { duplicate: !row };
  });
}
