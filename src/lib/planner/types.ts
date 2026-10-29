import type { CompanionId, DailyCost, MoodId, StyleId } from "@/lib/domain";
import type { Access } from "@/lib/travel/hubs";

export type TrekInfo = { km: number; difficulty: "easy" | "moderate" | "challenging"; maxAltM?: number; note?: string };

export type DestinationExtra = {
  access?: Access;
  packList?: string[];
  trek?: TrekInfo;
  /** Wikipedia article title used to find a licensed photo. */
  photoTitle?: string;
  /** Short trip label like "2D/1N weekend". */
  idealTrip?: string;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  localCurrency: string;
  tagline: string;
  story: string;
  moods: Exclude<MoodId, "surprise">[];
  styles: StyleId[];
  companions: CompanionId[];
  experienceTags: string[];
  dailyCost: DailyCost;
  suggestedDaysMin: number;
  suggestedDaysMax: number;
  bestMonths: number[];
  seasonNote: string;
  travelCharacter: string;
  practicalNote: string;
  gettingThere: string;
  stayArea: string;
  nearestAirport: string | null;
  nearestRail: string | null;
  scene: string;
  heroImageUrl: string | null;
  imageCredit: string | null;
  imagePageUrl: string | null;
  extra: DestinationExtra;
};

export type CuratedPlace = {
  id: string;
  destinationId: string | null;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  durationMin: number;
  costInr: number;
  bestTime: "morning" | "afternoon" | "evening" | "any";
  hiddenGem: boolean;
  scene: string | null;
  imageUrl?: string | null;
  imageCredit?: string | null;
  imagePageUrl?: string | null;
};

export type Estimate = {
  perDayPerPerson: [number, number];
  onTrip: [number, number];
  transport: [number, number];
  total: [number, number];
  distanceKm: number | null;
  withinBudget: "yes" | "stretch" | "no";
  international: boolean;
  /** The way a traveller of this style would most likely go, for the budget. */
  travel: { mode: "flight" | "train" | "bus" | "drive"; label: string; hours: [number, number]; overnight: boolean } | null;
  /** Too far to be worth it for this trip length. */
  tooFar: boolean;
};

export type MatchReason = { factor: "mood" | "style" | "companions" | "budget" | "duration" | "season" | "surprise" | "interests"; text: string };

export type Match = {
  destination: Destination;
  score: number; // organic_recommendation_score — never touched by sponsorship
  reasons: MatchReason[];
  estimate: Estimate;
  seasonCaveat: string | null;
  suggestedDays: number;
  closest: boolean;
};
