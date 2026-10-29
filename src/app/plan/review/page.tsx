import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft } from "@/lib/data/drafts";
import { curatedPlaces, getDestination } from "@/lib/data/catalog";
import { mockSkeleton, resolvePlan } from "@/lib/planner/itinerary";
import { priceFor, PRICING_COPY, unlockCta } from "@/lib/pricing";
import { paymentProvider } from "@/lib/payments/orders";
import { Scene } from "@/components/scene";
import { Band } from "@/components/money";
import { ButtonLink, Chip, Container, Illustrative } from "@/components/ui";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = { title: "Review your trip" };

export default async function ReviewPage() {
  const user = await getCurrentUser();
  const draft = await currentDraft(user);
  if (!draft) redirect("/plan");
  if (!draft.selectedDestinationId) redirect("/plan/matches");
  const dest = await getDestination(draft.selectedDestinationId);
  if (!dest) redirect("/plan/matches");
  const prefs = draft.preferences;
  const places = await curatedPlaces(dest.id);
  const preview = resolvePlan(mockSkeleton(dest, places, prefs), { dest, places, prefs });
  const price = priceFor(prefs.travellers);
  const cur = prefs.displayCurrency;

  return (
    <Container className="py-10 sm:py-14">
      <Link href={`/plan/destinations/${dest.id}`} className="text-[15px] text-forest underline underline-offset-4">
        Back to {dest.name}
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="text-[40px] sm:text-[52px]">Your {dest.name} trip is ready to build.</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="forest">{prefs.days} days</Chip>
            <Chip>
              {prefs.travellers} {prefs.travellers === 1 ? "traveller" : "travellers"}
            </Chip>
            <Chip>From {prefs.origin}</Chip>
            <Chip tone="plain">
              <Band band={preview.budget.total} currency={cur} /> estimated
            </Chip>
          </div>

          <section className="mt-10" aria-labelledby="preview">
            <h2 id="preview" className="text-[28px]">
              A look at the shape of your days
            </h2>
            <p className="mt-2 text-ink-soft">Day 1 is shown in full. The rest unlock with your plan.</p>
            <ol className="mt-6 space-y-4">
              {preview.days.map((d) => {
                const open = d.day === 1;
                const stops = [...d.morning, ...d.afternoon, ...d.evening];
                return (
                  <li key={d.day} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                    <div className="flex items-center gap-4 p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest font-serif text-[18px] text-cream">{d.day}</span>
                      <div>
                        <p className="font-serif text-[21px] leading-tight">{d.theme}</p>
                        <p className="text-[14px] text-ink-soft">
                          {stops.length} {stops.length === 1 ? "stop" : "stops"}
                          {open ? "" : " · details in your full plan"}
                        </p>
                      </div>
                    </div>
                    {open ? (
                      <ul className="space-y-2 border-t border-line px-4 py-4 text-[15px]">
                        {stops.map((s) => (
                          <li key={s.placeId} className="flex gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-hidden />
                            <span>
                              <strong className="font-medium">{s.name}</strong> — <span className="text-ink-soft">{s.note}</span>
                            </span>
                          </li>
                        ))}
                        <li className="flex gap-3 text-ink-soft">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sand" aria-hidden />
                          Food: {d.food.name}
                        </li>
                      </ul>
                    ) : (
                      <div aria-hidden className="select-none border-t border-line px-4 py-3 text-[15px] text-ink-soft blur-[5px]">
                        {stops.map((s) => s.name).join(" · ") || "A slow day"}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            <Scene kind={dest.scene} seed={`${dest.id}-review`} label={dest.name} photoUrl={dest.heroImageUrl} className="aspect-[16/8]" />
            <div className="p-6">
              <p className="text-[15px] text-ink-soft">One-time price for the whole group</p>
              <p className="nums mt-1 font-serif text-[52px] leading-none text-forest">₹{price.amountInr}</p>
              <p className="mt-2 text-[14px] text-ink-soft">{PRICING_COPY.checkout}</p>
              <p className="mt-4 font-medium">{PRICING_COPY.promise}</p>

              <h2 className="mt-6 font-sans text-[15px] font-semibold">Included</h2>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                <li>✓ A {prefs.days}-day plan: places, routes, food and hidden gems</li>
                <li>✓ Day-by-day and total budget estimates</li>
                <li>✓ Map of each day, plus booking links to trusted providers</li>
                <li>✓ Unlimited edits for 30 days — even a new destination</li>
                <li>✓ Your plan stays viewable after the 30 days</li>
              </ul>
              <h2 className="mt-5 font-sans text-[15px] font-semibold">Not included</h2>
              <ul className="mt-2 space-y-1.5 text-[15px] text-ink-soft">
                <li>Hotel, flight, train or activity bookings (booked on partner sites)</li>
                <li>Guaranteed prices or availability</li>
                <li>Several separate trips at once — one payment, one trip workspace</li>
              </ul>
              <p className="mt-4 text-[13px] text-ink-soft">
                {price.tier === "group" ? "Priced for 5+ travellers." : "Priced for 1–4 travellers. Growing to 5+ later is a ₹500 upgrade you confirm first."}{" "}
                <Link href="/refunds" className="underline underline-offset-2">
                  Refund policy
                </Link>
              </p>
              <div className="mt-6">
                {user ? (
                  <CheckoutButton label={unlockCta(prefs.travellers)} />
                ) : (
                  <ButtonLink href={`/sign-in?next=${encodeURIComponent("/plan/review")}`} className="w-full">
                    Sign in to {unlockCta(prefs.travellers).toLowerCase()}
                  </ButtonLink>
                )}
              </div>
              <p className="mt-3 text-center text-[13px] text-ink-soft">
                {paymentProvider === "dodo" ? "Secure checkout by Dodo Payments." : "Demo checkout — no real money moves."}
              </p>
              <Illustrative className="mt-4" />
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
