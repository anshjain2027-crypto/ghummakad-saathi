"use client";

import { useActionState } from "react";
import { createBusinessAction, type AdminState } from "@/app/actions/admin";
import { Button, Notice, inputClass } from "@/components/ui";

export function BusinessForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(createBusinessAction, {});
  return (
    <form action={action} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:grid-cols-2">
      <p className="font-serif text-[22px] sm:col-span-2">Add a sponsor</p>
      <label className="grid gap-1 text-[14px] font-medium">
        Business name
        <input name="name" required className={inputClass} />
      </label>
      <label className="grid gap-1 text-[14px] font-medium">
        Service
        <select name="serviceType" className={inputClass}>
          <option value="stay">Stay</option>
          <option value="vehicle_rental">Two-wheeler / car rental</option>
          <option value="activity">Activity</option>
          <option value="agency">Travel agency</option>
        </select>
      </label>
      <label className="grid gap-1 text-[14px] font-medium">
        Website (https)
        <input name="website" type="url" className={inputClass} />
      </label>
      <label className="grid gap-1 text-[14px] font-medium">
        Contact email
        <input name="contactEmail" type="email" className={inputClass} />
      </label>
      <div className="sm:col-span-2">
        {state.error ? <Notice tone="error">{state.error}</Notice> : state.ok ? <Notice tone="success">{state.message}</Notice> : null}
        <Button type="submit" disabled={pending} className="mt-2">
          Add sponsor
        </Button>
      </div>
    </form>
  );
}
