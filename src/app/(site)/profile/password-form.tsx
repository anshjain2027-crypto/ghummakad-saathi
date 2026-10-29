"use client";

import { useActionState } from "react";
import { setPasswordAction, type PasswordState } from "@/app/actions/auth";
import { Button, Field, inputClass, Notice } from "@/components/ui";

export function PasswordForm({ highlight }: { highlight?: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(setPasswordAction, {});
  return (
    <section id="password" className={`mt-12 rounded-[var(--radius-card)] border bg-surface p-6 ${highlight ? "border-forest" : "border-line"}`}>
      <h2 className="font-serif text-[22px]">Password</h2>
      <p className="mt-2 text-[15px] text-ink-soft">Set or change the password you use to sign in with your email.</p>
      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="New password" htmlFor="pw-new" hint="At least 8 characters">
          <input id="pw-new" name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </Field>
        <Field label="Type it again" htmlFor="pw-confirm">
          <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save password"}</Button>
        </div>
      </form>
      <div className="mt-3">{state.error ? <Notice tone="error">{state.error}</Notice> : state.ok ? <Notice tone="success">Password saved. You can now sign in with your email and password.</Notice> : null}</div>
    </section>
  );
}
