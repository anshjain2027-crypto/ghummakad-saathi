import { expect, type Page } from "@playwright/test";

/** Demo-mode sign-in: the code is shown on screen (no email is sent). */
export async function signIn(page: Page, email: string) {
  await page.getByRole("button", { name: "Use an email code instead" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a 6-digit code" }).click();
  const notice = page.getByText(/Your code is/);
  await expect(notice).toBeVisible({ timeout: 45_000 });
  const code = (await notice.textContent())!.match(/(\d{6})/)![1];
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Confirm & sign in" }).click();
}

/** Demo-mode password account: create it, which also signs you in. */
export async function signUpWithPassword(page: Page, email: string, password = "wander-far-2026") {
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Your name").fill("E2E Traveller");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Choose a password").fill(password);
  await page.getByRole("button", { name: "Create my free account" }).click();
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@e2e.test`;
}
