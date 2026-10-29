import { haversineKm, roundTo, type City } from "@/lib/geo";
import { AIRPORTS, RAILHEADS, type Access, type Hub } from "./hubs";

/**
 * Rome2rio-style route options between a departure city and a destination:
 * Flight, Train, Bus and Self-drive, each with door-to-door time and a fare
 * range. These are transparent rules-of-thumb from straight-line distance
 * (with road/rail detour factors) and typical Indian fares — always shown as
 * estimates, never as quotes. Client-safe and deterministic.
 */

export type TravelMode = "flight" | "train" | "bus" | "drive";

export type TravelLeg = { mode: TravelMode | "taxi" | "local_bus" | "ferry"; text: string };

export type TravelOption = {
  mode: TravelMode;
  label: string;
  /** Door-to-door hours, one way. */
  hours: [number, number];
  /** One-way fare per person in INR. For "drive", the whole car's fuel + tolls. */
  fareInr: [number, number];
  perVehicle: boolean;
  legs: TravelLeg[];
  note: string | null;
  overnight: boolean;
  /** Per-person last-mile cost (shared jeep/bus or a share of a cab), one way. */
  lastMileInr: [number, number];
  tags: ("fastest" | "cheapest" | "recommended")[];
  links: { label: string; url: string }[];
};

type Place = { name: string; lat: number; lng: number };

const ROAD_FACTOR = 1.3;
const RAIL_FACTOR = 1.25;

function lastMile(hub: Hub, dest: Place, hilly: boolean) {
  const km = haversineKm(hub, dest) * (hilly ? 1.5 : ROAD_FACTOR);
  const speed = hilly ? 32 : 45;
  return {
    km,
    hours: km / speed,
    taxi: [roundTo(Math.max(300, km * 14), 50), roundTo(Math.max(500, km * 22), 50)] as [number, number],
    bus: [roundTo(Math.max(40, km * 1.6), 10), roundTo(Math.max(80, km * 2.8), 10)] as [number, number],
  };
}

const fmtH = (h: number) => (h < 1 ? `${Math.max(10, Math.round(h * 6) * 10)} min` : `${Math.round(h * 2) / 2} h`);

const slug = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function mapsUrl(from: Place, to: Place, mode: "driving" | "transit") {
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("origin", from.name);
  u.searchParams.set("destination", `${to.lat},${to.lng}`);
  u.searchParams.set("travelmode", mode);
  return u.toString();
}

