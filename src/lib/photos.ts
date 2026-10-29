import "server-only";
import { asService } from "@/lib/db";
import { haversineKm } from "@/lib/geo";

/**
 * Real, licensed photos for destinations and curated places, from Wikimedia
 * Commons via the Wikipedia page-summary API. Only freely licensed images
 * (CC / public domain) are used, always with the author and licence credited
 * and linked. Results are cached in the database; each record is checked once.
 */

const UA = "GhummakadSaathi/1.0 (https://ghummakadsaathi.online; hello@ghummakadsaathi.online)";

export type Photo = { url: string; credit: string; pageUrl: string };

const strip = (html: string) => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type Summary = {
  type?: string;
  title?: string;
  thumbnail?: { source: string; width: number };
  originalimage?: { source: string; width: number };
  coordinates?: { lat: number; lon: number };
};

type CommonsInfo = {
  query?: { pages?: Record<string, { missing?: string; imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] }> };
};

/** Finds a freely-licensed lead photo for a Wikipedia article, near the expected location. */
export async function findPhoto(title: string, near?: { lat: number; lng: number }, maxKm = 60): Promise<Photo | null> {
  const s = await getJson<Summary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
  if (!s || s.type === "disambiguation") return null;
  const src = s.thumbnail?.source ?? s.originalimage?.source;
  if (!src) return null;
  if (near && s.coordinates && haversineKm(near, { lat: s.coordinates.lat, lng: s.coordinates.lon }) > maxKm) return null;

  // File name from the upload URL (thumb or original).
  const m = src.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
  if (!m) return null; // not a Commons file (e.g. non-free enwiki upload) → skip
  const file = decodeURIComponent(m[1]);
  const info = await getJson<CommonsInfo>(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent(`File:${file}`)}`,
  );
  const page = info?.query?.pages ? Object.values(info.query.pages)[0] : undefined;
  const ii = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !ii) return null;
  const meta = ii.extmetadata ?? {};
  const license = strip(meta.LicenseShortName?.value ?? "");
  // Free licences only: CC BY / CC BY-SA / CC0 / public domain. No NC or ND.
  if (!/^(cc|public domain|pd)/i.test(license) || /(^|[-\s])(nc|nd)([-\s]|$)/i.test(license)) return null;
  const artist = strip(meta.Artist?.value ?? "") || "Unknown author";

  // Ask for a 1280px rendition (or the original if smaller).
  const url = /\/thumb\//.test(src) ? src.replace(/\/\d+px-/, "/1280px-") : src;
  return {
    url,
    credit: `Photo: ${artist.slice(0, 60)} · ${license} · Wikimedia Commons`,
    pageUrl: ii.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
  };
}

type DestRow = { id: string; name: string; lat: number; lng: number; extra: { photoTitle?: string } | string | null };
type PlaceRow = { id: string; photo_title: string; lat: number; lng: number };

const inflight = new Set<string>();

/** Fills in photos not yet checked. Safe to call repeatedly; each record is attempted once. */
export async function refreshPhotos(opts: { destinationId?: string; limit?: number } = {}): Promise<{ destinations: number; places: number }> {
  const key = opts.destinationId ?? "*";
  if (inflight.has(key)) return { destinations: 0, places: 0 };
  inflight.add(key);
  const limit = opts.limit ?? 20;
  let dCount = 0;
  let pCount = 0;
  try {
    const { dests, places } = await asService(async (q) => ({
      dests: await q.query<DestRow>(
        `select id, name, lat, lng, extra from public.destination
         where photo_checked_at is null and hero_image_url is null ${opts.destinationId ? "and id = $2" : ""}
         order by name limit $1`,
        opts.destinationId ? [limit, opts.destinationId] : [limit],
      ),
      places: await q.query<PlaceRow>(
        `select id, photo_title, lat, lng from public.place
         where source = 'curated' and photo_title is not null and photo_checked_at is null ${opts.destinationId ? "and destination_id = $2" : ""}
         order by name limit $1`,
        opts.destinationId ? [limit * 2, opts.destinationId] : [limit * 2],
      ),
    }));

    for (const d of dests) {
      const extra = typeof d.extra === "string" ? JSON.parse(d.extra) : (d.extra ?? {});
      const photo = await findPhoto(extra.photoTitle ?? d.name, { lat: Number(d.lat), lng: Number(d.lng) }, 120);
      await asService((q) =>
        q.query(
          `update public.destination set hero_image_url = coalesce($2, hero_image_url), image_credit = coalesce($3, image_credit),
             image_page_url = coalesce($4, image_page_url), photo_checked_at = now() where id = $1`,
          [d.id, photo?.url ?? null, photo?.credit ?? null, photo?.pageUrl ?? null],
        ),
      );
      if (photo) dCount++;
    }
    for (const p of places) {
      const photo = await findPhoto(p.photo_title, { lat: Number(p.lat), lng: Number(p.lng) }, 40);
      await asService((q) =>
        q.query(
          `update public.place set image_url = $2, image_credit = $3, image_page_url = $4, photo_checked_at = now() where id = $1`,
          [p.id, photo?.url ?? null, photo?.credit ?? null, photo?.pageUrl ?? null],
        ),
      );
      if (photo) pCount++;
    }
  } catch (e) {
    console.error("photo refresh failed", e);
  } finally {
    inflight.delete(key);
  }
  return { destinations: dCount, places: pCount };
}
