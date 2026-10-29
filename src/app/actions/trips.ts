"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { asService, asUser, one } from "@/lib/db";
import { config } from "@/lib/config";
import { appendVersion, assertEditable, EntitlementError, setSelfBooking } from "@/lib/data/trips";
import { curatedPlaces, getDestination } from "@/lib/data/catalog";
import { generateTripPlan } from "@/lib/ai/provider";
import { swapCandidates } from "@/lib/planner/itinerary";
import { PreferencesSchema, TripPlanSchema, type Preferences, type TripPlan } from "@/lib/planner/schema";
import { travellerChangeRule } from "@/lib/pricing";
import { rateLimit } from "@/lib/ratelimit";
import { PACES, STYLES } from "@/lib/domain";

export type TripActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; code?: string; upgradeRequired?: boolean };

function fail(e: unknown): TripActionResult {
  if (e instanceof EntitlementError) return { ok: false, error: e.message, code: e.code };
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Check your changes." };
  console.error("trip action", e);
  return { ok: false, error: "That didn't save. Your previous version is untouched — please try again." };
}

/** Abuse control for AI calls — never presented as a revision cap. */
async function aiAllowed(userId: string) {
  return (await rateLimit(`ai-burst:${userId}`, 6, 60)) && (await rateLimit(`ai-day:${userId}`, config.llm.dailyCallsPerUser, 86400));
}

async function buildAndSave(userId: string, tripId: string, prefs: Preferences, destinationId: string, summary: string) {
  // 1) Permission check (short transaction), 2) generate OUTSIDE any lock, 3) re-check + save.
  await asService((q) => assertEditable(q, userId, tripId));
  const dest = await getDestination(destinationId);
  if (!dest) throw new EntitlementError("not_found", "That destination isn't available.");
  const places = await curatedPlaces(dest.id);
  const { plan, generator } = await generateTripPlan({ dest, places, prefs });
  await asService(async (q) => {
    await assertEditable(q, userId, tripId);
    await appendVersion(q, { tripId, userId, plan, prefs, summary, generator });
  });
}

