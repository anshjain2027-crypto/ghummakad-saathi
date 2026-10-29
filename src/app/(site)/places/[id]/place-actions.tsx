"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePlaceAction,
  deleteReviewAction,
  editPlaceAction,
  reportAction,
  reviewAction,
  toggleSaveAction,
  type FormResult,
} from "@/app/actions/community";
import { Button, Notice, inputClass } from "@/components/ui";
import { PLACE_CATEGORIES, WORTH_GOING } from "@/lib/domain";

export function SaveButton({ placeId, saved }: { placeId: string; saved: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant={saved ? "secondary" : "primary"}
        className="w-full"
        disabled={pending}
        aria-pressed={saved}
        onClick={() =>
          start(async () => {
            const r = await toggleSaveAction(placeId, !saved);
            if (!r.ok) setErr(r.error ?? "Couldn't save.");
          })
        }
      >
        {saved ? "Saved privately — remove" : "Save privately"}
      </Button>
      {err ? <p className="mt-2 text-[13px] text-error">{err}</p> : null}
      <p className="mt-2 text-[13px] text-ink-soft">Saved places are only visible to you.</p>
    </div>
  );
}

export function ReviewForm({ placeId, existing }: { placeId: string; existing: { rating: number; worthGoing: string; comment: string } | null }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(reviewAction.bind(null, placeId), null);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="font-serif text-[22px]">{existing ? "Edit your review" : "Rate & review"}</p>
      <fieldset>
        <legend className="text-[14px] font-medium">Your rating</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <span className="grid h-11 w-11 place-items-center rounded-full peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-forest" aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <svg width="26" height="26" viewBox="0 0 20 20" aria-hidden>
                  <path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.8l-5.1 2.7 1.1-5.7-4.3-4 5.8-.7z" fill={n <= rating ? "var(--terracotta)" : "none"} stroke="var(--terracotta)" strokeWidth="1.3" />
                </svg>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[14px] font-medium">Worth going?</legend>
        <div className="mt-2 flex gap-2">
          {WORTH_GOING.map((w) => (
            <label key={w.id} className="cursor-pointer">
              <input type="radio" name="worthGoing" value={w.id} defaultChecked={(existing?.worthGoing ?? "yes") === w.id} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-chip)] border border-line-strong px-4 text-[15px] peer-checked:border-forest peer-checked:bg-forest peer-checked:text-cream peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-forest">
                {w.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1 text-[14px] font-medium">
        Comment (optional)
        <textarea name="comment" rows={4} maxLength={1500} defaultValue={existing?.comment ?? ""} className={`${inputClass} py-2`} placeholder="What should someone know before they go?" />
      </label>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "Saving…" : existing ? "Update review" : "Post review"}
      </Button>
    </form>
  );
}

export function DeleteReviewButton({ reviewId, placeId }: { reviewId: string; placeId: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <span className="flex items-center gap-3 text-[14px]">
      Delete your review?
      <button className="min-h-11 font-medium text-error underline" disabled={pending} onClick={() => start(() => deleteReviewAction(reviewId, placeId))}>
        Delete
      </button>
      <button className="min-h-11 underline" onClick={() => setConfirm(false)}>
        Keep
      </button>
    </span>
  ) : (
    <button className="min-h-11 text-[14px] text-ink-soft underline" onClick={() => setConfirm(true)}>
      Delete
    </button>
  );
}

export function ReportButton({ target, label = "Report" }: { target: { reviewId?: string; placeId?: string }; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(reportAction.bind(null, target), null);
  if (state?.ok) return <p className="text-[14px] text-forest">{state.message}</p>;
  if (!open)
    return (
      <button className="min-h-11 text-[14px] text-ink-soft underline" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  return (
    <form action={action} className="w-full space-y-2 rounded-[12px] border border-line bg-cream p-3">
      <label className="block text-[14px] font-medium">
        What&rsquo;s wrong?
        <select name="reason" className={`${inputClass} mt-1`} defaultValue="inaccurate">
          <option value="inaccurate">Inaccurate</option>
          <option value="abusive">Abusive or hateful</option>
          <option value="spam">Spam</option>
          <option value="self_promotion">Self-promotion</option>
          <option value="unsafe">Unsafe</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <textarea name="details" rows={2} maxLength={500} className={`${inputClass} py-2`} placeholder="Details (optional)" aria-label="Details" />
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div className="flex gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          Send report
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function EditSubmission({ place }: { place: { id: string; name: string; category: string; description: string; lat: number; lng: number } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(editPlaceAction.bind(null, place.id), null);
  const [del, startDel] = useTransition();
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Close editor" : "Edit my submission"}
        </Button>
        <Button
          variant="danger"
          disabled={del}
          onClick={() => {
            if (window.confirm("Delete this place? This can't be undone.")) startDel(async () => { await deletePlaceAction(place.id); router.push("/my/places"); });
          }}
        >
          Delete
        </Button>
      </div>
      {open ? (
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="lat" value={place.lat} />
          <input type="hidden" name="lng" value={place.lng} />
          <label className="block space-y-1 text-[14px] font-medium">
            Name
            <input name="name" defaultValue={place.name} className={inputClass} maxLength={120} />
          </label>
          <label className="block space-y-1 text-[14px] font-medium">
            Type
            <select name="category" defaultValue={place.category} className={inputClass}>
              {PLACE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-[14px] font-medium">
            Description
            <textarea name="description" defaultValue={place.description} rows={4} className={`${inputClass} py-2`} />
          </label>
          {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
          {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
          <Button type="submit" disabled={pending}>
            Save changes
          </Button>
        </form>
      ) : null}
    </div>
  );
}
