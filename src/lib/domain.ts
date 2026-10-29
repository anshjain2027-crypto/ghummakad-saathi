/** Shared vocabulary. Safe to import from client and server code. */

export const MOODS = [
  { id: "beach", label: "Beach & slow days", line: "Warm sand, long lunches, nowhere to be.", scene: "beach" },
  { id: "mountains", label: "Mountains & cool air", line: "Pine air, quiet ridgelines, a blanket at night.", scene: "mountains" },
  { id: "forest", label: "Forest & quiet", line: "Green light, birdsong and slow walks.", scene: "forest" },
  { id: "culture", label: "Culture & food", line: "Old streets, local kitchens, stories in every lane.", scene: "culture" },
  { id: "adventure", label: "Adventure & adrenaline", line: "Rivers, trails and a bit of a rush.", scene: "adventure" },
  { id: "surprise", label: "Surprise me", line: "Let your answers lead somewhere unexpected.", scene: "lake" },
] as const;
export type MoodId = (typeof MOODS)[number]["id"];

export const COMPANIONS = [
  { id: "solo", label: "Just me", line: "Your pace, your plans." },
  { id: "partner", label: "Partner", line: "Room for two, and a few special moments." },
  { id: "friends", label: "Friends", line: "Shared stays, long evenings, group-friendly days." },
  { id: "family", label: "Family", line: "Easy logistics and something for every age." },
] as const;
export type CompanionId = (typeof COMPANIONS)[number]["id"];

export const STYLES = [
  { id: "backpacking", label: "Backpacking", line: "Hostels and homestays, local buses, more days for less." },
  { id: "comfortable", label: "Comfortable", line: "Easy stays, breathing room, a few special experiences." },
  { id: "luxury", label: "Luxury", line: "Beautiful stays, private transfers, nothing rushed." },
  { id: "romantic", label: "Romantic", line: "Views worth lingering over and evenings that feel special." },
  { id: "experience", label: "Experience-first", line: "Spend where it counts: guides, activities, local craft." },
] as const;
export type StyleId = (typeof STYLES)[number]["id"];

export const PACES = [
  { id: "slow", label: "Slow", line: "Two or three things a day, long breaks." },
  { id: "balanced", label: "Balanced", line: "A full morning, an easy afternoon." },
  { id: "full", label: "Full", line: "Early starts, lots to see." },
] as const;
export type PaceId = (typeof PACES)[number]["id"];

export const DURATIONS = [
  { id: "1", label: "Day trip", days: 1, min: 1, max: 1 },
  { id: "2", label: "Weekend · 2D/1N", days: 2, min: 2, max: 2 },
  { id: "3-4", label: "3–4 days", days: 3, min: 3, max: 4 },
  { id: "5-6", label: "5–6 days", days: 5, min: 5, max: 6 },
  { id: "7+", label: "7+ days", days: 7, min: 7, max: 30 },
] as const;

/** Quick budget presets for the whole group (INR). */
export const BUDGET_PRESETS = [5000, 10000, 25000, 50000, 100000] as const;

export function tripLabel(days: number): string {
  if (days <= 1) return "Day trip";
  return `${days}D/${days - 1}N`;
}

export const INTERESTS = [
  "Hidden gems",
  "Local food",
  "Short hikes",
  "Photography",
  "Water & swimming",
  "Heritage",
  "Wildlife",
  "Nightlife",
  "Wellness",
  "Crafts & markets",
] as const;

export const PLACE_CATEGORIES = [
  { id: "viewpoint", label: "Viewpoints" },
  { id: "nature", label: "Nature" },
  { id: "food", label: "Food" },
  { id: "stay", label: "Stay" },
  { id: "culture", label: "Culture" },
  { id: "experience", label: "Experiences" },
  { id: "lesser_known", label: "Lesser-known" },
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]["id"];

export type CostBand = [number, number];
export type DailyCost = { backpacking: CostBand; comfortable: CostBand; luxury: CostBand };

export const WORTH_GOING = [
  { id: "yes", label: "Yes" },
  { id: "depends", label: "Depends" },
  { id: "no", label: "No" },
] as const;

export const SCENES = ["mountains", "beach", "forest", "culture", "adventure", "lake", "desert", "tea", "city"] as const;
export type SceneId = (typeof SCENES)[number];

export function styleCostKey(style: StyleId): keyof DailyCost {
  if (style === "backpacking") return "backpacking";
  if (style === "luxury") return "luxury";
  if (style === "romantic") return "comfortable";
  return "comfortable";
}

export function travellerCountFor(companion: CompanionId, declared?: number): number {
  if (declared && declared > 0) return declared;
  if (companion === "solo") return 1;
  if (companion === "partner") return 2;
  if (companion === "friends") return 4;
  return 4;
}
