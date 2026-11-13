import type { Destination } from "@/lib/planner/types";

/** "Kullu, Himachal Pradesh" -> "Himachal Pradesh"; "Goa" -> "Goa". */
export function stateOf(d: Pick<Destination, "region">): string {
  const parts = d.region.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? d.region;
}

export function isIndia(d: Pick<Destination, "country">): boolean {
  return d.country === "India";
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function monthList(months: number[]): string {
  const names = months.map((m) => new Date(2026, m - 1, 1).toLocaleString("en-US", { month: "long" }));
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Plain-language FAQ built only from the destination's own editorial fields,
 * so every answer stays consistent with the rest of the page.
 */
export function destinationFaq(d: Destination): { q: string; a: string }[] {
  const faq: { q: string; a: string }[] = [];
  if (d.bestMonths.length) {
    faq.push({ q: `What is the best time to visit ${d.name}?`, a: `${monthList(d.bestMonths)} are the best months. ${d.seasonNote}` });
  }
  faq.push({
    q: `How many days do you need in ${d.name}?`,
    a:
      d.suggestedDaysMin === d.suggestedDaysMax
        ? `Plan for about ${d.suggestedDaysMin} days.`
        : `Plan for ${d.suggestedDaysMin} to ${d.suggestedDaysMax} days. The shorter end covers the highlights; the longer end lets you slow down.`,
  });
  if (d.gettingThere) {
    const hubs = [d.nearestAirport ? `nearest airport code ${d.nearestAirport}` : null, d.nearestRail ? `nearest railway station ${d.nearestRail}` : null].filter(Boolean);
    faq.push({ q: `How do you get to ${d.name}?`, a: `${d.gettingThere}${hubs.length ? ` (${hubs.join("; ")}).` : ""}` });
  }
  const c = d.dailyCost;
  if (c?.backpacking && c?.comfortable && c?.luxury && d.localCurrency === "INR") {
    faq.push({
      q: `How much does a trip to ${d.name} cost per day?`,
      a: `Roughly ${inr(c.backpacking[0])}–${inr(c.backpacking[1])} per person per day on a backpacker budget, ${inr(c.comfortable[0])}–${inr(c.comfortable[1])} for a comfortable trip, and ${inr(c.luxury[0])}–${inr(c.luxury[1])} at the luxury end, excluding travel to get there. These are estimates; prices rise in peak season.`,
    });
  }
  if (d.stayArea) faq.push({ q: `Where should you stay in ${d.name}?`, a: d.stayArea });
  if (d.practicalNote) faq.push({ q: `Anything to know before visiting ${d.name}?`, a: d.practicalNote });
  return faq;
}

/** "Jammu & Kashmir" -> "jammu-and-kashmir" */
export function stateSlug(state: string): string {
  return state.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** A state gets its own guide page only with at least this many destinations (thinner pages don't help readers or rankings). */
export const MIN_DESTINATIONS_FOR_STATE_PAGE = 2;

export function statesWithPages<T extends Pick<Destination, "region" | "country">>(all: T[]): { state: string; slug: string; destinations: T[] }[] {
  const m = new Map<string, T[]>();
  for (const d of all) if (isIndia(d)) m.set(stateOf(d), [...(m.get(stateOf(d)) ?? []), d]);
  return [...m.entries()]
    .filter(([, l]) => l.length >= MIN_DESTINATIONS_FOR_STATE_PAGE)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([state, destinations]) => ({ state, slug: stateSlug(state), destinations }));
}

export const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;
export const monthName = (i: number) => MONTHS[i - 1].charAt(0).toUpperCase() + MONTHS[i - 1].slice(1);
export { monthList, inr };
