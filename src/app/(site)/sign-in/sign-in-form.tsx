"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/actions/auth";
import { Button, Field, inputClass, Notice } from "@/components/ui";

export function SignInForm({ next, demo }: { next: string; demo: boolean }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, { step: "email", next });

  if (state.step === "code") {
    return (
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="intent" value="verify" />
        <p className="text-[15px]">
          {demo ? (
            <>We sent a 6-digit code to <strong>{state.email}</strong>.</>
          ) : (
            <>We emailed <strong>{state.email}</strong>. Open the sign-in link in this browser, or enter the 6-digit code from the email.</>
          )}
        </p>
        {demo && state.demoCode ? (
          <Notice tone="warning" title="Demo mailbox">
            Email isn&rsquo;t connected in demo mode. Your code is <strong className="nums tracking-[0.2em]">{state.demoCode}</strong>.
          </Notice>
        ) : null}
        <Field label="Sign-in code" htmlFor="code" error={state.error}>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className={`${inputClass} nums text-[20px] tracking-[0.3em]`}
            aria-invalid={!!state.error}
          />
        </Field>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Checking…" : "Sign in"}
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value="send" />
      <Field label="Email" htmlFor="email" error={state.error}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
          placeholder="you@example.com"
          aria-invalid={!!state.error}
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Email me a code"}
      </Button>
    </form>
  );
}
