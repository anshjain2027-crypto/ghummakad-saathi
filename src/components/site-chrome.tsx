import Link from "next/link";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { config } from "@/lib/config";
import { Container } from "./ui";
import { signOutAction } from "@/app/actions/auth";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${light ? "text-cream" : "text-forest"}`} aria-label="Ghummakad Saathi home">
      <span className={`grid h-10 w-10 place-items-center rounded-full ${light ? "bg-cream/95 shadow-md" : "bg-transparent"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" width={28} height={32} className="h-8 w-auto" />
      </span>
      <span className="font-serif text-[21px] leading-none">Ghummakad Saathi</span>
    </Link>
  );
}

export async function SiteHeader({ light = false, minimal = false }: { light?: boolean; minimal?: boolean }) {
  const user = await getCurrentUser();
  const link = `rounded-md px-2.5 py-2 text-[15px] ${light ? "text-cream/90 hover:text-cream" : "text-charcoal/80 hover:text-forest"}`;
  return (
    <header className={`no-print ${light ? "absolute inset-x-0 top-0 z-20" : "border-b border-line bg-cream/95"}`}>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Wordmark light={light} />
        {minimal ? null : (
          <nav aria-label="Main" className="flex items-center gap-1">
            <Link href="/map" className={`${link} hidden sm:inline-flex`}>
              Map
            </Link>
            <Link href="/pricing" className={`${link} hidden sm:inline-flex`}>
              Pricing
            </Link>
            {user ? (
              <details className="relative">
                <summary className={`${link} flex cursor-pointer list-none items-center gap-1.5`}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-[13px] font-semibold text-cream">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="sr-only">Account menu</span>
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-[14px] border border-line bg-surface py-1 text-charcoal shadow-xl">
                  <p className="truncate px-4 py-2 text-[13px] text-ink-soft">{user.email}</p>
                  {[
                    ["/my/trips", "My trips"],
                    ["/my/places", "Saved places"],
                    ["/my/reviews", "My reviews"],
                    ["/map", "Community map"],
                    ["/profile", "Profile"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} className="block px-4 py-2 text-[15px] hover:bg-cream">
                      {label}
                    </Link>
                  ))}
                  {hasRole(user, "moderator") ? (
                    <Link href="/admin" className="block px-4 py-2 text-[15px] hover:bg-cream">
                      Admin
                    </Link>
                  ) : null}
                  <form action={signOutAction}>
                    <button className="block w-full px-4 py-2 text-left text-[15px] hover:bg-cream">Sign out</button>
                  </form>
                </div>
              </details>
            ) : (
              <Link href="/sign-in" className={link}>
                Sign in
              </Link>
            )}
          </nav>
        )}
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-line bg-[#efe8da]">
      <Container className="grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup.png" alt="Ghummakad Saathi — Wanderer Partner" width={220} height={199} className="h-auto w-[200px]" />
          <p className="mt-3 text-[15px] text-ink-soft">Don&rsquo;t search for a destination. Start with how you want to feel.</p>
          {config.demoMode ? (
            <p className="mt-4 rounded-lg border border-line-strong px-3 py-2 text-[13px] text-ink-soft">
              Demo mode: sample data, on-screen sign-in codes and a test payment gateway. No real money moves.
            </p>
          ) : null}
        </div>
        <nav aria-label="Product" className="grid content-start gap-2 text-[15px]">
          <Link href="/plan" className="hover:text-forest">Plan a trip</Link>
          <Link href="/map" className="hover:text-forest">Community map</Link>
          <Link href="/pricing" className="hover:text-forest">Pricing</Link>
          <Link href="/my/trips" className="hover:text-forest">My trips</Link>
        </nav>
        <nav aria-label="Legal" className="grid content-start gap-2 text-[15px]">
          <Link href="/terms" className="hover:text-forest">Terms</Link>
          <Link href="/privacy" className="hover:text-forest">Privacy</Link>
          <Link href="/sponsored-disclosure" className="hover:text-forest">Sponsored disclosure</Link>
          <Link href="/community-guidelines" className="hover:text-forest">Community guidelines</Link>
          <Link href="/refunds" className="hover:text-forest">Refunds</Link>
        </nav>
      </Container>
      <Container className="pb-8 text-[13px] text-ink-soft">
        © {new Date().getFullYear()} Ghummakad Saathi. Prices and availability shown are illustrative unless a provider says otherwise. Bookings happen on partner sites.
      </Container>
    </footer>
  );
}
