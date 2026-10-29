"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { asUser } from "@/lib/db";
import { DISPLAY_CURRENCIES } from "@/lib/geo";

export type ProfileState = { ok?: boolean; error?: string };

const Schema = z.object({
  displayName: z.string().trim().min(1).max(40),
  currency: z.enum(DISPLAY_CURRENCIES),
  timezone: z.string().trim().max(60).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone"),
  marketing: z.boolean(),
});

export async function saveProfileAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser("/profile");
  const parsed = Schema.safeParse({
    displayName: form.get("displayName"),
    currency: form.get("currency"),
    timezone: form.get("timezone"),
    marketing: form.get("marketing") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await asUser(user.id, (q) =>
    q.query(
      `update public.profiles set display_name = $1, display_currency = $2, timezone = $3, marketing_consent = $4, updated_at = now() where id = auth.uid()`,
      [parsed.data.displayName, parsed.data.currency, parsed.data.timezone, parsed.data.marketing],
    ),
  );
  return { ok: true };
}
