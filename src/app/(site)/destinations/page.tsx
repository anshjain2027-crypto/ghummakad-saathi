import type { Metadata } from "next";
import Link from "next/link";
import { listDestinations } from "@/lib/data/catalog";
import { isIndia, stateOf } from "@/lib/destination-seo";
import { Scene } from "@/components/scene";
import { ButtonLink, Container } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import type { Destination } from "@/lib/planner/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "India travel destinations by state — where to go in India",
  description:
    "Browse India's best places to visit, state by state: Himalayan treks, Rajasthan forts, Kerala backwaters, Goa beaches and quiet hill towns, each with the best months, how many days you need and real costs.",
  alternates: { canonical: "/destinations" },
};

function Card({ d }: { d: Destination }) {
  return (
    <li>
      <Link href={`/destinations/${d.id}`} className="lift group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <Scene kind={d.scene} seed={d.id} label={`${d.name}, ${d.region}`} photoUrl={d.heroImageUrl} className="aspect-[4/3]" />
        <span className="block p-4">
          <span className="block font-serif text-[21px] leading-tight group-hover:text-forest">{d.name}</span>
          <span className="mt-1 block text-[14px] text-ink-soft">{d.tagline}</span>
          <span className="mt-2 block text-[13px] text-ink-soft">
            {d.suggestedDaysMin}–{d.suggestedDaysMax} days
          </span>
        </span>
      </Link>
    </li>
  );
}

export default async function DestinationsIndex() {
  const all = await listDestinations();
  const india = all.filter(isIndia);
  const abroad = all.filter((d) => !isIndia(d));
  const byState = new Map<string, Destination[]>();
  for (const d of india) {
    const s = stateOf(d);
    byState.set(s, [...(byState.get(s) ?? []), d]);
  }
  const states = [...byState.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "India travel destinations",
    itemListElement: india.map((d, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/destinations/${d.id}`, name: d.name })),
  };

  return (
    <Container className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="max-w-2xl">
        <p className="text-[15px] font-medium text-terracotta">Where to go in India</p>
        <h1 className="mt-2 text-[44px] sm:text-[56px]">India destinations, state by state</h1>
        <p className="mt-4 text-[18px] text-ink-soft">
          {india.length} places we know well, from Himalayan villages to desert forts and backwaters. Each guide covers the best months, how many days you need,
          how to get there and what it really costs.
        </p>
        <nav aria-label="Jump to a state" className="mt-6 flex flex-wrap gap-2">
          {states.map(([s]) => (
            <a key={s} href={`#${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="rounded-full border border-line px-3 py-1 text-[14px] hover:border-forest hover:text-forest">
              {s}
            </a>
          ))}
        </nav>
      </div>

      {states.map(([s, list]) => (
        <section key={s} id={s.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="mt-14 scroll-mt-20" aria-label={s}>
          <h2 className="text-[30px]">{s}</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((d) => (
              <Card key={d.id} d={d} />
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-16 rounded-[var(--radius-card)] border border-line bg-[#efe8da] p-8">
        <h2 className="text-[30px]">Not sure where to start?</h2>
        <p className="mt-2 max-w-xl text-ink-soft">Tell us how you want the trip to feel, your budget and your dates. We&rsquo;ll match you with three places that fit, for free.</p>
        <ButtonLink href="/plan" className="mt-6">
          Find my trip
        </ButtonLink>
      </div>

      {abroad.length ? (
        <section className="mt-16" aria-label="Beyond India">
          <h2 className="text-[30px]">Beyond India</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {abroad.map((d) => (
              <Card key={d.id} d={d} />
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
