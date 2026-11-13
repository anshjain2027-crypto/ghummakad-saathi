import { NOVEMBER_2026_POSTS } from "./blog-nov-2026";
import { NOVEMBER_2026_B_POSTS } from "./blog-nov-2026-b";

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
  coverImageUrl?: string;
  coverCredit?: string;
  /**
   * md5 of earlier seeded bodies this version replaces. The live row is only
   * rewritten if its body still matches one of them, so a post edited in the
   * admin is never overwritten.
   */
  replacesBodyMd5?: string[];
};

export const BLOG_VERSION = "2026-11-13.1";

export const SEED_POSTS: SeedPost[] = [
  {
    slug: "first-trip-to-india-10-day-itinerary",
    title: "First trip to India: a 10-day Delhi, Agra and Jaipur itinerary",
    description:
      "The Golden Triangle at a calm pace: 10 days in Delhi, Agra and Jaipur for first-timers, with real costs in dollars and rupees, entry fees, and the scams worth knowing about.",
    destinationId: "jaipur",
    tags: ["first-timers", "itinerary", "golden triangle", "north india"],
    publishedAt: "2026-11-07T09:00:00Z",
    coverImageUrl: "/blog/first-trip-to-india/taj-mahal-sunrise.jpg",
    coverCredit: "Photo: Gunjan Pandey · CC BY-SA 4.0 · Wikimedia Commons",
    replacesBodyMd5: ["976936f32390a2bf56680323b07610f4"],
    body: `Most Golden Triangle itineraries online squeeze Delhi, Agra and Jaipur into five days. You can do that. You'll also spend half of it in a car, see the Taj at noon with everyone else, and fly home needing a holiday from your holiday.

Ten days is the version we'd recommend to a friend visiting India for the first time: three days in Delhi, two in Agra, one slow day on the road, and four in Jaipur. It costs roughly **$700 to $1,100 per person** at a comfortable mid-range level, not counting your flights.

| Days | Where you sleep | What the days are about |
| --- | --- | --- |
| 1–3 | Delhi | Old Delhi's lanes, Humayun's Tomb, Qutub Minar, a lot of eating |
| 4–5 | Agra | The Taj at sunrise, Agra Fort, the sunset view from across the river |
| 6 | On the road | Fatehpur Sikri and the Chand Baori stepwell on the way to Jaipur |
| 7–10 | Jaipur | Amber Fort, the old city, Nahargarh at sunset, and a lazy last day |

It works for couples, families, solo travellers and anyone who'd rather see six things properly than twenty things through a bus window. Want mountains too? There's an optional Rishikesh extension at the end.

## Before you go

Sort the visa first. Most passports can get India's e-Tourist Visa online, and the 30-day one is cheap: **$25 from July to March, $10 from April to June**, plus a small card fee. Apply at least four days before you fly, and only on the government portal. Plenty of agent sites look official and charge three times as much. Fees vary by passport, so check the official table before paying.

Come between October and March if you can. Days sit around 20–28°C and it rarely rains. The catch is Delhi's air in November and fog in late December and January, which can delay morning trains by hours. Summer (April to June) regularly passes 40°C, and the monsoon arrives in July.

A few things nobody mentions until you land:

- UPI, the phone payment everyone in India uses, needs an Indian bank account. You'll pay for rickshaws, chai and street food in cash, so keep small notes. Our guide to [paying in India](/blog/paying-in-india-cash-cards-upi-for-visitors) has the details.
- Get a local SIM at the airport (Airtel or Jio, bring your passport). It costs a few dollars and makes Uber and Ola work, which saves a lot of haggling.
- Cards work at hotels, restaurants and monument ticket counters.

For moving between cities, take the train Delhi to Agra (the Gatimaan Express or Vande Bharat gets you there in about two hours). From Agra to Jaipur, hire a car with a driver for the day so you can stop at Fatehpur Sikri and the stepwell; your hotel can book one. At the end, take the train back to Delhi (four to five hours) or fly home from Jaipur. Book trains a few weeks ahead in winter, because the good ones sell out. Here's [how to book Indian trains as a foreigner](/blog/how-to-book-indian-trains-as-a-foreigner).

## Days 1–3: Delhi

Delhi is loud, huge, and a bit much on the first afternoon. Give it a day and it starts to make sense. Old Delhi is the Mughal city of narrow lanes and markets; New Delhi, built by the British, is wide roads and green roundabouts. Stay somewhere central with a metro station nearby, and the city gets much smaller.

### Day 1: Land and do very little

Your body will thank you. Check in, sleep, and in the late afternoon walk around Lodhi Garden, where 500-year-old tombs sit in the middle of a park full of joggers and families. Eat dinner nearby. Butter chicken and dal makhani were both invented in Delhi, so this is the place to try them.

### Day 2: Old Delhi, then the wide avenues

![A busy street in Chandni Chowk with auto-rickshaws and cycle-rickshaws](/blog/first-trip-to-india/chandni-chowk-street.jpg)
*A normal morning in Chandni Chowk. Photo: [Juan Antonio Segal](https://commons.wikimedia.org/wiki/File:Chandni_Chowk._Delhi,_India_%2823129638199%29.jpg), CC BY 2.0*

Take the metro to Chandni Chowk early, before the lanes jam up. Climb the steps of Jama Masjid (robes are handed out at the gate if your legs or shoulders are uncovered), then hire a cycle-rickshaw through Khari Baoli, the spice market. Your eyes will water from the chilli dust. That's normal.

For lunch, it's stuffed parathas in Paranthe Wali Gali or kebabs at Karim's. In the afternoon, see the Red Fort, then drive past India Gate and Kartavya Path. End the day at Gurudwara Bangla Sahib, the Sikh temple where volunteers cook free meals for thousands of people every day. Cover your head, take your shoes off, and sit down to eat with everyone else.

### Day 3: Tombs and a very old tower

![Humayun's Tomb in Delhi seen across its garden pool](/blog/first-trip-to-india/humayuns-tomb-delhi.jpg)
*Humayun's Tomb, the Taj's older cousin. Photo: [Jakub Hałun](https://commons.wikimedia.org/wiki/File:20191205_Grobowiec_Humajuna_w_Delhi_1055_6794.jpg), CC BY-SA 4.0*

Go to Humayun's Tomb when it opens. It's the building that inspired the Taj Mahal, and in the soft morning light with almost nobody around, some people end up liking it more. After lunch, head south to the Qutub Minar, a 73-metre stone tower started in the 1190s, and wander the ruins of Mehrauli next door. For the evening, pick between Dilli Haat (crafts and food from every state) and Hauz Khas Village (cafes over a medieval lake).

Budget around **$50–90 a day** per person in Delhi, covering a shared mid-range room, food, metro and rickshaws, and entry fees.

## Days 4–6: Agra, and the long way to Jaipur

One rule shapes your whole Agra plan: **the Taj Mahal is closed on Fridays.** Count your dates backwards from Day 5 before you book anything. And stay near the East Gate, so sunrise is a five-minute walk instead of a 5 am taxi hunt. More on the city in our [Agra guide](/destinations/agra).

### Day 4: Train, fort, sunset

![The red sandstone walls and moat of Agra Fort](/blog/first-trip-to-india/agra-fort.jpg)
*The walls of Agra Fort. Photo: [Jakub Hałun](https://commons.wikimedia.org/wiki/File:20191204_Moat_and_walls_of_Agra_Fort_0925_6582.jpg), CC BY-SA 4.0*

Catch the early train from Delhi and drop your bags. In the afternoon, walk through Agra Fort. This is where Shah Jahan, the emperor who built the Taj, spent his last years locked up by his own son, looking at his wife's tomb across the river. Before sunset, cross to Mehtab Bagh, a quiet garden directly opposite the Taj. Same view as the postcards, a fraction of the people.

### Day 5: The Taj Mahal

Be at the gate about half an hour before sunrise, with your ticket already bought online. Foreigners pay **₹1,100**, plus **₹200** to go inside the main tomb, and it's worth it. Give yourself two to three hours. The marble changes colour as the sun comes up, from grey to pink to white.

Go back for breakfast and a nap. Later, visit Itimad-ud-Daulah, nicknamed the Baby Taj. It's small, covered in inlaid stone flowers, and usually empty. Pick up a box of petha, Agra's sugary pumpkin sweet, on the way back.

### Day 6: Ghost city and a stepwell

![Visitors climbing the steps to the Buland Darwaza gate at Fatehpur Sikri](/blog/first-trip-to-india/fatehpur-sikri-buland-darwaza.jpg)
*Buland Darwaza, the giant gate at Fatehpur Sikri. Photo: [A. Savin](https://commons.wikimedia.org/wiki/File:Fatehpur_Sikri_near_Agra_2016-03_img08.jpg), Free Art License*

Leave Agra by car in the morning. An hour in, stop at Fatehpur Sikri, the red sandstone capital Emperor Akbar built and then abandoned after about 15 years. Get a guide from the official ticket office, not from the men who approach your car. If you can manage one more stop, detour to Chand Baori in Abhaneri, a 1,200-year-old stepwell with 3,500 steps arranged in a pattern that looks like an optical illusion. Reach Jaipur by evening.

![The geometric steps of Chand Baori stepwell in Abhaneri](/blog/first-trip-to-india/chand-baori-abhaneri.jpg)
*Chand Baori, worth the detour. Photo: [Gerd Eichmann](https://commons.wikimedia.org/wiki/File:Abhaneri-Chand_Baori-12-Stufenbrunnen-2018-gje.jpg), CC BY-SA 4.0*

Budget **$60–100 a day** per person in Agra; Day 5 costs more because of the Taj ticket and a guide.

## Days 7–10: Jaipur

After Delhi and Agra, Jaipur feels like exhaling. The old city is painted a dusty pink, the pace is slower, and the shopping is the best of the trip. If your budget stretches, stay in a haveli, an old merchant's mansion turned guesthouse, with a courtyard and a rooftop for evening chai. Our [Jaipur guide](/destinations/jaipur) has more places to eat and stay.

At your first monument, ask for the **composite ticket**. It covers Amber Fort, Hawa Mahal, Jantar Mantar, Albert Hall Museum and Nahargarh Fort over two days. Rajasthan raised its fees in January 2026, so expect roughly ₹1,000–1,700 and check the price printed at the counter. City Palace has its own ticket.

### Day 7: Amber Fort

![The main courtyard of Amber Fort with the Aravalli hills behind](/blog/first-trip-to-india/amber-fort-jaipur.jpg)
*Amber Fort's main courtyard, before the crowds. Photo: [Jakub Hałun](https://commons.wikimedia.org/wiki/File:Amber_Fort,_Jaipur,_20191219_1011_9509.jpg), CC BY-SA 4.0*

Get to Amber Fort at opening time, before the tour buses. Walk up or take a jeep, and please skip the elephant rides. Inside, find the Sheesh Mahal, a hall lined with thousands of tiny mirrors that once glittered under a single candle. Five minutes away is Panna Meena ka Kund, a small stepwell that's perfect for photos. On the drive back, stop for a look at Jal Mahal, the palace sitting in the middle of a lake. For dinner, try dal baati churma, Rajasthan's signature dish of lentils, baked wheat balls and sweet crumble.

### Day 8: The old city

![The pink honeycomb facade of Hawa Mahal in Jaipur](/blog/first-trip-to-india/hawa-mahal-jaipur.jpg)
*Hawa Mahal and its 953 windows. Photo: [Chainwit.](https://commons.wikimedia.org/wiki/File:East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg), CC BY-SA 4.0*

The Hawa Mahal is best seen from across the road. Climb to one of the rooftop cafes opposite, order a coffee, and look at all 953 little windows at once. Then walk to Jantar Mantar, an 18th-century observatory where the sundial is the size of a building and still tells the time to within a couple of seconds. Spend the afternoon at City Palace, part of which the royal family still lives in.

In the evening, wander Johari Bazaar for jewellery and Bapu Bazaar for block-printed textiles and embroidered slippers. A thick lassi from Lassiwala on MI Road is the right way to end the day.

### Day 9: Make something, then watch the sunset

Take the morning off from monuments. In Bagru or Sanganer, just outside Jaipur, families have hand block-printed fabric for generations, and several workshops let you print your own scarf or tablecloth. After lunch, visit Albert Hall Museum, then drive up to Nahargarh Fort and stay until dark. The whole city spreads out below you as the lights come on.

### Day 10: One last chai

Keep the morning loose: a final bazaar run, or Galtaji, the hillside temple complex everyone calls the Monkey Temple. Then fly home from Jaipur, or take the train back to Delhi for an evening flight. Leave at least two hours for the drive to Delhi airport.

Budget **$50–90 a day** per person in Jaipur, plus whatever the bazaars talk you into.

## Want mountains too? Add Rishikesh

If you have three more days, finish in the foothills. After Jaipur, fly or take a train to Dehradun or Haridwar and a cab for the last stretch. [Rishikesh](/destinations/rishikesh) is a reset after three busy cities: riverside cafes, the evening Ganga aarti at Triveni Ghat, a beginner yoga class, and short walks to waterfalls. Fly home from Dehradun via Delhi, or take the train back.

## What it really costs

For ten days at a comfortable mid-range level, sharing a double room, plan on **$700–1,100 per person** before flights. Backpackers manage it on under $500. Heritage palace hotels can take it past $3,000 without trying.

| Per person, 10 days | USD (approx.) | INR (approx.) |
| --- | --- | --- |
| Hotels, 9 nights, mid-range, shared room | $180–310 | ₹16,000–27,000 |
| Food and drinks | $170–280 | ₹15,000–25,000 |
| Trains, car Agra–Jaipur, local rides | $120–180 | ₹10,500–16,000 |
| Monument entry fees | $80–100 | ₹7,000–9,000 |
| Guides, tips, SIM card | $60–100 | ₹5,000–9,000 |
| e-Tourist Visa | $25 | — |
| Shopping and extras | $50–100+ | ₹4,500–9,000+ |
| **Total** | **$685–1,095** | **₹58,000–95,000** |

These are estimates at roughly ₹88 to the dollar, not live prices. You'll notice foreigners pay much more than Indians at monuments. That's official policy everywhere in India, not someone ripping you off.

## Mistakes and scams worth knowing about

Nothing here is dangerous. It's mostly people trying to earn a commission off you, and once you've heard the lines, they're easy to spot.

- **"Sorry, your hotel is closed" / "The Taj is shut today."** Almost never true. The goal is to take you somewhere that pays them. Call your hotel yourself.
- **Helpful strangers at monument gates.** Real guides carry a government ID card and work from the ticket office. Agree the fee before you start walking.
- **Gems you can "resell at a profit back home."** You can't. Walk away.
- **Rickshaw prices that change at the end of the ride.** Use Uber, Ola or Rapido, or fix the fare before you sit down.

And a few self-inflicted ones: planning the Taj for a Friday, cramming five sights into a Delhi day (traffic turns 10 km into an hour), and drinking tap water. Stick to bottled or filtered water, and eat street food where there's a queue and it's cooked in front of you.

What to wear is simpler than people think. Loose, light clothes that cover shoulders and knees work everywhere and are expected at temples and mosques. Pack a scarf to cover your head at gurudwaras, and wear shoes you can kick off quickly.

Tipping isn't required but is appreciated: around 10% at restaurants without a service charge, ₹100–200 for porters and housekeeping, and ₹300–500 a day for your driver.

On safety, this is one of the most travelled routes in India. Take registered taxis or app cabs at night, keep your phone and wallet zipped in busy markets, and if you're a woman travelling alone, the women-only coach on the Delhi metro and well-reviewed central hotels make life easier.

## Questions first-timers ask us

**Is ten days too long?** No, it's the comfortable length. Seven works if you drop a day each in Delhi and Jaipur. Five is doable but rushed.

**Which direction should I go?** Delhi, then Agra, then Jaipur. Most flights land in Delhi, and the Agra to Jaipur drive passes Fatehpur Sikri. Reverse it only if you're flying into Jaipur.

**Can I just do the Taj as a day trip from Delhi?** You can, but you'll miss sunrise and spend five or six hours in transit. One night in Agra changes the whole experience.

**Do I need a tour company?** Not really. Trains, cab apps and a driver booked through your hotel cover everything. A private driver for the full trip is a good middle ground for families.

**Is it okay with kids or older parents?** Yes. Pick hotels with lifts, use cars instead of buses, and plan one big sight a day.

**What if I want more?** Rishikesh (above) is the easiest add-on. Others are Ranthambore for tiger safaris (two nights from Jaipur), [Udaipur](/destinations/udaipur) for its lakes, or [Varanasi](/destinations/varanasi) on the Ganges (a short flight from Delhi).

## Make it your own trip

This plan is a starting point. The right version for you depends on how you want the trip to feel: slow and cultural, built around food, or full of rest days with a pool.

![Ghummakad Saathi in 30 seconds](/blog/first-trip-to-india/ghummakad-saathi-30s.mp4)
*Ghummakad Saathi in 30 seconds.*

Our [planner](/plan) asks a few questions about your mood, who's travelling and your budget, then builds a day-by-day plan with places, food, quieter spots and a rough budget. Seeing your first three destination matches is free, and you can change dates, pace or even the destination for 30 days.

**Sources** (fees change often; check before you go): [India e-Tourist Visa fees](https://blog.wego.com/india-e-tourist-visa/) · [Taj Mahal ticket prices](https://www.trivenicabs.in/blog/taj-mahal-entry-ticket-prices-2026-foreign-indian-skip-line) · [Jaipur composite ticket](https://www.waytoindia.com/travel-guide/rajasthan/jaipur) · [Rajasthan fee revision, January 2026](https://www.pinkcitypost.com/visiting-jaipurs-heritage-sites-to-cost-more-from-jan-1-what-tourists-should-know/)

Cover photo: Taj Mahal at sunrise by [Gunjan Pandey](https://commons.wikimedia.org/wiki/File:Taj_Mahal_sunrise.jpg), CC BY-SA 4.0. All photos from Wikimedia Commons, used under their licences with credit.`,
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
    replacesBodyMd5: ["1c2f7fa3f2feca800235c2f453641c42"],
    body: `Kerala is the gentlest introduction to India: green, calm, wonderfully hospitable and easy to get around. Five days is enough for its three classic experiences.

## Day 1: Kochi

Land in Kochi and spend the afternoon in Fort Kochi: Chinese fishing nets at sunset, Portuguese and Dutch-era streets, and a Kathakali performance in the evening.

## Days 2–3: Munnar

Drive about four hours into the Western Ghats. [Munnar's](/destinations/munnar) tea estates roll across every hill. See the Nilgiri tahr in Eravikulam National Park (closed for calving around February–March), take a jeep to Kolukkumalai for sunrise, and visit the tea museum.

## Day 4: Alleppey houseboat

Drive down to [Alappuzha (Alleppey)](/destinations/alleppey) and board a kettuvallam houseboat around noon. Drift through palm-lined canals, eat karimeen (pearl-spot fish) cooked on board, and sleep on the water. On a budget? The public ferry to Kottayam shows you the same backwaters for a few rupees.

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
  ...NOVEMBER_2026_POSTS,
  ...NOVEMBER_2026_B_POSTS,
];
