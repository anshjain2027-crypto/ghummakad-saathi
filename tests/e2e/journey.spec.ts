import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("visual planner → matches → paid trip → edit destination without paying again", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How do you want this trip to feel?" })).toBeVisible();
  await page.getByRole("link", { name: "Find my trip" }).first().click();

  // 1 Mood
  await expect(page.getByRole("heading", { name: "What are you craving right now?" })).toBeVisible();
  const cont = page.getByRole("button", { name: "Continue" });
  await expect(cont).toBeDisabled();
  await page.getByRole("radio", { name: /Mountains & cool air/ }).click();
  await cont.click();

  // 2 Companions (+ back keeps state)
  await expect(page.getByRole("heading", { name: "Who’s coming along?" })).toBeVisible();
  await page.getByRole("radio", { name: /Partner/ }).click();
  await expect(page.getByText("₹499")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("radio", { name: /Mountains & cool air/ })).toHaveAttribute("aria-checked", "true");
  await cont.click();
  await expect(page.getByRole("radio", { name: /Partner/ })).toHaveAttribute("aria-checked", "true");
  await cont.click();

  // 3 Style
  await page.getByRole("radio", { name: /Comfortable/ }).click();
  await expect(page.getByText(/Comfortable: easy stays/)).toBeVisible();
  await cont.click();

  // 4 Where / when
  await page.getByLabel("Departure city").fill("New Delhi");
  await page.getByRole("radio", { name: "A month" }).click();
  await page.getByLabel("Month").selectOption("10");
  await cont.click();

  // 5 Extras (skip) → 6 Budget
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "What should this trip work within?" })).toBeVisible();
  await page.getByLabel("Or type an amount in ₹").fill("40000");
  await page.getByRole("button", { name: "5–6 days" }).click();
  await expect(page.getByText("Illustrative estimate — not live pricing.")).toBeVisible();
  await page.getByRole("button", { name: "Show my matches" }).click();

  // Finding → matches
  await expect(page.getByText("Finding places that fit your mood, budget and pace…")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three places match your mood." })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Closest match", { exact: true })).toBeVisible();
  const first = page.getByRole("listitem").filter({ has: page.getByText("Closest match", { exact: true }) }).getByRole("article");
  await expect(first.getByRole("heading", { name: "Tirthan Valley" })).toBeVisible();
  await expect(first.getByText("Why it fits you")).toBeVisible();
  // Sponsored content is separate from the organic list and labelled.
  await expect(page.getByLabel("Sponsored")).toContainText("Sponsored");
  await first.getByRole("link", { name: "Explore this trip" }).click();

  // Destination detail
  await expect(page.getByRole("heading", { level: 1, name: "Tirthan Valley" })).toBeVisible();
  await page.getByRole("button", { name: "Build my itinerary" }).click();

  // Paywall → sign in → back to draft
  await expect(page.getByText("₹499").first()).toBeVisible();
  await expect(page.getByText(/inclusive of applicable taxes/)).toBeVisible();
  await page.getByRole("link", { name: /Sign in to unlock my trip for ₹499/i }).click();
  await signIn(page, uniqueEmail("traveller"));
  await expect(page).toHaveURL(/\/plan\/review/);
  await page.getByRole("button", { name: "Unlock my trip for ₹499" }).click();

  // Demo gateway: a declined payment grants nothing and keeps the draft
  await expect(page.getByText("Demo payment gateway")).toBeVisible();
  await page.getByRole("button", { name: "Simulate a declined payment" }).click();
  await expect(page.getByRole("heading", { name: "The payment didn’t go through" })).toBeVisible();
  await page.getByRole("link", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Unlock my trip for ₹499" }).click();
  await page.getByRole("button", { name: /Pay ₹499 \(test success\)/ }).click();

  // Generation → trip hub
  await expect(page.getByRole("heading", { name: "Your trip has a shape now." })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Unlimited edits until/)).toBeVisible();
  await expect(page.getByText("30 days left")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Day 1/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: /Day 2/ }).click();
  await expect(page.getByRole("tab", { name: /Day 2/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Check availability with Booking.com")).toBeVisible();
  await expect(page.getByText("No booking made").first()).toBeVisible();
  const tripUrl = page.url();

  // Change destination within the window — no checkout, new version kept
  await page.getByLabel("Destination").selectOption("gokarna");
  await page.getByRole("button", { name: "Rebuild my plan" }).click();
  await expect(page.getByText(/Your plan has been rebuilt/)).toBeVisible({ timeout: 60_000 });
  await expect(page).toHaveURL(tripUrl);
  await expect(page.getByText(/Version 2 · Gokarna/)).toBeVisible();
  await expect(page.getByText(/Version 1 · Tirthan Valley/)).toBeVisible();

  // Growing to 5 travellers requires an explicit upgrade
  await page.getByLabel("Travellers").fill("5");
  await expect(page.getByText(/one-time ₹500 upgrade/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Rebuild my plan" })).toBeDisabled();
});
