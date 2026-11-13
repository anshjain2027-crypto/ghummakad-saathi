import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listDestinations } from "@/lib/data/catalog";
import { postsForDestination } from "@/lib/data/blog";
import { inr, monthList, statesWithPages } from "@/lib/destination-seo";
import { DestinationCard } from "@/components/destination-card";
import { ButtonLink, Container } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

async function load(slug: string) {
  const all = await listDestinations().catch(() => []);
  const states = statesWithPages(all);
  return { hit: states.find((s) => s.slug === slug) ?? null, states };
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { hit } = await load((await params).state);
  if (!hit) return { title: "Not found", robots: { index: false } };
  const n = hit.destinations.length;
  const names = hit.destinations.slice(0, 3).map((d) => d.name).join(", ");
  return {
    title: `${hit.state} travel guide: ${n} places to visit, when to go and costs`,
    description: `Where to go in ${hit.state}: ${names}${n > 3 ? " and more" : ""}. Best months, how many days to plan and what each place costs per day, with day-by-day itineraries.`,
    alternates: { canonical: `/india/${hit.slug}` },
  };
}

/** Months that are "best" for at least half of the state's destinations. */
function bestStateMonths(lists: number[][]): number[] {
  const count = new Map<number, number>();
  for (const l of lists) for (const m of l) count.set(m, (count.get(m) ?? 0) + 1);
  return [...count.entries()].filter(([, c]) => c >= Math.ceil(lists.length / 2)).map(([m]) => m).sort((a, b) => a - b);
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { hit, states } = await load((await params).state);
  if (!hit) notFound();
  const { state, destinations } = hit;
  const guides = (await Promise.all(destinations.map((d) => postsForDestination(d.id, 2)))).flat();
  const months = bestStateMonths(destinations.map((d) => d.bestMonths));
  const minDays = Math.min(...destinations.map((d) => d.suggestedDaysMin));
  const comfy = destinations.map((d) => d.dailyCost?.comfortable).filter((c): c is [number, number] => Array.isArray(c));
  const costLow = comfy.length ? Math.min(...comfy.map((c) => c[0])) : null;
  const costHigh = comfy.length ? Math.max(...comfy.map((c) => c[1])) : null;

  const faq = [
    months.length
      ? { q: `What is the best time to visit ${state}?`, a: `${monthList(months)} suit most of ${state}'s destinations. Each place differs, so check the table above: hill areas and beaches peak in different months.` }
      : null,
    { q: `How many days do you need for ${state}?`, a: `Allow at least ${minDays} days for one place. To combine two or three of the destinations here, plan 7–10 days including travel between them.` },
    costLow && costHigh
      ? { q: `How much does a trip to ${state} cost?`, a: `A comfortable trip costs roughly ${inr(costLow)}–${inr(costHigh)} per person per day across these places, excluding travel to get there. Backpacker budgets can be much lower; peak-season prices are higher.` }
      : null,
  ].filter((f): f is { q: string; a: string } => Boolean(f));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Places to visit in ${state}`,
      itemListElement: destinations.map((d, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/destinations/${d.id}`, name: d.name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
        { "@type": "ListItem", position: 3, name: state, item: `${SITE_URL}/india/${hit.slug}` },
      ],
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
      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-soft">
        <Link href="/destinations" className="underline underline-offset-4 hover:text-forest">
          Destinations
        </Link>{" "}
        / <span>{state}</span>
      </nav>
      <div className="mt-3 max-w-2xl">
        <h1 className="text-[40px] sm:text-[54px]">{state} travel guide</h1>
        <p className="mt-4 text-[18px] text-ink-soft">
          {destinations.length} places in {state} worth the trip: {destinations.map((d) => d.name).join(", ")}. Here&rsquo;s when to go, how long to stay and what
          each one costs.
        </p>
      </div>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((d) => (
          <DestinationCard key={d.id} d={d} />
        ))}
      </ul>

      <section className="mt-14" aria-labelledby="compare">
        <h2 id="compare" className="text-[30px]">
          {state} at a glance
        </h2>
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="border-b border-line text-[13px] uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="p-4 font-medium">Place</th>
                <th className="p-4 font-medium">Best months</th>
                <th className="p-4 font-medium">Days</th>
                <th className="p-4 font-medium">Comfortable budget / day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {destinations.map((d) => (
                <tr key={d.id}>
                  <td className="p-4">
                    <Link href={`/destinations/${d.id}`} className="font-medium text-forest underline-offset-4 hover:underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="p-4 text-ink-soft">{monthList(d.bestMonths) || "Year-round"}</td>
                  <td className="p-4 text-ink-soft">
                    {d.suggestedDaysMin}–{d.suggestedDaysMax}
                  </td>
                  <td className="p-4 text-ink-soft">
                    {d.dailyCost?.comfortable ? `${inr(d.dailyCost.comfortable[0])}–${inr(d.dailyCost.comfortable[1])}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[13px] text-ink-soft">Per person, excluding travel to get there. Estimates; prices rise in peak season.</p>
      </section>

      {guides.length ? (
        <section className="mt-14" aria-labelledby="guides">
          <h2 id="guides" className="text-[30px]">
            {state} itineraries and guides
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.id}>
                <Link href={`/blog/${g.slug}`} className="lift block rounded-[var(--radius-card)] border border-line bg-surface p-5">
                  <span className="block font-serif text-[20px] leading-tight">{g.title}</span>
                  <span className="mt-2 block text-[14px] text-ink-soft">{g.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-14 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-[30px]">
          {state}: common questions
        </h2>
        <div className="mt-5 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {faq.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="font-sans text-[17px] font-medium">{f.q}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 rounded-[var(--radius-card)] border border-line bg-[#efe8da] p-8">
        <h2 className="text-[28px]">Plan {state} around your dates</h2>
        <p className="mt-2 max-w-xl text-ink-soft">Tell us your mood, budget and dates. We&rsquo;ll pick the places that fit and build the day-by-day plan, with trains and buses from your city.</p>
        <ButtonLink href="/plan" className="mt-6">
          Find my trip
        </ButtonLink>
      </div>

      <nav aria-label="Other states" className="mt-14">
        <h2 className="text-[22px]">More state guides</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {states
            .filter((s) => s.slug !== hit.slug)
            .map((s) => (
              <li key={s.slug}>
                <Link href={`/india/${s.slug}`} className="inline-block rounded-full border border-line px-3 py-1 text-[14px] hover:border-forest hover:text-forest">
                  {s.state}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </Container>
  );
}
