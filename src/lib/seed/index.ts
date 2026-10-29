import type { Queryable } from "@/lib/db/types";
import { SEED_DESTINATIONS as BASE } from "./destinations";
import { INDIA_DESTINATIONS } from "./india";
import { DESTINATION_EXTRAS } from "./extras";

/** Bump when the editorial catalogue changes so production re-seeds on boot. */
export const CATALOGUE_VERSION = "2026-10-30.1";

export const SEED_DESTINATIONS = [...BASE, ...INDIA_DESTINATIONS].map((d) => ({ ...d, extra: { ...(DESTINATION_EXTRAS[d.id] ?? {}), ...(d.extra ?? {}) } }));

export const PROVIDER_STATUS_SEED = [
  { provider: "booking_com", category: "stay", mode: "redirect", notes: "Outbound search links only. Affiliate ID and Demand API require partner approval.", docs: "https://developers.booking.com/demand/docs/getting-started/prerequisites" },
  { provider: "kayak", category: "flight", mode: "redirect", notes: "Preferred flight provider. Outbound search links until KAYAK Affiliate Network sandbox and production approval.", docs: "https://affiliates.kayak.com/apis/flights" },
  { provider: "skyscanner", category: "flight", mode: "redirect", notes: "Secondary referral fallback. Travel API has high entry requirements; not integrated.", docs: "https://www.partners.skyscanner.net/contact/travel-api" },
  { provider: "irctc", category: "train", mode: "redirect", notes: "Official IRCTC website only. Embedded ticketing needs authorised partner access.", docs: "https://contents.irctc.co.in/en/B2C_PSP_Policy_other_than_Startup_MSME.pdf" },
  { provider: "district", category: "event", mode: "redirect", notes: "Public outbound pages only, until written partner permission.", docs: null },
  { provider: "bookmyshow", category: "event", mode: "redirect", notes: "Public outbound pages only, until written partner permission.", docs: null },
  { provider: "local_vehicle", category: "vehicle", mode: "mock", notes: "No verified rental partner yet. Shows sponsor listings (labelled) or advice to ask your stay.", docs: null },
  { provider: "local_activity", category: "activity", mode: "mock", notes: "Curated suggestions only. Availability never verified.", docs: null },
  { provider: "google_maps", category: "maps", mode: "approved_api", notes: "Maps JavaScript API + Places API (New) under Google Maps Platform terms once a key is configured.", docs: "https://developers.google.com/maps/documentation/places/web-service/policies" },
  { provider: "dodo_payments", category: "payments", mode: "sandbox_approved", notes: "Hosted checkout (merchant of record). Test mode until the business is verified for live payouts.", docs: "https://docs.dodopayments.com/api-reference/checkout-sessions/create" },
  { provider: "exa", category: "search", mode: "approved_api", notes: "Web search API used for linked, attributed context only. No article text is republished.", docs: "https://docs.exa.ai/" },
  { provider: "llm", category: "ai", mode: "approved_api", notes: "OpenAI-compatible endpoint (River primary, OpenRouter fallback). Outputs validated against curated places.", docs: "https://openrouter.ai/docs" },
] as const;

export const PLACEMENT_SEED = [
  { id: "match_support", description: "Below the three organic destination matches", max: 1 },
  { id: "destination_sidebar", description: "Destination detail, beside the practical facts", max: 1 },
  { id: "map_pin", description: "Labelled sponsored pin on the community map", max: 2 },
  { id: "trip_module", description: "Trip hub stay / activity / vehicle module", max: 1 },
] as const;

