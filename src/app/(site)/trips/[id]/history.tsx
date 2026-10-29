"use client";

import { useState, useTransition } from "react";
import { restoreVersionAction } from "@/app/actions/trips";
import { Notice } from "@/components/ui";

type V = { version: number; summary: string; createdAt: string; generator: string; destination: string };

export function History({ tripId, editable, versions }: { tripId: string; editable: boolean; versions: V[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="history" className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
      <h2 id="history" className="font-serif text-[22px]">
        Versions
      </h2>
      {error ? <div className="mt-3"><Notice tone="error">{error}</Notice></div> : null}
      <ol className="mt-3 divide-y divide-line">
        {versions.map((v, i) => (
          <li key={v.version} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[15px] font-medium">
                Version {v.version} · {v.destination}
                {i === 0 ? <span className="ml-2 text-[13px] font-normal text-forest">current</span> : null}
              </p>
              <p className="truncate text-[13px] text-ink-soft">
                {v.summary} · {new Date(v.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {editable && i > 0 ? (
              <button
                type="button"
                disabled={pending}
                className="min-h-11 shrink-0 text-[14px] font-medium text-forest underline underline-offset-4 disabled:opacity-50"
                onClick={() =>
                  start(async () => {
                    const r = await restoreVersionAction(tripId, v.version);
                    if (!r.ok) setError(r.error);
                  })
                }
              >
                Restore
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
