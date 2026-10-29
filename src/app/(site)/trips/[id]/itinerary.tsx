"use client";

import { useMemo, useState, useTransition } from "react";
import { Scene } from "@/components/scene";
import { Band } from "@/components/money";
import { MapView } from "@/components/map/map-view";
import { Notice } from "@/components/ui";
import { swapStopAction } from "@/app/actions/trips";
import type { Stop, TripPlan } from "@/lib/planner/schema";
import { PLACE_CATEGORIES } from "@/lib/domain";

const MODE: Record<Stop["travelMode"], string> = { walk: "Walk", drive: "Drive", local_transport: "Local transport", boat: "Boat", train: "Train" };
const COST: Record<Stop["costCategory"], string> = { free: "Free", low: "Low cost", mid: "Moderate", high: "Higher cost" };

type Swaps = Record<number, { id: string; name: string; category: string }[]>;

export function Itinerary({ tripId, plan, editable, swaps, currency, center }: { tripId: string; plan: TripPlan; editable: boolean; swaps: Swaps; currency: string; center: { lat: number; lng: number } }) {
  const [active, setActive] = useState(1);
  const day = plan.days.find((d) => d.day === active) ?? plan.days[0];
  const stops = useMemo(() => [...day.morning, ...day.afternoon, ...day.evening], [day]);

  const markers = stops.map((s, i) => ({ id: s.placeId, lat: s.lat, lng: s.lng, label: `${i + 1}. ${s.name}`, kind: "stop" as const, order: i + 1 }));

  function onKey(e: React.KeyboardEvent) {
    const idx = plan.days.findIndex((d) => d.day === active);
    if (e.key === "ArrowRight") setActive(plan.days[Math.min(idx + 1, plan.days.length - 1)].day);
    if (e.key === "ArrowLeft") setActive(plan.days[Math.max(idx - 1, 0)].day);
  }

  return (
    <section aria-labelledby="days-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="days-heading" className="text-[30px]">
          Day by day
        </h2>
        <p className="text-[14px] text-ink-soft">Use the arrow keys to move between days.</p>
      </div>

      <div role="tablist" aria-label="Trip days" className="scroller no-print -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2" onKeyDown={onKey}>
        {plan.days.map((d) => (
          <button
            key={d.day}
            role="tab"
            id={`tab-${d.day}`}
            aria-selected={d.day === active}
            aria-controls={`panel-${d.day}`}
            tabIndex={d.day === active ? 0 : -1}
            onClick={() => setActive(d.day)}
            className={`min-h-11 shrink-0 rounded-[var(--radius-control)] border px-4 py-2 text-left transition-colors ${d.day === active ? "border-forest bg-forest text-cream" : "border-line bg-surface hover:border-forest"}`}
          >
            <span className="block text-[13px] opacity-80">Day {d.day}</span>
            <span className="block max-w-40 truncate text-[15px] font-medium">{d.theme}</span>
          </button>
        ))}
      </div>

      <div id={`panel-${day.day}`} role="tabpanel" aria-labelledby={`tab-${day.day}`} key={day.day} className="crossfade mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-serif text-[28px] leading-tight">{day.theme}</p>
          <p className="text-[15px] text-ink-soft">
            Est. day spend <strong className="text-charcoal">{day.estSpendInr[1] ? <Band band={day.estSpendInr} currency={currency} /> : "—"}</strong>
            {day.travelKm ? ` · about ${Math.round(day.travelKm)} km between stops` : ""}
          </p>
        </div>
        {day.restNote ? <p className="mt-2 text-[15px] text-forest">{day.restNote}</p> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <ol className="relative space-y-6 border-l-2 border-dashed border-forest/30 pl-6">
            {(["morning", "afternoon", "evening"] as const).map((slot) =>
              day[slot].length ? (
                <li key={slot}>
                  <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-[3px] border-cream bg-terracotta" aria-hidden />
                  <p className="text-[14px] font-semibold capitalize text-forest">{slot}</p>
                  <ul className="mt-3 space-y-3">
                    {day[slot].map((s) => (
                      <StopCard key={s.placeId} stop={s} index={stops.indexOf(s) + 1} tripId={tripId} day={day.day} editable={editable} swaps={swaps[day.day] ?? []} />
                    ))}
                  </ul>
                </li>
              ) : null,
            )}
          </ol>
          <div className="space-y-4">
            <div className="h-[300px] overflow-hidden rounded-[var(--radius-card)] border border-line no-print">
              <MapView center={center} zoom={11} markers={markers} route={stops.map((s) => ({ lat: s.lat, lng: s.lng }))} label={`Map of day ${day.day}`} className="h-full w-full" cluster={false} />
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <p className="text-[13px] font-semibold text-forest">Food</p>
              <p className="mt-1 font-serif text-[20px] leading-tight">{day.food.name}</p>
              <p className="mt-1 text-[14px] text-ink-soft">{day.food.note}</p>
            </div>
            {day.hiddenGem ? (
              <div className="rounded-[var(--radius-card)] border border-terracotta/40 bg-[#fbeee8] p-4">
                <p className="text-[13px] font-semibold text-terracotta-deep">Hidden gem</p>
                <p className="mt-1 font-serif text-[20px] leading-tight">{day.hiddenGem.name}</p>
                <p className="mt-1 text-[14px] text-ink-soft">{day.hiddenGem.note}</p>
              </div>
            ) : null}
            <div className="rounded-[var(--radius-card)] bg-sand-soft p-4 text-[14px]">
              <p className="font-semibold">Practical note</p>
              <p className="mt-1">{day.practicalNote}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full plan for print */}
      <div className="hidden print:block">
        {plan.days.map((d) => (
          <div key={d.day} className="print-break mt-6">
            <p className="font-serif text-[22px]">
              Day {d.day}: {d.theme}
            </p>
            {(["morning", "afternoon", "evening"] as const).map((slot) => (
              <p key={slot} className="text-[13px]">
                <strong className="capitalize">{slot}:</strong> {d[slot].map((s) => s.name).join(", ") || "Free time"}
              </p>
            ))}
            <p className="text-[13px]">Food: {d.food.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StopCard({ stop, index, tripId, day, editable, swaps }: { stop: Stop; index: number; tripId: string; day: number; editable: boolean; swaps: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="flex gap-4 p-3">
        <Scene kind={stop.scene ?? "forest"} seed={stop.placeId} label="" className="h-24 w-24 shrink-0 rounded-[12px] sm:h-28 sm:w-32" />
        <div className="min-w-0 flex-1 py-1">
          <p className="text-[13px] text-ink-soft">
            {index}. {PLACE_CATEGORIES.find((c) => c.id === stop.category)?.label ?? stop.category}
            {stop.hiddenGem ? " · hidden gem" : ""}
          </p>
          <p className="font-serif text-[20px] leading-tight">{stop.name}</p>
          <p className="mt-1 line-clamp-2 text-[14px] text-ink-soft">{stop.note}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
            <span>~{stop.durationMin >= 60 ? `${Math.round(stop.durationMin / 30) / 2} h` : `${stop.durationMin} min`}</span>
            <span>{MODE[stop.travelMode]}</span>
            <span>{COST[stop.costCategory]}</span>
            {stop.feasibility === "tight" ? <span className="font-medium text-warning">Longer travel — start early</span> : null}
          </p>
        </div>
      </div>
      {editable && swaps.length ? (
        <div className="no-print border-t border-line px-3 py-2">
          <button type="button" className="min-h-11 text-[14px] font-medium text-forest" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? "Keep this activity" : "Swap this activity"}
          </button>
          {open ? (
            <div className="pb-2">
              {error ? <Notice tone="error">{error}</Notice> : null}
              <ul className="mt-1 flex flex-wrap gap-2">
                {swaps.map((alt) => (
                  <li key={alt.id}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const r = await swapStopAction(tripId, day, stop.placeId, alt.id);
                          if (!r.ok) setError(r.error);
                          else setOpen(false);
                        })
                      }
                      className="min-h-11 rounded-[var(--radius-chip)] border border-line-strong bg-cream px-3 text-[14px] hover:border-forest disabled:opacity-50"
                    >
                      {alt.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
