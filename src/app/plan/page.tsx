import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft } from "@/lib/data/drafts";
import { MOODS } from "@/lib/domain";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "Find my trip" };

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ mood?: string; edit?: string }> }) {
  const sp = await searchParams;
  const draft = await currentDraft(await getCurrentUser());
  const presetMood = MOODS.some((m) => m.id === sp.mood) ? (sp.mood as (typeof MOODS)[number]["id"]) : undefined;
  return <Wizard initial={draft?.preferences ?? null} presetMood={presetMood} startAtSummary={sp.edit === "1" && !!draft} />;
}
