import type { Metadata } from "next";
import { after } from "next/server";
import { refreshPhotos } from "@/lib/photos";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { postsForDestination } from "@/lib/data/blog";
import { curatedPlaces, getDestination, listDestinations } from "@/lib/data/catalog";
import { destinationFaq, isIndia, stateOf } from "@/lib/destination-seo";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { Scene } from "@/components/scene";
import { SITE_URL } from "@/lib/site";
import { ButtonLink, Chip, Container } from "@/components/ui";

/** Public, indexable editorial destination page (SEO). Community content stays behind sign-in. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return { title: "Destination" };
  const base = `${d.name}, ${d.region} travel guide & itinerary`;
  // The site-wide title suffix says "India trip planner"; that's wrong on Kyoto or Lisbon, so non-India pages get their own.
  const title = d.country === "India" ? base : { absolute: `${base} · Ghummakad Saathi trip planner` };
  const description = `${d.tagline} ${d.story.slice(0, 120)}…`;
  const images = d.heroImageUrl ? [d.heroImageUrl] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.id}` },
    openGraph: { type: "article", title: base, description, url: `/destinations/${d.id}`, images },
    twitter: { card: "summary_large_image", title: base, description, images },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) notFound();
  after(() => refreshPhotos({ destinationId: d.id, limit: 10 }));
  const [places, user, guides, all] = await Promise.all([curatedPlaces(d.id), getCurrentUser(), postsForDestination(d.id), listDestinations().catch(() => [])]);
  const state = stateOf(d);
  const nearby = all.filter((o) => o.id !== d.id && o.country === d.country && stateOf(o) === state).slice(0, 4);
  const more = nearby.length >= 3 ? nearby : [...nearby, ...all.filter((o) => o.id !== d.id && o.country === d.country && !nearby.includes(o))].slice(0, 4);
  const faq = destinationFaq(d);
  const months = d.bestMonths.map((m) => new Date(2026, m - 1, 1).toLocaleString("en-IN", { month: "short" })).join(", ");
  const jsonLd = [{
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.story,
    url: `${SITE_URL}/destinations/${d.id}`,
    ...(d.heroImageUrl ? { image: d.heroImageUrl } : {}),
    geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng },
    containedInPlace: { "@type": "Place", name: `${d.region}, ${d.country}` },
  }, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: d.name, item: `${SITE_URL}/destinations/${d.id}` },
    ],
  }, ...(faq.length ? [{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }] : [])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="on-dark relative isolate overflow-hidden bg-forest-deep text-cream">
        <Scene kind={d.scene} seed={d.id} label={`${d.name} landscape`} photoUrl={d.heroImageUrl} credit={d.imageCredit} className="absolute inset-0 -z-10" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f2a23]/90 via-[#0f2a23]/30 to-transparent" />
        <Container className="flex min-h-[56svh] flex-col justify-end pb-12 pt-24">
          <nav aria-label="Breadcrumb" className="text-[14px] text-cream/80">
            <Link href="/destinations" className="underline decoration-cream/40 underline-offset-4 hover:decoration-cream">Destinations</Link>
            <span aria-hidden> / </span>
            {isIndia(d) ? <Link href={`/destinations#${state.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="underline decoration-cream/40 underline-offset-4 hover:decoration-cream">{state}</Link> : <span>{d.country}</span>}
          </nav>
          <p className="mt-1 text-cream/85">
            {d.region}, {d.country}
          </p>
          <h1 className="text-[48px] sm:text-[72px]">{d.name}</h1>
          <p className="mt-2 max-w-xl font-serif text-[24px] italic">{d.tagline}</p>
        </Container>
      </section>
      <Container className="grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="max-w-2xl text-[19px] leading-relaxed">{d.story}</p>
          <h2 className="mt-12 text-[30px]">Places we love here</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {places
              .filter((p) => p.category !== "stay")
              .map((p) => (
                <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                  <p className="text-[13px] font-medium text-forest">
                    {PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}
                    {p.hiddenGem ? " · lesser-known" : ""}
                  </p>
                  <p className="font-serif text-[20px] leading-tight">{p.name}</p>
                  <p className="mt-1 text-[14px] text-ink-soft">{p.description}</p>
                </li>
              ))}
          </ul>
          {faq.length ? (
            <section className="mt-12" aria-labelledby="faq">
              <h2 id="faq" className="text-[30px]">{d.name}: common questions</h2>
              <div className="mt-5 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
                {faq.map((f) => (
                  <details key={f.q} className="group p-5">
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      <span className="flex items-start justify-between gap-4">
                        {f.q}
                        <span aria-hidden className="text-forest transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
          {more.length ? (
            <section className="mt-12" aria-labelledby="more">
              <h2 id="more" className="text-[30px]">{nearby.length >= 3 ? `More places in ${state}` : "You might also like"}</h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {more.map((o) => (
                  <li key={o.id}>
                    <Link href={`/destinations/${o.id}`} className="lift block rounded-[var(--radius-card)] border border-line bg-surface p-4">
                      <span className="block font-serif text-[20px] leading-tight">{o.name}</span>
                      <span className="mt-1 block text-[14px] text-ink-soft">{o.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/destinations" className="mt-5 inline-block text-[15px] text-forest underline underline-offset-4">
                See all destinations
              </Link>
            </section>
          ) : null}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
            <dl className="space-y-4 text-[15px]">
              <div>
                <dt className="text-ink-soft">Best months</dt>
                <dd className="font-medium">{months}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Suggested stay</dt>
                <dd className="font-medium">
                  {d.suggestedDaysMin}–{d.suggestedDaysMax} days
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">Getting there</dt>
                <dd>{d.gettingThere}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Season</dt>
                <dd>{d.seasonNote}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.experienceTags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>
          <ButtonLink href="/plan" className="w-full">
            Find my trip
          </ButtonLink>
          <Link href={user ? `/map?lat=${d.lat}&lng=${d.lng}&z=11` : `/sign-in?next=${encodeURIComponent(`/map?lat=${d.lat}&lng=${d.lng}&z=11`)}`} className="block text-center text-[15px] text-forest underline underline-offset-4">
            {user ? "See it on the community map" : "Sign in free to see community pins here"}
          </Link>
          {guides.length ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <p className="font-serif text-[21px]">Guides</p>
              <ul className="mt-2 space-y-2">
                {guides.map((g) => (
                  <li key={g.id}>
                    <Link href={`/blog/${g.slug}`} className="text-[15px] text-forest underline underline-offset-4">
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </Container>
    </>
  );
}
