"use client";

import { useActionState, useState } from "react";
import { signInAction, type AuthMode, type SignInState } from "@/app/actions/auth";
import { Button, Field, inputClass, Notice } from "@/components/ui";

const TABS: { id: AuthMode; label: string }[] = [
  { id: "password", label: "Sign in" },
  { id: "signup", label: "Create account" },
];

function PasswordInput({ id, label, autoComplete, hint }: { id: string; label: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <input id={id} name="password" type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={autoComplete === "new-password" ? 8 : undefined} className={`${inputClass} pr-20`} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-2 my-auto h-9 rounded-md px-2 text-[13px] font-medium text-forest" aria-label={show ? "Hide password" : "Show password"}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}

function Switch({ to, children }: { to: AuthMode; children: React.ReactNode }) {
  return (
    <button type="submit" name="switch" value={to} formNoValidate className="min-h-11 text-[14px] font-medium text-forest underline underline-offset-4">
      {children}
    </button>
  );
}

export function SignInForm({ next, demo, initialMode = "password" }: { next: string; demo: boolean; initialMode?: AuthMode }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, { mode: initialMode, step: "form", next });
  const mode = state.mode;

  // ── Code entry (sign-up confirmation, email-code sign-in, password reset) ──
  if (state.step === "code") {
    const reset = mode === "reset";
    return (
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="intent" value={reset ? "reset-verify" : "verify"} />
        <p className="text-[15px]">
          {state.info ?? (
            <>
              We sent a 6-digit code to <strong>{state.email}</strong>.
            </>
          )}{" "}
          It can take a minute — check spam too.
        </p>
        {demo && state.demoCode ? (
          <Notice tone="warning" title="Demo mailbox">
            Email isn&rsquo;t connected in demo mode. Your code is <strong className="nums tracking-[0.2em]">{state.demoCode}</strong>.
          </Notice>
        ) : null}
        <Field label={reset ? "Reset code" : "6-digit code"} htmlFor="code" error={state.error}>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            maxLength={8}
            required
            autoFocus
            placeholder="123456"
            className={`${inputClass} nums text-[22px] tracking-[0.35em]`}
            aria-invalid={!!state.error}
          />
        </Field>
        {reset ? <PasswordInput id="new-password" label="New password" autoComplete="new-password" hint="At least 8 characters" /> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Checking…" : reset ? "Set new password & sign in" : "Confirm & sign in"}
        </Button>
        <div className="flex flex-wrap justify-between gap-2">
          <Switch to={reset ? "reset" : "code"}>Send a new code</Switch>
          <Switch to="password">Back to sign in</Switch>
        </div>
      </form>
    );
  }

  return (
    <div>
      {mode === "password" || mode === "signup" ? (
        <form action={action} className="mb-6 grid grid-cols-2 rounded-[var(--radius-control)] border border-line-strong p-1" noValidate>
          <input type="hidden" name="next" value={next} />
          {TABS.map((t) => (
            <button key={t.id} type="submit" name="switch" value={t.id} formNoValidate aria-pressed={mode === t.id} className={`min-h-11 rounded-[10px] text-[15px] font-medium ${mode === t.id ? "bg-forest text-cream" : "text-ink"}`}>
              {t.label}
            </button>
          ))}
        </form>
      ) : null}

      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="intent" value={mode === "password" ? "password" : mode === "signup" ? "signup" : mode === "reset" ? "reset-send" : "send"} />
        {mode === "reset" ? <p className="font-serif text-[24px]">Reset your password</p> : null}
        {mode === "code" ? <p className="font-serif text-[24px]">Sign in with an email code</p> : null}
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        {mode === "signup" ? (
          <Field label="Your name" htmlFor="name">
            <input id="name" name="name" autoComplete="name" required maxLength={40} defaultValue={state.name} className={inputClass} placeholder="Ansh" />
          </Field>
        ) : null}
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className={inputClass} placeholder="you@example.com" />
        </Field>
        {mode === "password" ? <PasswordInput id="password" label="Password" autoComplete="current-password" /> : null}
        {mode === "signup" ? <PasswordInput id="password" label="Choose a password" autoComplete="new-password" hint="At least 8 characters" /> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Please wait…"
            : mode === "password"
              ? "Log in"
              : mode === "signup"
                ? "Create my free account"
                : mode === "reset"
                  ? "Email me a reset code"
                  : "Email me a 6-digit code"}
        </Button>
        <div className="flex flex-wrap justify-between gap-2">
          {mode === "password" ? (
            <>
              <Switch to="reset">Forgot password?</Switch>
              <Switch to="code">Use an email code instead</Switch>
            </>
          ) : mode === "signup" ? (
            <Switch to="code">Prefer no password? Use an email code</Switch>
          ) : (
            <Switch to="password">Back to sign in with password</Switch>
          )}
        </div>
      </form>
    </div>
  );
}
