import { findCity, haversineKm, roundTo, transportEstimatePerPersonInr } from "@/lib/geo";
import { styleCostKey } from "@/lib/domain";
import { MOODS, STYLES, COMPANIONS } from "@/lib/domain";
import type { Preferences } from "./schema";
import type { Destination, Estimate, Match, MatchReason } from "./types";

/**
 * Organic matching. Pure and deterministic: the same inputs always produce
 * the same three destinations. Sponsorship is never an input here.
 */

export function estimateTrip(d: Destination, p: Preferences): Estimate {
  const band = d.dailyCost[styleCostKey(p.style)];
  const romanticBump = p.style === "romantic" ? 1.15 : 1;
  const perDay: [number, number] = [Math.round(band[0] * romanticBump), Math.round(band[1] * romanticBump)];
  const onTrip: [number, number] = [perDay[0] * p.days * p.travellers, perDay[1] * p.days * p.travellers];

  const city = findCity(p.originCityId) ?? findCity(p.origin);
  const distanceKm = city ? Math.round(haversineKm(city, d)) : null;
  const perPersonTransport = distanceKm === null ? ([3000, 12000] as [number, number]) : transportEstimatePerPersonInr(distanceKm);
  const transport: [number, number] = p.budgetIncludesTransport
    ? [perPersonTransport[0] * p.travellers, perPersonTransport[1] * p.travellers]
    : [0, 0];

  const total: [number, number] = [roundTo(onTrip[0] + transport[0], 500), roundTo(onTrip[1] + transport[1], 500)];
  const withinBudget = total[0] <= p.budgetInr ? (total[1] <= p.budgetInr * 1.05 ? "yes" : "stretch") : total[0] <= p.budgetInr * 1.2 ? "stretch" : "no";

  return {
    perDayPerPerson: perDay,
    onTrip,
    transport,
    total,
    distanceKm,
    withinBudget,
    international: city ? city.countryCode !== d.countryCode : d.countryCode !== "IN",
  };
}

function travelMonth(p: Preferences): number | null {
  if (p.dateMode === "dates" && p.startDate) return Number(p.startDate.slice(5, 7));
  if (p.dateMode === "month" && p.month) return p.month;
  return null;
}

const label = <T extends readonly { id: string; label: string }[]>(xs: T, id: string) =>
  xs.find((x) => x.id === id)?.label ?? id;