export function travelOptions(city: City, dest: Place & { access?: Access; countryCode?: string }, opts: { travellers?: number; date?: string | null } = {}): TravelOption[] {
  const access = dest.access ?? {};
  const hilly = !!access.hilly;
  const straight = haversineKm(city, dest);
  const out: TravelOption[] = [];
  const share = Math.min(Math.max(opts.travellers ?? 1, 1), 4);
  const domestic = city.countryCode === "IN" && (dest.countryCode ?? "IN") === "IN";

  if (straight < 15) return [];

  // ── Flight ────────────────────────────────────────────────────────────
  const destAirport = access.airport ? AIRPORTS[access.airport] : undefined;
  const cityAirport = AIRPORTS[city.iata] ?? { code: city.iata, name: city.name, lat: city.lat, lng: city.lng };
  if (destAirport && destAirport.code !== city.iata) {
    const airKm = haversineKm(cityAirport, destAirport);
    if (airKm > 300 || access.island) {
      const lm = lastMile(destAirport, dest, hilly);
      const block = airKm / 650 + 0.6;
      const hours: [number, number] = [block + 2.2 + lm.hours, block + 3.5 + lm.hours * 1.2 + (airKm > 1800 && !domestic ? 3 : 0)];
      const base = domestic ? 1800 + airKm * 2.6 : 6000 + airKm * 4.2;
      const fare: [number, number] = [roundTo(Math.max(2800, base * 0.85), 100), roundTo(Math.max(5500, base * 1.9), 100)];
      const legs: TravelLeg[] = [{ mode: "flight", text: `Fly ${cityAirport.code} → ${destAirport.code} (${destAirport.name}), about ${fmtH(block)} in the air` }];
      if (lm.km > 8) legs.push({ mode: "taxi", text: `Taxi or cab to ${dest.name}, about ${fmtH(lm.hours)} (₹${lm.taxi[0].toLocaleString("en-IN")}–${lm.taxi[1].toLocaleString("en-IN")} per cab)` });
      const sky = new URL(`https://www.skyscanner.co.in/transport/flights/${cityAirport.code.toLowerCase()}/${destAirport.code.toLowerCase()}/`);
      if (opts.date) sky.pathname += `${opts.date.slice(2, 4)}${opts.date.slice(5, 7)}${opts.date.slice(8, 10)}/`;
      out.push({
        mode: "flight",
        label: "Fly",
        hours: [round1(hours[0]), round1(hours[1])],
        fareInr: fare,
        perVehicle: false,
        legs,
        note: lm.km > 8 ? `Fare is the flight only; add the cab from ${destAirport.name}.` : null,
        overnight: false,
        lastMileInr: lm.km > 8 ? [roundTo(lm.taxi[0] / share, 10), roundTo(lm.taxi[1] / share, 10)] : [0, 0],
        tags: [],
        links: [
          { label: "Search flights (Skyscanner)", url: sky.toString() },
          { label: "Compare on KAYAK", url: `https://www.kayak.co.in/flights/${cityAirport.code}-${destAirport.code}${opts.date ? `/${opts.date}` : ""}` },
        ],
      });
    }
  }
  if (access.island || !domestic) return finalize(out);

  // ── Train ─────────────────────────────────────────────────────────────
  const cityRail = city.rail ? RAILHEADS[city.rail] : undefined;
  const destRail = access.rail ? RAILHEADS[access.rail] : undefined;
  if (cityRail && destRail && cityRail.code !== destRail.code) {
    const railKm = haversineKm(cityRail, destRail) * RAIL_FACTOR;
    if (railKm > 80) {
      const lm = lastMile(destRail, dest, hilly);
      const onTrain = railKm / 60;
      const hours: [number, number] = [onTrain * 0.75 + 0.5 + lm.hours, onTrain * 1.3 + 1 + lm.hours * 1.3];
      const sleeper = 60 + railKm * 0.42;
      const ac2 = 250 + railKm * 1.9;
      const fare: [number, number] = [roundTo(sleeper, 10), roundTo(ac2, 10)];
      const legs: TravelLeg[] = [{ mode: "train", text: `Train ${cityRail.name} → ${destRail.name}, about ${fmtH(onTrain)}` }];
      if (lm.km > 5) legs.push({ mode: lm.km > 25 ? "taxi" : "local_bus", text: `${lm.km > 25 ? "Cab or shared jeep" : "Auto or local bus"} to ${dest.name}, about ${fmtH(lm.hours)}` });
      out.push({
        mode: "train",
        label: "Train",
        hours: [round1(hours[0]), round1(hours[1])],
        fareInr: fare,
        perVehicle: false,
        legs,
        note: `Sleeper to 2AC range. ${onTrain > 7 ? "Overnight trains save a hotel night." : "Book early for weekends and festivals."}`,
        overnight: onTrain > 7,
        lastMileInr: lm.km > 5 ? (lm.km > 25 ? [lm.bus[0], roundTo(lm.taxi[0] / share, 10)] : lm.bus) : [0, 0],
        tags: [],
        links: [{ label: "Check trains on IRCTC", url: "https://www.irctc.co.in/nget/train-search" }],
      });
    }
  }

  // ── Bus ───────────────────────────────────────────────────────────────
  const roadKm = straight * (hilly ? 1.35 : ROAD_FACTOR);
  // Only the last stretch is mountain road; the rest is highway.
  const hillKm = hilly ? Math.min(roadKm * 0.4, 160) : 0;
  const roadHours = (plain: number, hill: number) => (roadKm - hillKm) / plain + hillKm / hill;
  if (roadKm > 40 && roadKm < 1500) {
    const onBus = roadHours(48, 28);
    const fare: [number, number] = [roundTo(Math.max(150, roadKm * 1.25), 10), roundTo(Math.max(400, roadKm * 2.7), 10)];
    out.push({
      mode: "bus",
      label: "Bus",
      hours: [round1(onBus * 0.9 + 0.5), round1(onBus * 1.2 + 1)],
      fareInr: fare,
      perVehicle: false,
      legs: [{ mode: "bus", text: `${onBus > 6 ? "Overnight " : ""}bus ${city.name} → ${dest.name}${access.busHint ? ` (${access.busHint})` : ""}, about ${fmtH(onBus)}` }],
      note: onBus > 6 ? "State transport to AC Volvo sleeper range. Leave at night, arrive early morning." : "State transport to AC coach range.",
      overnight: onBus > 6,
      lastMileInr: [0, 0],
      tags: [],
      links: [
        { label: "Search buses (redBus)", url: `https://www.redbus.in/bus-tickets/${slug(city.name)}-to-${slug(dest.name)}` },
        { label: "Search on AbhiBus", url: "https://www.abhibus.com/" },
      ],
    });
  }

  // ── Self-drive ────────────────────────────────────────────────────────
  if (roadKm > 25 && roadKm < 2200) {
    const drive = roadHours(58, 30);
    const fuel = roadKm * 7.2; // ~15 km/l at ~₹105/l
    const tolls = roadKm * (hilly ? 0.6 : 1.4);
    out.push({
      mode: "drive",
      label: "Self-drive",
      hours: [round1(drive * 0.9), round1(drive * 1.25 + (drive > 8 ? 1 : 0.3))],
      fareInr: [roundTo(fuel + tolls * 0.7, 100), roundTo(fuel * 1.2 + tolls, 100)],
      perVehicle: true,
      legs: [{ mode: "drive", text: `Drive about ${roundTo(roadKm, 10).toLocaleString("en-IN")} km${hilly ? ", the last stretch on mountain roads" : ""}` }],
      note: `Fuel and tolls for one car${opts.travellers && opts.travellers > 1 ? `, shared by up to ${Math.min(opts.travellers, 4)}` : ""}. ${drive > 9 ? "Split the drive or start before dawn." : hilly ? "Avoid driving mountain roads after dark." : ""}`.trim(),
      overnight: false,
      lastMileInr: [0, 0],
      tags: [],
      links: [{ label: "Route on Google Maps", url: mapsUrl(city, dest, "driving") }],
    });
  }

  return finalize(out);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const ORDER: TravelMode[] = ["flight", "train", "bus", "drive"];

function finalize(out: TravelOption[]): TravelOption[] {
  if (!out.length) return out;
  const perPerson = (o: TravelOption) => (o.perVehicle ? o.fareInr[0] / 3 : o.fareInr[0]);
  const fastest = [...out].sort((a, b) => a.hours[0] - b.hours[0])[0];
  const cheapest = [...out].sort((a, b) => perPerson(a) - perPerson(b))[0];
  fastest.tags.push("fastest");
  cheapest.tags.push("cheapest");
  // Recommended: best balance of time and money (an hour is "worth" ₹350).
  const value = (o: TravelOption) => o.hours[0] * 350 + perPerson(o) * 0.6 + (o.overnight ? -500 : 0);
  const rec = [...out].sort((a, b) => value(a) - value(b))[0];
  if (!rec.tags.includes("recommended")) rec.tags.push("recommended");
  return out.sort((a, b) => ORDER.indexOf(a.mode) - ORDER.indexOf(b.mode));
}

export type StyleKey = "backpacking" | "comfortable" | "luxury" | "romantic" | "experience";

/**
 * The option a traveller of this style would most likely take, used for the
 * trip budget. Backpackers take the cheapest; comfortable travellers avoid
 * very long ground journeys; luxury prefers flying or driving.
 */
export function preferredOption(options: TravelOption[], style: StyleKey, travellers: number): TravelOption | null {
  if (!options.length) return null;
  const by = (m: TravelMode) => options.find((o) => o.mode === m);
  const perPerson = (o: TravelOption) => (o.perVehicle ? o.fareInr[0] / Math.min(Math.max(travellers, 1), 4) : o.fareInr[0]);
  if (style === "backpacking") return [...options].filter((o) => o.mode !== "drive" || travellers >= 3).sort((a, b) => perPerson(a) - perPerson(b))[0] ?? options[0];
  if (style === "luxury") {
    const f = by("flight");
    if (f) return f;
    return by("drive") ?? options[0];
  }
  const ground = options.filter((o) => o.mode !== "flight" && (o.mode !== "drive" || travellers >= 3)).sort((a, b) => a.hours[0] - b.hours[0]);
  const flight = by("flight");
  if (flight && (!ground.length || ground[0].hours[0] > 14)) return flight;
  const train = by("train");
  const bus = by("bus");
  const fastest = ground[0]?.hours[0] ?? 99;
  if (train && train.hours[0] <= fastest + 3) return train;
  if (bus && bus.hours[0] <= fastest + 3) return bus;
  return ground[0] ?? flight ?? options[0];
}

/** Round-trip cost per person for the trip budget, from a chosen option. */
export function roundTripPerPerson(o: TravelOption, travellers: number, style: StyleKey): [number, number] {
  const share = o.perVehicle ? Math.min(Math.max(travellers, 1), 4) : 1;
  let [lo, hi] = o.fareInr.map((x) => x / share) as [number, number];
  if (style === "backpacking" && !o.perVehicle) hi = lo + (hi - lo) * 0.45;
  if (style === "luxury" && !o.perVehicle) lo = lo + (hi - lo) * 0.5;
  lo += o.lastMileInr[0];
  hi += style === "backpacking" ? Math.min(o.lastMileInr[1], o.lastMileInr[0] * 1.6) : o.lastMileInr[1];
  return [roundTo(lo * 2, 100), roundTo(hi * 2, 100)];
}
