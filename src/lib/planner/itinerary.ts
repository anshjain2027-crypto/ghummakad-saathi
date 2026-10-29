import { haversineKm, roundTo } from "@/lib/geo";
import { PACES, STYLES } from "@/lib/domain";
import type { Preferences, Stop, TripPlan } from "./schema";
import { TripPlanSchema } from "./schema";
import type { CuratedPlace, Destination } from "./types";
import { destinationTravelOptions, estimateTrip } from "./matching";
import { findCity } from "@/lib/geo";
import { tripLabel } from "@/lib/domain";

/**
 * A skeleton is the only thing an AI provider is allowed to decide: which
 * curated place IDs go in which slot, plus short explanatory text. All facts
 * (names, coordinates, costs, durations) are resolved server-side from our
 * own records, so the model cannot invent places, prices or opening hours.
 */
export type DaySkeleton = {
  day: number;
  theme: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  foodPlaceId: string | null;
  hiddenGemPlaceId: string | null;
  practicalNote: string;
  restNote: string | null;
};
export type PlanSkeleton = {
  title: string;
  summary: string;
  whyThisFits: string[];
  days: DaySkeleton[];
  caveats: string[];
};

export const PACE_RULES = {
  slow: { stopsPerDay: 3, maxKmPerDay: 30, maxMinutesPerDay: 420 },
  balanced: { stopsPerDay: 4, maxKmPerDay: 45, maxMinutesPerDay: 540 },
  full: { stopsPerDay: 5, maxKmPerDay: 70, maxMinutesPerDay: 660 },
} as const;

const SLOT_ORDER = ["morning", "afternoon", "evening"] as const;

function costCategory(inr: number): Stop["costCategory"] {
  if (inr <= 0) return "free";
  if (inr < 600) return "low";
  if (inr < 2500) return "mid";
  return "high";
}

function travelModeBetween(a: CuratedPlace | null, b: CuratedPlace): Stop["travelMode"] {
  if (/boat|coracle|cruise|lantern/i.test(b.name)) return "boat";
  if (/train/i.test(b.name)) return "train";
  if (!a) return "local_transport";
  const km = haversineKm(a, b);
  if (km < 1.5) return "walk";
  if (km < 8) return "local_transport";
  return "drive";
}