export function scoreDestination(d: Destination, p: Preferences): { score: number; reasons: MatchReason[]; estimate: Estimate; seasonCaveat: string | null } {
  const reasons: MatchReason[] = [];
  let score = 0;

  if (p.mood === "surprise") {
    score += 12;
    reasons.push({ factor: "surprise", text: `A ${d.travelCharacter.toLowerCase()} pick you might not have searched for.` });
  } else if (d.moods[0] === p.mood) {
    score += 40;
    reasons.push({ factor: "mood", text: `Built for ${label(MOODS, p.mood).toLowerCase()}: ${d.tagline.toLowerCase().replace(/\.$/, "")}.` });
  } else if (d.moods.includes(p.mood)) {
    score += 28;
    reasons.push({ factor: "mood", text: `Has plenty of ${label(MOODS, p.mood).toLowerCase()} alongside its ${d.moods[0]} side.` });
  }

  if (d.styles.includes(p.style)) {
    score += 16;
    const line = STYLES.find((s) => s.id === p.style)?.line ?? "";
    reasons.push({ factor: "style", text: `Works well for a ${label(STYLES, p.style).toLowerCase()} trip — ${line.charAt(0).toLowerCase()}${line.slice(1)}` });
  } else {
    score -= 6;
  }

  if (d.companions.includes(p.companion)) {
    score += 8;
    if (p.companion !== "solo") reasons.push({ factor: "companions", text: `Easy to enjoy with ${p.companion === "partner" ? "a partner" : p.companion === "family" ? "family" : "friends"}.` });
    else reasons.push({ factor: "companions", text: "Comfortable and rewarding to explore on your own." });
  } else {
    score -= 8;
  }

  const estimate = estimateTrip(d, p);
  if (estimate.withinBudget === "yes") {
    score += 18;
    reasons.push({ factor: "budget", text: `Fits your total budget at roughly the ${label(STYLES, p.style).toLowerCase()} level.` });
  } else if (estimate.withinBudget === "stretch") {
    score += 4;
    reasons.push({ factor: "budget", text: "Doable on your budget with a few savings on stays or transport." });
  } else {
    score -= 30;
  }

  if (p.days >= d.suggestedDaysMin && p.days <= d.suggestedDaysMax + 1) {
    score += 10;
    reasons.push({ factor: "duration", text: `${p.days} days is about right here, without rushing.` });
  } else if (p.days < d.suggestedDaysMin) {
    score -= (d.suggestedDaysMin - p.days) * 6;
  } else {
    score += 2;
  }

  let seasonCaveat: string | null = null;
  const month = travelMonth(p);
  if (month) {
    if (d.bestMonths.includes(month)) {
      score += 8;
      reasons.push({ factor: "season", text: "Your travel month falls in a good season." });
    } else {
      score -= 12;
      seasonCaveat = d.seasonNote;
    }
  } else {
    seasonCaveat = null;
  }

  const interestHits = p.interests.filter((i) =>
    d.experienceTags.some((t) => t.toLowerCase().includes(i.toLowerCase().split(" ")[0])),
  ).length;
  if (interestHits) {
    score += interestHits * 3;
    reasons.push({ factor: "interests", text: "Lines up with interests you picked." });
  }

  // Long-haul trips on short durations are poor value.
  if (estimate.international && p.days <= 4 && (estimate.distanceKm ?? 0) > 3000) score -= 10;

  return { score, reasons, estimate, seasonCaveat };
}

export function matchDestinations(destinations: Destination[], p: Preferences, limit = 3): Match[] {
  const scored = destinations
    .map((d) => ({ d, ...scoreDestination(d, p) }))
    .filter((s) => s.estimate.withinBudget !== "no")
    .filter((s) => p.mood === "surprise" || s.d.moods.includes(p.mood as never))
    .sort((a, b) => b.score - a.score || a.d.id.localeCompare(b.d.id));

  let picked = scored;
  if (p.mood === "surprise") {
    // Prefer variety: no two picks with the same primary mood.
    const seen = new Set<string>();
    picked = scored.filter((s) => (seen.has(s.d.moods[0]) ? false : (seen.add(s.d.moods[0]), true)));
  }

  return picked.slice(0, limit).map((s, i) => ({
    destination: s.d,
    score: s.score,
    reasons: s.reasons.slice(0, 4),
    estimate: s.estimate,
    seasonCaveat: s.seasonCaveat,
    suggestedDays: Math.min(Math.max(p.days, s.d.suggestedDaysMin), s.d.suggestedDaysMax + 1),
    closest: i === 0,
  }));
}

/** When nothing fits, tell the traveller which lever would help most. */
export function noMatchAdvice(destinations: Destination[], p: Preferences): string[] {
  const tips: string[] = [];
  const cheapest = destinations
    .filter((d) => p.mood === "surprise" || d.moods.includes(p.mood as never))
    .map((d) => estimateTrip(d, p).total[0])
    .sort((a, b) => a - b)[0];
  if (cheapest && cheapest > p.budgetInr) {
    tips.push(`The closest fit starts at around ₹${cheapest.toLocaleString("en-IN")} for your group — try a higher budget or fewer days.`);
  }
  if (p.style === "luxury") tips.push("A Comfortable style opens up more options at this budget.");
  if (p.mood !== "surprise") tips.push("Try “Surprise me” to see places outside your chosen mood.");
  tips.push(`${label(COMPANIONS, p.companion)} trips with ${p.travellers} travellers are priced for the whole group.`);
  return tips;
}
