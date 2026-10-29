"use client";

import { useEffect, useRef } from "react";

/** Counts an impression only when ≥50% of the ad is visible for ≥1 second. */
export function ImpressionBeacon({ token }: { token: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (sent) return;
        if (entry.intersectionRatio >= 0.5) {
          timer = setTimeout(() => {
            sent = true;
            io.disconnect();
            fetch("/api/sponsor/impression", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ t: token }),
              keepalive: true,
            }).catch(() => undefined);
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [token]);
  return <span ref={ref} hidden />;
}
