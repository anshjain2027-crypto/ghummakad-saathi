# UI inventory

| Route | States covered |
| --- | --- |
| `/` | default |
| `/plan` | 6 steps, disabled/selected/focus, back/edit, finding (loading), error + retry |
| `/plan/matches` | 1–3 matches, closest-match label, season/stretch caveats, no-match advice, sponsored slot or none |
| `/plan/destinations/[id]` | with/without draft, web notes, sponsor sidebar |
| `/plan/review` | signed-out CTA, signed-in checkout, checkout error |
| `/checkout/demo`, `/checkout/return` | success, decline, cancel, delayed/pending (auto-refresh), signature failure |
| `/trips/[id]` | generating, generation error/retry, editable, expired (renew), upgrade-required, swap, history/restore, print |
| `/map` | sign-in gate, loading, error, empty, list/detail, add public place, private pin, Google search unavailable, sponsored pin |
| `/places/[id]` | pending/rejected banners, review form, edit/delete own, report, saved/unsaved |
| `/my/*`, `/profile` | empty and populated |
| `/admin/*` | moderator vs admin nav, empty queues |