/** Deterministic planner used without an LLM key, and as the fallback when an LLM answer fails validation. */
export function mockSkeleton(dest: Destination, places: CuratedPlace[], p: Preferences): PlanSkeleton {
  const rules = PACE_RULES[p.pace];
  const usable = places.filter((pl) => pl.category !== "stay");
  const foods = usable.filter((pl) => pl.category === "food");
  const sights = usable.filter((pl) => pl.category !== "food");
  const center = { lat: dest.lat, lng: dest.lng };
  const farKm = rules.maxKmPerDay;

  // Near places first, far "day trips" later in the trip; hidden gems interleaved.
  const ordered = [...sights].sort((a, b) => {
    const da = haversineKm(center, a);
    const db = haversineKm(center, b);
    const far = (x: number) => (x > farKm ? 1 : 0);
    return far(da) - far(db) || Number(a.hiddenGem) - Number(b.hiddenGem) || da - db || a.id.localeCompare(b.id);
  });

  const est = estimateTrip(dest, p);
  const t = est.travel;
  // Overnight bus/train: you arrive at dawn with a full day ahead. Short hops (≤4 h) arrive by late morning.
  const arriveEarly = !!t && (t.overnight || t.hours[0] <= 4);
  const short = p.days <= 2;
  const used = new Set<string>();
  const days: DaySkeleton[] = [];
  for (let day = 1; day <= p.days; day++) {
    const isArrival = day === 1;
    const isDeparture = day === p.days && (p.days > 2 || short);
    let capacity: number = rules.stopsPerDay;
    if (p.days === 1) capacity = Math.max(2, rules.stopsPerDay - 1);
    else if (isArrival) capacity = arriveEarly ? rules.stopsPerDay - (short ? 0 : 1) : Math.max(1, rules.stopsPerDay - 2);
    else if (isDeparture) capacity = Math.max(2, rules.stopsPerDay - (short ? 1 : 2));
    const anchor = ordered.find((pl) => !used.has(pl.id));
    const slots: Record<(typeof SLOT_ORDER)[number], string[]> = { morning: [], afternoon: [], evening: [] };
    let minutes = 0;
    let picked: CuratedPlace[] = [];

    if (anchor) {
      const pool = ordered
        .filter((pl) => !used.has(pl.id))
        .sort((a, b) => haversineKm(anchor, a) - haversineKm(anchor, b));
      for (const pl of pool) {
        if (picked.length >= capacity) break;
        if (picked.length && haversineKm(anchor, pl) > rules.maxKmPerDay / 2) continue;
        if (minutes + pl.durationMin > rules.maxMinutesPerDay) continue;
        picked.push(pl);
        minutes += pl.durationMin;
      }
    }
    if (isArrival && !arriveEarly && p.days > 1) picked = picked.filter((pl) => pl.bestTime !== "morning" || pl.durationMin <= 120);

    for (const pl of picked) {
      used.add(pl.id);
      const pref = pl.bestTime === "any" ? null : pl.bestTime;
      let slot: (typeof SLOT_ORDER)[number] = pref ?? "afternoon";
      if (isArrival && !arriveEarly && p.days > 1 && slot === "morning") slot = "afternoon";
      if (isDeparture && p.days > 1 && slot === "evening") slot = "afternoon";
      const limit = slot === "evening" ? 2 : 3;
      if (slots[slot].length >= limit) slot = SLOT_ORDER.find((s) => slots[s].length < (s === "evening" ? 2 : 3)) ?? slot;
      slots[slot].push(pl.id);
    }

    const food = foods.length ? foods[(day - 1) % foods.length] : null;
    const gem = picked.find((pl) => pl.hiddenGem) ?? null;
    const restDay = picked.length === 0;
    days.push({
      day,
      theme: restDay
        ? "A slow day to wander"
        : p.days === 1
          ? `A full day in ${dest.name}`
          : isArrival
            ? arriveEarly
              ? `Arrive early and dive into ${dest.name}`
              : `Arrive and settle into ${dest.name}`
            : isDeparture
              ? short
                ? `${themeFor(picked)}, then head home`
                : "One last easy morning"
              : themeFor(picked),
      morning: slots.morning,
      afternoon: slots.afternoon,
      evening: slots.evening,
      foodPlaceId: food?.id ?? null,
      hiddenGemPlaceId: gem?.id ?? null,
      practicalNote: (isArrival
        ? t
          ? p.days === 1
            ? `Leave early: about ${Math.round(t.hours[0])}–${Math.round(t.hours[1])} h each way by ${t.label.toLowerCase()}. ${dest.practicalNote}`
            : t.overnight
              ? `Take the overnight ${t.label.toLowerCase()} the night before (about ${Math.round(t.hours[0])} h) and arrive at dawn. ${dest.extra?.access?.startPoint ? `Start point: ${dest.extra.access.startPoint}.` : ""}`
              : `About ${Math.round(t.hours[0])}–${Math.round(t.hours[1])} h by ${t.label.toLowerCase()}. ${dest.gettingThere}`
          : dest.gettingThere
        : isDeparture
          ? t?.overnight
            ? `Catch the overnight ${t.label.toLowerCase()} home this evening — you're back by morning.`
            : "Keep the late afternoon free for the journey home; mountain and coastal roads can be slow."
          : dest.practicalNote
      ).slice(0, 300),
      restNote: restDay
        ? "Nothing scheduled on purpose. Revisit a favourite spot, rest, or ask your host what is happening locally."
        : p.pace === "slow" && day % 3 === 0
          ? "A lighter day — leave room for a long lunch."
          : null,
    });
  }

  const style = STYLES.find((s) => s.id === p.style)?.label ?? p.style;
  const pace = PACES.find((x) => x.id === p.pace)?.label ?? p.pace;
  return {
    title: `${dest.name} · ${tripLabel(p.days)} · ${style}`,
    summary: `${dest.tagline} A ${pace.toLowerCase()}-paced ${p.days}-day plan built around ${dest.experienceTags.slice(0, 3).join(", ").toLowerCase()}.`,
    whyThisFits: [
      `It matches the ${p.mood === "surprise" ? "open-minded" : p.mood} mood you chose, with ${dest.travelCharacter.toLowerCase()} days.`,
      `Paced for ${pace.toLowerCase()} travel: about ${PACE_RULES[p.pace].stopsPerDay} stops on a full day, with nearby places grouped together.`,
      `Planned for ${p.travellers} ${p.travellers === 1 ? "traveller" : "travellers"} at a ${style.toLowerCase()} level.`,
    ],
    days,
    caveats: [],
  };
}

