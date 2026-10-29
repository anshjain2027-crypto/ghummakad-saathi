# Test plan

- `tests/unit/pricing.test.ts` — 1/4/5/10 travellers → ₹499/499/999/999; active at +29d23h59m, expired at +30d; 4→5 upgrade, 5→4 free.
- `tests/unit/planner.test.ts` — matching determinism, ≤3 results, global origins, no-match advice, itinerary validity, invented IDs dropped, swaps.
- `tests/unit/urls.test.ts` — SSRF/phishing URL rejection, partner allowlist.
- `tests/integration/rls-and-payments.test.ts` — private pins via RLS, anon map denied, moderation visibility, no self-approval, others' reviews immutable, duplicate webhook/return race, amount tampering, users can't mint entitlements.
- `tests/e2e/journey.spec.ts` — full DESIGN.md journey → declined then successful payment → trip hub → destination change without payment → 5+ upgrade gate.
- `tests/e2e/explorer.spec.ts` — sign-in gate returns to same map view, save/review flows, pricing.
Manual before launch: Dodo test-mode payment + webhook, Supabase email link, Google Maps key, screen reader pass, 360 px layout.
