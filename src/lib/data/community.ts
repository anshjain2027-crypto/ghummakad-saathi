import "server-only";
import { z } from "zod";
import { asService, asUser, one } from "@/lib/db";
import { rateLimit, RateLimitedError } from "@/lib/ratelimit";
import { audit } from "@/lib/audit";
import { PLACE_CATEGORIES } from "@/lib/domain";

const categoryIds = PLACE_CATEGORIES.map((c) => c.id) as [string, ...string[]];

export type MapPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  source: "curated" | "community";
  status: "pending" | "approved" | "rejected";
  mine: boolean;
  hiddenGem: boolean;
  avgRating: number | null;
  reviewCount: number;
  destinationId: string | null;
};

export type Bounds = { south: number; west: number; north: number; east: number };

export const BoundsSchema = z.object({
  south: z.coerce.number().min(-90).max(90),
  west: z.coerce.number().min(-180).max(180),
  north: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
});

/** Viewport search through RLS: approved places + the user's own submissions only. */
export async function placesInBounds(userId: string, b: Bounds, category?: string, query?: string): Promise<MapPlace[]> {
  const crossesDateline = b.west > b.east;
  return asUser(userId, (q) =>
    q.query<MapPlace>(
      `select p.id, p.name, p.category, p.lat::float8 as lat, p.lng::float8 as lng, p.source, p.status,
              (p.created_by = auth.uid()) as mine, p.hidden_gem as "hiddenGem", p.destination_id as "destinationId",
              (select round(avg(r.rating)::numeric, 1)::float8 from public.place_review r where r.place_id = p.id and r.status = 'published') as "avgRating",
              (select count(*)::int from public.place_review r where r.place_id = p.id and r.status = 'published') as "reviewCount"
       from public.place p
       where p.lat between $1 and $2
         and (${crossesDateline ? "p.lng >= $3 or p.lng <= $4" : "p.lng between $3 and $4"})
         and ($5::text is null or p.category = $5)
         and ($6::text is null or p.name ilike '%' || $6 || '%')
         and p.status <> 'rejected'
       order by p.hidden_gem desc, p.name
       limit 400`,
      [b.south, b.north, b.west, b.east, category ?? null, query?.trim() ? query.trim().slice(0, 60) : null],
    ),
  );
}

export type PlaceDetail = MapPlace & {
  description: string;
  createdAt: Date;
  rejectionReason: string | null;
  saved: boolean;
  reviews: {
    id: string;
    rating: number;
    comment: string;
    worthGoing: "yes" | "depends" | "no";
    author: string;
    mine: boolean;
    isDemo: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  googlePlaceId: string | null;
};

export async function placeDetail(userId: string, placeId: string): Promise<PlaceDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(placeId)) return null;
  return asUser(userId, async (q) => {
    const p = await one<Omit<PlaceDetail, "reviews" | "saved" | "googlePlaceId">>(
      q,
      `select p.id, p.name, p.category, p.lat::float8 as lat, p.lng::float8 as lng, p.source, p.status, p.description,
              p.created_at as "createdAt", p.rejection_reason as "rejectionReason", (p.created_by = auth.uid()) as mine,
              p.hidden_gem as "hiddenGem", p.destination_id as "destinationId",
              (select round(avg(r.rating)::numeric, 1)::float8 from public.place_review r where r.place_id = p.id and r.status = 'published') as "avgRating",
              (select count(*)::int from public.place_review r where r.place_id = p.id and r.status = 'published') as "reviewCount"
       from public.place p where p.id = $1`,
      [placeId],
    );
    if (!p) return null;
    const reviews = await q.query<PlaceDetail["reviews"][number]>(
      `select r.id, r.rating, r.comment, r.worth_going as "worthGoing", coalesce(pr.display_name, 'Explorer') as author,
              (r.user_id = auth.uid()) as mine, r.is_demo as "isDemo", r.created_at as "createdAt", r.updated_at as "updatedAt"
       from public.place_review r left join public.profiles pr on pr.id = r.user_id
       where r.place_id = $1 and r.status = 'published'
       order by (r.user_id = auth.uid()) desc, r.created_at desc limit 100`,
      [placeId],
    );
    const saved = !!(await one(q, `select 1 from public.private_saved_place where place_id = $1`, [placeId]));
    const ref = await one<{ external_id: string }>(
      q,
      `select external_id from public.place_external_reference where place_id = $1 and provider = 'google'`,
      [placeId],
    );
    return { ...p, reviews, saved, googlePlaceId: ref?.external_id ?? null };
  });
}