export async function generateTripAction(tripId: string): Promise<TripActionResult> {
  const user = await requireUser(`/trips/${tripId}`);
  try {
    if (!(await aiAllowed(user.id))) return { ok: false, error: "We're still working on your last request. Try again in a minute." };
    const trip = await asUser(user.id, (q) => one<{ destination_id: string; preferences: unknown; current_version: number }>(q, `select destination_id, preferences, current_version from public.trip_plan where id = $1`, [tripId]));
    if (!trip) return { ok: false, error: "Trip not found." };
    if (trip.current_version > 0) return { ok: true };
    const prefs = PreferencesSchema.parse(typeof trip.preferences === "string" ? JSON.parse(trip.preferences) : trip.preferences);
    await buildAndSave(user.id, tripId, prefs, trip.destination_id, "First plan");
    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const EditSchema = z.object({
  destinationId: z.string().min(2).max(60),
  days: z.coerce.number().int().min(2).max(14),
  travellers: z.coerce.number().int().min(1).max(30),
  style: z.enum(STYLES.map((s) => s.id) as [string, ...string[]]),
  pace: z.enum(PACES.map((p) => p.id) as [string, ...string[]]),
  budgetInr: z.coerce.number().int().min(5000).max(5_000_000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
});

/** Change anything — destination included — within the 30-day window. Never triggers checkout (except the confirmed 5+ upgrade). */
export async function editTripAction(tripId: string, _prev: TripActionResult | null, form: FormData): Promise<TripActionResult> {
  const user = await requireUser(`/trips/${tripId}`);
  try {
    const v = EditSchema.parse(Object.fromEntries(form));
    const { trip, entitlement } = await asService((q) => assertEditable(q, user.id, tripId));
    const rule = travellerChangeRule(entitlement.tier, v.travellers);
    if (rule.kind === "upgrade_required") {
      return { ok: false, upgradeRequired: true, error: "Plans for 5 or more travellers need the group tier. Confirm a one-time ₹500 upgrade to continue — nothing is charged until you confirm." };
    }
    if (!(await aiAllowed(user.id))) return { ok: false, error: "You're making changes quickly — give it a minute and try again." };
    const prefs: Preferences = PreferencesSchema.parse({
      ...trip.preferences,
      days: v.days,
      travellers: v.travellers,
      style: v.style,
      pace: v.pace,
      budgetInr: v.budgetInr,
      ...(v.startDate ? { dateMode: "dates", startDate: v.startDate } : {}),
    });
    const changes: string[] = [];
    if (v.destinationId !== trip.destinationId) changes.push("new destination");
    if (v.days !== trip.preferences.days) changes.push(`${v.days} days`);
    if (v.travellers !== trip.travellers) changes.push(`${v.travellers} travellers`);
    if (v.style !== trip.preferences.style) changes.push(`${v.style} style`);
    if (v.pace !== trip.preferences.pace) changes.push(`${v.pace} pace`);
    if (v.budgetInr !== trip.preferences.budgetInr) changes.push("budget");
    if (v.startDate && v.startDate !== trip.preferences.startDate) changes.push("dates");
    await buildAndSave(user.id, tripId, prefs, v.destinationId, changes.length ? `Changed ${changes.join(", ")}` : "Rebuilt plan");
    revalidatePath(`/trips/${tripId}`);
    return { ok: true, message: "Your plan has been rebuilt. The previous version is saved in history." };
  } catch (e) {
    return fail(e);
  }
}

export async function swapStopAction(tripId: string, day: number, oldPlaceId: string, newPlaceId: string): Promise<TripActionResult> {
  const user = await requireUser(`/trips/${tripId}`);
  try {
    const { trip } = await asService((q) => assertEditable(q, user.id, tripId));
    const current = await asUser(user.id, (q) =>
      one<{ plan: unknown }>(q, `select plan from public.trip_edit_history where trip_id = $1 order by version desc limit 1`, [tripId]),
    );
    if (!current) return { ok: false, error: "Build your plan first." };
    const plan: TripPlan = TripPlanSchema.parse(typeof current.plan === "string" ? JSON.parse(current.plan) : current.plan);
    const places = await curatedPlaces(plan.destinationId);
    const replacement = swapCandidates(plan, day, places).find((p) => p.id === newPlaceId);
    if (!replacement) return { ok: false, error: "That swap isn't available for this day." };
    let swapped = false;
    const days = plan.days.map((d) => {
      if (d.day !== day) return d;
      const repl = (slot: typeof d.morning) =>
        slot.map((s) => {
          if (s.placeId !== oldPlaceId) return s;
          swapped = true;
          return {
            ...s,
            placeId: replacement.id,
            name: replacement.name,
            lat: replacement.lat,
            lng: replacement.lng,
            category: replacement.category,
            durationMin: replacement.durationMin,
            costCategory: replacement.costInr <= 0 ? ("free" as const) : replacement.costInr < 600 ? ("low" as const) : replacement.costInr < 2500 ? ("mid" as const) : ("high" as const),
            estCostInr: replacement.costInr * trip.travellers,
            note: replacement.description,
            hiddenGem: replacement.hiddenGem,
            scene: replacement.scene,
          };
        });
      return { ...d, morning: repl(d.morning), afternoon: repl(d.afternoon), evening: repl(d.evening) };
    });
    if (!swapped) return { ok: false, error: "That activity isn't on this day any more." };
    await asService(async (q) => {
      await assertEditable(q, user.id, tripId);
      await appendVersion(q, { tripId, userId: user.id, plan: { ...plan, days }, prefs: trip.preferences, summary: `Day ${day}: swapped in ${replacement.name}`, generator: "manual" });
    });
    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function restoreVersionAction(tripId: string, version: number): Promise<TripActionResult> {
  const user = await requireUser(`/trips/${tripId}`);
  try {
    const { trip } = await asService((q) => assertEditable(q, user.id, tripId));
    const old = await asUser(user.id, (q) =>
      one<{ plan: unknown }>(q, `select plan from public.trip_edit_history where trip_id = $1 and version = $2`, [tripId, version]),
    );
    if (!old) return { ok: false, error: "That version doesn't exist." };
    const plan = TripPlanSchema.parse(typeof old.plan === "string" ? JSON.parse(old.plan) : old.plan);
    const prefs = PreferencesSchema.parse({ ...trip.preferences, days: plan.days.length });
    await asService(async (q) => {
      await assertEditable(q, user.id, tripId);
      await appendVersion(q, { tripId, userId: user.id, plan, prefs, summary: `Restored version ${version}`, generator: "manual" });
    });
    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function selfBookingAction(tripId: string, itemKey: string, booked: boolean): Promise<TripActionResult> {
  const user = await requireUser(`/trips/${tripId}`);
  try {
    await setSelfBooking(user.id, tripId, itemKey, booked);
    revalidatePath(`/trips/${tripId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
