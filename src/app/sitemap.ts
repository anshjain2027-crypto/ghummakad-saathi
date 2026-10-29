import type { MetadataRoute } from "next";
import { SEED_DESTINATIONS } from "@/lib/seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const pages = ["", "/plan", "/pricing", "/terms", "/privacy", "/sponsored-disclosure", "/community-guidelines", "/refunds"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...SEED_DESTINATIONS.map((d) => ({ url: `${base}/destinations/${d.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
