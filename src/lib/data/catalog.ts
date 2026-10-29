import "server-only";
import { asAnon, asService } from "@/lib/db";
import type { CuratedPlace, Destination } from "@/lib/planner/types";

type DestinationRow = {
  id: string; name: string; region: string; country: string; country_code: string; lat: number; lng: number;
  timezone: string; local_currency: string; tagline: string; story: string; moods: string[]; styles: string[];
  companions: string[]; experience_tags: string[]; daily_cost_inr: Destination["dailyCost"]; suggested_days_min: number;
  suggested_days_max: number; best_months: number[]; season_note: string; travel_character: string; practical_note: string;
  getting_there: string; stay_area: string; nearest_airport_iata: string | null; nearest_rail_station: string | null;
  scene: string; hero_image_url: string | null; image_credit: string | null; image_page_url?: string | null; extra?: unknown;
};

export function mapDestination(r: DestinationRow): Destination {
  return {
    id: r.id, name: r.name, region: r.region, country: r.country, countryCode: r.country_code, lat: Number(r.lat), lng: Number(r.lng),
    timezone: r.timezone, localCurrency: r.local_currency, tagline: r.tagline, story: r.story,
    moods: r.moods as Destination["moods"], styles: r.styles as Destination["styles"], companions: r.companions as Destination["companions"],
    experienceTags: r.experience_tags, dailyCost: typeof r.daily_cost_inr === "string" ? JSON.parse(r.daily_cost_inr) : r.daily_cost_inr,
    suggestedDaysMin: r.suggested_days_min, suggestedDaysMax: r.suggested_days_max, bestMonths: r.best_months,
    seasonNote: r.season_note, travelCharacter: r.travel_character, practicalNote: r.practical_note, gettingThere: r.getting_there,
    stayArea: r.stay_area, nearestAirport: r.nearest_airport_iata, nearestRail: r.nearest_rail_station, scene: r.scene,
    heroImageUrl: r.hero_image_url, imageCredit: r.image_credit, imagePageUrl: r.image_page_url ?? null,
    extra: (typeof r.extra === "string" ? JSON.parse(r.extra) : r.extra ?? {}) as Destination["extra"],
  };
}

/** Public editorial catalogue, read as the anon role (RLS: published only). */
export async function listDestinations(): Promise<Destination[]> {
  const rows = await asAnon((q) => q.query<DestinationRow>(`select * from public.destination where status = 'published' order by name`));
  return rows.map(mapDestination);
}

export async function getDestination(id: string): Promise<Destination | null> {
  const rows = await asAnon((q) => q.query<DestinationRow>(`select * from public.destination where id = $1`, [id]));
  return rows[0] ? mapDestination(rows[0]) : null;
}

type PlaceRow = {
  id: string; destination_id: string | null; name: string; category: string; description: string; lat: number; lng: number;
  avg_duration_min: number | null; est_cost_inr: number | null; best_time: CuratedPlace["bestTime"] | null; hidden_gem: boolean; scene: string | null;
  image_url?: string | null; image_credit?: string | null; image_page_url?: string | null;
};

export function mapPlace(r: PlaceRow): CuratedPlace {
  return {
    id: r.id, destinationId: r.destination_id, name: r.name, category: r.category, description: r.description,
    lat: Number(r.lat), lng: Number(r.lng), durationMin: r.avg_duration_min ?? 90, costInr: r.est_cost_inr ?? 0,
    bestTime: r.best_time ?? "any", hiddenGem: r.hidden_gem, scene: r.scene,
    imageUrl: r.image_url ?? null, imageCredit: r.image_credit ?? null, imagePageUrl: r.image_page_url ?? null,
  };
}

/**
 * Editorial (curated, approved) places for planning. These are our own
 * records, so the planner may read them without a session; community
 * submissions are NOT included here — they stay behind map sign-in + RLS.
 */
export async function curatedPlaces(destinationId: string): Promise<CuratedPlace[]> {
  const rows = await asService((q) =>
    q.query<PlaceRow>(
      `select id, destination_id, name, category, description, lat, lng, avg_duration_min, est_cost_inr, best_time, hidden_gem, scene, image_url, image_credit, image_page_url
       from public.place where destination_id = $1 and source = 'curated' and status = 'approved' order by name`,
      [destinationId],
    ),
  );
  return rows.map(mapPlace);
}
