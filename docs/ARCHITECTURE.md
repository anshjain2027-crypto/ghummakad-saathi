# Architecture

- **Next.js 16 App Router + TypeScript + Tailwind v4**, single deployable app with admin area. `cacheComponents` is off: every page is session-aware.
- **Data layer**: one SQL code path for two drivers — `postgres` (Supabase pooler, prod) and **PGlite** (Postgres in WASM, demo/tests). The same `supabase/migrations` run on both; `db/local/000_supabase_shim.sql` recreates `auth.uid()` + roles locally so **RLS is tested for real**.
- **Authorisation**: `asUser(userId)` runs statements as role `authenticated` with JWT claims set → RLS decides. `asService()` bypasses RLS and is used only after explicit server checks (payments, entitlements, moderation, sponsor billing, admin).
- **Auth**: Supabase Auth email OTP / magic link (`@supabase/ssr`, `src/proxy.ts` refreshes sessions). Demo mode: HMAC-signed cookie + on-screen code; privileged accounts are blocked from demo codes in production.
- **Planner**: rule-based organic matching (`src/lib/planner/matching.ts`) → AI skeleton (place IDs + text only) → server-side resolution from curated records → physical/logical validation → versioned JSON in `trip_edit_history`. Provider chain: primary LLM → fallback LLM → deterministic.
- **Payments**: server-priced orders, Dodo hosted checkout, confirmation via server-side `GET /payments/{id}` and Standard-Webhooks-signed webhooks; `fulfillOrder` is the single, idempotent, row-locked grant path. Daily cron reconciles.
- **Sponsors**: separate selection pipeline, HMAC-signed impression/click tokens, bot + 30-min dedupe, budget caps with auto-pause, admin reversal with audit.

## Entity mapping (master prompt → schema)
`trip_preference` → `trip_draft.preferences` / `trip_plan.preferences` (Zod-validated JSON). `trip_day` / `trip_stop` → embedded in validated `trip_edit_history.plan` snapshots (one immutable version per edit). `public_place_submission` → `place` rows with `source='community'` and `status`. `sponsor_placement` is a registry table. All other entities exist as named.