// ───────────── Private pins ─────────────

export const CustomPinSchema = z.object({
  name: z.string().trim().min(1).max(120),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  note: z.string().trim().max(500).optional(),
});

export async function savePlacePrivately(userId: string, placeId: string, note?: string) {
  if (!(await rateLimit(`save:${userId}`, 60, 3600))) throw new RateLimitedError();
  await asUser(userId, (q) =>
    q.query(
      `insert into public.private_saved_place (user_id, place_id, note) select auth.uid(), id, $2 from public.place where id = $1
       on conflict (user_id, place_id) where place_id is not null do update set note = excluded.note`,
      [placeId, note ?? null],
    ),
  );
}

export async function unsavePlace(userId: string, placeId: string) {
  await asUser(userId, (q) => q.query(`delete from public.private_saved_place where place_id = $1`, [placeId]));
}

export async function saveCustomPin(userId: string, input: z.infer<typeof CustomPinSchema>) {
  if (!(await rateLimit(`save:${userId}`, 60, 3600))) throw new RateLimitedError();
  const v = CustomPinSchema.parse(input);
  await asUser(userId, (q) =>
    q.query(
      `insert into public.private_saved_place (user_id, custom_name, lat, lng, note) values (auth.uid(), $1, $2, $3, $4)`,
      [v.name, v.lat, v.lng, v.note ?? null],
    ),
  );
}

export async function deletePrivatePin(userId: string, pinId: string) {
  await asUser(userId, (q) => q.query(`delete from public.private_saved_place where id = $1`, [pinId]));
}

export type PrivatePin = { id: string; placeId: string | null; name: string; lat: number; lng: number; note: string | null; category: string | null; createdAt: Date };

export async function myPins(userId: string): Promise<PrivatePin[]> {
  return asUser(userId, (q) =>
    q.query<PrivatePin>(
      `select s.id, s.place_id as "placeId", coalesce(p.name, s.custom_name) as name,
              coalesce(p.lat, s.lat)::float8 as lat, coalesce(p.lng, s.lng)::float8 as lng, s.note, p.category, s.created_at as "createdAt"
       from public.private_saved_place s left join public.place p on p.id = s.place_id
       order by s.created_at desc`,
    ),
  );
}

// ───────────── Public submissions ─────────────

export const SubmissionSchema = z.object({
  name: z.string().trim().min(2, "Give the place a name").max(120),
  category: z.enum(categoryIds),
  description: z.string().trim().min(20, "Add a short description (20+ characters) so others know why it's worth going").max(1200),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  googlePlaceId: z.string().regex(/^[A-Za-z0-9_-]{10,300}$/).optional(),
});

const LINK = /(https?:\/\/|www\.|\.com\b|\.in\b|wa\.me|t\.me|bit\.ly)/i;
const PHONE = /(\+?\d[\d\s-]{8,}\d)/;

export function spamSignals(text: string): string | null {
  if (LINK.test(text)) return "Please don't include links in community posts.";
  if (PHONE.test(text)) return "Please don't include phone numbers — community posts can't be used for promotion.";
  if (/(.)\1{7,}/.test(text)) return "That looks like repeated characters. Please write a real description.";
  return null;
}

