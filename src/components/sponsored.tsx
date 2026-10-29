import type { SponsoredItem } from "@/lib/sponsors";
import { SponsoredLabel } from "./ui";
import { ImpressionBeacon } from "./impression-beacon";

/**
 * A sponsored placement. Always visually separate from organic results,
 * labelled, names the advertiser and says why it is shown. Renders nothing
 * when no campaign qualifies — no empty slot.
 */
export function SponsoredSlot({ items, heading = "From a sponsor", compact = false }: { items: SponsoredItem[]; heading?: string; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <aside aria-label="Sponsored" className="rounded-[var(--radius-card)] border border-dashed border-[#c9a65d] bg-[#fbf6ea] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-ink-soft">{heading}</p>
        <a href="/sponsored-disclosure" className="text-[13px] text-ink-soft underline underline-offset-2">
          How ads work
        </a>
      </div>
      <ul className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {items.map((it) => (
          <li key={it.campaignId} className="rounded-[14px] bg-surface p-4">
            <ImpressionBeacon token={it.impressionToken} />
            <div className="flex flex-wrap items-center gap-2">
              <SponsoredLabel demo={it.isDemo} />
              <span className="text-[13px] capitalize text-ink-soft">{it.serviceType}</span>
            </div>
            <p className="mt-2 font-serif text-[20px] leading-tight">{it.title}</p>
            <p className="mt-1 text-[14px] text-ink-soft">{it.body}</p>
            <p className="mt-2 text-[12px] text-ink-soft">
              Advertiser: {it.advertiser}. {it.whyShown} Not part of our recommendation.
            </p>
            <a
              href={`/api/sponsor/click?t=${encodeURIComponent(it.clickToken)}`}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line-strong px-4 text-[15px] font-medium hover:border-forest hover:text-forest"
            >
              Visit {it.advertiser.replace(/ \(demo sponsor\)$/, "")}
              <span className="sr-only"> (opens the advertiser&rsquo;s site in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
