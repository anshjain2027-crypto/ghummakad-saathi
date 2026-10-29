# Visual Travel Explorer

## Promise

Tell us how you want your trip to feel, and the AI turns that into a personalised destination and a clear day-by-day travel plan in one place.

## Primary user and moment

A digital-first traveller who wants to take a trip but feels unsure where to go or overwhelmed by researching destinations, routes, stays, activities, food, and practical details across multiple sources. They arrive with a mood, companions, rough budget, and travel style rather than a fixed itinerary, and want to move from “I want to travel” to “this trip feels right and I know what I would do.”

## Commercial position

Considered but attainable

## Chosen direction

Visual Travel Explorer. The experience makes travel discovery emotional and visual before becoming structured and practical: cinematic destination imagery and editorial composition help the traveller recognise the kind of trip they want, while clear cards, budgets, tags, and itinerary modules turn inspiration into an understandable plan. The AI should feel present through personalisation and explanations, but the interface must never collapse into a generic chatbot.

## Core action and success

- Core action: Answer a short sequence of visual trip-preference questions, choose one AI-matched destination, and generate its personalised itinerary.
- Success state: The traveller can see one coherent trip overview containing the chosen destination, why it matches, trip duration, estimated trip budget, and a usable day-by-day itinerary with places, food, experiences, and practical travel notes.

## Focused journey

Use static or simulated data throughout. For the workshop prototype, use a representative India-based example journey and keep all prices, availability, travel times, and recommendations visibly illustrative rather than live. The path begins with uncertainty and ends when the user can review a complete personalised trip plan. No authentication, payment, checkout, or live booking connection is part of this journey.

| Order | Screen or state | Purpose | Content hierarchy | Primary action | Exact CTA | Important state | Successful outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Explorer entry | Establish the promise immediately and invite the traveller to begin with feelings rather than a destination search box. | 1) Full-bleed atmospheric travel image, 2) headline “How do you want this trip to feel?”, 3) supporting promise, 4) primary CTA, 5) small cue that the experience will ask a few simple questions. | Start the guided discovery journey. | **Find my trip** | Default entry state with one dominant CTA and no account prompt, booking widget, testimonial, or destination search field competing for attention. | User understands that the product will discover and plan a trip around their preferences and starts the flow. |
| 2 | Mood selection | Capture the emotional destination signal in the most visual interaction of the journey. | 1) Question “What are you craving right now?”, 2) large image-led options: Beach & slow days / Mountains & cool air / Forest & quiet / Culture & food / Adventure & adrenaline / Surprise me, 3) progress cue, 4) continue CTA. | Select one mood. | **Continue** | Selected card gains a forest-green outline/check treatment and remains visually prominent; CTA becomes active only after one selection. | One clear mood is selected and carried forward. |
| 3 | Travel companions | Understand who the trip must work for without turning the flow into a form. | 1) Question “Who’s coming along?”, 2) illustrated/graphic option cards: Just me / Partner / Friends / Family, 3) progress cue, 4) continue CTA. | Select one companion type. | **Continue** | Exactly one option is visibly selected; previous mood is retained in the journey state. | Companion context is captured and the user advances without typing. |
| 4 | Trip style | Capture the desired comfort and pace so recommendations feel meaningfully different. | 1) Question “What kind of trip sounds right?”, 2) visual options: Backpacking / Comfortable / Luxury / Romantic / Experience-first, 3) small descriptors under each option, 4) continue CTA. | Select one travel style. | **Continue** | Selection reveals a one-line confirmation such as “Comfortable: easy stays, breathing room, a few special experiences.” | One trip style is selected and understood. |
| 5 | Budget and duration | Add the practical boundary needed for useful recommendations while keeping the interaction lightweight. | 1) Question “What should this trip work within?”, 2) trip budget control in ₹ with example range, 3) duration choices: 3–4 days / 5–6 days / 7+ days, 4) compact preference summary, 5) generate CTA. | Set budget and duration, then ask the AI to match destinations. | **Show my matches** | Example workshop state: ₹40,000 total trip budget and 5–6 days. A small label states “Illustrative estimate — not live pricing.” | User sees a concise summary of their inputs and requests destination matches. |
| 6 | Finding matches | Make the AI work legible without inventing live search or unsupported precision. | 1) Atmospheric transition image/map texture, 2) status line “Finding places that fit your mood, budget and pace…”, 3) three short matching signals appearing progressively: mood / travel style / budget, 4) no fake percentage or countdown. | Wait for simulated matching to complete. | No CTA; simulated transition proceeds to results. | Loading lasts briefly and uses editorial motion rather than a technical spinner-heavy AI treatment. | User understands what factors are being used and arrives at recommendations. |
| 7 | Destination matches | Turn the traveller’s vague intent into a small, understandable set of options. | 1) Headline “Three places match your mood”, 2) preference summary chips, 3) three large destination cards, 4) each card: destination, hero image, “Why it fits you”, estimated trip budget, suggested duration, 2–3 experience tags, 5) secondary “Adjust preferences” text action. | Choose one destination to explore. | **Explore this trip** | Primary workshop example: **Tirthan Valley, Himachal Pradesh** with two alternative simulated matches. Tirthan card can be visually marked “Closest match” without claiming objective superiority. All estimates labelled illustrative. | User can compare three personalised options and intentionally selects one. |
| 8 | Destination detail | Give enough emotional and practical confidence to commit to planning the selected destination. | 1) Immersive destination hero and name, 2) short editorial line describing the experience, 3) “Why it fits you”, 4) quick facts: suggested duration / illustrative budget / travel character, 5) visual experience strip for nature, food, local experiences, hidden spots, 6) compact practical note, 7) itinerary CTA. | Commit to the destination and ask the AI to plan it. | **Build my itinerary** | Destination remains Tirthan Valley; no hotel inventory, live fare, booking button, review score, or fabricated availability appears. | User understands why the destination matches their inputs and requests a personalised plan. |
| 9 | Building itinerary | Show the transition from discovery to organisation and set expectation for what will appear. | 1) Destination image remains visible, 2) status “Building your Tirthan Valley trip…”, 3) progressive planning signals: route / daily pace / experiences / food & practical notes, 4) no unsupported claims about live availability. | Wait for simulated plan generation. | No CTA; simulated transition proceeds to itinerary. | The system feels intentional and personalised rather than instant/random. | User reaches the generated itinerary without confusion about what the AI is organising. |
| 10 | Personalised itinerary | Deliver the product’s central value in a scannable, visual day-by-day plan. | 1) Header: Tirthan Valley · 5 days · Comfortable · illustrative ₹40K budget, 2) short “Why this plan fits you” note, 3) horizontal day selector, 4) selected day timeline with morning / afternoon / evening, 5) image-backed place and experience cards, 6) food recommendation, 7) hidden-gem callout, 8) practical travel note, 9) estimated day spend, 10) CTA to review the complete trip. | Explore the day plan, then move to the complete trip overview. | **Review my trip** | Day 1 is expanded by default; changing days swaps the simulated timeline while preserving the same visual hierarchy. Budget numbers are clearly estimates. | User can understand what they would do on each day and sees that the itinerary reflects the selected mood, companions, style, budget, and duration. |
| 11 | Trip-ready overview / success | Provide a clear observable completion point: the traveller now has a coherent plan they can act on. | 1) Success line “Your trip has a shape now.”, 2) destination + dates/duration placeholder, 3) illustrative total budget and simple category split, 4) five-day itinerary summary, 5) travel-to-destination note, 6) stay-area suggestion, 7) activity/experience summary, 8) clear note that prices and availability are illustrative, 9) optional text action to revisit itinerary. | Finish the planning journey by reviewing the complete plan. | **View day-by-day plan** | Completed-plan state; all preference chips and plan details remain consistent with earlier selections. No “Booked”, payment confirmation, reservation number, or live availability language. | The user can point to a destination, budget, duration, and day-by-day plan and say what their trip would look like. This is the approved prototype success state. |

