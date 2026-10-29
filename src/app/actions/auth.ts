"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import { safeNext, signOut, startEmailSignIn, verifyEmailCode } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { sha256 } from "@/lib/crypto";

export type SignInState = {
  step: "email" | "code";
  email?: string;
  next?: string;
  demoCode?: string;
  error?: string;
};

const Email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);

async function clientKey() {
  const h = await headers();
  return sha256(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local").slice(0, 24);
}

export async function signInAction(prev: SignInState, form: FormData): Promise<SignInState> {
  const next = safeNext(String(form.get("next") ?? prev.next ?? "/"));
  const intent = String(form.get("intent") ?? "send");

  if (intent === "send" || prev.step === "email") {
    const parsed = Email.safeParse(form.get("email") ?? prev.email);
    if (!parsed.success) return { step: "email", next, error: parsed.error.issues[0].message };
    const ok = (await rateLimit(`otp:${await clientKey()}`, 8, 900)) && (await rateLimit(`otp-email:${parsed.data}`, 5, 900));
    if (!ok) return { step: "email", email: parsed.data, next, error: "Too many codes requested. Please wait 15 minutes and try again." };
    const res = await startEmailSignIn(parsed.data, next);
    if (!res.ok) return { step: "email", email: parsed.data, next, error: res.error };
    return { step: "code", email: parsed.data, next, demoCode: res.demoCode };
  }

  const email = Email.safeParse(prev.email);
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (!email.success) return { step: "email", next, error: "Start again with your email." };
  if (code.length !== 6) return { ...prev, step: "code", error: "Enter the 6-digit code." };
  if (!(await rateLimit(`verify:${email.data}`, 10, 900))) {
    return { ...prev, step: "code", error: "Too many attempts. Request a new code in 15 minutes." };
  }
  const res = await verifyEmailCode(email.data, code);
  if (!res.ok) return { ...prev, step: "code", error: res.error };
  redirect(next);
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
