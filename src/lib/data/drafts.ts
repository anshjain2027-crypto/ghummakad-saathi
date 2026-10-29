import "server-only";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { asService, one } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import type { SessionUser } from "@/lib/auth";
import { PreferencesSchema, type Preferences } from "@/lib/planner/schema";
import type { Match } from "@/lib/planner/types";

const DRAFT_COOKIE = "gs_draft";

export type Draft = {
  id: string;
  ownerId: string | null;
  preferences: Preferences;
  selectedDestinationId: string | null;
};

export type StoredMatch = {
  destinationId: string;
  rank: number;
  score: number;
  reasons: Match["reasons"];
  estimate: Match["estimate"] & { seasonCaveat: string | null; suggestedDays: number; closest: boolean };
};

type DraftRow = { id: string; owner_id: string | null; preferences: unknown; selected_destination_id: string | null };

function toDraft(r: DraftRow): Draft {
  const prefs = typeof r.preferences === "string" ? JSON.parse(r.preferences) : r.preferences;
  return { id: r.id, ownerId: r.owner_id, preferences: PreferencesSchema.parse(prefs), selectedDestinationId: r.selected_destination_id };
}

async function anonTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(DRAFT_COOKIE)?.value;
  return token ? sha256(`draft:${token}`) : null;
}

/**
 * The visitor's current draft. Drafts are keyed by account when signed in,
 * otherwise by a hashed httpOnly cookie — never by an id in the URL.
 * Signing in claims the anonymous draft.
 */
export async function currentDraft(user: SessionUser | null): Promise<Draft | null> {
  const tokenHash = await anonTokenHash();
  return asService(async (q) => {
    if (user && tokenHash) {
      await q.query(
        `update public.trip_draft set owner_id = $1, updated_at = now()
         where anon_token_hash = $2 and owner_id is null and expires_at > now()`,
        [user.id, tokenHash],
      );
    }
    const row = user
      ? await one<DraftRow>(
          q,
          `select id, owner_id, preferences, selected_destination_id from public.trip_draft
           where owner_id = $1 and expires_at > now()
             and not exists (select 1 from public.trip_plan t where t.draft_id = trip_draft.id)
           order by updated_at desc limit 1`,
          [user.id],
        )
      : tokenHash
        ? await one<DraftRow>(
            q,
            `select id, owner_id, preferences, selected_destination_id from public.trip_draft
             where anon_token_hash = $1 and owner_id is null and expires_at > now()
             order by updated_at desc limit 1`,
            [tokenHash],
          )
        : undefined;
    return row ? toDraft(row) : null;
  });
}

/** Must be called from a Server Action or Route Handler (may set a cookie). */
export async function saveDraft(user: SessionUser | null, prefs: Preferences): Promise<Draft> {
  const parsed = PreferencesSchema.parse(prefs);
  const existing = await currentDraft(user);
  let tokenHash: string | null = null;
  if (!user) {
    const store = await cookies();
    let token = store.get(DRAFT_COOKIE)?.value;
    if (!token || !existing) {
      token = randomToken();
      store.set(DRAFT_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: config.isProd, path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
    tokenHash = sha256(`draft:${token}`);
  }
  return asService(async (q) => {
    const row = existing
      ? await one<DraftRow>(
          q,
          `update public.trip_draft set preferences = $2, selected_destination_id = null, updated_at = now(),
             expires_at = now() + interval '7 days'
           where id = $1 returning id, owner_id, preferences, selected_destination_id`,
          [existing.id, JSON.stringify(parsed)],
        )
      : await one<DraftRow>(
          q,
          `insert into public.trip_draft (owner_id, anon_token_hash, preferences) values ($1, $2, $3)
           returning id, owner_id, preferences, selected_destination_id`,
          [user?.id ?? null, tokenHash, JSON.stringify(parsed)],
        );
    return toDraft(row!);
  });
}

export async function saveMatches(draftId: string, matches: Match[]): Promise<void> {
  await asService(async (q) => {
    await q.query(`delete from public.destination_match where draft_id = $1`, [draftId]);
    for (const [i, m] of matches.entries()) {
      await q.query(
        `insert into public.destination_match (draft_id, destination_id, rank, organic_recommendation_score, reasons, estimate)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          draftId,
          m.destination.id,
          i + 1,
          m.score,
          JSON.stringify(m.reasons),
          JSON.stringify({ ...m.estimate, seasonCaveat: m.seasonCaveat, suggestedDays: m.suggestedDays, closest: m.closest }),
        ],
      );
    }
  });
}

export async function draftMatches(draftId: string): Promise<StoredMatch[]> {
  const rows = await asService((q) =>
    q.query<{ destination_id: string; rank: number; score: string | number; reasons: unknown; estimate: unknown }>(
      `select destination_id, rank, organic_recommendation_score::float8 as score, reasons, estimate
       from public.destination_match where draft_id = $1 order by rank`,
      [draftId],
    ),
  );
  const parse = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return rows.map((r) => ({
    destinationId: r.destination_id,
    rank: r.rank,
    score: Number(r.score),
    reasons: parse(r.reasons) as StoredMatch["reasons"],
    estimate: parse(r.estimate) as StoredMatch["estimate"],
  }));
}

export async function selectDraftDestination(draftId: string, destinationId: string): Promise<void> {
  await asService((q) =>
    q.query(`update public.trip_draft set selected_destination_id = $2, updated_at = now() where id = $1`, [draftId, destinationId]),
  );
}
