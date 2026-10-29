import Link from "next/link";
import { Scene } from "@/components/scene";

export default function NotFound() {
  return (
    <main id="main" className="on-dark relative isolate grid min-h-dvh place-items-center overflow-hidden bg-forest-deep px-6 text-center text-cream">
      <Scene kind="lake" seed="not-found" label="" className="absolute inset-0 -z-10 opacity-70" />
      <div className="absolute inset-0 -z-10 bg-[#0f2a23]/50" />
      <div>
        <h1 className="text-[44px] sm:text-[60px]">This path doesn&rsquo;t lead anywhere.</h1>
        <p className="mt-3 text-[18px] text-cream/90">The page may have moved, or the link was mistyped.</p>
        <div className="mt-8 flex justify-center gap-6">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-[12px] bg-cream px-6 text-forest-deep">Go home</Link>
          <Link href="/plan" className="inline-flex min-h-11 items-center underline underline-offset-4">Find my trip</Link>
        </div>
      </div>
    </main>
  );
}
