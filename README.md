# Ghummakad Saathi — Visual Travel Explorer

> Tell us how you want your trip to feel, and the AI turns that into a personalised destination and a clear day-by-day travel plan in one place.

A production-oriented Next.js app with two offerings:

- **Free Explorer** — community map (free sign-up required): browse, save private pins, add public places (moderated), rate & review.
- **Paid Trip Plan** — ₹499 (1–4 travellers) / ₹999 (5+), taxes included. One trip workspace, unlimited edits — even a new destination — for 30 days after verified payment.

Plus clearly-labelled CPC sponsored placements and partner redirects (Booking.com, KAYAK, Skyscanner, IRCTC, District, BookMyShow).

Visual source of truth: [`DESIGN.md`](./DESIGN.md). Product scope additions: [`docs/PRODUCT_SCOPE.md`](./docs/PRODUCT_SCOPE.md). Status: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

## Run locally (no accounts needed)

```bash
npm install
npm run dev            # http://localhost:3000 — demo mode, in-memory database
npm run dev:persist    # same, but keeps data in .data/pglite between restarts
```

Demo mode: sign-in codes appear on screen, payments go through a demo gateway, the map uses OpenStreetMap tiles, the planner uses the deterministic engine. Demo admin: sign in as `admin@ghummakad.demo`.

## Tests

```bash
npm test               # unit + integration (pricing, 30-day window, RLS privacy, payment idempotency)
npm run test:e2e       # Playwright: full planner → payment → trip journey, map, reviews
npm run typecheck && npm run lint
```

`CHROME_PATH=/path/to/chromium` lets Playwright use a system browser.

## Deploy (Vercel + Supabase)

1. Supabase project → run `supabase/migrations/*.sql` (already applied to project `wcgfucvqilajfmuthsnq`). The catalogue seeds itself on first boot.
2. Vercel → Import the GitHub repo → add the environment variables from `.env.example` → Deploy.
3. Supabase → Authentication → URL configuration: set **Site URL** to your Vercel URL and add `https://YOUR-DOMAIN/auth/callback` to redirect URLs.
4. Dodo Payments → create three one-time products (₹499, ₹999, ₹500, tax inclusive) → put their IDs in `DODO_PRODUCT_*`. Add a webhook to `https://YOUR-DOMAIN/api/payments/webhook` and copy its secret into `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Visit `/api/health` to confirm the database connection.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md).

## Troubleshooting

- **`/api/health` fails** — check `DATABASE_URL` uses the transaction pooler (port 6543).
- **Sign-in email never arrives** — Supabase's built-in email has low rate limits; add SMTP under Authentication → Emails for production.
- **Checkout says "payments are not fully set up"** — a `DODO_PRODUCT_*` variable is missing.
