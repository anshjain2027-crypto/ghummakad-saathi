import type { MetadataRoute } from "next";
import { SEED_DESTINATIONS } from "@/lib/seed";
import { listPublishedPosts } from "@/lib/data/blog";
import { SITE_URL } from "@/lib/site";
import { statesWithPages } from "@/lib/destination-seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const pages = ["", "/plan", "/destinations", "/blog", "/pricing", "/terms", "/privacy", "/sponsored-disclosure", "/community-guidelines", "/refunds"];
  const posts = await listPublishedPosts(500);
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : p === "/blog" ? 0.8 : 0.6 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...SEED_DESTINATIONS.map((d) => ({ url: `${base}/destinations/${d.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...statesWithPages(SEED_DESTINATIONS).map((s) => ({ url: `${base}/india/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
