import "server-only";
import { asService, one } from "@/lib/db";
import { signToken, verifyToken } from "@/lib/crypto";
import { checkExternalUrl, withUtm } from "@/lib/urls";
import { audit } from "@/lib/audit";

/**
 * CPC sponsorship. Kept in a separate pipeline from organic recommendations:
 * nothing here reads or writes organic_recommendation_score, and sponsored
 * results are returned in their own array for their own labelled UI slot.
 */

export type PlacementId = "match_support" | "destination_sidebar" | "map_pin" | "trip_module";

export type SponsoredItem = {
  campaignId: string;
  placement: PlacementId;
  contextKey: string;
  advertiser: string;
  serviceType: string;
  title: string;
  body: string;
  imageUrl: string | null;
  whyShown: string;
  isDemo: boolean;
  clickToken: string;
  impressionToken: string;
  lat: number | null;
  lng: number | null;
};

type CampaignRow = {
  id: string; name: string; business_name: string; service_type: string; creative_title: string; creative_body: string;
  creative_image_url: string | null; destination_ids: string[]; country_codes: string[]; categories: string[];
  is_demo: boolean; map_lat: number | null; map_lng: number | null;
};

/** Campaigns that may be shown AND billed right now. */
const BILLABLE_WHERE = `c.status = 'active' and b.status = 'active' and now() >= c.start_at and now() < c.end_at
  and c.spent_paise + c.cpc_paise <= c.budget_cap_paise`;

export async function sponsoredFor(args: {
  placement: PlacementId;
  destinationId?: string;
  countryCode?: string;
  category?: string;
  limit?: number;
}): Promise<SponsoredItem[]> {
  const rows = await asService((q) =>
    q.query<CampaignRow & { max_slots: number }>(
      `select c.id, c.name, b.name as business_name, b.service_type, c.creative_title, c.creative_body, c.creative_image_url,
              c.destination_ids, c.country_codes, c.categories, c.is_demo, c.map_lat, c.map_lng, p.max_slots
       from public.sponsor_campaign c
       join public.sponsor_business b on b.id = c.business_id
       join public.sponsor_placement p on p.id = $1
       where ${BILLABLE_WHERE} and $1 = any(c.placements)
         and (cardinality(c.destination_ids) = 0 or $2::text = any(c.destination_ids))
         and (cardinality(c.country_codes) = 0 or $3::text = any(c.country_codes))
         and (cardinality(c.categories) = 0 or $4::text is null or $4::text = any(c.categories))
       order by c.priority desc, c.created_at asc
       limit 5`,
      [args.placement, args.destinationId ?? null, args.countryCode ?? null, args.category ?? null],
    ),
  );
  const max = Math.min(args.limit ?? rows[0]?.max_slots ?? 1, rows[0]?.max_slots ?? 1);
  const contextKey = `${args.placement}:${args.destinationId ?? args.countryCode ?? "global"}`;
  const ts = Date.now();
  return rows.slice(0, max).map((r) => ({
    campaignId: r.id,
    placement: args.placement,
    contextKey,
    advertiser: r.business_name,
    serviceType: r.service_type.replace("_", " "),
    title: r.creative_title,
    body: r.creative_body,
    imageUrl: r.creative_image_url,
    whyShown: r.destination_ids.length
      ? "Shown because it serves the destination you're looking at."
      : r.categories.length
        ? `Shown for ${r.categories.join(", ")} in this area.`
        : "Shown in this area.",
    isDemo: r.is_demo,
    clickToken: signToken({ c: r.id, p: args.placement, k: contextKey, t: ts }, "sponsor-click"),
    impressionToken: signToken({ c: r.id, p: args.placement, k: contextKey, t: ts }, "sponsor-impression"),
    lat: r.map_lat === null ? null : Number(r.map_lat),
    lng: r.map_lng === null ? null : Number(r.map_lng),
  }));
}

type TokenBody = { c: string; p: PlacementId; k: string; t: number };
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const DEDUPE_WINDOW = "30 minutes";
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|curl|wget|python-requests|httpclient|monitor/i;

