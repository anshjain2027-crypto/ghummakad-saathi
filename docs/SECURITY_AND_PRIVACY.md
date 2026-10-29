# Security & privacy

- RLS on every table; private pins, drafts, trips, orders and entitlements readable only by their owner (tested). Entitlements and payments are written only by server code.
- Prices computed server-side from traveller count; client amounts never trusted. Payment confirmation requires provider lookup or signed webhook; replays are de-duplicated by event ID; row locks prevent races.
- CSP, HSTS, X-Frame-Options DENY, nosniff, strict referrer policy (`next.config.ts`). Server Actions have built-in origin checks; JSON routes use a same-origin guard.
- External links: https-only, no credentials/IP/private hosts, partner allowlist, `rel="sponsored nofollow noopener noreferrer"`.
- Rate limits (Postgres-backed) on sign-in codes, AI calls, submissions, reviews, reports, checkout.
- Prompt-injection: user notes, reviews and web results are passed to the LLM as labelled untrusted data; output can only reference curated place IDs.
- Minimal data: email + display name; card data never touches our servers. Data export at `/api/me/export`. DPDP Act review required before launch.
