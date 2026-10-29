"use client";

import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "./actions";
import { Button, Notice, inputClass } from "@/components/ui";

export function ProfileForm({ initial, currencies }: { initial: { displayName: string; currency: string; timezone: string; marketing: boolean }; currencies: string[] }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfileAction, {});
  return (
    <form action={action} className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-6">
      <label className="block space-y-1.5 text-[15px] font-medium">
        Display name (shown on your reviews)
        <input name="displayName" defaultValue={initial.displayName} maxLength={40} required className={inputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-[15px] font-medium">
          Show budgets in
          <select name="currency" defaultValue={initial.currency} className={inputClass}>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-[15px] font-medium">
          Time zone
          <input name="timezone" defaultValue={initial.timezone} maxLength={60} className={inputClass} />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input type="checkbox" name="marketing" defaultChecked={initial.marketing} className="h-5 w-5 accent-[var(--forest)]" />
        Send me occasional trip ideas by email (you can turn this off any time)
      </label>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="success">Saved.</Notice> : null}
      <Button type="submit" disabled={pending}>
        Save profile
      </Button>
    </form>
  );
}
