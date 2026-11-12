import Link from "next/link";
import { Scene } from "@/components/scene";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ButtonLink, Container } from "@/components/ui";
import { MOODS } from "@/lib/domain";
import { PRICING_COPY } from "@/lib/pricing";
import { listDestinations } from "@/lib/data/catalog";
import { listPublishedPosts } from "@/lib/data/blog";
import { isIndia } from "@/lib/destination-seo";

export const revalidate = 3600;

/** Hand-picked order: the places first-time visitors to India search for most, then quieter favourites. */
const FEATURED = ["jaipur", "agra", "varanasi", "leh-ladakh", "alleppey", "munnar", "jaisalmer", "north-goa", "darjeeling", "mcleodganj-triund", "rishikesh", "udaipur"];

export default async function Home() {
  const [destinations, posts] = await Promise.all([listDestinations().catch(() => []), listPublishedPosts(3).catch(() => [])]);
  const india = destinations.filter(isIndia);
  const featured = [
    ...FEATURED.map((id) => india.find((d) => d.id === id)).filter((d): d is NonNullable<typeof d> => Boolean(d)),
    ...india.filter((d) => !FEATURED.includes(d.id) && d.heroImageUrl),
  ].slice(0, 8);
  return (
    <>
      <SiteHeader light />
      <main id="main">
        {/* Explorer entry — DESIGN.md screen 1: one dominant decision. */}
        <section className="on-dark relative isolate min-h-[92svh] overflow-hidden bg-forest-deep text-cream">
          <Scene kind="mountains" seed="tirthan-valley-hero" label="A river valley between cedar-covered mountains at first light" className="absolute inset-0 -z-10" priority />
          <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-[#0f2a23]/60 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f2a23]/85 via-[#0f2a23]/30 to-transparent" />
          <Container className="flex min-h-[92svh] flex-col justify-end pb-16 pt-28 sm:pb-24">
            <div className="max-w-2xl">
              <h1 className="text-[44px] leading-[1.02] sm:text-[72px]">How do you want this trip to feel?</h1>
              <p className="mt-5 max-w-xl text-[18px] text-cream/90 sm:text-[20px]">
                Tell us the mood, the people and the budget. We&rsquo;ll turn it into a trip that feels made for you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="/plan" variant="light" className="min-h-12 px-7 text-[16px]">
                  Find my trip
                </ButtonLink>
                <Link href="/destinations" className="rounded-md px-1 py-2 text-[16px] text-cream underline decoration-cream/40 underline-offset-[6px] hover:decoration-cream">
                  Browse destinations
                </Link>
              </div>
              <p className="mt-6 text-[14px] text-cream/75">A few simple questions, one at a time. No forms, no search box.</p>
            </div>
          </Container>
        </section>

        {/* Start from a feeling */}
        <section className="py-20" aria-labelledby="moods">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="moods" className="max-w-xl text-[34px] sm:text-[44px]">
                Start with a feeling, not a place.
              </h2>
              <p className="max-w-sm text-ink-soft">Pick the one that pulls at you today. You can change your mind at every step.</p>
            </div>
            <ul className="scroller -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {MOODS.map((m) => (
                <li key={m.id} className="w-[62vw] shrink-0 sm:w-auto">
                  <Link href={`/plan?mood=${m.id}`} className="lift group block overflow-hidden rounded-[var(--radius-card)] bg-surface">
                    <Scene kind={m.scene} seed={`home-${m.id}`} label="" className="aspect-[4/5]" />
                    <span className="block px-4 pb-4 pt-3">
                      <span className="block font-serif text-[21px] leading-tight">{m.label}</span>
                      <span className="mt-1 block text-[14px] text-ink-soft">{m.line}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {featured.length ? (
          <section className="pb-20" aria-labelledby="popular">
            <Container>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="popular" className="max-w-xl text-[34px] sm:text-[44px]">
                  Popular places in India
                </h2>
                <Link href="/destinations" className="text-[16px] text-forest underline underline-offset-4">
                  All {india.length} destinations
                </Link>
              </div>
              <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {featured.map((d) => (
                  <li key={d.id}>
                    <Link href={`/destinations/${d.id}`} className="lift group block overflow-hidden rounded-[var(--radius-card)] bg-surface">
                      <Scene kind={d.scene} seed={d.id} label={`${d.name}, ${d.region}`} photoUrl={d.heroImageUrl} className="aspect-[4/3]" />
                      <span className="block px-4 pb-4 pt-3">
                        <span className="block font-serif text-[20px] leading-tight group-hover:text-forest">{d.name}</span>
                        <span className="mt-1 block text-[13px] text-ink-soft">
                          {d.region} · {d.suggestedDaysMin}–{d.suggestedDaysMax} days
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        ) : null}

        {/* What you get — honest, plain */}
        <section className="border-y border-line bg-[#efe8da] py-20" aria-labelledby="shape">
          <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 id="shape" className="text-[34px] sm:text-[44px]">
                See the trip take shape, day by day.
              </h2>
              <p className="mt-4 max-w-lg text-[17px] text-ink-soft">
                Three destinations that fit you, each with the reason it fits. Choose one, and you get a full day-by-day plan with places,
                food, hidden spots, a rough budget and practical notes — then book stays and travel directly with the providers you trust.
              </p>
              <dl className="mt-8 grid max-w-lg gap-5 sm:grid-cols-2">
                <div>
                  <dt className="font-serif text-[22px]">Free to explore</dt>
                  <dd className="mt-1 text-[15px] text-ink-soft">Answer the questions and see your three matches without paying.</dd>
                </div>
                <div>
                  <dt className="font-serif text-[22px]">One price per trip</dt>
                  <dd className="mt-1 text-[15px] text-ink-soft">{PRICING_COPY.tiers}, taxes included. Not a subscription.</dd>
                </div>
                <div>
                  <dt className="font-serif text-[22px]">30 days to change anything</dt>
                  <dd className="mt-1 text-[15px] text-ink-soft">Dates, pace, activities — even the destination. As often as you like.</dd>
                </div>
                <div>
                  <dt className="font-serif text-[22px]">Honest numbers</dt>
                  <dd className="mt-1 text-[15px] text-ink-soft">Budgets are clearly marked as estimates. We never fake live prices.</dd>
                </div>
              </dl>
              <div className="mt-9 flex flex-wrap gap-4">
                <ButtonLink href="/plan">Find my trip</ButtonLink>
                <ButtonLink href="/pricing" variant="ghost">
                  See what&rsquo;s included
                </ButtonLink>
              </div>
            </div>
            <SampleDay />
          </Container>
        </section>

        {posts.length ? (
          <section className="pt-20" aria-labelledby="guides">
            <Container>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="guides" className="max-w-xl text-[34px] sm:text-[44px]">
                  India travel guides
                </h2>
                <Link href="/blog" className="text-[16px] text-forest underline underline-offset-4">
                  All guides
                </Link>
              </div>
              <ul className="mt-10 grid gap-5 md:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/blog/${p.slug}`} className="lift group block h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                      <Scene kind="mountains" seed={p.slug} label={p.title} photoUrl={p.coverImageUrl} className="aspect-[16/9]" />
                      <span className="block p-5">
                        <span className="block font-serif text-[21px] leading-tight group-hover:text-forest">{p.title}</span>
                        <span className="mt-2 block text-[14px] text-ink-soft">{p.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        ) : null}

        {/* Community map */}
        <section className="py-20" aria-labelledby="map-teaser">
          <Container className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="relative overflow-hidden rounded-[var(--radius-card)]">
              <Scene kind="forest" seed="map-teaser" label="Forest trail" className="aspect-[16/10]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid grid-cols-3 gap-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="grid h-10 w-10 place-items-center rounded-full border-2 border-cream bg-forest text-cream shadow-lg" style={{ transform: `translateY(${(i % 2) * 22}px)` }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                        <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3.2-4.5 8.5-4.5 8.5S3.5 9.2 3.5 6A4.5 4.5 0 0 1 8 1.5z" fill="currentColor" />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 id="map-teaser" className="text-[34px] sm:text-[44px]">
                A map kept by travellers.
              </h2>
              <p className="mt-4 max-w-lg text-[17px] text-ink-soft">
                Save places privately, add the quiet spots you found, and say whether somewhere is really worth going. The map is free — you
                just need a free account.
              </p>
              <ButtonLink href="/map" variant="secondary" className="mt-8">
                Explore the map
              </ButtonLink>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SampleDay() {
  const rows = [
    { time: "Morning", name: "Great Himalayan National Park trail", note: "Forest walk along the river" },
    { time: "Afternoon", name: "Gushaini riverside", note: "Clear pools, slow lunch" },
    { time: "Evening", name: "Himachali homestay dinner", note: "Siddu and rajma-chawal" },
  ];
  return (
    <figure className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[0_30px_60px_-40px_rgba(31,81,69,0.5)]">
      <Scene kind="mountains" seed="sample-day" label="Tirthan Valley" className="aspect-[16/7]" />
      <div className="p-6">
        <p className="text-[14px] text-ink-soft">Sample · Tirthan Valley · Day 2</p>
        <p className="mt-1 font-serif text-[26px]">Trails and big views</p>
        <ol className="mt-5 space-y-4 border-l-2 border-forest/25 pl-5">
          {rows.map((r) => (
            <li key={r.time} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-terracotta" aria-hidden />
              <p className="text-[13px] font-medium text-forest">{r.time}</p>
              <p className="font-medium">{r.name}</p>
              <p className="text-[14px] text-ink-soft">{r.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
