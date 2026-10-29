"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft, saveDraft, saveMatches, selectDraftDestination } from "@/lib/data/drafts";
import { getDestination, listDestinations } from "@/lib/data/catalog";
import { matchDestinations } from "@/lib/planner/matching";
import { PreferencesSchema } from "@/lib/planner/schema";
import { rateLimit } from "@/lib/ratelimit";
import { visitorHash } from "@/lib/auth";

export type FindMatchesResult = { ok: true; count: number } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function findMatchesAction(raw: unknown): Promise<FindMatchesResult> {
  const parsed = PreferencesSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { ok: false, error: "A few answers need another look.", fieldErrors };
  }
  if (!(await rateLimit(`match:${await visitorHash()}`, 40, 3600))) {
    return { ok: false, error: "You've searched a lot in the last hour. Take a breather and try again shortly." };
  }
  try {
    const user = await getCurrentUser();
    const draft = await saveDraft(user, parsed.data);
    const matches = matchDestinations(await listDestinations(), parsed.data);
    await saveMatches(draft.id, matches);
    return { ok: true, count: matches.length };
  } catch (e) {
    console.error("findMatchesAction", e);
    return { ok: false, error: "We couldn't find matches just now. Your answers are kept — please try again." };
  }
}

export async function chooseDestinationAction(destinationId: string) {
  const user = await getCurrentUser();
  const draft = await currentDraft(user);
  if (!draft) redirect("/plan");
  const dest = await getDestination(String(destinationId).slice(0, 60));
  if (!dest) redirect("/plan/matches");
  await selectDraftDestination(draft.id, dest.id);
  redirect("/plan/review");
}
