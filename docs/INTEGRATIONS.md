# Integrations (verified 29 Oct 2026)

| Provider | Status | Notes / source |
| --- | --- | --- |
| Dodo Payments | approval-required (test mode available) | `POST /checkouts`, `GET /payments/{id}`, Standard Webhooks headers `webhook-id/-timestamp/-signature`. https://docs.dodopayments.com/api-reference/checkout-sessions/create |
| Supabase | available | Project `wcgfucvqilajfmuthsnq` (ap-south-1). |
| Google Maps Platform | available with billing | Store place IDs only; lat/lng cache ≤30 days; show attribution. https://developers.google.com/maps/documentation/places/web-service/policies |
| Exa | available | `POST https://api.exa.ai/search`, header `x-api-key`. Titles/links only are shown. |
| OpenRouter | available | OpenAI-compatible `https://openrouter.ai/api/v1`. |
| River | not-verified | Hosted inference (console.river.ai); base URL and free tier not publicly documented — owner to supply. |
| KAYAK | approval-required | https://affiliates.kayak.com/apis/flights — redirect links until approved. |
| Booking.com | approval-required | https://developers.booking.com/demand/docs/getting-started/prerequisites — search links until affiliate ID. |
| Skyscanner | approval-required (high bar) | https://www.partners.skyscanner.net/contact/travel-api |
| IRCTC | approval-required | Official site link only. https://contents.irctc.co.in/en/B2C_PSP_Policy_other_than_Startup_MSME.pdf |
| District / BookMyShow | redirect | Public pages only. |
| Apify scrapers | **rejected** | Scraping Booking.com/IRCTC/Google violates their terms. |

Cost assumptions: Supabase free tier; Vercel Hobby; Google Maps per-request billing (set quotas); LLM per-token (daily per-user cap via `LLM_DAILY_CALLS_PER_USER`).
