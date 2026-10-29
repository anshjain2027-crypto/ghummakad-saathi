"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Polls the server-side payment check while confirmation is pending. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries > 24) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      router.refresh();
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [router, seconds, tries]);
  return (
    <p className="mt-6 text-[14px] text-ink-soft" aria-live="polite">
      {tries > 24 ? "Still waiting. You can leave this page — the trip will appear in My trips once confirmed." : "Checking again automatically…"}
    </p>
  );
}
