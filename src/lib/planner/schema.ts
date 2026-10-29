import { z } from "zod";
import { COMPANIONS, DISPLAY_CURRENCIES_LIST, MOODS, PACES, STYLES } from "./vocab";

const ids = <T extends readonly { id: string }[]>(xs: T) => xs.map((x) => x.id) as [T[number]["id"], ...T[number]["id"][]];

/** trip_preference: everything the wizard collects. Validated on every write. */
export const PreferencesSchema = z.object({
  mood: z.enum(ids(MOODS)),
  companion: z.enum(ids(COMPANIONS)),
  travellers: z.number().int().min(1).max(30),
  style: z.enum(ids(STYLES)),
  pace: z.enum(ids(PACES)).default("balanced"),
  origin: z.string().trim().min(2).max(80),
  originCityId: z.string().max(40).optional(),
  dateMode: z.enum(["dates", "month", "flexible"]).default("flexible"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.number().int().min(1).max(12).optional(),
  days: z.number().int().min(2).max(14),
  budgetInr: z.number().int().min(5_000).max(5_000_000),
  budgetIncludesTransport: z.boolean().default(true),
  displayCurrency: z.enum(DISPLAY_CURRENCIES_LIST).default("INR"),
  interests: z.array(z.string().max(40)).max(10).default([]),
  accessibility: z.string().trim().max(300).default(""),
  exclusions: z.string().trim().max(300).default(""),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

// ───────────── Trip plan (generated itinerary) ─────────────

export const StopSchema = z.object({
  placeId: z.string().guid(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  category: z.string(),
  durationMin: z.number().int().min(10).max(600),
  travelMode: z.enum(["walk", "drive", "local_transport", "boat", "train"]),
  feasibility: z.enum(["ok", "tight"]),
  costCategory: z.enum(["free", "low", "mid", "high"]),
  estCostInr: z.number().int().min(0),
  note: z.string().max(400),
  hiddenGem: z.boolean().default(false),
  scene: z.string().nullable().optional(),
});
export type Stop = z.infer<typeof StopSchema>;

export const DaySchema = z.object({
  day: z.number().int().min(1),
  theme: z.string().max(80),
  morning: z.array(StopSchema).max(3),
  afternoon: z.array(StopSchema).max(3),
  evening: z.array(StopSchema).max(2),
  food: z.object({ name: z.string(), note: z.string(), placeId: z.string().guid().nullable() }),
  hiddenGem: z.object({ name: z.string(), note: z.string(), placeId: z.string().guid().nullable() }).nullable(),
  practicalNote: z.string().max(300),
  estSpendInr: z.tuple([z.number().int(), z.number().int()]),
  travelKm: z.number().min(0),
  restNote: z.string().max(200).nullable(),
});
export type Day = z.infer<typeof DaySchema>;

export const TripPlanSchema = z.object({
  destinationId: z.string(),
  title: z.string().max(120),
  summary: z.string().max(600),
  whyThisFits: z.array(z.string().max(220)).min(1).max(5),
  days: z.array(DaySchema).min(1).max(14),
  budget: z.object({
    currency: z.literal("INR"),
    total: z.tuple([z.number().int(), z.number().int()]),
    split: z.object({
      transport: z.tuple([z.number().int(), z.number().int()]),
      stay: z.tuple([z.number().int(), z.number().int()]),
      food: z.tuple([z.number().int(), z.number().int()]),
      activities: z.tuple([z.number().int(), z.number().int()]),
    }),
    withinBudget: z.boolean(),
  }),
  travelToDestination: z.string(),
  stayArea: z.string(),
  caveats: z.array(z.string()).max(8),
  sources: z.array(z.object({ label: z.string(), url: z.string().url().nullable() })).max(10),
  confidence: z.literal("illustrative"),
});
export type TripPlan = z.infer<typeof TripPlanSchema>;
