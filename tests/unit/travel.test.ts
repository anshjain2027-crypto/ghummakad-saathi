import { describe, expect, test } from "vitest";
import { findCity } from "@/lib/geo";
import { SEED_DESTINATIONS } from "@/lib/seed";
import { preferredOption, travelOptions } from "@/lib/travel/options";
import { matchDestinations } from "@/lib/planner/matching";
import { PreferencesSchema } from "@/lib/planner/schema";
import type { Destination } from "@/lib/planner/types";

const destinations: Destination[] = SEED_DESTINATIONS.map((d) => ({
  ...d, suggestedDaysMin: d.suggestedDays[0], suggestedDaysMax: d.suggestedDays[1], nearestAirport: d.nearestAirport ?? null,
  nearestRail: d.nearestRail ?? null, heroImageUrl: null, imageCredit: null, imagePageUrl: null, extra: d.extra ?? {},
})) as unknown as Destination[];
const dest = (id: string) => destinations.find((d) => d.id === id)!;

describe("travel options (rome2rio-style)", () => {
  test("Delhi → McLeodganj offers flight, train, bus and self-drive with sane numbers", () => {
    const d = dest("mcleodganj-triund");
    const opts = travelOptions(findCity("delhi")!, { ...d, access: d.extra.access }, { travellers: 2 });
    expect(opts.map((o) => o.mode)).toEqual(["flight", "train", "bus", "drive"]);
    const bus = opts.find((o) => o.mode === "bus")!;
    expect(bus.hours[0]).toBeGreaterThan(8);
    expect(bus.hours[0]).toBeLessThan(15);
    expect(bus.overnight).toBe(true);
    expect(bus.fareInr[0]).toBeGreaterThanOrEqual(500);
    expect(bus.fareInr[1]).toBeLessThan(2500);
    expect(opts.some((o) => o.tags.includes("cheapest"))).toBe(true);
    expect(opts.some((o) => o.tags.includes("fastest"))).toBe(true);
  });

  test("islands are flight-only and backpackers pick the cheapest option", () => {
    const a = dest("andaman-havelock");
    const opts = travelOptions(findCity("chennai")!, { ...a, access: a.extra.access }, {});
    expect(opts.map((o) => o.mode)).toEqual(["flight"]);
    const d = dest("lonavala-lohagad");
    const m = travelOptions(findCity("mumbai")!, { ...d, access: d.extra.access }, { travellers: 1 });
    const pick = preferredOption(m, "backpacking", 1)!;
    expect(pick.mode === "train" || pick.mode === "bus").toBe(true);
  });
});

describe("budget weekend trips", () => {
  test("2-day mountain adventure on ₹6,000 from Delhi finds real options", () => {
    const p = PreferencesSchema.parse({
      mood: "adventure", companion: "solo", travellers: 1, style: "backpacking", pace: "balanced",
      origin: "New Delhi", originCityId: "delhi", dateMode: "month", month: 10, days: 2, budgetInr: 6000,
    });
    const m = matchDestinations(destinations, p);
    expect(m).toHaveLength(3);
    for (const x of m) {
      expect(x.estimate.total[0]).toBeLessThanOrEqual(6000);
      expect(x.destination.suggestedDaysMin).toBeLessThanOrEqual(2);
      expect(x.estimate.travel?.hours[0] ?? 0).toBeLessThanOrEqual(13);
    }
  });

  test("a day trip never suggests somewhere half a day away", () => {
    const p = PreferencesSchema.parse({
      mood: "culture", companion: "family", travellers: 4, style: "comfortable", pace: "balanced",
      origin: "New Delhi", originCityId: "delhi", dateMode: "flexible", days: 1, budgetInr: 20000,
    });
    const m = matchDestinations(destinations, p);
    expect(m.length).toBeGreaterThan(0);
    for (const x of m) expect(x.estimate.travel?.hours[0] ?? 0).toBeLessThanOrEqual(3.5 * 1.25);
  });
});