export async function submitPublicPlace(userId: string, input: z.infer<typeof SubmissionSchema>) {
  const v = SubmissionSchema.parse(input);
  const spam = spamSignals(`${v.name} ${v.description}`);
  if (spam) throw new Error(spam);
  if (!(await rateLimit(`submit:${userId}`, 5, 86400))) throw new RateLimitedError("You can submit up to 5 places a day. Try again tomorrow.");
  return asUser(userId, async (q) => {
    const row = await one<{ id: string }>(
      q,
      `insert into public.place (name, category, description, lat, lng, source, status, created_by, coords_source, coords_cached_at)
       values ($1, $2, $3, $4, $5, 'community', 'pending', auth.uid(), $6, $7) returning id`,
      [v.name, v.category, v.description, v.lat, v.lng, v.googlePlaceId ? "google" : "first_party", v.googlePlaceId ? new Date().toISOString() : null],
    );
    if (v.googlePlaceId) {
      await q.query(
        `insert into public.place_external_reference (place_id, provider, external_id) values ($1, 'google', $2) on conflict do nothing`,
        [row!.id, v.googlePlaceId],
      );
    }
    return row!.id;
  });
}

export async function updateOwnSubmission(userId: string, placeId: string, input: z.infer<typeof SubmissionSchema>) {
  const v = SubmissionSchema.parse(input);
  const spam = spamSignals(`${v.name} ${v.description}`);
  if (spam) throw new Error(spam);
  await asUser(userId, (q) =>
    q.query(
      `update public.place set name = $2, category = $3, description = $4, lat = $5, lng = $6, updated_at = now() where id = $1`,
      [placeId, v.name, v.category, v.description, v.lat, v.lng],
    ),
  );
  // Edits to a rejected submission send it back for review (server-side, after the RLS-checked edit).
  await asService((q) =>
    q.query(
      `update public.place set status = 'pending', rejection_reason = null where id = $1 and created_by = $2 and status = 'rejected'`,
      [placeId, userId],
    ),
  );
}

export async function deleteOwnSubmission(userId: string, placeId: string) {
  await asUser(userId, (q) => q.query(`delete from public.place where id = $1`, [placeId]));
}

export async function mySubmissions(userId: string) {
  return asUser(userId, (q) =>
    q.query<{ id: string; name: string; category: string; status: string; rejectionReason: string | null; createdAt: Date }>(
      `select id, name, category, status, rejection_reason as "rejectionReason", created_at as "createdAt"
       from public.place where created_by = auth.uid() order by created_at desc`,
    ),
  );
}

// ───────────── Reviews ─────────────

export const ReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  worthGoing: z.enum(["yes", "depends", "no"]),
  comment: z.string().trim().max(1500).default(""),
});

export async function upsertReview(userId: string, placeId: string, input: z.infer<typeof ReviewSchema>) {
  const v = ReviewSchema.parse(input);
  const spam = v.comment ? spamSignals(v.comment) : null;
  if (spam) throw new Error(spam);
  if (!(await rateLimit(`review:${userId}`, 20, 86400))) throw new RateLimitedError("You've posted a lot of reviews today. Please try again tomorrow.");
  await asUser(userId, async (q) => {
    const own = await one<{ id: string; status: string }>(q, `select id, status from public.place_review where place_id = $1 and user_id = auth.uid()`, [placeId]);
    if (own) {
      await q.query(
        `update public.place_review set rating = $2, worth_going = $3, comment = $4, updated_at = now() where id = $1`,
        [own.id, v.rating, v.worthGoing, v.comment],
      );
    } else {
      await q.query(
        `insert into public.place_review (place_id, user_id, rating, worth_going, comment) values ($1, auth.uid(), $2, $3, $4)`,
        [placeId, v.rating, v.worthGoing, v.comment],
      );
    }
  });
}

export async function deleteOwnReview(userId: string, reviewId: string) {
  await asUser(userId, (q) => q.query(`delete from public.place_review where id = $1`, [reviewId]));
}

export async function myReviews(userId: string) {
  return asUser(userId, (q) =>
    q.query<{ id: string; placeId: string; placeName: string; rating: number; worthGoing: string; comment: string; status: string; updatedAt: Date }>(
      `select r.id, r.place_id as "placeId", p.name as "placeName", r.rating, r.worth_going as "worthGoing", r.comment, r.status,
              r.updated_at as "updatedAt"
       from public.place_review r join public.place p on p.id = r.place_id
       where r.user_id = auth.uid() order by r.updated_at desc`,
    ),
  );
}