export async function recordImpression(token: string, sessionHash: string): Promise<boolean> {
  const t = verifyToken<TokenBody>(token, "sponsor-impression");
  if (!t || Date.now() - t.t > TOKEN_TTL_MS) return false;
  await asService((q) =>
    q.query(
      `insert into public.sponsor_impression (campaign_id, placement, context_key, session_hash) values ($1, $2, $3, $4)
       on conflict do nothing`,
      [t.c, t.p, t.k, sessionHash],
    ),
  );
  return true;
}

export type ClickOutcome = { redirect: string | null; billable: boolean; reason: string | null };

/**
 * Signed click → validated redirect. Every click is logged; only valid ones
 * are billable. Exhausted budgets pause the campaign automatically.
 */
export async function recordClick(token: string, sessionHash: string, userAgent: string): Promise<ClickOutcome> {
  const t = verifyToken<TokenBody>(token, "sponsor-click");
  if (!t) return { redirect: null, billable: false, reason: "invalid_token" };

  return asService(async (q) => {
    const c = await one<{ id: string; target_url: string; utm_campaign: string | null; cpc_paise: number; billable: boolean }>(
      q,
      `select c.id, c.target_url, c.utm_campaign, c.cpc_paise, (${BILLABLE_WHERE}) as billable
       from public.sponsor_campaign c join public.sponsor_business b on b.id = c.business_id
       where c.id = $1 for update of c`,
      [t.c],
    );
    if (!c) return { redirect: null, billable: false, reason: "unknown_campaign" };

    const urlCheck = checkExternalUrl(c.target_url);
    const target = urlCheck.ok ? withUtm(urlCheck.url, c.utm_campaign ?? `gs_${c.id.slice(0, 8)}`, "ghummakad_saathi", "cpc").toString() : null;

    let reason: string | null = null;
    if (!c.billable) reason = "campaign_not_billable";
    else if (Date.now() - t.t > TOKEN_TTL_MS) reason = "expired_token";
    else if (!userAgent || BOT_UA.test(userAgent)) reason = "bot_filtered";
    else {
      const dup = await one(
        q,
        `select 1 from public.sponsor_click where campaign_id = $1 and session_hash = $2
           and created_at > now() - interval '${DEDUPE_WINDOW}' limit 1`,
        [c.id, sessionHash],
      );
      if (dup) reason = "duplicate";
    }
    if (!target) reason = reason ?? "unsafe_target";

    const billable = reason === null;
    await q.query(
      `insert into public.sponsor_click (campaign_id, placement, context_key, session_hash, billable, invalid_reason, cost_paise)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [c.id, t.p, t.k, sessionHash, billable, reason, billable ? c.cpc_paise : 0],
    );
    if (billable) {
      await q.query(
        `update public.sponsor_campaign set spent_paise = spent_paise + cpc_paise,
           status = case when spent_paise + 2 * cpc_paise > budget_cap_paise then 'exhausted' else status end,
           updated_at = now() where id = $1`,
        [c.id],
      );
    }
    return { redirect: target, billable, reason };
  });
}

/** Admin: reverse an invalid click (dispute process). Restores spend and audits. */
export async function reverseClick(clickId: string, adminId: string, reason: string) {
  return asService(async (q) => {
    const click = await one<{ id: string; campaign_id: string; cost_paise: number; billable: boolean; reversed_at: Date | null }>(
      q,
      `select id, campaign_id, cost_paise, billable, reversed_at from public.sponsor_click where id = $1 for update`,
      [clickId],
    );
    if (!click || !click.billable || click.reversed_at) return false;
    await q.query(
      `update public.sponsor_click set billable = false, disputed = true, invalid_reason = $2, reversed_at = now(), reversed_by = $3 where id = $1`,
      [clickId, `reversed: ${reason}`.slice(0, 200), adminId],
    );
    await q.query(
      `update public.sponsor_campaign set spent_paise = greatest(0, spent_paise - $2),
         status = case when status = 'exhausted' then 'paused' else status end, updated_at = now() where id = $1`,
      [click.campaign_id, click.cost_paise],
    );
    await audit(q, adminId, "sponsor.click_reversed", "sponsor_click", clickId, { reason, cost_paise: click.cost_paise });
    return true;
  });
}
