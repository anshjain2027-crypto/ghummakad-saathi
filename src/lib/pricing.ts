/**
 * Locked commercial rules (product owner decision, 13 Oct 2026).
 * Client-safe: the same functions render prices and the server uses them to
 * create orders, so the displayed amount and the charged amount cannot drift.
 */

export const GROUP_THRESHOLD = 5;
export const EDIT_WINDOW_DAYS = 30;
export const EDIT_WINDOW_MS = EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type Tier = "standard" | "group";

/**
 * Two price lists (product owner decision, 7 Nov 2026): buyers in India pay in
 * rupees; everyone else pays in US dollars. Amounts are in minor units
 * (paise / cents), taxes included.
 */
export type PayCurrency = "INR" | "USD";
export const PAY_CURRENCIES: PayCurrency[] = ["INR", "USD"];

export const PRICES: Record<PayCurrency, Record<Tier, number>> = {
  INR: { standard: 49_900, group: 99_900 }, // ₹499 / ₹999
  USD: { standard: 1_000, group: 1_900 }, // $10 / $19
};

/** Explicitly confirmed upgrade when a standard workspace grows to 5+. */
export const UPGRADE_PRICE: Record<PayCurrency, number> = {
  INR: PRICES.INR.group - PRICES.INR.standard, // ₹500
  USD: PRICES.USD.group - PRICES.USD.standard, // $9
};

/** Back-compat aliases (INR). */
export const TIER_PRICE_PAISE = PRICES.INR;
export const TIER_UPGRADE_PAISE = UPGRADE_PRICE.INR;

export function formatPrice(minor: number, currency: PayCurrency | string): string {
  const major = minor / 100;
  if (currency === "USD") return `$${Number.isInteger(major) ? major : major.toFixed(2)}`;
  return `₹${major.toLocaleString("en-IN")}`;
}

export const isPayCurrency = (c: unknown): c is PayCurrency => c === "INR" || c === "USD";

export function assertTravellers(travellers: number): number {
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > 30) {
    throw new RangeError("Traveller count must be a whole number between 1 and 30.");
  }
  return travellers;
}

export function tierFor(travellers: number): Tier {
  return assertTravellers(travellers) >= GROUP_THRESHOLD ? "group" : "standard";
}

export function priceFor(
  travellers: number,
  currency: PayCurrency = "INR",
): { tier: Tier; currency: PayCurrency; amountPaise: number; amountInr: number; label: string } {
  const tier = tierFor(travellers);
  const amountPaise = PRICES[currency][tier];
  return { tier, currency, amountPaise, amountInr: PRICES.INR[tier] / 100, label: formatPrice(amountPaise, currency) };
}

export function tierAllows(tier: Tier, travellers: number): boolean {
  return tier === "group" || assertTravellers(travellers) < GROUP_THRESHOLD;
}

export function unlockCta(travellers: number, currency: PayCurrency = "INR"): string {
  const { tier, label } = priceFor(travellers, currency);
  return tier === "group" ? `Unlock our trip for ${label}` : `Unlock my trip for ${label}`;
}

export const PRICING_COPY = {
  promise: "One trip workspace. Change anything, even your destination, as often as you like for 30 days.",
  checkout: "One-time price, inclusive of applicable taxes. Hotel, travel and activity bookings cost extra.",
  expired: "Your 30-day editing period has ended. Your saved trip is still here.",
  tiers: "₹499 (or $10 outside India) for 1–4 travellers · ₹999 (or $19) for 5+",
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
export function travellerChangeRule(currentTier: Tier, nextTravellers: number, currency: PayCurrency = "INR"): TravellerChange {
  if (tierAllows(currentTier, nextTravellers)) return { kind: "free" };
  return { kind: "upgrade_required", amountPaise: UPGRADE_PRICE[currency] };
}
