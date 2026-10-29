import { describe, expect, test } from "vitest";
import {
  daysRemaining,
  entitlementWindow,
  isEditable,
  priceFor,
  tierFor,
  travellerChangeRule,
  unlockCta,
} from "@/lib/pricing";

describe("price calculator (acceptance extension 2)", () => {
  test.each([
    [1, 499],
    [4, 499],
    [5, 999],
    [10, 999],
  ])("%i travellers → ₹%i", (travellers, inr) => {
    expect(priceFor(travellers).amountInr).toBe(inr);
    expect(priceFor(travellers).amountPaise).toBe(inr * 100);
  });

  test("threshold is 5", () => {
    expect(tierFor(4)).toBe("standard");
    expect(tierFor(5)).toBe("group");
  });

  test("CTA copy follows party size", () => {
    expect(unlockCta(2)).toBe("Unlock my trip for ₹499");
    expect(unlockCta(6)).toBe("Unlock our trip for ₹999");
  });

  test("rejects invalid traveller counts", () => {
    expect(() => priceFor(0)).toThrow();
    expect(() => priceFor(2.5)).toThrow();
    expect(() => priceFor(31)).toThrow();
  });
});

describe("30-day entitlement (fake clock)", () => {
  const paidAt = new Date("2026-11-01T10:00:00.000Z");
  const { editExpiresAt } = entitlementWindow(paidAt);
  const at = (d: number, h = 0, m = 0) => new Date(paidAt.getTime() + ((d * 24 + h) * 60 + m) * 60_000);

  test("expires exactly 720 hours after payment", () => {
    expect(editExpiresAt.toISOString()).toBe("2026-12-01T10:00:00.000Z");
  });
  test("active at paid_at + 29d23h59m", () => {
    expect(isEditable(editExpiresAt, at(29, 23, 59))).toBe(true);
  });
  test("expired at exactly paid_at + 30d", () => {
    expect(isEditable(editExpiresAt, at(30))).toBe(false);
  });
  test("days remaining counts down to zero", () => {
    expect(daysRemaining(editExpiresAt, at(0))).toBe(30);
    expect(daysRemaining(editExpiresAt, at(15))).toBe(15);
    expect(daysRemaining(editExpiresAt, at(30))).toBe(0);
  });
});

describe("traveller changes", () => {
  test("4 → 5 requires an explicit ₹500 upgrade", () => {
    expect(travellerChangeRule("standard", 5)).toEqual({ kind: "upgrade_required", amountPaise: 50_000 });
  });
  test("5 → 4 is free (no payment, no silent refund)", () => {
    expect(travellerChangeRule("group", 4)).toEqual({ kind: "free" });
  });
  test("group tier can grow freely", () => {
    expect(travellerChangeRule("group", 12)).toEqual({ kind: "free" });
  });
});