function themeFor(picked: CuratedPlace[]): string {
  const cats = new Set(picked.map((p) => p.category));
  if (cats.has("viewpoint") && cats.has("nature")) return "Trails and big views";
  if (cats.has("culture") && cats.has("food")) return "Old streets and good food";
  if (cats.has("culture")) return "History and local life";
  if (cats.has("experience")) return "Something to remember";
  if (cats.has("lesser_known")) return "Off the usual path";
  if (cats.has("nature")) return "Out in nature";
  return "An easy day";
}

export type ResolveContext = { dest: Destination; places: CuratedPlace[]; prefs: Preferences };

/** Turns a skeleton into a full, fact-checked TripPlan. Unknown IDs are dropped, never trusted. */
export function resolvePlan(skel: PlanSkeleton, ctx: ResolveContext): TripPlan {
  const byId = new Map(ctx.places.map((p) => [p.id, p]));
  const estimate = estimateTrip(ctx.dest, ctx.prefs);
  const travellers = ctx.prefs.travellers;
  const perDay = estimate.perDayPerPerson;

  const days = skel.days.slice(0, ctx.prefs.days).map((d, idx) => {
    let prev: CuratedPlace | null = null;
    let km = 0;
    const seen = new Set<string>();
    const toStops = (ids: string[]): Stop[] =>
      ids
        .map((id) => byId.get(id))
        .filter((pl): pl is CuratedPlace => !!pl && pl.destinationId === ctx.dest.id && !seen.has(pl.id))
        .map((pl) => {
          seen.add(pl.id);
          const leg = prev ? haversineKm(prev, pl) : 0;
          km += leg;
          const stop: Stop = {
            placeId: pl.id,
            name: pl.name,
            lat: pl.lat,
            lng: pl.lng,
            category: pl.category,
            durationMin: pl.durationMin,
            travelMode: travelModeBetween(prev, pl),
            feasibility: leg > PACE_RULES[ctx.prefs.pace].maxKmPerDay / 2 ? "tight" : "ok",
            costCategory: costCategory(pl.costInr),
            estCostInr: pl.costInr * travellers,
            note: pl.description,
            hiddenGem: pl.hiddenGem,
            scene: pl.scene,
          };
          prev = pl;
          return stop;
        });
    const morning = toStops(d.morning).slice(0, 3);
    const afternoon = toStops(d.afternoon).slice(0, 3);
    const evening = toStops(d.evening).slice(0, 2);
    const food = d.foodPlaceId ? byId.get(d.foodPlaceId) : undefined;
    const gem = d.hiddenGemPlaceId ? byId.get(d.hiddenGemPlaceId) : undefined;
    return {
      day: idx + 1,
      theme: d.theme.slice(0, 80) || "An easy day",
      morning,
      afternoon,
      evening,
      food: food && food.destinationId === ctx.dest.id
        ? { name: food.name, note: food.description, placeId: food.id }
        : { name: "A local meal near your stay", note: "Ask your host what is fresh and local today.", placeId: null },
      hiddenGem: gem && gem.destinationId === ctx.dest.id ? { name: gem.name, note: gem.description, placeId: gem.id } : null,
      practicalNote: d.practicalNote.slice(0, 300),
      estSpendInr: [roundTo(perDay[0] * travellers, 100), roundTo(perDay[1] * travellers, 100)] as [number, number],
      travelKm: Math.round(km * 10) / 10,
      restNote: d.restNote ? d.restNote.slice(0, 200) : null,
    };
  });

  const onTrip = estimate.onTrip;
  const split = (share: number): [number, number] => [roundTo(onTrip[0] * share, 100), roundTo(onTrip[1] * share, 100)];
  const plan: TripPlan = {
    destinationId: ctx.dest.id,
    title: skel.title.slice(0, 120),
    summary: skel.summary.slice(0, 600),
    whyThisFits: skel.whyThisFits.slice(0, 5).map((s) => s.slice(0, 220)),
    days,
    budget: {
      currency: "INR",
      total: estimate.total,
      split: {
        transport: estimate.transport,
        stay: split(0.45),
        food: split(0.25),
        activities: split(0.3),
      },
      withinBudget: estimate.withinBudget !== "no",
    },
    travelToDestination: ctx.dest.gettingThere,
    stayArea: ctx.dest.stayArea,
    caveats: [
      "Illustrative estimate — not live pricing.",
      "Check current details with provider for opening times, permits and transport.",
      ...(estimate.withinBudget === "stretch" ? ["This plan is a stretch on your budget; choose simpler stays to keep it comfortable."] : []),
      ...skel.caveats.slice(0, 4).map((c) => c.slice(0, 200)),
    ].slice(0, 8),
    sources: [{ label: "Ghummakad Saathi editorial notes", url: null }],
    confidence: "illustrative",
    tripLabel: tripLabel(ctx.prefs.days),
    travelOptions: destinationTravelOptions(ctx.dest, findCity(ctx.prefs.originCityId) ?? findCity(ctx.prefs.origin), travellers, ctx.prefs.startDate ?? null)
      .slice(0, 4)
      .map((o) => ({ mode: o.mode, label: o.label, hours: o.hours, fareInr: o.fareInr, perVehicle: o.perVehicle, legs: o.legs, note: o.note, overnight: o.overnight, tags: o.tags, links: o.links })),
    chosenTravel: estimate.travel?.mode ?? null,
    packList: ctx.dest.extra?.packList?.slice(0, 10),
    trek: ctx.dest.extra?.trek ?? null,
  };
  return TripPlanSchema.parse(plan);
}

