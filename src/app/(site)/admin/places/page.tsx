import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { moderationQueue } from "@/lib/data/community";
import { moderatePlaceAction } from "@/app/actions/community";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { Button, Empty, inputClass } from "@/components/ui";

export default async function AdminPlaces() {
  await requireRole("moderator", "/admin/places");
  const { pending } = await moderationQueue();
  return (
    <div>
      <h1 className="text-[40px]">Place submissions</h1>
      <p className="mt-2 text-ink-soft">Approve genuine places. Decline self-promotion, duplicates, unsafe or private locations, and explain why.</p>
      <div className="mt-8 space-y-4">
        {pending.length === 0 ? (
          <Empty title="Queue is clear">New community submissions will appear here.</Empty>
        ) : (
          pending.map((p) => (
            <article key={p.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-serif text-[24px]">{p.name}</h2>
                <p className="text-[13px] text-ink-soft">
                  {PLACE_CATEGORIES.find((c) => c.id === p.category)?.label} · by {p.author} · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <p className="mt-2">{p.description}</p>
              <p className="mt-2 text-[13px] text-ink-soft">
                {p.lat.toFixed(5)}, {p.lng.toFixed(5)} ·{" "}
                <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=15/${p.lat}/${p.lng}`}>
                  Check location
                </a>{" "}
                · <Link className="underline" href={`/places/${p.id}`}>Preview</Link>
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <form action={moderatePlaceAction.bind(null, p.id, "approve")}>
                  <Button type="submit">Approve</Button>
                </form>
                <form action={moderatePlaceAction.bind(null, p.id, "reject")} className="flex flex-wrap gap-2">
                  <label className="sr-only" htmlFor={`r-${p.id}`}>
                    Reason
                  </label>
                  <input id={`r-${p.id}`} name="reason" placeholder="Reason shown to the author" className={`${inputClass} w-72`} />
                  <Button type="submit" variant="danger">
                    Decline
                  </Button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
