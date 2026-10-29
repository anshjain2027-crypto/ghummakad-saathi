import { describe, expect, test } from "vitest";
import { SEED_DESTINATIONS } from "@/lib/seed/destinations";
import type { CuratedPlace, Destination } from "@/lib/planner/types";
import { matchDestinations, noMatchAdvice } from "@/lib/planner/matching";
import { mockSkeleton, resolvePlan, swapCandidates, validatePlan } from "@/lib/planner/itinerary";
import { PreferencesSchema } from "@/lib/planner/schema";

const destinations: Destination[] = SEED_DESTINATIONS.map((d) => ({
  id: d.id, name: d.name, region: d.region, country: d.country, countryCode: d.countryCode, lat: d.lat, lng: d.lng,
  timezone: d.timezone, localCurrency: d.localCurrency, tagline: d.tagline, story: d.story, moods: d.moods, styles: d.styles,
  companions: d.companions, experienceTags: d.experienceTags, dailyCost: d.dailyCost, suggestedDaysMin: d.suggestedDays[0],
  suggestedDaysMax: d.suggestedDays[1], bestMonths: d.bestMonths, seasonNote: d.seasonNote, travelCharacter: d.travelCharacter,
  practicalNote: d.practicalNote, gettingThere: d.gettingThere, stayArea: d.stayArea, nearestAirport: d.nearestAirport ?? null,
  nearestRail: d.nearestRail ?? null, scene: d.scene, heroImageUrl: null, imageCredit: null,
}));
const placesFor = (id: string): CuratedPlace[] =>
  SEED_DESTINATIONS.find((d) => d.id === id)!.places.map((p, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, destinationId: id, name: p.name, category: p.category,
    description: p.description, lat: p.lat, lng: p.lng, durationMin: p.durationMin, costInr: p.costInr, bestTime: p.bestTime,
    hiddenGem: !!p.hiddenGem, scene: p.scene ?? null,
  }));

const workshop = PreferencesSchema.parse({
  mood: "mountains", companion: "partner", travellers: 2, style: "comfortable", pace: "balanced",
  origin: "New Delhi", originCityId: "delhi", dateMode: "month", month: 10, days: 5, budgetInr: 40_000,
});

describe("matching", () => {
  test("workshop journey puts Tirthan Valley first", () => {
    const m = matchDestinations(destinations, workshop);
    expect(m).toHaveLength(3);
    expect(m[0].destination.id).toBe("tirthan-valley");
    expect(m[0].closest).toBe(true);
    expect(m[0].reasons.length).toBeGreaterThan(1);
  });

  test("never returns more than three, and is deterministic", () => {
    const a = matchDestinations(destinations, { ...workshop, mood: "culture" }).map((x) => x.destination.id);
    const b = matchDestinations(destinations, { ...workshop, mood: "culture" }).map((x) => x.destination.id);
    expect(a).toEqual(b);
    expect(a.length).toBeLessThanOrEqual(3);
  });

  test("global origins work (non-Indian destinations reachable)", () => {
    const m = matchDestinations(destinations, { ...workshop, origin: "London", originCityId: "london", mood: "culture", budgetInr: 600_000, days: 6 });
    expect(m.some((x) => x.destination.countryCode !== "IN")).toBe(true);
  });

  test("impossible budget yields no matches and helpful advice", () => {
    const p = { ...workshop, budgetInr: 5_000, travellers: 6 };
    expect(matchDestinations(destinations, p)).toHaveLength(0);
    expect(noMatchAdvice(destinations, p)[0]).toMatch(/higher budget|fewer days/);
  });

  test("surprise me gives varied primary moods", () => {
    const m = matchDestinations(destinations, { ...workshop, mood: "surprise", budgetInr: 80_000 });
    expect(new Set(m.map((x) => x.destination.moods[0])).size).toBe(m.length);
  });
});

describe("itinerary", () => {
  const dest = destinations.find((d) => d.id === "tirthan-valley")!;
  const places = placesFor(dest.id);
  const ctx = { dest, places, prefs: workshop };

  test("deterministic plan validates and has the requested days", () => {
    const plan = resolvePlan(mockSkeleton(dest, places, workshop), ctx);
    expect(plan.days).toHaveLength(5);
    expect(validatePlan(plan, ctx)).toEqual([]);
    expect(plan.caveats).toContain("Illustrative estimate — not live pricing.");
  });

  test("resolve drops invented place ids from an untrusted skeleton", () => {
    const skel = mockSkeleton(dest, places, workshop);
    skel.days[1].morning.unshift("11111111-2222-4333-8444-555555555555");
    const plan = resolvePlan(skel, ctx);
    expect(plan.days[1].morning.every((s) => places.some((p) => p.id === s.placeId))).toBe(true);
  });

  test("validator flags a plan for the wrong destination and wrong length", () => {
    const plan = resolvePlan(mockSkeleton(dest, places, workshop), ctx);
    const issues = validatePlan({ ...plan, destinationId: "gokarna", days: plan.days.slice(0, 2) }, ctx);
    expect(issues.map((i) => i.message).join(" ")).toMatch(/different destination/);
    expect(issues.map((i) => i.message).join(" ")).toMatch(/Expected 5 days/);
  });

  test("swap candidates exclude places already in that day", () => {
    const plan = resolvePlan(mockSkeleton(dest, places, workshop), ctx);
    const day2 = plan.days[1];
    const ids = new Set([...day2.morning, ...day2.afternoon, ...day2.evening].map((s) => s.placeId));
    expect(swapCandidates(plan, 2, places).every((p) => !ids.has(p.id))).toBe(true);
  });

  test("handles more days than places with rest days", () => {
    const long = { ...workshop, days: 14, pace: "full" as const };
    const plan = resolvePlan(mockSkeleton(dest, places, long), { ...ctx, prefs: long });
    expect(plan.days).toHaveLength(14);
    expect(plan.days.some((d) => d.restNote)).toBe(true);
  });
});
