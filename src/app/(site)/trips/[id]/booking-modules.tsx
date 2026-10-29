"use client";

import { useTransition, type ReactNode } from "react";
import type { BookingCategory, BookingOption } from "@/lib/booking/adapters";
import { selfBookingAction } from "@/app/actions/trips";

const TITLES: Record<BookingCategory, string> = { stay: "Stay", flight: "Flights", train: "Trains", activity: "Events & activities", vehicle: "Two-wheeler & car" };
const STATUS: Record<BookingOption["status"], string> = { redirect: "Link to provider", mock: "Suggestion only", approved_api: "Live from provider", disabled: "Unavailable" };

export function BookingModules({ tripId, options, selfBookings, sponsored }: { tripId: string; options: Record<BookingCategory, BookingOption[]>; selfBookings: Record<string, { status: string }>; sponsored: ReactNode }) {
  const [pending, start] = useTransition();
  const cats = (Object.keys(options) as BookingCategory[]).filter((c) => options[c].length);
  return (
    <section aria-labelledby="booking" className="no-print">
      <h2 id="booking" className="text-[30px]">
        Book it your way
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] text-ink-soft">
        Bookings happen on the provider&rsquo;s own website, not here. Your ₹499 / ₹999 plan doesn&rsquo;t include tickets or rooms, and we never mark anything as booked for you.
      </p>
      <div className="mt-6 space-y-6">
        {cats.map((cat) => {
          const key = `booking:${cat}`;
          const booked = selfBookings[key]?.status === "self_reported_booked";
          return (
            <div key={cat} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-serif text-[22px]">{TITLES[cat]}</p>
                <label className="flex min-h-11 items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--forest)]"
                    checked={booked}
                    disabled={pending}
                    onChange={(e) => start(async () => void (await selfBookingAction(tripId, key, e.target.checked)))}
                  />
                  {booked ? "Booked by you (not verified by us)" : "No booking made"}
                </label>
              </div>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {options[cat].map((o) => (
                  <li key={`${o.provider}-${o.title}`} className="rounded-[14px] bg-cream p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-[6px] bg-surface px-2 py-0.5 font-semibold">{o.providerLabel}</span>
                      <span className="text-ink-soft">{STATUS[o.status]}</span>
                      {o.isAffiliate ? <span className="text-ink-soft">· affiliate link</span> : null}
                    </div>
                    <p className="mt-2 font-medium">{o.title}</p>
                    <p className="mt-1 text-[14px] text-ink-soft">{o.rationale}</p>
                    <p className="mt-2 text-[13px] text-ink-soft">
                      {o.priceType === "none" ? "Price: shown on the provider's site." : o.priceText}
                      {o.lastChecked ? ` · checked ${o.lastChecked}` : ""}
                    </p>
                    {o.missingData ? <p className="mt-1 text-[13px] text-ink-soft">{o.missingData}</p> : null}
                    {o.url ? (
                      <a
                        href={`/go?u=${encodeURIComponent(o.url)}&p=${o.provider}&c=${cat}`}
                        target="_blank"
                        rel={o.isAffiliate ? "sponsored nofollow noopener noreferrer" : "nofollow noopener noreferrer"}
                        className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-forest px-4 text-[15px] font-medium text-cream hover:bg-forest-deep"
                      >
                        {o.cta}
                        <span className="sr-only"> (opens {o.providerLabel} in a new tab)</span>
                      </a>
                    ) : (
                      <p className="mt-3 text-[14px] font-medium text-forest">{o.cta}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {sponsored}
      </div>
    </section>
  );
}
