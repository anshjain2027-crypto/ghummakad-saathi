import { expect, type Page } from "@playwright/test";

/** Demo-mode sign-in: the code is shown on screen (no email is sent). */
export async function signIn(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  const notice = page.getByText(/Your code is/);
  await expect(notice).toBeVisible({ timeout: 45_000 });
  const code = (await notice.textContent())!.match(/(\d{6})/)![1];
  await page.getByLabel("Sign-in code").fill(code);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@e2e.test`;
}
