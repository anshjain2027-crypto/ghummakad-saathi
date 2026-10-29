# Product scope

`DESIGN.md` describes the approved **workshop prototype** (no auth, payments or community). It remains the visual and interaction source of truth and is unchanged. The production product adds, per the 13 Oct 2026 owner decisions:

- Free sign-up (email code via Supabase Auth); sign-in required for **all** community map access.
- Paid trip plan: ₹499 (1–4) / ₹999 (5+), tax-inclusive, one workspace, unlimited edits incl. destination for 30 days (720 h) from verified payment. ₹500 confirmed upgrade for 4→5. Renewal creates a new window without erasing history.
- Community map: private pins, moderated public places, 1–5 ratings with "Worth going? Yes / Depends / No", reports.
- CPC sponsored placements in four labelled slots, kept out of organic ranking.
- Partner redirects with honest status labels (mock / redirect / approved).
- Global destinations (India + Japan, Portugal, Indonesia, Vietnam, Georgia, Sri Lanka, Switzerland), departure cities worldwide, indicative display currencies; checkout in INR.

Payments provider changed from Razorpay (master prompt) to **Dodo Payments** at the owner's request (29 Oct 2026).
