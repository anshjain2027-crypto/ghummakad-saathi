import type { CompanionId, DailyCost, MoodId, StyleId } from "@/lib/domain";

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
};

export type Estimate = {
  perDayPerPerson: [number, number];
  onTrip: [number, number];
  transport: [number, number];
  total: [number, number];
  distanceKm: number | null;
  withinBudget: "yes" | "stretch" | "no";
  international: boolean;
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
