"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-[40px]">Something went wrong on our side.</h1>
        <p className="mt-3 text-ink-soft">Your trips and payments are safe. Try again, or head back home.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button onClick={reset} className="inline-flex min-h-11 items-center rounded-[12px] bg-forest px-5 text-cream">Try again</button>
          <Link href="/" className="inline-flex min-h-11 items-center text-forest underline">Home</Link>
        </div>
      </div>
    </main>
  );
}
