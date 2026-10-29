"use client";

import { useActionState } from "react";
import { startRenewalCheckout, type CheckoutState } from "@/app/actions/checkout";
import { Button, Notice } from "@/components/ui";
import { PRICING_COPY } from "@/lib/pricing";

type Ent = { tier: "standard" | "group"; editExpiresAt: string; editable: boolean; daysRemaining: number } | null;

/** Expiry is decided on the server in UTC; this only formats it in the viewer's own timezone. */
export function EntitlementBanner({ tripId, entitlement }: { tripId: string; entitlement: Ent }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startRenewalCheckout.bind(null, tripId), {});

  if (!entitlement) return <Notice tone="warning">Payment for this trip hasn&rsquo;t been confirmed yet.</Notice>;

  if (entitlement.editable) {
    return (
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-forest/25 bg-forest-soft px-5 py-4" role="status">
        <p className="text-[16px] text-forest-deep">
          <strong>Unlimited edits until <LocalTime iso={entitlement.editExpiresAt} />.</strong>{" "}
          <span className="nums">
            {entitlement.daysRemaining} {entitlement.daysRemaining === 1 ? "day" : "days"} left
          </span>
        </p>
        <p className="text-[14px] text-forest-deep/80">{entitlement.tier === "group" ? "Group plan · 5+ travellers" : "Plan for 1–4 travellers"}</p>
      </div>
    );
  }

  return (
    <div className="no-print rounded-[var(--radius-card)] border border-sand bg-sand-soft px-5 py-4">
      <p className="text-[16px] font-semibold">{PRICING_COPY.expired}</p>
      <p className="mt-1 text-[14px]">You can still view and print it. To make changes again, start a new 30-day editing window.</p>
      <form action={action} className="mt-3">
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Opening checkout…" : `Start a new 30-day window for ₹${entitlement.tier === "group" ? 999 : 499}`}
        </Button>
      </form>
    </div>
  );
}

/** Formats in the viewer's own timezone; the server render may differ, so hydration text mismatch is expected. */
function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
    </time>
  );
}
