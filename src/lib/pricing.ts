/**
 * Locked commercial rules (product owner decision, 13 Oct 2026).
 * Client-safe: the same functions render prices and the server uses them to
 * create orders, so the displayed amount and the charged amount cannot drift.
 */

export const GROUP_THRESHOLD = 5;
export const EDIT_WINDOW_DAYS = 30;
export const EDIT_WINDOW_MS = EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type Tier = "standard" | "group";

export const TIER_PRICE_PAISE: Record<Tier, number> = {
  standard: 49_900, // ₹499, 1–4 travellers, inclusive of applicable taxes
  group: 99_900, // ₹999, 5+ travellers, inclusive of applicable taxes
};

/** Explicitly confirmed upgrade when a standard workspace grows to 5+. */
export const TIER_UPGRADE_PAISE = TIER_PRICE_PAISE.group - TIER_PRICE_PAISE.standard; // ₹500

export function assertTravellers(travellers: number): number {
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > 30) {
    throw new RangeError("Traveller count must be a whole number between 1 and 30.");
  }
  return travellers;
}

export function tierFor(travellers: number): Tier {
  return assertTravellers(travellers) >= GROUP_THRESHOLD ? "group" : "standard";
}

export function priceFor(travellers: number): { tier: Tier; amountPaise: number; amountInr: number } {
  const tier = tierFor(travellers);
  const amountPaise = TIER_PRICE_PAISE[tier];
  return { tier, amountPaise, amountInr: amountPaise / 100 };
}

export function tierAllows(tier: Tier, travellers: number): boolean {
  return tier === "group" || assertTravellers(travellers) < GROUP_THRESHOLD;
}

export function unlockCta(travellers: number): string {
  const { tier, amountInr } = priceFor(travellers);
  return tier === "group" ? `Unlock our trip for ₹${amountInr}` : `Unlock my trip for ₹${amountInr}`;
}

export const PRICING_COPY = {
  promise: "One trip workspace. Change anything, even your destination, as often as you like for 30 days.",
  checkout: "₹499 / ₹999 total, inclusive of applicable taxes. Hotel, travel and activity bookings cost extra.",
  expired: "Your 30-day editing period has ended. Your saved trip is still here.",
  tiers: "₹499 for 1–4 travellers / ₹999 for 5+ travellers",
} as const;

// ───────────── Entitlement window ─────────────

export type EntitlementWindow = { paidAt: Date; editExpiresAt: Date };

export function entitlementWindow(paidAt: Date): EntitlementWindow {
  return { paidAt, editExpiresAt: new Date(paidAt.getTime() + EDIT_WINDOW_MS) };
}

/** UTC is the authority: active strictly before paid_at + 30 days. */
export function isEditable(editExpiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() < editExpiresAt.getTime();
}

export function daysRemaining(editExpiresAt: Date, now: Date = new Date()): number {
  const ms = editExpiresAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export type TravellerChange =
  | { kind: "free" }
  | { kind: "upgrade_required"; amountPaise: number };

/** 4→5 needs a confirmed upgrade; 5→4 never charges or silently refunds. */
export function travellerChangeRule(currentTier: Tier, nextTravellers: number): TravellerChange {
  if (tierAllows(currentTier, nextTravellers)) return { kind: "free" };
  return { kind: "upgrade_required", amountPaise: TIER_UPGRADE_PAISE };
}
