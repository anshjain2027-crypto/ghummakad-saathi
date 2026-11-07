import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts, readingMinutes } from "@/lib/data/blog";
import { listDestinations } from "@/lib/data/catalog";
import { Scene } from "@/components/scene";
import { Chip, Container, Empty, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "India travel guides & itineraries",
  description:
    "Practical India travel guides for first-timers and returning travellers: itineraries, trains, money, treks and honest costs in dollars and rupees.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const [posts, destinations] = await Promise.all([listPublishedPosts(), listDestinations()]);
  const dest = new Map(destinations.map((d) => [d.id, d]));
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[15px] font-medium text-terracotta">The Saathi journal</p>
        <h1 className="mt-2 text-[44px] sm:text-[56px]">India travel guides</h1>
        <p className="mt-4 text-[18px] text-ink-soft">
          Honest, practical guides for planning a trip to India — routes, trains, money, treks and what things really cost.
        </p>
      </div>
      {posts.length === 0 ? (
        <div className="mt-10">
          <Empty title="Guides are on their way" action={<ButtonLink href="/plan">Plan a trip</ButtonLink>}>
            Our first guides are being published. Meanwhile, plan your trip in two minutes.
          </Empty>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const d = p.destinationId ? dest.get(p.destinationId) : undefined;
            return (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <Scene
                    kind={d?.scene ?? "mountains"}
                    seed={p.slug}
                    label={p.title}
                    photoUrl={p.coverImageUrl ?? d?.heroImageUrl ?? null}
                    className="aspect-[16/10] rounded-[var(--radius-card)]"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.slice(0, 2).map((t) => (
                      <Chip key={t} tone="plain">
                        {t}
                      </Chip>
                    ))}
                  </div>
                  <h2 className="mt-2 text-[24px] leading-tight group-hover:text-forest">{p.title}</h2>
                  <p className="mt-2 text-[15px] text-ink-soft">{p.description}</p>
                  <p className="mt-2 text-[13px] text-ink-soft">
                    {p.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {readingMinutes(p.bodyMd)} min read
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
