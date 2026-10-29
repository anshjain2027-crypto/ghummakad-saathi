"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth";
import {
  CustomPinSchema,
  deleteOwnReview,
  deleteOwnSubmission,
  deletePrivatePin,
  moderatePlace,
  reportContent,
  ReportSchema,
  resolveReport,
  ReviewSchema,
  saveCustomPin,
  savePlacePrivately,
  SubmissionSchema,
  submitPublicPlace,
  unsavePlace,
  updateOwnSubmission,
  upsertReview,
} from "@/lib/data/community";
import { RateLimitedError } from "@/lib/ratelimit";

export type FormResult = { ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string>; id?: string };

function failure(e: unknown): FormResult {
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0])] = i.message;
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  if (e instanceof RateLimitedError) return { ok: false, error: e.message };
  if (e instanceof Error && e.message.startsWith("Please")) return { ok: false, error: e.message };
  console.error("community action", e);
  return { ok: false, error: "That didn't save. Please try again." };
}

const fd = (form: FormData) => Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

export async function submitPlaceAction(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  const user = await requireUser("/map");
  try {
    const raw = fd(form);
    const id = await submitPublicPlace(user.id, SubmissionSchema.parse({ ...raw, googlePlaceId: raw.googlePlaceId || undefined }));
    revalidatePath("/my/places");
    return { ok: true, id, message: "Thanks! Your place is waiting for a quick review. Only you can see it until it's approved." };
  } catch (e) {
    return failure(e);
  }
}

export async function editPlaceAction(placeId: string, _prev: FormResult | null, form: FormData): Promise<FormResult> {
  const user = await requireUser(`/places/${placeId}`);
  try {
    await updateOwnSubmission(user.id, placeId, SubmissionSchema.parse(fd(form)));
    revalidatePath(`/places/${placeId}`);
    return { ok: true, message: "Saved. Edited submissions go back for review." };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePlaceAction(placeId: string) {
  const user = await requireUser(`/places/${placeId}`);
  await deleteOwnSubmission(user.id, placeId);
  revalidatePath("/my/places");
}

export async function customPinAction(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  const user = await requireUser("/map");
  try {
    await saveCustomPin(user.id, CustomPinSchema.parse(fd(form)));
    revalidatePath("/my/places");
    return { ok: true, message: "Saved privately. Only you can see this pin." };
  } catch (e) {
    return failure(e);
  }
}

export async function toggleSaveAction(placeId: string, save: boolean): Promise<FormResult> {
  const user = await requireUser(`/places/${placeId}`);
  try {
    if (save) await savePlacePrivately(user.id, placeId);
    else await unsavePlace(user.id, placeId);
    revalidatePath(`/places/${placeId}`);
    revalidatePath("/my/places");
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function deletePinAction(pinId: string) {
  const user = await requireUser("/my/places");
  await deletePrivatePin(user.id, pinId);
  revalidatePath("/my/places");
}

export async function reviewAction(placeId: string, _prev: FormResult | null, form: FormData): Promise<FormResult> {
  const user = await requireUser(`/places/${placeId}`);
  try {
    await upsertReview(user.id, placeId, ReviewSchema.parse(fd(form)));
    revalidatePath(`/places/${placeId}`);
    return { ok: true, message: "Review saved. Thanks for helping other travellers." };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteReviewAction(reviewId: string, placeId: string) {
  const user = await requireUser(`/places/${placeId}`);
  await deleteOwnReview(user.id, reviewId);
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/my/reviews");
}

export async function reportAction(target: { reviewId?: string; placeId?: string }, _prev: FormResult | null, form: FormData): Promise<FormResult> {
  const user = await requireUser(target.placeId ? `/places/${target.placeId}` : "/map");
  try {
    await reportContent(user.id, target, ReportSchema.parse(fd(form)));
    return { ok: true, message: "Thanks — a moderator will take a look." };
  } catch (e) {
    return failure(e);
  }
}

export async function moderatePlaceAction(placeId: string, decision: "approve" | "reject", form?: FormData) {
  const user = await requireRole("moderator", "/admin/places");
  await moderatePlace(user.id, placeId, decision, form ? String(form.get("reason") ?? "") || undefined : undefined);
  revalidatePath("/admin/places");
}

export async function resolveReportAction(reportId: string, decision: "upheld" | "dismissed") {
  const user = await requireRole("moderator", "/admin/reviews");
  await resolveReport(user.id, reportId, decision);
  revalidatePath("/admin/reviews");
}
