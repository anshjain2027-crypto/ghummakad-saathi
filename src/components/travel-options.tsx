import type { ReactNode } from "react";

type Opt = {
  mode: "flight" | "train" | "bus" | "drive";
  label: string;
  hours: [number, number];
  fareInr: [number, number];
  perVehicle: boolean;
  legs: { mode: string; text: string }[];
  note: string | null;
  overnight: boolean;
  tags: string[];
  links: { label: string; url: string }[];
};

const ICON: Record<Opt["mode"], ReactNode> = {
  flight: <path d="M2 16l20-6-20-6 4 6-4 6zm4-6h9" />,
  train: <path d="M6 3h12a2 2 0 012 2v9a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2zm-2 7h16M8 21l2-4m6 4l-2-4M8 14h.01M16 14h.01" />,
  bus: <path d="M5 3h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm-2 8h18M7 21v-3m10 3v-3M7 15h.01M17 15h.01" />,
  drive: <path d="M5 13l2-6h10l2 6M4 13h16v5H4zm3 5v2m10-2v2M7.5 15.5h.01m9 0h.01" />,
};

export function ModeIcon({ mode, className = "h-5 w-5" }: { mode: Opt["mode"]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICON[mode]}
    </svg>
  );
}

export const fmtHours = (h: number) => {
  if (h < 1) return `${Math.max(10, Math.round(h * 6) * 10)}m`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60 / 15) * 15;
  return mins === 60 ? `${whole + 1}h` : mins ? `${whole}h ${mins}m` : `${whole}h`;
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const TAG_LABEL: Record<string, string> = { fastest: "Fastest", cheapest: "Cheapest", recommended: "Best balance" };

/** One-line summary for match cards: "Bus · 11h · ₹700–1,500". */
export function TravelSummary({ travel, from }: { travel: { mode: Opt["mode"]; label: string; hours: [number, number]; overnight: boolean } | null | undefined; from: string }) {
  if (!travel) return null;
  return (
    <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-soft">
      <ModeIcon mode={travel.mode} className="h-4 w-4 text-forest" />
      <span>
        {fmtHours(travel.hours[0])} by {travel.label.toLowerCase()} from {from}
        {travel.overnight ? " · overnight" : ""}
      </span>
    </p>
  );
}

/** Rome2rio-style list of ways to get there, with time, fare and booking links. */
export function TravelOptions({ options, from, to, chosen, travellers }: { options: Opt[]; from: string; to: string; chosen?: string | null; travellers?: number }) {
  if (!options.length) return null;
  return (
    <section aria-labelledby="getting-there" className="rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="border-b border-line p-5">
        <h2 id="getting-there" className="font-serif text-[24px]">
          {from} to {to}
        </h2>
        <p className="mt-1 text-[14px] text-ink-soft">Ways to get there, one way. Times are door to door; fares are typical ranges, not quotes.</p>
      </div>
      <ul className="divide-y divide-line">
        {options.map((o) => (
          <li key={o.mode} className="p-5">
            <details className="group" open={o.mode === chosen}>
              <summary className="flex cursor-pointer list-none items-center gap-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${o.mode === chosen ? "bg-forest text-cream" : "bg-cream text-forest"}`}>
                  <ModeIcon mode={o.mode} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.label}</span>
                    {o.tags.map((t) => (
                      <span key={t} className="rounded-full bg-sand-soft px-2 py-0.5 text-[12px] font-medium text-ink">
                        {TAG_LABEL[t] ?? t}
                      </span>
                    ))}
                    {o.mode === chosen ? <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[12px] font-medium text-forest">In your budget</span> : null}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-soft">
                    {fmtHours(o.hours[0])}–{fmtHours(o.hours[1])}
                    {o.overnight ? " · overnight" : ""}
                  </span>
                </span>
                <span className="nums text-right">
                  <span className="block font-semibold">
                    {inr(o.fareInr[0])}–{inr(o.fareInr[1])}
                  </span>
                  <span className="block text-[12px] text-ink-soft">{o.perVehicle ? `per car${travellers && travellers > 1 ? ` · ${inr(o.fareInr[0] / Math.min(travellers, 4))}+ each` : ""}` : "per person"}</span>
                </span>
              </summary>
              <div className="mt-4 space-y-3 pl-15 sm:pl-[60px]">
                <ol className="space-y-2 text-[15px]">
                  {o.legs.map((l, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" aria-hidden />
                      {l.text}
                    </li>
                  ))}
                </ol>
                {o.note ? <p className="text-[13px] text-ink-soft">{o.note}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {o.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line-strong px-3 text-[14px] hover:border-forest">
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
