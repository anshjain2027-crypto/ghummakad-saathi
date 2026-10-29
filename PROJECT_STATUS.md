# Project status — 29 October 2026

Legend: **Done** (real, tested) · **Mock** (works with labelled demo data/flows) · **Redirect** (honest outbound link) · **Blocked** (needs an owner decision, credential or partner approval).

## Product

| Area | State | Evidence |
| --- | --- | --- |
| Visual planner (6 questions, back/edit, validation) | Done | `tests/e2e/journey.spec.ts` |
| Destination matching (≤3, reasons, budget bands, season caveats, no-match advice) | Done | `tests/unit/planner.test.ts` |
| Itinerary generation (curated places only, server-side resolution + validation) | Done (deterministic) · LLM path ready | `src/lib/ai/provider.ts`; LLM needs keys |
| Pricing ₹499 / ₹999, 1/4/5/10 travellers | Done | `tests/unit/pricing.test.ts` |
| 30-day entitlement, UTC authority, fake-clock tests | Done | `tests/unit/pricing.test.ts`, `tests/integration/rls-and-payments.test.ts` |
| Destination change on day 15 without payment; version history; restore | Done | e2e journey |
| 4→5 travellers needs confirmed ₹500 upgrade; 5→4 free | Done | unit + e2e |
| Checkout: Dodo Payments hosted checkout + server-side payment lookup + webhook | Done in code · **Blocked** on Dodo keys/products | `src/lib/payments/*` |
| Demo payment gateway (success / decline / cancel / delayed / webhook replay) | Mock | e2e journey |
| Duplicate webhook / return race → exactly one entitlement | Done | integration test |
| Trip hub (timeline, day maps, swap, budget, print, self-reported bookings) | Done | e2e journey |
| Community map (sign-in gate + return to view, filters, clustering, list) | Done | `tests/e2e/explorer.spec.ts` |
| Private pins invisible to others via RLS | Done | integration test |
| Public place submission → moderation → public | Done | integration test |
| Reviews (1–5, Worth going?, edit/delete own, report) | Done | integration + e2e |
| Admin: moderation, reports, sponsors, CPC campaigns, click disputes, payments, providers, referrals | Done | `/admin/*` |
| Sponsored placements (separate arrays/UI, labelled, signed clicks, bot/dupe filtering, caps, auto-pause) | Done | `src/lib/sponsors.ts` |
| Exa "Recent from the web" | Done in code · **Blocked** on `EXA_API_KEY` | `src/lib/search/exa.ts` |
| Google Maps + Places search | Done in code · Mock (OpenStreetMap preview) until key | `src/components/map/*` |
| Legal pages | Drafts — **legal review required** | `/terms`, `/privacy`, `/refunds`, … |

## Integrations

| Provider | Mode | What unlocks it |
| --- | --- | --- |
| Supabase DB/Auth | Live project created (ap-south-1), migrations applied | — |
| Dodo Payments | Blocked → demo gateway | API key, webhook secret, 3 product IDs |
| River (LLM primary) | Blocked → deterministic planner | Base URL, key, model from console.river.ai |
| OpenRouter (LLM fallback) | Blocked | API key |
| Exa | Blocked | API key |
| Google Maps/Places | Mock (OSM preview) | Browser + server keys |
| Booking.com | Redirect | Affiliate approval → `BOOKING_AFFILIATE_ID` |
| KAYAK / Skyscanner | Redirect | Affiliate approval |
| IRCTC, District, BookMyShow | Redirect | Written partner permission for anything more |

**Not used by design:** Apify scrapers for Booking.com, IRCTC and Google Places — they violate those providers' terms and the master prompt.

## Known gaps

- Destination imagery is illustrated (brand-palette landscapes). Add licensed photos per destination via `destination.hero_image_url` + `image_credit`.
- Mobile E2E journey is flaky in this sandbox's single-process Chromium (desktop passes; mobile explorer passes). Re-run on a normal machine.
- International card acceptance and GST invoicing depend on Dodo merchant-of-record setup — verify before live launch.
