# Go-live checklist

1. Dodo: business verification → live mode → live products/webhook → `DODO_PAYMENTS_ENVIRONMENT=live_mode`.
2. Legal review of Terms, Privacy (DPDP), Refunds, Sponsored disclosure; confirm merchant entity and GST treatment.
3. Supabase: custom SMTP, Site URL + redirect URLs, backups (PITR on paid plan).
4. Google Maps: restrict keys to your domain, set daily quotas and billing alerts.
5. Replace illustrated hero art with licensed photography (with credits).
6. Set `ADMIN_EMAILS`, `SESSION_SECRET`, `CRON_SECRET`; confirm `/api/health`.
7. Apply to Booking.com Affiliate Partner and KAYAK affiliate programmes.
8. Remove/disable any demo sponsor content (only seeded in demo mode).
