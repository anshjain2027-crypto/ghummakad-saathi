import "server-only";
import { config } from "@/lib/config";

/**
 * Exa web search (https://api.exa.ai/search, header x-api-key).
 * Used for timely, attributed context — road closures, festivals, advisories.
 * We show the title, source and date with a link; we never republish article
 * text. Results are treated as untrusted data everywhere (prompt injection).
 */

export type WebNote = { title: string; url: string; source: string; publishedDate: string | null };

const cache = new Map<string, { at: number; notes: WebNote[] }>();
const TTL_MS = 6 * 60 * 60 * 1000;

export const exaEnabled = !!config.exaKey;

export async function recentTravelNotes(destination: { id: string; name: string; region: string; country: string }): Promise<WebNote[]> {
  if (!config.exaKey) return [];
  const hit = cache.get(destination.id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.notes;

  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-api-key": config.exaKey },
      body: JSON.stringify({
        query: `${destination.name}, ${destination.region}, ${destination.country} travel update road conditions weather festival advisory`,
        type: "auto",
        numResults: 5,
        startPublishedDate: since,
        moderation: true,
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { results?: { title?: string; url?: string; publishedDate?: string }[] };
    const notes = (body.results ?? [])
      .filter((r) => r.url && /^https:\/\//.test(r.url))
      .slice(0, 4)
      .map((r) => ({
        title: (r.title ?? r.url!).replace(/<[^>]+>/g, "").slice(0, 140),
        url: r.url!,
        source: new URL(r.url!).hostname.replace(/^www\./, ""),
        publishedDate: r.publishedDate ?? null,
      }));
    cache.set(destination.id, { at: Date.now(), notes });
    return notes;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