## Visual and interaction rules

- Target: responsive web app, designed mobile-first but composed cleanly for desktop Stitch preview.
- Palette: **Forest Trail #1F5145** (primary actions, selected states, key labels); **Terracotta Sun #D96C4A** (warm accent, small highlights, progress emphasis); **Warm Cream #F5F0E6** (primary background); **Charcoal Ink #242321** (main text); **Golden Sand #D9B46F** (secondary accent, tags, map/details). White may appear only as a neutral surface inside imagery/cards, not as a replacement brand background.
- Typography: expressive editorial serif such as **DM Serif Display** for destination names, major questions, and emotional headlines; **DM Sans** for body copy, labels, controls, prices, tags, and buttons. Headlines should feel spacious and editorial; UI labels stay concise and highly legible. Avoid tech-style monospace, futuristic display fonts, or overly rounded “AI app” typography.
- Spacing and layout: generous breathing room; one dominant decision per preference screen; 8px spacing logic with visibly larger 24–40px section gaps; content width constrained so questions never feel like forms. Use asymmetrical/editorial composition on discovery and destination screens, then a clearer modular grid/timeline on itinerary screens. On mobile, cards may stack or horizontally scroll; never shrink photography into tiny thumbnails.
- Components: minimal top navigation with brand/wordmark and progress or back affordance only when needed; large image-led choice cards; preference chips; one primary filled forest button; restrained text links for secondary actions; editorial destination cards; itinerary day tabs; timeline blocks; budget summary modules; hidden-gem callout; inline informative labels for illustrative pricing. Controls need obvious selected, default, hover/focus, disabled, and transition states.
- Imagery: cinematic, natural destination photography with a sense of place and lived experience: landscapes, paths, food, local details, and people experiencing a destination naturally. Prefer warm natural light, texture, depth, and less-obvious viewpoints. Avoid generic airport/business-traveller stock photography, influencer posing, oversaturated tourism posters, landmark collages, or fake user-generated content. Imagery must support the destination being shown rather than decorate unrelated UI.
- Motion: calm and cinematic, not flashy. Use gentle image crossfades, 180–300ms card lift/selection feedback, horizontal destination reveals, subtle map/texture movement, and progressive appearance of matching/planning signals. Itinerary day changes should crossfade/slide with continuity. No bouncing AI orb, confetti, spinning gradients, fake typing theatrics, or long blocking animations.

