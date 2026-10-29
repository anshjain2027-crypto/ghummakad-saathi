"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { audit } from "@/lib/audit";
import { checkExternalUrl } from "@/lib/urls";
import { reverseClick } from "@/lib/sponsors";

export type AdminState = { ok?: boolean; error?: string; message?: string };

const PLACEMENTS = ["match_support", "destination_sidebar", "map_pin", "trip_module"] as const;

const BusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  serviceType: z.enum(["stay", "vehicle_rental", "activity", "agency"]),
  website: z.string().trim().max(300).optional(),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
});

export async function createBusinessAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireRole("admin");
  const v = BusinessSchema.safeParse(Object.fromEntries(form));
  if (!v.success) return { error: v.error.issues[0].message };
  if (v.data.website && !checkExternalUrl(v.data.website).ok) return { error: "Website must be a public https URL." };
  await asService(async (q) => {
    const r = await q.query<{ id: string }>(
      `insert into public.sponsor_business (name, service_type, website, contact_email) values ($1, $2, $3, $4) returning id`,
      [v.data.name, v.data.serviceType, v.data.website || null, v.data.contactEmail || null],
    );
    await audit(q, admin.id, "sponsor_business.create", "sponsor_business", r[0].id, { name: v.data.name });
  });
  revalidatePath("/admin/sponsors");
  return { ok: true, message: "Sponsor added." };
}

export async function setBusinessStatusAction(id: string, status: "active" | "suspended") {
  const admin = await requireRole("admin");
  await asService(async (q) => {
    await q.query(`update public.sponsor_business set status = $2 where id = $1`, [id, status]);
    await audit(q, admin.id, `sponsor_business.${status}`, "sponsor_business", id);
  });
  revalidatePath("/admin/sponsors");
}

const CampaignSchema = z.object({
  businessId: z.string().guid(),
  name: z.string().trim().min(2).max(120),
  placements: z.array(z.enum(PLACEMENTS)).min(1, "Choose at least one placement"),
  destinationIds: z.array(z.string().max(60)).max(30),
  countryCodes: z.array(z.string().length(2)).max(30),
  categories: z.array(z.string().max(30)).max(10),
  creativeTitle: z.string().trim().min(2).max(80),
  creativeBody: z.string().trim().min(10).max(220),
  targetUrl: z.string().trim().max(500),
  utmCampaign: z.string().trim().regex(/^[a-z0-9_-]{0,60}$/i).optional(),
  startAt: z.string().min(10),
  endAt: z.string().min(10),
  cpcInr: z.coerce.number().min(1).max(10_000),
  budgetInr: z.coerce.number().min(50).max(10_000_000),
  priority: z.coerce.number().int().min(0).max(100),
  mapLat: z.coerce.number().min(-90).max(90).optional(),
  mapLng: z.coerce.number().min(-180).max(180).optional(),
});

const list = (form: FormData, key: string) =>
  String(form.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function createCampaignAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireRole("admin");
  const raw = {
    businessId: form.get("businessId"),
    name: form.get("name"),
    placements: form.getAll("placements").map(String),
    destinationIds: list(form, "destinationIds"),
    countryCodes: list(form, "countryCodes").map((c) => c.toUpperCase()),
    categories: list(form, "categories"),
    creativeTitle: form.get("creativeTitle"),
    creativeBody: form.get("creativeBody"),
    targetUrl: form.get("targetUrl"),
    utmCampaign: String(form.get("utmCampaign") ?? "") || undefined,
    startAt: form.get("startAt"),
    endAt: form.get("endAt"),
    cpcInr: form.get("cpcInr"),
    budgetInr: form.get("budgetInr"),
    priority: form.get("priority") || 0,
    mapLat: form.get("mapLat") || undefined,
    mapLng: form.get("mapLng") || undefined,
  };
  const v = CampaignSchema.safeParse(raw);
  if (!v.success) return { error: v.error.issues[0].message };
  const url = checkExternalUrl(v.data.targetUrl);
  if (!url.ok) return { error: `Target URL rejected: ${url.reason}.` };
  const start = new Date(v.data.startAt);
  const end = new Date(v.data.endAt);
  if (!(end > start)) return { error: "End date must be after the start date." };
  await asService(async (q) => {
    const r = await q.query<{ id: string }>(
      `insert into public.sponsor_campaign (business_id, name, status, placements, destination_ids, country_codes, categories,
        creative_title, creative_body, target_url, utm_campaign, start_at, end_at, cpc_paise, budget_cap_paise, priority, map_lat, map_lng, created_by)
       values ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning id`,
      [
        v.data.businessId, v.data.name, v.data.placements, v.data.destinationIds, v.data.countryCodes, v.data.categories,
        v.data.creativeTitle, v.data.creativeBody, url.url.toString(), v.data.utmCampaign ?? null, start.toISOString(), end.toISOString(),
        Math.round(v.data.cpcInr * 100), Math.round(v.data.budgetInr * 100), v.data.priority, v.data.mapLat ?? null, v.data.mapLng ?? null, admin.id,
      ],
    );
    await audit(q, admin.id, "sponsor_campaign.create", "sponsor_campaign", r[0].id, { name: v.data.name });
  });
  revalidatePath("/admin/campaigns");
  return { ok: true, message: "Campaign created as a draft. Activate it when ready." };
}

