"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Scene } from "@/components/scene";
import { Button, Notice } from "@/components/ui";
import { generateTripAction } from "@/app/actions/trips";

const SIGNALS = ["Route", "Daily pace", "Experiences", "Food & practical notes"];

/** DESIGN.md screen 9 — "Building your <destination> trip…" */
export function Generator({ tripId, destinationName, scene, seed }: { tripId: string; destinationName: string; scene: string; seed: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    let cancelled = false;
    const minWait = new Promise((r) => setTimeout(r, 3200));
    const timeout = new Promise<{ ok: false; error: string }>((r) => setTimeout(() => r({ ok: false, error: "This is taking longer than usual." }), 60_000));
    Promise.all([Promise.race([generateTripAction(tripId), timeout]), minWait]).then(([res]) => {
      if (cancelled) return;
      if (res.ok) router.refresh();
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, router, tripId]);

  return (
    <div className="on-dark relative isolate grid min-h-[70vh] place-items-center overflow-hidden rounded-[var(--radius-card)] bg-forest-deep text-cream">
      <Scene kind={scene} seed={seed} label="" className="absolute inset-0 -z-10 opacity-80" />
      <div className="absolute inset-0 -z-10 bg-[#0f2a23]/55" />
      <div className="px-6 text-center" role="status" aria-live="polite">
        {error ? (
          <div className="mx-auto max-w-md text-left text-charcoal">
            <Notice tone="error" title="We couldn't finish your plan">
              {error} Your payment and 30-day window are safe.
            </Notice>
            <Button
              className="mt-4"
              variant="light"
              onClick={() => {
                setError(null);
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <p className="font-serif text-[32px] leading-tight sm:text-[46px]">Building your {destinationName} trip…</p>
            <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-[17px]">
              {SIGNALS.map((s, i) => (
                <li key={s} className="signal flex items-center justify-center gap-3" style={{ animationDelay: `${300 + i * 650}ms` }}>
                  <span className="h-2 w-2 rounded-full bg-sand" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
