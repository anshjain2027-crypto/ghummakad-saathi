import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft } from "@/lib/data/drafts";
import { MOODS } from "@/lib/domain";
import { Wizard } from "./wizard";

export const metadata: Metadata = {
  title: "Find my India trip",
  description: "Answer a few quick questions — mood, budget, dates, who you travel with — and get India destinations matched to you, with a day-by-day itinerary and real travel costs.",
  alternates: { canonical: "/plan" },
};

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ mood?: string; edit?: string }> }) {
  const sp = await searchParams;
  const draft = await currentDraft(await getCurrentUser());
  const presetMood = MOODS.some((m) => m.id === sp.mood) ? (sp.mood as (typeof MOODS)[number]["id"]) : undefined;
  return <Wizard initial={draft?.preferences ?? null} presetMood={presetMood} startAtSummary={sp.edit === "1" && !!draft} />;
}