export async function setCampaignStatusAction(id: string, status: "active" | "paused" | "ended" | "suspended") {
  const admin = await requireRole("admin");
  await asService(async (q) => {
    await q.query(`update public.sponsor_campaign set status = $2, updated_at = now() where id = $1`, [id, status]);
    await audit(q, admin.id, `sponsor_campaign.${status}`, "sponsor_campaign", id);
  });
  revalidatePath("/admin/campaigns");
}

export async function addBudgetAction(id: string, form: FormData) {
  const admin = await requireRole("admin");
  const inr = Number(form.get("addInr"));
  if (!Number.isFinite(inr) || inr <= 0 || inr > 10_000_000) return;
  await asService(async (q) => {
    await q.query(
      `update public.sponsor_campaign set budget_cap_paise = budget_cap_paise + $2,
         status = case when status = 'exhausted' then 'paused' else status end, updated_at = now() where id = $1`,
      [id, Math.round(inr * 100)],
    );
    await audit(q, admin.id, "sponsor_campaign.budget_added", "sponsor_campaign", id, { inr });
  });
  revalidatePath("/admin/campaigns");
}

export async function reverseClickAction(clickId: string, form: FormData) {
  const admin = await requireRole("admin");
  await reverseClick(clickId, admin.id, String(form.get("reason") ?? "invalid click").slice(0, 160));
  revalidatePath("/admin/campaigns");
}

export async function setProviderModeAction(provider: string, form: FormData) {
  const admin = await requireRole("admin");
  const mode = String(form.get("mode"));
  if (!["mock", "redirect", "sandbox_approved", "approved_api", "disabled"].includes(mode)) return;
  const notes = String(form.get("notes") ?? "").slice(0, 400);
  await asService(async (q) => {
    await q.query(
      `update public.provider_adapter_status set mode = $2, notes = coalesce(nullif($3, ''), notes), verified_at = current_date, updated_at = now() where provider = $1`,
      [provider, mode, notes],
    );
    await audit(q, admin.id, "provider_status.update", "provider_adapter_status", provider, { mode });
  });
  revalidatePath("/admin/provider-status");
}

export async function grantModeratorAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireRole("admin");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email." };
  const done = await asService(async (q) => {
    const u = await q.query<{ id: string }>(`select id from auth.users where lower(email) = $1`, [email]);
    if (!u[0]) return false;
    await q.query(`insert into public.user_roles (user_id, role) values ($1, 'moderator') on conflict do nothing`, [u[0].id]);
    await audit(q, admin.id, "role.grant_moderator", "user", u[0].id, { email });
    return true;
  });
  return done ? { ok: true, message: `${email} is now a moderator.` } : { error: "No account with that email yet — ask them to sign in once first." };
}

export type DodoSetupState = { ok?: boolean; error?: string; steps?: string[] };

export async function runDodoSetupAction(_prev: DodoSetupState): Promise<DodoSetupState> {
  const admin = await requireRole("admin");
  const { config } = await import("@/lib/config");
  const { runDodoSetup } = await import("@/lib/payments/dodo");
  const result = await runDodoSetup(`${config.appUrl}/api/payments/webhook`);
  await asService((q) =>
    audit(q, admin.id, "payments.dodo_setup", "app_setting", null, { ok: result.ok, steps: result.steps, error: result.error ?? null }),
  );
  revalidatePath("/admin/payments");
  return { ok: result.ok, error: result.error, steps: result.steps };
}
