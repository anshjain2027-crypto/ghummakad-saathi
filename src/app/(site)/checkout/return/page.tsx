import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  confirmDodoReturn,
  fulfillOrder,
  getOrderForUser,
  PaymentError,
  tripIdForOrder,
  verifyDemoSignature,
} from "@/lib/payments/orders";
import { demoWebhookAction } from "@/app/actions/checkout";
import { Button, ButtonLink, Container, Notice } from "@/components/ui";
import { AutoRefresh } from "./auto-refresh";

export const metadata: Metadata = { title: "Payment status", robots: { index: false } };

type SP = { order?: string; payment_id?: string; status?: string; p?: string; s?: string; pending?: string; cancelled?: string; failed?: string };

export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser(`/checkout/return?order=${sp.order ?? ""}`);
  const order = sp.order ? await getOrderForUser(sp.order, user.id) : null;
  if (!order) redirect("/my/trips");

  const retryHref = order.purpose === "trip_purchase" ? "/plan/review" : order.tripId ? `/trips/${order.tripId}` : "/my/trips";

  if (order.status === "paid") {
    const tripId = await tripIdForOrder(order.id);
    redirect(tripId ? `/trips/${tripId}?welcome=${order.purpose}` : "/my/trips");
  }

  let state: "paid" | "pending" | "failed" | "cancelled" | "error" = "pending";
  let message: string | null = null;
  let tripId: string | null = null;

  try {
    if (order.provider === "dodo") {
      if (sp.cancelled) state = "cancelled";
      else {
        const res = await confirmDodoReturn(order, sp.payment_id ?? null);
        state = res.state;
        if (res.state === "paid") tripId = res.tripId;
      }
    } else {
      if (sp.cancelled || order.status === "cancelled") state = "cancelled";
      else if (sp.failed || order.status === "failed") state = "failed";
      else if (sp.p && sp.s && !sp.pending) {
        if (!verifyDemoSignature(order.id, sp.p, order.amountPaise, "succeeded", sp.s)) {
          state = "error";
          message = "The payment signature didn't verify, so nothing was unlocked.";
        } else {
          const res = await fulfillOrder(order.id, { providerPaymentId: sp.p, paidAt: new Date(), source: "return", amountPaise: order.amountPaise });
          state = "paid";
          tripId = res.tripId;
        }
      }
    }
  } catch (e) {
    state = "error";
    message = e instanceof PaymentError ? e.message : "We couldn't confirm the payment yet.";
    if (!(e instanceof PaymentError)) console.error("checkout return", e);
  }

  if (state === "paid" && tripId) redirect(`/trips/${tripId}?welcome=${order.purpose}`);

  return (
    <Container narrow className="py-16">
      <div className="mx-auto max-w-lg text-center">
        {state === "pending" ? (
          <>
            <h1 className="text-[36px]">Confirming your payment…</h1>
            <p className="mt-3 text-ink-soft">
              The payment provider hasn&rsquo;t confirmed it yet. This usually takes a few seconds. We&rsquo;ll unlock your trip as soon as it does — you won&rsquo;t be charged twice.
            </p>
            <AutoRefresh seconds={5} />
            {order.provider === "mock" && sp.p && sp.s ? (
              <form action={demoWebhookAction.bind(null, order.id, sp.p, sp.s)} className="mt-6">
                <Button type="submit" variant="secondary">
                  Deliver the demo webhook now
                </Button>
              </form>
            ) : null}
          </>
        ) : state === "cancelled" ? (
          <>
            <h1 className="text-[36px]">Checkout cancelled</h1>
            <p className="mt-3 text-ink-soft">Nothing was charged. Your trip draft is saved, so you can pick up where you left off.</p>
            <ButtonLink href={retryHref} className="mt-6">
              Back to my trip
            </ButtonLink>
          </>
        ) : state === "failed" ? (
          <>
            <h1 className="text-[36px]">The payment didn&rsquo;t go through</h1>
            <p className="mt-3 text-ink-soft">Your bank or card declined it, so nothing was unlocked. Your draft is safe — try again or use another payment method.</p>
            <ButtonLink href={retryHref} className="mt-6">
              Try again
            </ButtonLink>
          </>
        ) : (
          <>
            <h1 className="text-[36px]">We need a moment</h1>
            <div className="mt-4 text-left">
              <Notice tone="error">{message ?? "We couldn't confirm this payment."}</Notice>
            </div>
            <p className="mt-4 text-ink-soft">If money left your account, it will be matched to your order automatically or refunded. </p>
            <div className="mt-6 flex justify-center gap-4">
              <ButtonLink href={retryHref}>Back to my trip</ButtonLink>
              <Link className="min-h-11 py-2 text-forest underline" href="/my/trips">
                My trips
              </Link>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
