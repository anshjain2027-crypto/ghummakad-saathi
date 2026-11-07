/**
 * Starter travel guides written for international visitors to India.
 * Inserted once (on conflict do nothing) so edits made in the admin are never
 * overwritten. Facts that change (fees, booking windows) are hedged and point
 * readers to the official source.
 */
export type SeedPost = {
  slug: string;
  title: string;
  description: string;
  destinationId: string | null;
  tags: string[];
  publishedAt: string;
  body: string;
};

export const BLOG_VERSION = "2026-11-07.1";

export const SEED_POSTS: SeedPost[] = [
  {
    slug: "first-trip-to-india-10-day-itinerary",
    title: "First trip to India: a calm 10-day route for first-timers",
    description:
      "Delhi, Agra, Jaipur and Rishikesh in 10 unhurried days — with train tips, real costs in dollars and rupees, and how to avoid the classic first-week mistakes.",
    destinationId: "jaipur",
    tags: ["first-timers", "itinerary", "north india"],
    publishedAt: "2026-11-07T09:00:00Z",
    body: `India rewards slow travel. Most first-timers try to see six cities in a week and spend half of it in traffic. This route covers four very different places in ten days, with fast trains between them and enough breathing room to actually enjoy the country.

## The route at a glance

- **Days 1–2: Delhi** — arrive, rest, see Old Delhi and Humayun's Tomb
- **Day 3: Agra** — the Taj Mahal at sunrise, Agra Fort, back by train
- **Days 4–6: Jaipur** — forts, bazaars and the best street food in Rajasthan
- **Days 7–9: Rishikesh** — the Ganga, yoga, easy Himalayan foothill walks
- **Day 10: Delhi** — last shopping and fly home

## Days 1–2: Delhi, gently

Jet lag plus Delhi traffic is a lot, so keep day one light: a walk around Lodhi Garden and dinner close to your hotel. On day two, take the metro to Chandni Chowk early (before 10 am) for parathas and spice markets, then Humayun's Tomb in the afternoon light.

**Tip:** the Delhi Metro is clean, cheap and air-conditioned. Buy a smart card at any station instead of single tokens.

## Day 3: Agra and the Taj Mahal

Take an early fast train from Delhi (the Gatimaan Express or Vande Bharat takes under two hours) and enter the Taj through the east gate at sunrise for soft light and fewer people. The Taj is **closed on Fridays**. Add Agra Fort and the "Baby Taj" (Itimad-ud-Daulah), then return to Delhi or continue to Jaipur.

## Days 4–6: Jaipur

Jaipur is the easiest city in Rajasthan for a first visit. Climb Amer Fort at opening time, walk the old city's bazaars, eat pyaaz kachori for breakfast and watch sunset from Nahargarh Fort. A composite ticket covers most monuments for a few days.

## Days 7–9: Rishikesh

After three busy cities, Rishikesh is a reset: riverside cafés, the evening Ganga aarti at Triveni Ghat, a beginner yoga class, and short walks to waterfalls. From Jaipur, fly or take a train to Haridwar or Dehradun and a cab for the last stretch.

## What it costs

For one traveller in comfortable mid-range hotels, budget roughly **$40–75 (₹3,500–6,500) per day** for stay, food and local transport, plus about **$60–120** for the trains and the Rishikesh leg. Backpackers can do it for half that.

## Five first-week mistakes to avoid

1. **Over-planning.** Two cities fewer is always a better trip.
2. **Skipping train bookings.** Popular trains sell out — book as soon as your dates are firm.
3. **Drinking tap water.** Stick to sealed bottled or filtered water.
4. **Taking the first taxi offer.** Use prepaid taxi counters at airports and app cabs in cities.
5. **Packing only shorts.** Carry a scarf and loose trousers for temples and gurdwaras.

## Make it yours

This is a starting point. Tell our planner how you want your trip to feel and who you're travelling with, and it will suggest the right places, the best way to travel between them, and a day-by-day plan you can change for 30 days.`,
  },
  {
    slug: "how-to-book-indian-trains-as-a-foreigner",
    title: "How to book Indian trains as a foreigner (2026 guide)",
    description:
      "IRCTC accounts, the foreign tourist quota, which class to choose and when bookings open — a plain-English guide to booking train tickets in India from abroad.",
    destinationId: null,
    tags: ["trains", "practical", "how-to"],
    publishedAt: "2026-11-06T09:00:00Z",
    body: `Indian Railways is one of the best ways to see the country: safe, cheap and full of life. Booking from abroad used to be painful, but it's now very doable if you know the steps.

## Option 1: An IRCTC account

IRCTC is the official railway booking site and app. Foreign visitors can register with an international mobile number and email. Follow the on-screen verification steps; the process changes from time to time, so check the current instructions on the IRCTC website when you sign up.

Once registered you can search trains, see live seat availability and pay with an international card.

## Option 2: The foreign tourist quota

Many popular trains keep a small number of seats for foreign passport holders. You can book these at the **International Tourist Bureau** at major stations (New Delhi station has one on the first floor), and sometimes online. Bring your passport and visa.

## When do bookings open?

Advance reservations currently open **60 days before the journey** (excluding the travel date). Popular routes sell out quickly, especially around Indian holidays like Diwali. A small "Tatkal" quota opens the day before travel at a higher fare.

## Which class should I book?

- **CC / EC (Chair Car / Executive Chair):** daytime trains like Shatabdi and Vande Bharat. Comfortable reclining seats, meals often included.
- **3A (AC 3-tier):** the best value for overnight trains. Air-conditioned, bedding provided, six berths per bay.
- **2A (AC 2-tier):** quieter, with curtains — great for a first overnight trip.
- **1A (First AC):** private lockable cabins on some trains.
- **SL (Sleeper):** cheapest, no AC, busy. Fun for short hops if you're adventurous.

## What does a waitlisted ticket mean?

If a train is full you may get a **WL** (waitlist) or **RAC** ticket. RAC means you can board and share a berth; WL tickets on e-tickets are not valid for travel if they stay waitlisted. Check status on the IRCTC app before you go.

## Practical tips

- Arrive 30 minutes early; the coach position board tells you where to stand.
- Keep your passport with you — ticket checkers may ask for ID.
- Carry snacks and water, though vendors and pantry cars are common.
- Download the train's route and timings in advance; mobile data can drop in remote areas.

## Not sure which train?

Every trip plan from Ghummakad Saathi compares flights, trains, buses and self-drive for your route, with door-to-door times and typical fares, and links straight to IRCTC to book.`,
  },
  {
    slug: "paying-in-india-cash-cards-upi-for-visitors",
    title: "Paying in India as a visitor: cash, cards and UPI explained",
    description:
      "Do cards work in India? How much cash to carry, how ATMs work, and how visitors can use UPI — the QR-code payments Indians use for everything.",
    destinationId: null,
    tags: ["money", "practical", "first-timers"],
    publishedAt: "2026-11-05T09:00:00Z",
    body: `India has leapt ahead in digital payments, but cash still matters — especially in small towns and the mountains. Here's how to pay for things without stress.

## Cards

Visa and Mastercard work in hotels, malls, airlines, bigger restaurants and most city shops. Amex is accepted less often. Tell your bank you're travelling, and carry a second card as a backup.

## Cash and ATMs

You'll want cash for street food, auto-rickshaws, small guesthouses, temple donations and most things in rural areas. ATMs are common in cities; withdraw larger amounts less often to save on foreign transaction fees. In remote mountain areas (Spiti, parts of Ladakh, trek villages) ATMs can be rare or empty — carry enough cash before you leave the last big town.

**How much?** A traveller in mid-range comfort typically spends ₹1,500–3,000 ($18–35) a day in cash on top of card payments.

## UPI: India's QR-code payments

UPI is how most Indians pay — even a chai stall has a QR code. Visitors can use it too through prepaid UPI wallets designed for international travellers, available at some international airports and through approved apps. You load money with your card, then scan and pay like a local. Availability is expanding, so check the latest options before you fly.

## Tipping

Tipping isn't mandatory but is appreciated: round up for drivers, 5–10% in restaurants without a service charge, and something for trek guides and porters at the end of a trek.

## Bargaining

Fixed-price shops and malls don't bargain. Markets usually do — start around half the first price and meet in the middle with a smile.

## Plan your budget before you go

Our planner gives you a per-day and total trip budget for your style of travel — backpacking, comfortable or luxury — so you know roughly how much cash to carry.`,
  },
  {
    slug: "triund-trek-guide-mcleodganj",
    title: "Triund trek: the easiest overnight Himalayan trek (complete guide)",
    description:
      "A 9 km climb from McLeodganj to a meadow facing the snow peaks of the Dhauladhar. How to get there, what it costs, when to go and what to pack.",
    destinationId: "mcleodganj-triund",
    tags: ["trekking", "himalaya", "weekend"],
    publishedAt: "2026-11-04T09:00:00Z",
    body: `If you want one taste of the Himalaya without a week-long expedition, Triund is it. The trail climbs 9 km from the Tibetan hill town of McLeodganj to a grassy ridge at about 2,850 m, directly facing the snow wall of the Dhauladhar range.

## Quick facts

- **Distance:** about 9 km each way
- **Time:** 4–5 hours up, 3 hours down
- **Difficulty:** easy to moderate — steady climb, rocky in the last stretch
- **Best months:** March–June and September–December
- **Start point:** Galu Devi temple above Dharamkot, or the road from McLeodganj

## Getting there

McLeodganj is about 10–12 hours from Delhi by overnight Volvo bus — leave in the evening, arrive at dawn. You can also fly to Dharamshala (Gaggal airport) and take a 45-minute cab.

## Day hike or overnight?

You can do Triund as a long day hike, but the magic is sunset and sunrise from the ridge. Local operators set up tents with dinner and breakfast for roughly ₹800–1,500 ($10–18) per person. Carry cash.

## A simple 2-day plan

**Night before:** overnight bus from Delhi.
**Day 1:** arrive early, breakfast in Dharamkot, start walking by 9 am, lunch at the halfway café, reach the ridge by early afternoon, sunset and dinner in camp.
**Day 2:** sunrise over the Dhauladhar, walk down, visit the Dalai Lama temple (Tsuglagkhang) and eat momos in McLeodganj before the evening bus home.

## What it costs

A budget weekend from Delhi — bus both ways, camping, food — usually comes to about **₹3,000–5,500 ($35–65)** per person.

## What to pack

- Trekking shoes with good grip
- A warm layer and a rain jacket (weather changes fast)
- 2 litres of water and snacks
- A head torch
- Photo ID

## Respect the mountain

Carry all your rubbish back down, stay on the trail, and avoid the ridge in storms — it's exposed. In winter the top can be snowbound; go with a local guide then.

## Plan it in two minutes

Choose **Adventure**, **Weekend · 2D/1N** and your budget in our planner, and Triund will come up with your bus options, a timed day-by-day plan and a packing list.`,
  },
  {
    slug: "kerala-5-day-itinerary-backwaters-tea-hills-cost",
    title: "Kerala in 5 days: backwaters, tea hills and what it really costs",
    description:
      "A 5-day Kerala itinerary — Kochi, Munnar's tea estates and a night on an Alleppey houseboat — with honest costs in dollars and rupees and the best time to go.",
    destinationId: "munnar",
    tags: ["kerala", "itinerary", "south india"],
    publishedAt: "2026-11-03T09:00:00Z",
    body: `Kerala is the gentlest introduction to India: green, calm, wonderfully hospitable and easy to get around. Five days is enough for its three classic experiences.

## Day 1: Kochi

Land in Kochi and spend the afternoon in Fort Kochi: Chinese fishing nets at sunset, Portuguese and Dutch-era streets, and a Kathakali performance in the evening.

## Days 2–3: Munnar

Drive about four hours into the Western Ghats. Munnar's tea estates roll across every hill. See the Nilgiri tahr in Eravikulam National Park (closed for calving around February–March), take a jeep to Kolukkumalai for sunrise, and visit the tea museum.

## Day 4: Alleppey houseboat

Drive down to Alappuzha and board a kettuvallam houseboat around noon. Drift through palm-lined canals, eat karimeen (pearl-spot fish) cooked on board, and sleep on the water. On a budget? The public ferry to Kottayam shows you the same backwaters for a few rupees.

## Day 5: Marari beach or back to Kochi

Relax on quiet Marari beach before your flight, or head straight back to Kochi airport (about 1.5 hours).

## When to go

September to March is best. The monsoon (June–August) is lush and dramatic but wet; some trails close.

## What it costs

For two travellers in comfortable stays:

- Hotels and homestays: **$35–70 (₹3,000–6,000)** per night
- One-night houseboat for two with meals: **$85–180 (₹7,000–15,000)**
- Car with driver for the loop: **$35–50 (₹3,000–4,000)** per day
- Food: **$10–20 (₹800–1,700)** per person per day

A comfortable 5-day trip for two typically comes to about **$700–1,100** excluding flights to India.

## Make it your own

Our planner builds this kind of trip around your mood, pace and budget — then shows how to get there from your city and lets you change anything for 30 days.`,
  },
];
