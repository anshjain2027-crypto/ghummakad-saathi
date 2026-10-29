"use client";

import { useActionState, useState } from "react";
import { editTripAction, type TripActionResult } from "@/app/actions/trips";
import { startUpgradeCheckout, type CheckoutState } from "@/app/actions/checkout";
import { Button, Notice, inputClass } from "@/components/ui";
import { PACES, STYLES } from "@/lib/domain";
import type { Tier } from "@/lib/pricing";

type Current = { destinationId: string; days: number; travellers: number; style: string; pace: string; budgetInr: number; startDate: string };

export function EditPanel({ tripId, editable, tier, current, destinations }: { tripId: string; editable: boolean; tier: Tier; current: Current; destinations: { id: string; name: string; country: string }[] }) {
  const [state, action, pending] = useActionState<TripActionResult | null, FormData>(editTripAction.bind(null, tripId), null);
  const [upState, upAction, upPending] = useActionState<CheckoutState, FormData>(startUpgradeCheckout.bind(null, tripId), {});
  const [travellers, setTravellers] = useState(current.travellers);
  const needsUpgrade = tier === "standard" && travellers >= 5;

  if (!editable) return null;

  return (
    <section aria-labelledby="edit" className="rounded-[var(--radius-card)] border border-forest/30 bg-forest-soft p-6">
      <h2 id="edit" className="font-serif text-[24px]">
        Change your trip
      </h2>
      <p className="mt-1 text-[14px] text-forest-deep">Change anything, even your destination. No extra charge within your 30 days.</p>
      <form action={action} className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-[14px] font-medium">
          Destination
          <select name="destinationId" defaultValue={current.destinationId} className={inputClass}>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}, {d.country}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-[14px] font-medium">
            Days
            <input name="days" type="number" min={1} max={14} defaultValue={current.days} className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-medium">
            Travellers
            <input name="travellers" type="number" min={1} max={30} value={travellers} onChange={(e) => setTravellers(Number(e.target.value))} className={inputClass} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-[14px] font-medium">
            Style
            <select name="style" defaultValue={current.style} className={inputClass}>
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[14px] font-medium">
            Pace
            <select name="pace" defaultValue={current.pace} className={inputClass}>
              {PACES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-[14px] font-medium">
            Budget (₹ total)
            <input name="budgetInr" type="number" min={5000} step={1000} defaultValue={current.budgetInr} className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-[14px] font-medium">
            Start date
            <input name="startDate" type="date" defaultValue={current.startDate} className={inputClass} />
          </label>
        </div>

        {needsUpgrade ? (
          <Notice tone="warning" title="5 or more travellers">
            Your plan covers 1–4 travellers. A group plan is a one-time ₹500 upgrade (inclusive of applicable taxes). Your 30-day window doesn&rsquo;t change. You won&rsquo;t be charged unless you confirm below.
          </Notice>
        ) : null}
        {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}
        {state?.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}

        <Button type="submit" disabled={pending || needsUpgrade}>
          {pending ? "Rebuilding your plan…" : "Rebuild my plan"}
        </Button>
      </form>
      {needsUpgrade ? (
        <form action={upAction} className="mt-3">
          {upState.error ? <Notice tone="error">{upState.error}</Notice> : null}
          <Button type="submit" variant="secondary" disabled={upPending} className="mt-2 w-full">
            {upPending ? "Opening checkout…" : "Confirm ₹500 group upgrade"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
