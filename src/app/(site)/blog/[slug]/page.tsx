import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, listPublishedPosts, readingMinutes } from "@/lib/data/blog";
import { getDestination } from "@/lib/data/catalog";
import { config } from "@/lib/config";
import { formatPrice, PRICES } from "@/lib/pricing";
import { payCurrency } from "@/lib/pay-currency";
import { Markdown } from "@/components/markdown";
import { Scene } from "@/components/scene";
import { ButtonLink, Chip, Container } from "@/components/ui";
import { CurrencySwitch } from "@/components/currency-switch";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPublishedPost((await params).slug);
  if (!p) return { title: "Guide" };
  const d = p.destinationId ? await getDestination(p.destinationId) : null;
  const image = p.coverImageUrl ?? d?.heroImageUrl ?? undefined;
  return {
    title: { absolute: `${p.title} | Ghummakad Saathi` },
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.description, publishedTime: p.publishedAt?.toISOString(), images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title: p.title, description: p.description, images: image ? [image] : undefined },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedPost(slug);
  if (!p) notFound();
  const [d, more, cur] = await Promise.all([p.destinationId ? getDestination(p.destinationId) : null, listPublishedPosts(6), payCurrency()]);
  const cover = p.coverImageUrl ?? d?.heroImageUrl ?? null;
  const credit = p.coverImageUrl ? p.coverCredit : d?.imageCredit ?? null;
  const price = `${formatPrice(PRICES[cur].standard, cur)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt?.toISOString(),
    dateModified: p.updatedAt.toISOString(),
    author: { "@type": "Organization", name: p.authorName },
    publisher: { "@type": "Organization", name: "Ghummakad Saathi", logo: { "@type": "ImageObject", url: `${config.appUrl}/brand/mark.png` } },
    mainEntityOfPage: `${config.appUrl}/blog/${p.slug}`,
    ...(cover ? { image: [cover] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container narrow className="pt-10 sm:pt-14">
        <Link href="/blog" className="text-[15px] text-forest underline underline-offset-4">
          All guides
        </Link>
        <div className="mt-6 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <Chip key={t} tone="plain">
              {t}
            </Chip>
          ))}
        </div>
        <h1 className="mt-3 text-[38px] leading-tight sm:text-[52px]">{p.title}</h1>
        <p className="mt-4 text-[19px] text-ink-soft">{p.description}</p>
        <p className="mt-4 text-[14px] text-ink-soft">
          By {p.authorName} · {p.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {readingMinutes(p.bodyMd)} min read
        </p>
      </Container>
      <Container className="mt-8 max-w-4xl">
        <Scene kind={d?.scene ?? "mountains"} seed={p.slug} label={p.title} photoUrl={cover} credit={credit} className="aspect-[16/8] rounded-[var(--radius-card)]" priority />
      </Container>
      <Container narrow className="pb-16">
        <article className="max-w-none">
          <Markdown source={p.bodyMd} />
        </article>

        <aside className="mt-12 rounded-[var(--radius-card)] border border-forest bg-forest-soft p-6">
          <p className="font-serif text-[26px]">{d ? `Plan your ${d.name} trip in two minutes` : "Plan your India trip in two minutes"}</p>
          <p className="mt-2 text-[16px] text-ink-soft">
            Tell us your mood, budget and dates. Get matched destinations, the best way to travel from your city, and a day-by-day plan you can change for 30 days.
          </p>
          <p className="mt-3 text-[15px]">
            Full plan from <strong>{price}</strong> for 1–4 travellers{cur === "USD" ? " (₹499 if you pay from India)" : " ($10 from outside India)"}. Exploring matches is free.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/plan">Start planning — it&rsquo;s free</ButtonLink>
            {d ? (
              <ButtonLink href={`/destinations/${d.id}`} variant="secondary">
                About {d.name}
              </ButtonLink>
            ) : null}
          </div>
          <CurrencySwitch current={cur} next={`/blog/${p.slug}`} className="mt-3" />
        </aside>

        {more.filter((m) => m.slug !== p.slug).length ? (
          <section className="mt-14" aria-labelledby="more">
            <h2 id="more" className="text-[26px]">
              More guides
            </h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {more
                .filter((m) => m.slug !== p.slug)
                .slice(0, 4)
                .map((m) => (
                  <li key={m.id} className="py-4">
                    <Link href={`/blog/${m.slug}`} className="font-serif text-[20px] hover:text-forest">
                      {m.title}
                    </Link>
                    <p className="mt-1 text-[14px] text-ink-soft">{m.description}</p>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}