/** Idempotent. Safe to run on every boot (PGlite) or via `npm run db:seed`. */
export async function seedDatabase(q: Queryable, opts: { demo?: boolean } = { demo: true }) {
  for (const d of SEED_DESTINATIONS) {
    await q.query(
      `insert into public.destination (id, name, region, country, country_code, lat, lng, timezone, local_currency, tagline, story,
        moods, styles, companions, experience_tags, daily_cost_inr, suggested_days_min, suggested_days_max, best_months,
        season_note, travel_character, practical_note, getting_there, stay_area, nearest_airport_iata, nearest_rail_station, scene, extra)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28::jsonb)
       on conflict (id) do update set name = excluded.name, tagline = excluded.tagline, story = excluded.story,
        moods = excluded.moods, styles = excluded.styles, companions = excluded.companions, experience_tags = excluded.experience_tags,
        daily_cost_inr = excluded.daily_cost_inr, suggested_days_min = excluded.suggested_days_min, suggested_days_max = excluded.suggested_days_max,
        best_months = excluded.best_months, season_note = excluded.season_note, travel_character = excluded.travel_character,
        practical_note = excluded.practical_note, getting_there = excluded.getting_there, stay_area = excluded.stay_area,
        nearest_airport_iata = excluded.nearest_airport_iata, nearest_rail_station = excluded.nearest_rail_station, scene = excluded.scene,
        extra = excluded.extra, region = excluded.region, lat = excluded.lat, lng = excluded.lng, updated_at = now()`,
      [
        d.id, d.name, d.region, d.country, d.countryCode, d.lat, d.lng, d.timezone, d.localCurrency, d.tagline, d.story,
        d.moods, d.styles, d.companions, d.experienceTags, JSON.stringify(d.dailyCost), d.suggestedDays[0], d.suggestedDays[1],
        d.bestMonths, d.seasonNote, d.travelCharacter, d.practicalNote, d.gettingThere, d.stayArea, d.nearestAirport ?? null,
        d.nearestRail ?? null, d.scene, JSON.stringify(d.extra ?? {}),
      ],
    );
    for (const p of d.places) {
      await q.query(
        `insert into public.place (id, destination_id, name, category, description, lat, lng, country_code, source, status,
           avg_duration_min, est_cost_inr, best_time, hidden_gem, scene, photo_title)
         values (md5($1)::uuid, $2, $3, $4, $5, $6, $7, $8, 'curated', 'approved', $9, $10, $11, $12, $13, $14)
         on conflict (id) do update set name = excluded.name, category = excluded.category, description = excluded.description,
           lat = excluded.lat, lng = excluded.lng, avg_duration_min = excluded.avg_duration_min, est_cost_inr = excluded.est_cost_inr,
           best_time = excluded.best_time, hidden_gem = excluded.hidden_gem, scene = excluded.scene,
           photo_title = excluded.photo_title,
           photo_checked_at = case when place.photo_title is distinct from excluded.photo_title then null else place.photo_checked_at end,
           updated_at = now()`,
        [
          `place:${d.id}:${p.key}`, d.id, p.name, p.category, p.description, p.lat, p.lng, d.countryCode,
          p.durationMin, p.costInr, p.bestTime, p.hiddenGem ?? false, p.scene ?? null, p.photo ?? null,
        ],
      );
    }
  }

  for (const s of PROVIDER_STATUS_SEED) {
    await q.query(
      `insert into public.provider_adapter_status (provider, category, mode, notes, docs_url, verified_at)
       values ($1,$2,$3,$4,$5, date '2026-10-29')
       on conflict (provider) do nothing`,
      [s.provider, s.category, s.mode, s.notes, s.docs],
    );
  }
  for (const p of PLACEMENT_SEED) {
    await q.query(
      `insert into public.sponsor_placement (id, description, max_slots) values ($1,$2,$3)
       on conflict (id) do update set description = excluded.description, max_slots = excluded.max_slots`,
      [p.id, p.description, p.max],
    );
  }

  await q.query(
    `insert into public.app_setting (key, value, updated_at) values ('catalogue_version', $1::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(CATALOGUE_VERSION)],
  );

  if (opts.demo) await seedDemoData(q);
}

/** Clearly-labelled demo content. Never seeded into production unless asked. */
async function seedDemoData(q: Queryable) {
  const users = [
    { email: "admin@ghummakad.demo", name: "Ghummakad Admin" },
    { email: "traveller@ghummakad.demo", name: "Asha (demo)" },
    { email: "explorer@ghummakad.demo", name: "Kabir (demo)" },
  ];
  for (const u of users) {
    await q.query(
      `insert into auth.users (id, email, raw_user_meta_data) values (md5($1)::uuid, $1, $2)
       on conflict (email) do nothing`,
      [u.email, JSON.stringify({ display_name: u.name })],
    );
  }
  await q.query(
    `insert into public.user_roles (user_id, role) values (md5('admin@ghummakad.demo')::uuid, 'admin') on conflict do nothing`,
  );

  const reviews = [
    { place: "place:tirthan-valley:serolsar", user: "explorer@ghummakad.demo", rating: 5, worth: "yes", text: "Demo review — an easy forest walk. We went early and had the lake almost to ourselves." },
    { place: "place:tirthan-valley:jalori-pass", user: "explorer@ghummakad.demo", rating: 4, worth: "depends", text: "Demo review — spectacular on a clear morning, but the road was muddy after rain." },
    { place: "place:hampi:hemakuta", user: "traveller@ghummakad.demo", rating: 5, worth: "yes", text: "Demo review — the easiest sunset climb in Hampi." },
  ];
  for (const r of reviews) {
    await q.query(
      `insert into public.place_review (place_id, user_id, rating, comment, worth_going, is_demo)
       values (md5($1)::uuid, md5($2)::uuid, $3, $4, $5, true)
       on conflict (place_id, user_id) do nothing`,
      [r.place, r.user, r.rating, r.text, r.worth],
    );
  }

  // A pending community submission so the moderation queue has something in it.
  await q.query(
    `insert into public.place (id, name, category, description, lat, lng, country_code, source, status, created_by, destination_id)
     values (md5('demo:pending:tirthan')::uuid,'Riverside picnic rocks (demo submission)', 'lesser_known',
       'Demo submission — flat rocks by the river, a short walk downstream from Gushaini bridge.',
       31.6215, 77.4420, 'IN', 'community', 'pending', md5('traveller@ghummakad.demo')::uuid, 'tirthan-valley')
     on conflict (id) do nothing`,
  );

  await q.query(
    `insert into public.sponsor_business (id, name, service_type, website, status, is_demo)
     values (md5('demo:sponsor:homestay')::uuid, 'Cedar Bend Homestay (demo sponsor)', 'stay', 'https://example.com', 'active', true)
     on conflict (id) do nothing`,
  );
  await q.query(
    `insert into public.sponsor_campaign (id, business_id, name, status, placements, destination_ids, categories,
       creative_title, creative_body, target_url, utm_campaign, start_at, end_at, cpc_paise, budget_cap_paise, priority,
       map_lat, map_lng, is_demo)
     values (md5('demo:campaign:tirthan')::uuid, md5('demo:sponsor:homestay')::uuid, 'Tirthan riverside stays (demo)', 'active',
       array['match_support','destination_sidebar','trip_module','map_pin'], array['tirthan-valley'], array['stay'],
       'Cedar Bend Homestay', 'Demo sponsor listing — a wooden riverside homestay near Gushaini. Availability not verified.',
       'https://example.com/cedar-bend', 'gs_demo_tirthan', now() - interval '1 day', now() + interval '180 days', 500, 50000, 10,
       31.6229, 77.4489, true)
     on conflict (id) do nothing`,
  );
}
