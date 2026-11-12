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
