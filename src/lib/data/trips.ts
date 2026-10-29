import "server-only";
import { asService, asUser, one, type Queryable } from "@/lib/db";
import { isEditable, daysRemaining, type Tier } from "@/lib/pricing";
import { PreferencesSchema, TripPlanSchema, type Preferences, type TripPlan } from "@/lib/planner/schema";

export type Entitlement = { id: string; tier: Tier; paidAt: Date; editExpiresAt: Date; editable: boolean; daysRemaining: number };

export type TripSummary = {
  id: string;
  ownerId: string;
  destinationId: string;
  destinationName: string;
  preferences: Preferences;
  travellers: number;
  currentVersion: number;
  createdAt: Date;
  entitlement: Entitlement | null;
};

export type TripVersion = { version: number; destinationId: string; plan: TripPlan; changeSummary: string; generator: string; createdAt: Date };

const parse = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);

export async function latestEntitlement(q: Queryable, tripId: string, now = new Date()): Promise<Entitlement | null> {
  const row = await one<{ id: string; tier: Tier; paid_at: Date; edit_expires_at: Date }>(
    q,
    `select id, tier, paid_at, edit_expires_at from public.trip_entitlement
     where trip_id = $1 order by edit_expires_at desc, (tier = 'group') desc, created_at desc limit 1`,
    [tripId],
  );
  if (!row) return null;
  const expires = new Date(row.edit_expires_at);
  return { id: row.id, tier: row.tier, paidAt: new Date(row.paid_at), editExpiresAt: expires, editable: isEditable(expires, now), daysRemaining: daysRemaining(expires, now) };
}

type TripRow = {
  id: string; owner_id: string; destination_id: string; destination_name: string; preferences: unknown;
  travellers: number; current_version: number; created_at: Date;
};

const TRIP_SELECT = `select t.id, t.owner_id, t.destination_id, d.name as destination_name, t.preferences, t.travellers,
  t.current_version, t.created_at from public.trip_plan t join public.destination d on d.id = t.destination_id`;

async function toSummary(q: Queryable, r: TripRow): Promise<TripSummary> {
  return {
    id: r.id,
    ownerId: r.owner_id,
    destinationId: r.destination_id,
    destinationName: r.destination_name,
    preferences: PreferencesSchema.parse(parse(r.preferences)),
    travellers: r.travellers,
    currentVersion: r.current_version,
    createdAt: new Date(r.created_at),
    entitlement: await latestEntitlement(q, r.id),
  };
}

/** Reads go through RLS as the user: a trip is only visible to its owner. */
export async function getTrip(userId: string, tripId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return null;
  return asUser(userId, async (q) => {
    const row = await one<TripRow>(q, `${TRIP_SELECT} where t.id = $1`, [tripId]);
    if (!row) return null;
    const summary = await toSummary(q, row);
    const versions = await q.query<{ version: number; destination_id: string; plan: unknown; change_summary: string; generator: string; created_at: Date }>(
      `select version, destination_id, plan, change_summary, generator, created_at from public.trip_edit_history
       where trip_id = $1 order by version desc`,
      [tripId],
    );
    const bookings = await q.query<{ item_key: string; status: string; note: string | null }>(
      `select item_key, status, note from public.trip_self_booking where trip_id = $1`,
      [tripId],
    );
    return {
      trip: summary,
      versions: versions.map<TripVersion>((v) => ({
        version: v.version,
        destinationId: v.destination_id,
        plan: TripPlanSchema.parse(parse(v.plan)),
        changeSummary: v.change_summary,
        generator: v.generator,
        createdAt: new Date(v.created_at),
      })),
      selfBookings: Object.fromEntries(bookings.map((b) => [b.item_key, b])),
    };
  });
}

export async function listTrips(userId: string): Promise<TripSummary[]> {
  return asUser(userId, async (q) => {
    const rows = await q.query<TripRow>(`${TRIP_SELECT} order by t.created_at desc`);
    const out: TripSummary[] = [];
    for (const r of rows) out.push(await toSummary(q, r));
    return out;
  });
}

export class EntitlementError extends Error {
  constructor(public readonly code: "not_found" | "expired" | "unpaid" | "tier", message: string) {
    super(message);
  }
}

/**
 * Server-side permission check run on EVERY trip update and AI generation.
 * Ownership + an active 30-day entitlement. Expiry authority is UTC.
 */
export async function assertEditable(q: Queryable, userId: string, tripId: string, now = new Date()) {
  const trip = await one<TripRow>(q, `${TRIP_SELECT} where t.id = $1 and t.owner_id = $2 for update of t`, [tripId, userId]);
  if (!trip) throw new EntitlementError("not_found", "Trip not found.");
  const ent = await latestEntitlement(q, tripId, now);
  if (!ent) throw new EntitlementError("unpaid", "This trip hasn't been unlocked yet.");
  if (!ent.editable) throw new EntitlementError("expired", "Your 30-day editing period has ended. Your saved trip is still here.");
  return { trip: await toSummary(q, trip), entitlement: ent };
}

export async function appendVersion(
  q: Queryable,
  args: { tripId: string; userId: string; plan: TripPlan; prefs: Preferences; summary: string; generator: string },
): Promise<number> {
  const plan = TripPlanSchema.parse(args.plan);
  const row = await one<{ v: number }>(
    q,
    `update public.trip_plan set current_version = current_version + 1, destination_id = $2, preferences = $3, travellers = $4,
       updated_at = now() where id = $1 returning current_version as v`,
    [args.tripId, plan.destinationId, JSON.stringify(args.prefs), args.prefs.travellers],
  );
  await q.query(
    `insert into public.trip_edit_history (trip_id, version, destination_id, plan, change_summary, generator, created_by)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [args.tripId, row!.v, plan.destinationId, JSON.stringify(plan), args.summary.slice(0, 200), args.generator, args.userId],
  );
  return row!.v;
}

export async function setSelfBooking(userId: string, tripId: string, itemKey: string, booked: boolean) {
  return asService(async (q) => {
    const owned = await one(q, `select 1 from public.trip_plan where id = $1 and owner_id = $2`, [tripId, userId]);
    if (!owned) throw new EntitlementError("not_found", "Trip not found.");
    await q.query(
      `insert into public.trip_self_booking (trip_id, item_key, status) values ($1, $2, $3)
       on conflict (trip_id, item_key) do update set status = excluded.status, updated_at = now()`,
      [tripId, itemKey.slice(0, 120), booked ? "self_reported_booked" : "not_booked"],
    );
  });
}
