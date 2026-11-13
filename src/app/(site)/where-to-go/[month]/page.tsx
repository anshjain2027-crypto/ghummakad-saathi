import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listDestinations } from "@/lib/data/catalog";
import { MONTHS, isIndia, monthName, stateOf } from "@/lib/destination-seo";
import { MONTH_INTRO } from "@/lib/month-guide";
import { DestinationCard } from "@/components/destination-card";
import { ButtonLink, Container } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}

function monthIndex(slug: string): number | null {
  const i = (MONTHS as readonly string[]).indexOf(slug);
  return i === -1 ? null : i + 1;
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const m = monthIndex((await params).month);
  if (!m) return { title: "Not found", robots: { index: false } };
  const name = monthName(m);
  return {
    title: `Where to go in India in ${name}: best places to visit`,
    description: `The best places to visit in India in ${name}, chosen by season: ${MONTH_INTRO[m].summary}`,
    alternates: { canonical: `/where-to-go/${MONTHS[m - 1]}` },
  };
}

export default async function MonthPage({ params }: { params: Promise<{ month: string }> }) {
  const m = monthIndex((await params).month);
  if (!m) notFound();
  const name = monthName(m);
  const intro = MONTH_INTRO[m];
  const all = (await listDestinations().catch(() => [])).filter(isIndia);
  const best = all.filter((d) => d.bestMonths.includes(m));
  const prev = m === 1 ? 12 : m - 1;
  const next = m === 12 ? 1 : m + 1;

  // Group by state so the page reads like a map of the month.
  const groups = new Map<string, typeof best>();
  for (const d of best) groups.set(stateOf(d), [...(groups.get(stateOf(d)) ?? []), d]);
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  const faq = [
    { q: `Is ${name} a good time to visit India?`, a: `${intro.summary} ${intro.watch}` },
    best.length
      ? {
          q: `Where is the best place to visit in India in ${name}?`,
          a: `Good choices in ${name} include ${best
            .slice(0, 6)
            .map((d) => d.name)
            .join(", ")}. The right one depends on whether you want mountains, beaches or culture.`,
        }
      : null,
  ].filter((f): f is { q: string; a: string } => Boolean(f));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best places to visit in India in ${name}`,
      itemListElement: best.map((d, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/destinations/${d.id}`, name: d.name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <Container className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Months" className="flex flex-wrap gap-2">
        {MONTHS.map((slug, i) => (
          <Link
            key={slug}
            href={`/where-to-go/${slug}`}
            aria-current={i + 1 === m ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-[14px] ${i + 1 === m ? "border-forest bg-forest text-cream" : "border-line hover:border-forest hover:text-forest"}`}
          >
            {monthName(i + 1).slice(0, 3)}
          </Link>
        ))}
      </nav>

      <div className="mt-8 max-w-2xl">
        <p className="text-[15px] font-medium text-terracotta">{intro.headline}</p>
        <h1 className="mt-2 text-[40px] sm:text-[54px]">Where to go in India in {name}</h1>
        <p className="mt-4 text-[18px] text-ink-soft">{intro.summary}</p>
        <p className="mt-3 text-[15px] text-ink-soft">
          <strong className="font-medium text-ink">Keep in mind:</strong> {intro.watch}
        </p>
      </div>

      {best.length ? (
        <>
          <p className="mt-10 text-[15px] text-ink-soft">
            {best.length} places at their best in {name}:
          </p>
          {ordered.map(([state, list]) => (
            <section key={state} className="mt-8" aria-label={state}>
              <h2 className="text-[26px]">{state}</h2>
              <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((d) => (
                  <DestinationCard key={d.id} d={d} note={d.seasonNote} />
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <p className="mt-10 text-ink-soft">
          Few of our destinations are at their best in {name}. Try <Link href={`/where-to-go/${MONTHS[next - 1]}`} className="text-forest underline">{monthName(next)}</Link> instead.
        </p>
      )}

      <section className="mt-14 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-[30px]">
          Travelling in {name}: common questions
        </h2>
        <div className="mt-5 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {faq.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="font-sans text-[17px] font-medium">{f.q}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[15px]">
          Planning the whole year? Read our{" "}
          <Link href="/blog/best-time-to-visit-india-month-by-month" className="text-forest underline underline-offset-4">
            month-by-month guide to India
          </Link>
          .
        </p>
      </section>

      <div className="mt-14 rounded-[var(--radius-card)] border border-line bg-[#efe8da] p-8">
        <h2 className="text-[28px]">Travelling in {name}?</h2>
        <p className="mt-2 max-w-xl text-ink-soft">Give our planner your dates, mood and budget. It only suggests places that are good in your month, with a day-by-day plan.</p>
        <ButtonLink href="/plan" className="mt-6">
          Find my trip
        </ButtonLink>
      </div>

      <nav aria-label="Previous and next month" className="mt-10 flex justify-between text-[15px]">
        <Link href={`/where-to-go/${MONTHS[prev - 1]}`} className="text-forest underline underline-offset-4">
          ← {monthName(prev)}
        </Link>
        <Link href={`/where-to-go/${MONTHS[next - 1]}`} className="text-forest underline underline-offset-4">
          {monthName(next)} →
        </Link>
      </nav>
    </Container>
  );
}
