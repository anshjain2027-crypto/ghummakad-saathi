"use client";

import { useActionState, useState } from "react";
import { createCampaignAction, type AdminState } from "@/app/actions/admin";
import { Button, Notice, inputClass } from "@/components/ui";

const PLACEMENTS = [
  ["match_support", "Below destination matches"],
  ["destination_sidebar", "Destination page sidebar"],
  ["map_pin", "Sponsored map pin"],
  ["trip_module", "Trip hub booking module"],
] as const;

export function CampaignForm({ businesses, destinations }: { businesses: { id: string; name: string }[]; destinations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createCampaignAction, {});
  const [[today, later]] = useState(() => {
    const now = new Date();
    return [now.toISOString().slice(0, 10), new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)];
  });
  if (!businesses.length) return <Notice tone="info">Add an active sponsor first.</Notice>;
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <summary className="cursor-pointer font-serif text-[22px]">New campaign</summary>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[14px] font-medium">
          Sponsor
          <select name="businessId" className={inputClass}>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Campaign name
          <input name="name" required className={inputClass} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-[14px] font-medium">Placements</legend>
          <div className="mt-1 flex flex-wrap gap-4">
            {PLACEMENTS.map(([id, label]) => (
              <label key={id} className="flex min-h-11 items-center gap-2 text-[14px]">
                <input type="checkbox" name="placements" value={id} className="h-4 w-4 accent-[var(--forest)]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1 text-[14px] font-medium">
          Destination IDs (comma-separated, blank = all)
          <input name="destinationIds" list="dest-ids" className={inputClass} placeholder="tirthan-valley" />
          <datalist id="dest-ids">
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </datalist>
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Country codes (comma-separated, blank = all)
          <input name="countryCodes" className={inputClass} placeholder="IN" />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Categories (comma-separated)
          <input name="categories" className={inputClass} placeholder="stay" />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          UTM campaign tag
          <input name="utmCampaign" className={inputClass} placeholder="winter_stays" />
        </label>
        <label className="grid gap-1 text-[14px] font-medium sm:col-span-2">
          Headline (max 80)
          <input name="creativeTitle" required maxLength={80} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium sm:col-span-2">
          Description (max 220)
          <textarea name="creativeBody" required maxLength={220} rows={2} className={`${inputClass} py-2`} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium sm:col-span-2">
          Landing page (https only)
          <input name="targetUrl" required type="url" className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Start
          <input name="startAt" type="date" defaultValue={today} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          End
          <input name="endAt" type="date" defaultValue={later} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Cost per click (₹)
          <input name="cpcInr" type="number" min={1} step="0.5" defaultValue={5} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Total budget (₹)
          <input name="budgetInr" type="number" min={50} step={50} defaultValue={1000} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[14px] font-medium">
          Priority (0–100)
          <input name="priority" type="number" min={0} max={100} defaultValue={0} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-[14px] font-medium">
            Map pin lat
            <input name="mapLat" type="number" step="any" className={inputClass} />
          </label>
          <label className="grid gap-1 text-[14px] font-medium">
            Map pin lng
            <input name="mapLng" type="number" step="any" className={inputClass} />
          </label>
        </div>
        <div className="sm:col-span-2">
          {state.error ? <Notice tone="error">{state.error}</Notice> : state.ok ? <Notice tone="success">{state.message}</Notice> : null}
          <Button type="submit" disabled={pending} className="mt-2">
            Create as draft
          </Button>
        </div>
      </form>
    </details>
  );
}
