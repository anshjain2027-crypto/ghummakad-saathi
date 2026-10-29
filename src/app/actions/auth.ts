"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import {
  completePasswordReset,
  requireUser,
  safeNext,
  setPassword,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startEmailSignIn,
  startPasswordReset,
  verifyEmailCode,
} from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { sha256 } from "@/lib/crypto";

export type AuthMode = "password" | "signup" | "code" | "reset";

export type SignInState = {
  mode: AuthMode;
  step: "form" | "code";
  email?: string;
  name?: string;
  next?: string;
  demoCode?: string;
  error?: string;
  info?: string;
};

const Email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const Password = z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer");
const Name = z.string().trim().min(1, "Tell us what to call you").max(40);
const Code = z.string().regex(/^\d{6,8}$/, "Enter the code from the email (6 digits)");

async function clientKey() {
  const h = await headers();
  return sha256(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local").slice(0, 24);
}

async function sendLimit(email: string) {
  return (await rateLimit(`otp:${await clientKey()}`, 8, 900)) && (await rateLimit(`otp-email:${email}`, 5, 900));
}

export async function signInAction(prev: SignInState, form: FormData): Promise<SignInState> {
  const next = safeNext(String(form.get("next") ?? prev.next ?? "/"));
  const intent = String(form.get("intent") ?? "password");
  const switchTo = String(form.get("switch") ?? "");
  if (switchTo === "password" || switchTo === "signup" || switchTo === "code" || switchTo === "reset") {
    return { mode: switchTo, step: "form", next, email: prev.email };
  }
  const code = String(form.get("code") ?? "").replace(/\D/g, "");

  // ── Password sign-in ──
  if (intent === "password") {
    const email = Email.safeParse(form.get("email"));
    if (!email.success) return { mode: "password", step: "form", next, error: email.error.issues[0].message };
    const pw = String(form.get("password") ?? "");
    if (!pw) return { mode: "password", step: "form", next, email: email.data, error: "Enter your password." };
    if (!(await rateLimit(`pw:${await clientKey()}`, 20, 900)) || !(await rateLimit(`pw-email:${email.data}`, 10, 900))) {
      return { mode: "password", step: "form", next, email: email.data, error: "Too many attempts. Wait 15 minutes, or sign in with an email code." };
    }
    const res = await signInWithPassword(email.data, pw);
    if (res.ok) redirect(next);
    if (res.code === "unconfirmed") {
      if (!(await sendLimit(email.data))) return { mode: "password", step: "form", next, email: email.data, error: res.error };
      const sent = await startEmailSignIn(email.data, next);
      return { mode: "code", step: "code", next, email: email.data, demoCode: sent.ok ? sent.demoCode : undefined, info: "Your email isn't confirmed yet. Enter the 6-digit code we just sent to finish." };
    }
    return { mode: "password", step: "form", next, email: email.data, error: res.error };
  }

  // ── Create account ──
  if (intent === "signup") {
    const email = Email.safeParse(form.get("email"));
    const name = Name.safeParse(form.get("name"));
    const pw = Password.safeParse(form.get("password"));
    const base = { mode: "signup" as const, step: "form" as const, next, email: email.success ? email.data : undefined, name: name.success ? name.data : undefined };
    if (!name.success) return { ...base, error: name.error.issues[0].message };
    if (!email.success) return { ...base, error: email.error.issues[0].message };
    if (!pw.success) return { ...base, error: pw.error.issues[0].message };
    if (!(await sendLimit(email.data))) return { ...base, error: "Too many attempts. Please wait 15 minutes." };
    const res = await signUpWithPassword(email.data, pw.data, name.data, next);
    if (!res.ok) return res.code === "exists" ? { mode: "password", step: "form", next, email: email.data, error: res.error } : { ...base, error: res.error };
    if (!res.needsCode) redirect(next);
    return { mode: "signup", step: "code", next, email: email.data, info: `We sent a 6-digit code to ${email.data} to confirm it's you.` };
  }

  // ── Email code (no password) ──
  if (intent === "send") {
    const email = Email.safeParse(form.get("email"));
    if (!email.success) return { mode: "code", step: "form", next, error: email.error.issues[0].message };
    if (!(await sendLimit(email.data))) return { mode: "code", step: "form", email: email.data, next, error: "Too many codes requested. Please wait 15 minutes and try again." };
    const res = await startEmailSignIn(email.data, next);
    if (!res.ok) return { mode: "code", step: "form", email: email.data, next, error: res.error };
    return { mode: "code", step: "code", email: email.data, next, demoCode: res.demoCode };
  }

  if (intent === "verify") {
    const email = Email.safeParse(prev.email);
    if (!email.success) return { mode: prev.mode, step: "form", next, error: "Start again with your email." };
    const c = Code.safeParse(code);
    if (!c.success) return { ...prev, step: "code", error: c.error.issues[0].message };
    if (!(await rateLimit(`verify:${email.data}`, 10, 900))) return { ...prev, step: "code", error: "Too many attempts. Request a new code in 15 minutes." };
    const res = await verifyEmailCode(email.data, c.data);
    if (!res.ok) return { ...prev, step: "code", error: res.error };
    redirect(next);
  }

  // ── Forgot password ──
  if (intent === "reset-send") {
    const email = Email.safeParse(form.get("email"));
    if (!email.success) return { mode: "reset", step: "form", next, error: email.error.issues[0].message };
    if (!(await sendLimit(email.data))) return { mode: "reset", step: "form", email: email.data, next, error: "Too many codes requested. Please wait 15 minutes." };
    const res = await startPasswordReset(email.data);
    if (!res.ok) return { mode: "reset", step: "form", email: email.data, next, error: res.error };
    return { mode: "reset", step: "code", email: email.data, next, demoCode: res.demoCode, info: `If ${email.data} has an account, we've sent a 6-digit reset code.` };
  }

  if (intent === "reset-verify") {
    const email = Email.safeParse(prev.email);
    if (!email.success) return { mode: "reset", step: "form", next, error: "Start again with your email." };
    const c = Code.safeParse(code);
    if (!c.success) return { ...prev, step: "code", error: c.error.issues[0].message };
    const pw = Password.safeParse(form.get("password"));
    if (!pw.success) return { ...prev, step: "code", error: pw.error.issues[0].message };
    if (!(await rateLimit(`verify:${email.data}`, 10, 900))) return { ...prev, step: "code", error: "Too many attempts. Request a new code in 15 minutes." };
    const res = await completePasswordReset(email.data, c.data, pw.data);
    if (!res.ok) return { ...prev, step: "code", error: res.error };
    redirect(next);
  }

  return { mode: "password", step: "form", next };
}

export type PasswordState = { ok?: boolean; error?: string };

export async function setPasswordAction(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requireUser("/profile");
  const pw = Password.safeParse(form.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  if (String(form.get("confirm") ?? "") !== pw.data) return { error: "The two passwords don't match." };
  const res = await setPassword(user.id, user.email, pw.data);
  return res.ok ? { ok: true } : { error: res.error };
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
