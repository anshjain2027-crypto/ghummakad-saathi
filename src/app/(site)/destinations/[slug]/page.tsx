import type { Metadata } from "next";
import { after } from "next/server";
import { refreshPhotos } from "@/lib/photos";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { curatedPlaces, getDestination } from "@/lib/data/catalog";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { Scene } from "@/components/scene";
import { ButtonLink, Chip, Container } from "@/components/ui";

/** Public, indexable editorial destination page (SEO). Community content stays behind sign-in. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return { title: "Destination" };
  return { title: `${d.name}, ${d.region}`, description: `${d.tagline} ${d.story.slice(0, 120)}…`, alternates: { canonical: `/destinations/${d.id}` } };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) notFound();
  after(() => refreshPhotos({ destinationId: d.id, limit: 10 }));
  const [places, user] = await Promise.all([curatedPlaces(d.id), getCurrentUser()]);
  const months = d.bestMonths.map((m) => new Date(2026, m - 1, 1).toLocaleString("en-IN", { month: "short" })).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.story,
    geo: { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng },
    containedInPlace: { "@type": "Place", name: `${d.region}, ${d.country}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="on-dark relative isolate overflow-hidden bg-forest-deep text-cream">
        <Scene kind={d.scene} seed={d.id} label={`${d.name} landscape`} photoUrl={d.heroImageUrl} credit={d.imageCredit} className="absolute inset-0 -z-10" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f2a23]/90 via-[#0f2a23]/30 to-transparent" />
        <Container className="flex min-h-[56svh] flex-col justify-end pb-12 pt-24">
          <p className="text-cream/85">
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
        </aside>
      </Container>
    </>
  );
}
