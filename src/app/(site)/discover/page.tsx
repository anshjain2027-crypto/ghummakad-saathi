import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDestinations } from "@/lib/data/catalog";
import { MOODS } from "@/lib/domain";
import { Scene } from "@/components/scene";
import { Chip, Container, PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Discover" };

export default async function Discover({ searchParams }: { searchParams: Promise<{ mood?: string }> }) {
  await requireUser("/discover");
  const { mood } = await searchParams;
  const all = await listDestinations();
  const list = mood ? all.filter((d) => d.moods.includes(mood as never)) : all;
  return (
    <Container className="py-12">
      <PageHeading title="Discover" lead="Every destination in our editorial collection. Open one to see its places on the community map." />
      <div className="scroller -mx-4 mb-8 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filter by mood">
        <Link href="/discover" aria-current={!mood ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-chip)] border px-3 text-[14px] ${!mood ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface"}`}>
          All
        </Link>
        {MOODS.filter((m) => m.id !== "surprise").map((m) => (
          <Link key={m.id} href={`/discover?mood=${m.id}`} aria-current={mood === m.id ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-chip)] border px-3 text-[14px] ${mood === m.id ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface"}`}>
            {m.label}
          </Link>
        ))}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <li key={d.id}>
            <Link href={`/destinations/${d.id}`} className="lift block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <Scene kind={d.scene} seed={d.id} label={d.name} photoUrl={d.heroImageUrl} className="aspect-[4/3]" />
              <div className="p-5">
                <p className="font-serif text-[26px] leading-tight">{d.name}</p>
                <p className="text-[14px] text-ink-soft">
                  {d.region}, {d.country}
                </p>
                <p className="mt-2 text-[15px]">{d.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.experienceTags.slice(0, 2).map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
