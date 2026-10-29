"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft } from "@/lib/data/drafts";
import {
  createOrder,
  demoSignature,
  fulfillOrder,
  getOrderForUser,
  markOrderStatus,
  PaymentError,
  recordPaymentEvent,
  verifyDemoSignature,
  type Purpose,
} from "@/lib/payments/orders";
import { rateLimit } from "@/lib/ratelimit";

export type CheckoutState = { error?: string };

async function begin(purpose: Purpose, target: { draftId?: string; tripId?: string }, back: string): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(back)}`);
  if (!(await rateLimit(`checkout:${user.id}`, 20, 3600))) return { error: "Too many checkout attempts. Please wait a few minutes." };
  let url: string;
  try {
    const res = await createOrder({ userId: user.id, email: user.email, name: user.displayName, purpose, ...target });
    if ("alreadyPaid" in res) url = `/trips/${res.tripId}`;
    else url = res.redirectUrl;
  } catch (e) {
    if (e instanceof PaymentError) return { error: e.message };
    console.error("checkout", e);
    return { error: "We couldn't start checkout. Nothing was charged — please try again." };
  }
  redirect(url);
}

export async function startTripCheckout(_prev: CheckoutState): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/plan/review")}`);
  const draft = await currentDraft(user);
  if (!draft) return { error: "Your draft expired. Start again from your matches." };
  if (!draft.selectedDestinationId) return { error: "Choose a destination first." };
  return begin("trip_purchase", { draftId: draft.id }, "/plan/review");
}

export async function startUpgradeCheckout(tripId: string, _prev: CheckoutState): Promise<CheckoutState> {
  return begin("tier_upgrade", { tripId }, `/trips/${tripId}`);
}

export async function startRenewalCheckout(tripId: string, _prev: CheckoutState): Promise<CheckoutState> {
  return begin("renewal", { tripId }, `/trips/${tripId}`);
}

/**
 * Demo gateway outcome. Mirrors a real provider: the gateway signs the
 * result, then the app verifies the signature before fulfilling. Also lets
 * you rehearse failure, cancellation, delayed confirmation and replays.
 */
export async function demoGatewayAction(orderId: string, outcome: "success" | "failure" | "cancel" | "delayed") {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const order = await getOrderForUser(orderId, user.id);
  if (!order || order.provider !== "mock") redirect("/my/trips");

  if (outcome === "cancel") {
    await markOrderStatus(order.id, "cancelled", "Cancelled at demo checkout");
    redirect(`/checkout/return?order=${order.id}&cancelled=1`);
  }
  if (outcome === "failure") {
    await markOrderStatus(order.id, "failed", "Demo card declined");
    redirect(`/checkout/return?order=${order.id}&failed=1`);
  }

  const paymentId = `pay_demo_${randomUUID().slice(0, 12)}`;
  const sig = demoSignature(order.id, paymentId, order.amountPaise, "succeeded");
  if (outcome === "delayed") {
    await markOrderStatus(order.id, "pending", null);
    redirect(`/checkout/return?order=${order.id}&pending=1&p=${paymentId}&s=${sig}`);
  }
  redirect(`/checkout/return?order=${order.id}&p=${paymentId}&s=${sig}`);
}

/** Simulates the provider's webhook arriving (possibly late, possibly twice). */
export async function demoWebhookAction(orderId: string, paymentId: string, sig: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const order = await getOrderForUser(orderId, user.id);
  if (!order || order.provider !== "mock") redirect("/my/trips");
  const valid = verifyDemoSignature(order.id, paymentId, order.amountPaise, "succeeded", sig);
  const { duplicate } = await recordPaymentEvent({ provider: "mock", eventId: `evt_${paymentId}`, orderId: order.id, type: "payment.succeeded", signatureValid: valid, payload: { paymentId } });
  if (valid && !duplicate) {
    await fulfillOrder(order.id, { providerPaymentId: paymentId, paidAt: new Date(), source: "webhook", amountPaise: order.amountPaise });
  }
  redirect(`/checkout/return?order=${order.id}`);
}
