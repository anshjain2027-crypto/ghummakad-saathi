import { beforeAll, describe, expect, test } from "vitest";
import { asAnon, asService, asUser, one } from "@/lib/db";
import {
  moderatePlace,
  myPins,
  placeDetail,
  placesInBounds,
  reportContent,
  saveCustomPin,
  submitPublicPlace,
  upsertReview,
} from "@/lib/data/community";
import { fulfillOrder, recordPaymentEvent } from "@/lib/payments/orders";
import { latestEntitlement } from "@/lib/data/trips";

const world = { south: -90, west: -180, north: 90, east: 180 };
let alice = "";
let bob = "";
let admin = "";

async function makeUser(email: string) {
  const r = await asService((q) =>
    one<{ id: string }>(q, `insert into auth.users (email) values ($1) on conflict (email) do update set email = excluded.email returning id`, [email]),
  );
  return r!.id;
}

beforeAll(async () => {
  alice = await makeUser("alice@test.local");
  bob = await makeUser("bob@test.local");
  admin = await makeUser("admin@ghummakad.demo"); // seeded with the admin role
});

describe("private pins are enforced by the database", () => {
  test("only the owner can read a private pin, even via direct SQL", async () => {
    await saveCustomPin(alice, { name: "Secret swimming hole", lat: 31.61, lng: 77.44, note: "don't share" });
    expect((await myPins(alice)).map((p) => p.name)).toContain("Secret swimming hole");
    expect((await myPins(bob)).map((p) => p.name)).not.toContain("Secret swimming hole");
    const raw = await asUser(bob, (q) => q.query(`select * from public.private_saved_place`));
    expect(raw).toHaveLength(0);
    await expect(asAnon((q) => q.query(`select * from public.private_saved_place`))).rejects.toThrow(/permission denied/);
  });

  test("anonymous visitors cannot read the community map at all", async () => {
    await expect(asAnon((q) => q.query(`select * from public.place limit 1`))).rejects.toThrow(/permission denied/);
  });
});

describe("public pin moderation", () => {
  let placeId = "";
  test("pending submission is visible to its author only", async () => {
    placeId = await submitPublicPlace(alice, {
      name: "Quiet bend below the bridge",
      category: "lesser_known",
      description: "A calm stretch of river with flat rocks, a short walk downstream.",
      lat: 31.6221,
      lng: 77.4431,
    });
    expect((await placesInBounds(alice, world)).some((p) => p.id === placeId)).toBe(true);
    expect((await placesInBounds(bob, world)).some((p) => p.id === placeId)).toBe(false);
    expect(await placeDetail(bob, placeId)).toBeNull();
  });

  test("a user cannot self-approve via direct SQL", async () => {
    await asUser(alice, (q) => q.query(`update public.place set status = 'approved' where id = $1`, [placeId])).catch(() => undefined);
    const row = await asService((q) => one<{ status: string }>(q, `select status from public.place where id = $1`, [placeId]));
    expect(row!.status).toBe("pending");
  });

  test("after moderator approval everyone signed in sees it", async () => {
    await moderatePlace(admin, placeId, "approve");
    expect((await placesInBounds(bob, world)).some((p) => p.id === placeId)).toBe(true);
  });

  test("non-moderators cannot moderate", async () => {
    await expect(moderatePlace(bob, placeId, "reject")).rejects.toThrow(/Not authorised/);
  });

  test("spammy submissions are rejected before saving", async () => {
    await expect(
      submitPublicPlace(bob, { name: "Best deals", category: "stay", description: "Call +91 98765 43210 for cheap rooms today!!", lat: 31.6, lng: 77.4 }),
    ).rejects.toThrow(/phone numbers/);
  });

  test("reviews: own edits work, others' reviews cannot be changed", async () => {
    await upsertReview(alice, placeId, { rating: 5, worthGoing: "yes", comment: "Lovely in the morning." });
    await upsertReview(alice, placeId, { rating: 4, worthGoing: "depends", comment: "Lovely, but busy at weekends." });
    const detail = await placeDetail(bob, placeId);
    const review = detail!.reviews.find((r) => r.author === "alice")!;
    expect(review.rating).toBe(4);
    const changed = await asUser(bob, (q) => q.query(`update public.place_review set rating = 1 where id = $1 returning id`, [review.id]));
    expect(changed).toHaveLength(0);
    await reportContent(bob, { reviewId: review.id }, { reason: "inaccurate" });
    const reports = await asService((q) => q.query(`select * from public.review_report where review_id = $1`, [review.id]));
    expect(reports).toHaveLength(1);
  });
});

