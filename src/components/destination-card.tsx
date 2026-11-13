import Link from "next/link";
import { Scene } from "@/components/scene";
import type { Destination } from "@/lib/planner/types";

export function DestinationCard({ d, note }: { d: Destination; note?: string }) {
  return (
    <li>
      <Link href={`/destinations/${d.id}`} className="lift group block h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <Scene kind={d.scene} seed={d.id} label={`${d.name}, ${d.region}`} photoUrl={d.heroImageUrl} className="aspect-[4/3]" />
        <span className="block p-4">
          <span className="block font-serif text-[21px] leading-tight group-hover:text-forest">{d.name}</span>
          <span className="mt-1 block text-[14px] text-ink-soft">{note ?? d.tagline}</span>
          <span className="mt-2 block text-[13px] text-ink-soft">
            {d.region} · {d.suggestedDaysMin}–{d.suggestedDaysMax} days
          </span>
        </span>
      </Link>
    </li>
  );
}
