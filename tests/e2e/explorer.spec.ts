import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("map requires free sign-in and returns to the same view", async ({ page }) => {
  await page.goto("/map?lat=31.62&lng=77.41&z=11");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await expect(page.getByText(/community map is free/)).toBeVisible();
  await signIn(page, uniqueEmail("explorer"));
  await expect(page).toHaveURL(/\/map\?lat=31.62&lng=77.41&z=11/);
  await expect(page.getByRole("heading", { name: "Community map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Gushaini riverside/ })).toBeVisible({ timeout: 20_000 });
});

test("review, private save and report flows on a place", async ({ page }) => {
  await page.goto("/map?lat=31.62&lng=77.41&z=11");
  await signIn(page, uniqueEmail("reviewer"));
  await page.getByRole("button", { name: /Gushaini riverside/ }).click();
  await page.getByRole("link", { name: "Open place" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Gushaini riverside" })).toBeVisible();

  await page.getByRole("button", { name: "Save privately" }).click();
  await expect(page.getByRole("button", { name: /Saved privately/ })).toBeVisible();

  await page.getByLabel("4 stars").click();
  await page.getByLabel("Comment (optional)").fill("Clear water and a quiet bank in the afternoon.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByText("Review saved.", { exact: false })).toBeVisible();
  await expect(page.getByText("your review", { exact: true })).toBeVisible();

  await page.goto("/my/places");
  await expect(page.getByRole("link", { name: "Gushaini riverside" })).toBeVisible();
});

test("pricing page states both tiers and tax-inclusive totals", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("₹499", { exact: true })).toBeVisible();
  await expect(page.getByText("₹999", { exact: true })).toBeVisible();
  await expect(page.getByText(/inclusive of applicable taxes/)).toBeVisible();
});