describe("payments and entitlements", () => {
  async function paidDraft(userId: string, travellers: number) {
    return asService(async (q) => {
      const draft = await one<{ id: string }>(
        q,
        `insert into public.trip_draft (owner_id, preferences, selected_destination_id) values ($1, $2, 'tirthan-valley') returning id`,
        [
          userId,
          JSON.stringify({ mood: "mountains", companion: "partner", travellers, style: "comfortable", pace: "balanced", origin: "New Delhi", days: 5, budgetInr: 40000 }),
        ],
      );
      const amount = travellers >= 5 ? 99900 : 49900;
      const order = await one<{ id: string }>(
        q,
        `insert into public.payment_order (user_id, draft_id, purpose, tier, travellers, amount_paise, provider, idempotency_key)
         values ($1, $2, 'trip_purchase', $3, $4, $5, 'mock', gen_random_uuid()::text) returning id`,
        [userId, draft!.id, travellers >= 5 ? "group" : "standard", travellers, amount],
      );
      return { draftId: draft!.id, orderId: order!.id, amount };
    });
  }

  test("duplicate webhook / return races create exactly one entitlement", async () => {
    const { orderId, amount } = await paidDraft(alice, 2);
    const evidence = { providerPaymentId: "pay_demo_1", paidAt: new Date("2026-11-01T10:00:00Z"), source: "webhook" as const, amountPaise: amount };
    const [a, b] = await Promise.all([fulfillOrder(orderId, evidence), fulfillOrder(orderId, { ...evidence, source: "return" })]);
    expect(a.tripId).toBe(b.tripId);
    expect([a.created, b.created].filter(Boolean)).toHaveLength(1);
    const ents = await asService((q) => q.query(`select * from public.trip_entitlement where trip_id = $1`, [a.tripId]));
    expect(ents).toHaveLength(1);
    const ent = await asService((q) => latestEntitlement(q, a.tripId, new Date("2026-11-16T10:00:00Z")));
    expect(ent!.editable).toBe(true);
    expect(ent!.editExpiresAt.toISOString()).toBe("2026-12-01T10:00:00.000Z");
  });

  test("a replayed provider event is recorded once", async () => {
    const e = { provider: "dodo", eventId: "evt_replay_1", orderId: null, type: "payment.succeeded", signatureValid: true, payload: {} };
    expect((await recordPaymentEvent(e)).duplicate).toBe(false);
    expect((await recordPaymentEvent(e)).duplicate).toBe(true);
  });

  test("amount tampering never grants access", async () => {
    const { orderId } = await paidDraft(bob, 6);
    await expect(
      fulfillOrder(orderId, { providerPaymentId: "pay_demo_2", paidAt: new Date(), source: "webhook", amountPaise: 49900 }),
    ).rejects.toThrow(/did not match/);
    const ents = await asService((q) =>
      q.query(`select e.* from public.trip_entitlement e join public.payment_order o on o.id = e.payment_order_id where o.id = $1`, [orderId]),
    );
    expect(ents).toHaveLength(0);
  });

  test("users cannot create entitlements or read others' trips", async () => {
    await expect(
      asUser(bob, (q) =>
        q.query(`insert into public.trip_entitlement (trip_id, user_id, payment_order_id, tier, paid_at, edit_expires_at)
                 select id, $1, gen_random_uuid(), 'group', now(), now() + interval '30 days' from public.trip_plan limit 1`, [bob]),
      ),
    ).rejects.toThrow(/permission denied/);
    const visible = await asUser(bob, (q) => q.query(`select * from public.trip_plan where owner_id <> $1`, [bob]));
    expect(visible).toHaveLength(0);
  });
});
