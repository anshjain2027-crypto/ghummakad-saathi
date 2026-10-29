import { expect, test } from "@playwright/test";
import { signUpWithPassword, uniqueEmail } from "./helpers";

test("create an account with a password, sign out, sign back in", async ({ page }) => {
  const email = uniqueEmail("pw");
  await page.goto("/sign-in?next=/profile");
  await signUpWithPassword(page, email, "wander-far-2026");
  await expect(page).toHaveURL(/\/profile/, { timeout: 45_000 });
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/sign-in?next=/profile");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("That email and password don't match.")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Password", { exact: true }).fill("wander-far-2026");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile/, { timeout: 45_000 });
});