export const ReportSchema = z.object({
  reason: z.enum(["inaccurate", "abusive", "spam", "self_promotion", "unsafe", "other"]),
  details: z.string().trim().max(500).optional(),
});

export async function reportContent(userId: string, target: { reviewId?: string; placeId?: string }, input: z.infer<typeof ReportSchema>) {
  const v = ReportSchema.parse(input);
  if (!(await rateLimit(`report:${userId}`, 20, 86400))) throw new RateLimitedError();
  await asUser(userId, (q) =>
    q.query(
      `insert into public.review_report (review_id, place_id, reporter_id, reason, details) values ($1, $2, auth.uid(), $3, $4)
       on conflict do nothing`,
      [target.reviewId ?? null, target.reviewId ? null : (target.placeId ?? null), v.reason, v.details ?? null],
    ),
  );
}

// ───────────── Moderation (moderator role checked by caller AND re-checked here) ─────────────

async function assertModerator(userId: string) {
  const ok = await asService((q) =>
    one(q, `select 1 from public.user_roles where user_id = $1 and role in ('moderator', 'admin')`, [userId]),
  );
  if (!ok) throw new Error("Not authorised");
}

export async function moderatePlace(moderatorId: string, placeId: string, decision: "approve" | "reject", reason?: string) {
  await assertModerator(moderatorId);
  await asService(async (q) => {
    await q.query(
      `update public.place set status = $2, rejection_reason = $3, updated_at = now() where id = $1 and source = 'community'`,
      [placeId, decision === "approve" ? "approved" : "rejected", decision === "reject" ? (reason ?? "Doesn't meet the community guidelines").slice(0, 300) : null],
    );
    await q.query(
      `insert into public.moderation_action (moderator_id, target_type, target_id, action, reason) values ($1, 'place', $2, $3, $4)`,
      [moderatorId, placeId, decision, reason ?? null],
    );
    await audit(q, moderatorId, `place.${decision}`, "place", placeId, { reason });
  });
}

export async function resolveReport(moderatorId: string, reportId: string, decision: "upheld" | "dismissed") {
  await assertModerator(moderatorId);
  await asService(async (q) => {
    const r = await one<{ review_id: string | null; place_id: string | null }>(
      q,
      `update public.review_report set status = $2, resolved_by = $3, resolved_at = now() where id = $1 and status = 'open'
       returning review_id, place_id`,
      [reportId, decision, moderatorId],
    );
    if (r && decision === "upheld") {
      if (r.review_id) await q.query(`update public.place_review set status = 'hidden' where id = $1`, [r.review_id]);
      if (r.place_id) await q.query(`update public.place set status = 'rejected', rejection_reason = 'Removed after a community report' where id = $1 and source = 'community'`, [r.place_id]);
    }
    await q.query(
      `insert into public.moderation_action (moderator_id, target_type, target_id, action) values ($1, 'report', $2, $3)`,
      [moderatorId, reportId, decision],
    );
    await audit(q, moderatorId, `report.${decision}`, "review_report", reportId);
  });
}

export async function moderationQueue() {
  return asService(async (q) => ({
    pending: await q.query<{ id: string; name: string; category: string; description: string; lat: number; lng: number; author: string; createdAt: Date }>(
      `select p.id, p.name, p.category, p.description, p.lat::float8 as lat, p.lng::float8 as lng, coalesce(pr.display_name, 'Explorer') as author,
              p.created_at as "createdAt"
       from public.place p left join public.profiles pr on pr.id = p.created_by
       where p.status = 'pending' and p.source = 'community' order by p.created_at`,
    ),
    reports: await q.query<{ id: string; reason: string; details: string | null; reviewId: string | null; placeId: string | null; target: string; createdAt: Date }>(
      `select rr.id, rr.reason, rr.details, rr.review_id as "reviewId", coalesce(rr.place_id, rv.place_id) as "placeId",
              coalesce(left(rv.comment, 160), pl.name, 'Content') as target, rr.created_at as "createdAt"
       from public.review_report rr
       left join public.place_review rv on rv.id = rr.review_id
       left join public.place pl on pl.id = rr.place_id
       where rr.status = 'open' order by rr.created_at`,
    ),
  }));
}