export type ValidationIssue = { day?: number; message: string };

/** Physical and logical checks before any plan is shown or saved. */
export function validatePlan(plan: TripPlan, ctx: ResolveContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rules = PACE_RULES[ctx.prefs.pace];
  if (plan.destinationId !== ctx.dest.id) issues.push({ message: "Plan is for a different destination" });
  if (plan.days.length !== ctx.prefs.days) issues.push({ message: `Expected ${ctx.prefs.days} days, got ${plan.days.length}` });
  const placeIds = new Set(ctx.places.filter((p) => p.destinationId === ctx.dest.id).map((p) => p.id));
  for (const d of plan.days) {
    const stops = [...d.morning, ...d.afternoon, ...d.evening];
    for (const s of stops) if (!placeIds.has(s.placeId)) issues.push({ day: d.day, message: `Unknown place ${s.name}` });
    if (new Set(stops.map((s) => s.placeId)).size !== stops.length) issues.push({ day: d.day, message: "A place appears twice in one day" });
    const minutes = stops.reduce((m, s) => m + s.durationMin, 0);
    if (minutes > rules.maxMinutesPerDay * 1.25) issues.push({ day: d.day, message: "Too much packed into one day" });
    if (d.travelKm > rules.maxKmPerDay * 2.5) issues.push({ day: d.day, message: "Travel distance is unrealistic for one day" });
  }
  return issues;
}

/** Usable alternatives for "swap this activity": same destination, not already that day. */
export function swapCandidates(plan: TripPlan, dayNo: number, places: CuratedPlace[]): CuratedPlace[] {
  const day = plan.days.find((d) => d.day === dayNo);
  if (!day) return [];
  const inDay = new Set([...day.morning, ...day.afternoon, ...day.evening].map((s) => s.placeId));
  const inTrip = new Set(plan.days.flatMap((d) => [...d.morning, ...d.afternoon, ...d.evening].map((s) => s.placeId)));
  return places
    .filter((p) => p.destinationId === plan.destinationId && p.category !== "stay" && p.category !== "food" && !inDay.has(p.id))
    .sort((a, b) => Number(inTrip.has(a.id)) - Number(inTrip.has(b.id)) || a.name.localeCompare(b.name));
}