## Voice and approved copy

- Voice: curious, warm, quietly confident.
- Main headline: **How do you want this trip to feel?**
- Supporting line: **Tell us the mood, the people and the budget. We’ll turn it into a trip that feels made for you.**
- Entry CTA: **Find my trip**
- Primary-action CTA: **Build my itinerary**
- Success message: **Your trip has a shape now.**
- Social line: **Don’t search for a destination. Start with how you want to feel.**
- Video beat 1: **You want to get away. You just don’t know where yet.**
- Video beat 2: **Choose the mood, the people and the budget.**
- Video beat 3: **See the trip take shape, day by day.**

Approved interface copy for the focused journey:
- Entry question: **How do you want this trip to feel?**
- Mood question: **What are you craving right now?**
- Companion question: **Who’s coming along?**
- Style question: **What kind of trip sounds right?**
- Budget question: **What should this trip work within?**
- Matching status: **Finding places that fit your mood, budget and pace…**
- Match result headline: **Three places match your mood.**
- Destination explanation label: **Why it fits you**
- Itinerary generation status: **Building your Tirthan Valley trip…**
- Itinerary explanation label: **Why this plan fits you**
- Estimate disclaimer: **Illustrative estimate — not live pricing.**
- Success line: **Your trip has a shape now.**

## Three selected visual moments

Complete this section after the Stitch prototype works, when preparing the three video beats. These moments are not a limit on the prototype. Pomelli can use the published Netlify URL for the social image; it does not need a contact sheet.

1. Entry point: **Explorer entry — “How do you want this trip to feel?” over immersive destination imagery.**
2. Defining interaction: **Destination matches — three personalised visual recommendations with “Why it fits you”, budget, duration, and experience tags.**
3. Successful outcome: **Trip-ready overview — the complete Tirthan Valley plan with illustrative budget and five-day itinerary summary.**

## Non-negotiables

- Preserve the approved promise, focused journey, interface copy, controls, selected-state behaviour, palette, typography direction, imagery treatment, motion character, and voice.
- Create only the screens and states the focused journey needs. Do not add onboarding, authentication, profiles, wishlists, community feeds, reviews, loyalty, chat support, payments, checkout, or unrelated navigation.
- Use the published Stitch experience as the visual source of truth. Use genuine captures when the video or fallback image tool needs them.
- The product must feel like a **Visual Travel Explorer**, not a generic OTA, dashboard, search engine, or chatbot. Discovery is image-led; AI personalisation is expressed through the choices, “Why it fits you” explanations, and generated plan.
- Use static or simulated workshop data only. Any budget, travel time, price, availability, destination match, activity, stay area, or route detail must be presented as illustrative unless independently connected to a live source later.
- The prototype ends at a **trip-ready plan**, not a completed booking. Never show a payment success, booking confirmation, reservation number, or claim that inventory has been reserved.
- Maintain accessibility despite the editorial aesthetic: readable contrast, visible focus/selected states, clear labels, large tap targets, and no critical information communicated by image or colour alone.
- Keep preference collection lightweight and visual. The user should make one clear decision at a time rather than fill out a conventional travel-search form.

## Avoid

- Do not redesign the experience into a blue-and-white OTA with flight/hotel search tabs, dense filters, deal banners, discount badges, or “cheapest fare” merchandising.
- Do not make a chatbot the primary interface, add a floating AI orb, or rely on long text conversations to collect preferences.
- Do not add testimonials, star ratings, community votes, fabricated traveller reviews, popularity claims, “best” claims, or unsupported destination rankings.
- Do not add authentication, payments, checkout, live integrations, live availability, booking confirmations, or third-party brand logos as if integrations already exist.
- Do not introduce neon gradients, glassmorphism, futuristic AI visuals, excessive rounded pills, gamification, confetti, or energetic social-app motion that conflicts with the warm editorial travel direction.
- Do not overload preference screens with maps, price grids, long copy, or multiple competing CTAs. One decision should dominate each step.
- Do not use generic stock imagery unrelated to the named destination, oversaturated postcard treatments, landmark collages, or influencer-style posed imagery.
- Do not promise that the AI will “manage everything,” guarantee savings, guarantee accuracy, or imply real-time booking/pricing in this static workshop prototype.
