"use client";

import { useActionState } from "react";
import { grantModeratorAction, type AdminState } from "@/app/actions/admin";
import { Button, Notice, inputClass } from "@/components/ui";

export function GrantModerator() {
  const [state, action, pending] = useActionState<AdminState, FormData>(grantModeratorAction, {});
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="font-serif text-[22px]">Add a moderator</h2>
      <form action={action} className="mt-3 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="mod-email">
          Email
        </label>
        <input id="mod-email" name="email" type="email" placeholder="their@email.com" className={`${inputClass} max-w-sm`} />
        <Button type="submit" disabled={pending}>
          Grant moderator role
        </Button>
      </form>
      <div className="mt-3">{state.error ? <Notice tone="error">{state.error}</Notice> : state.ok ? <Notice tone="success">{state.message}</Notice> : null}</div>
    </section>
  );
}
