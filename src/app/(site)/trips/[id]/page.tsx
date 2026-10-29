import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTrip } from "@/lib/data/trips";
import { curatedPlaces, getDestination, listDestinations } from "@/lib/data/catalog";
import { bookingOptions } from "@/lib/booking/adapters";
import { sponsoredFor } from "@/lib/sponsors";
import { swapCandidates } from "@/lib/planner/itinerary";
import { COMPANIONS, PACES, STYLES } from "@/lib/domain";
import { PRICING_COPY } from "@/lib/pricing";
import { Scene } from "@/components/scene";
import { Band } from "@/components/money";
import { SponsoredSlot } from "@/components/sponsored";
import { Chip, Container, Illustrative, Notice } from "@/components/ui";
import { Generator } from "./generator";
import { Itinerary } from "./itinerary";
import { EditPanel } from "./edit-panel";
import { History } from "./history";
import { BookingModules } from "./booking-modules";
import { EntitlementBanner } from "./entitlement-banner";
import { PrintButton } from "./print-button";
import { WebNotes } from "@/components/web-notes";

export const metadata: Metadata = { title: "Your trip", robots: { index: false } };

export default async function TripHub({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const user = await requireUser(`/trips/${id}`);
  const data = await getTrip(user.id, id);
  if (!data) notFound();
  const { trip, versions, selfBookings } = data;
  const current = versions[0] ?? null;
  const ent = trip.entitlement;
  const editable = !!ent?.editable;

  if (!current) {
    const dest = await getDestination(trip.destinationId);
    return (
      <Container className="py-10">
        {editable ? (
          <Generator tripId={trip.id} destinationName={dest?.name ?? "your"} scene={dest?.scene ?? "mountains"} seed={trip.destinationId} />
        ) : (
          <Notice tone="warning" title="This trip hasn't been built">
            {ent ? PRICING_COPY.expired : "Payment for this trip hasn't been confirmed yet."}
          </Notice>
        )}
      </Container>
    );
  }

  const plan = current.plan;
  const prefs = trip.preferences;
  const [dest, places, destinations] = await Promise.all([getDestination(plan.destinationId), curatedPlaces(plan.destinationId), listDestinations()]);
  if (!dest) notFound();
  const booking = bookingOptions(dest, prefs);
  const sponsored = await sponsoredFor({ placement: "trip_module", destinationId: dest.id, countryCode: dest.countryCode });
  const swaps = Object.fromEntries(
    plan.days.map((d) => [d.day, swapCandidates(plan, d.day, places).slice(0, 6).map((p) => ({ id: p.id, name: p.name, category: p.category }))]),
  );
  const cur = prefs.displayCurrency;
  const budgetMax = Math.max(...Object.values(plan.budget.split).map((b) => b[1]), 1);

  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-forest-deep text-cream">
        <Scene kind={dest.scene} seed={`${dest.id}-hub`} label={dest.name} photoUrl={dest.heroImageUrl} className="absolute inset-0 -z-10" priority />
        <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-[#0f2a23]/60 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f2a23]/92 via-[#0f2a23]/45 to-[#0f2a23]/10" />
        <Container className="pb-10 pt-16 sm:pt-24">
          <p className="text-[16px] text-cream/85">{welcome === "trip_purchase" ? "Payment confirmed." : welcome === "tier_upgrade" ? "Upgrade confirmed — your trip now covers 5+ travellers." : welcome === "renewal" ? "A new 30-day editing window has started." : "Your trip"}</p>
          <h1 className="mt-1 text-[44px] sm:text-[68px]">Your trip has a shape now.</h1>
          <p className="mt-3 max-w-2xl text-[19px] text-cream/90">{plan.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip tone="sand">{dest.name}</Chip>
            <Chip tone="sand">From {prefs.origin}</Chip>
            <Chip tone="sand">
              {plan.days.length} days{prefs.dateMode === "dates" && prefs.startDate ? ` from ${new Date(`${prefs.startDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
            </Chip>
            <Chip tone="sand">
              {COMPANIONS.find((c) => c.id === prefs.companion)?.label} · {trip.travellers}
            </Chip>
            <Chip tone="sand">{STYLES.find((s) => s.id === prefs.style)?.label}</Chip>
            <Chip tone="sand">{PACES.find((p) => p.id === prefs.pace)?.label} pace</Chip>
          </div>
        </Container>
      </section>

      <Container className="py-8">
        <EntitlementBanner tripId={trip.id} entitlement={ent ? { tier: ent.tier, editExpiresAt: ent.editExpiresAt.toISOString(), editable: ent.editable, daysRemaining: ent.daysRemaining } : null} />
      </Container>

      <Container className="grid gap-12 pb-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="why-plan">
            <h2 id="why-plan" className="text-[30px]">
              Why this plan fits you
            </h2>
            <ul className="mt-4 space-y-2 text-[17px]">
              {plan.whyThisFits.map((w) => (
                <li key={w} className="flex gap-3">
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          </section>

          <Itinerary tripId={trip.id} plan={plan} editable={editable} swaps={swaps} currency={cur} center={{ lat: dest.lat, lng: dest.lng }} />

          <section aria-labelledby="practical" className="grid gap-6 sm:grid-cols-2">
            <h2 id="practical" className="sr-only">
              Practical notes
            </h2>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <p className="font-serif text-[21px]">Getting there</p>
              <p className="mt-2 text-[15px] text-ink-soft">{plan.travelToDestination}</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <p className="font-serif text-[21px]">Where to stay</p>
              <p className="mt-2 text-[15px] text-ink-soft">{plan.stayArea}</p>
            </div>
          </section>

          <BookingModules tripId={trip.id} options={booking} selfBookings={selfBookings} sponsored={<SponsoredSlot items={sponsored} heading={`Sponsored stays & services in ${dest.name}`} />} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <section aria-labelledby="budget" className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
            <h2 id="budget" className="font-serif text-[24px]">
              Trip budget
            </h2>
            <p className="nums mt-2 font-serif text-[34px] text-forest">
              <Band band={plan.budget.total} currency={cur} />
            </p>
            <p className="text-[14px] text-ink-soft">
              for {trip.travellers} {trip.travellers === 1 ? "traveller" : "travellers"} · your budget {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(prefs.budgetInr)}
            </p>
            <dl className="mt-5 space-y-3 text-[14px]">
              {(Object.entries(plan.budget.split) as [string, [number, number]][]).map(([k, band]) => (
                <div key={k}>
                  <div className="flex justify-between">
                    <dt className="capitalize">{k === "transport" ? "Getting there & back" : k}</dt>
                    <dd className="nums">{band[1] ? <Band band={band} currency={cur} /> : "Not included"}</dd>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-cream" aria-hidden>
                    <div className="h-full rounded-full bg-sand" style={{ width: `${(band[1] / budgetMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </dl>
            <Illustrative className="mt-5" />
            {!plan.budget.withinBudget ? <p className="mt-2 text-[14px] text-warning">This is above your budget. Try fewer days or a simpler style.</p> : null}
          </section>

          {plan.caveats.length ? (
            <section aria-labelledby="caveats" className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <h2 id="caveats" className="font-serif text-[22px]">
                Good to know
              </h2>
              <ul className="mt-3 space-y-2 text-[14px] text-ink-soft">
                {plan.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="no-print">
            <WebNotes destination={dest} />
          </div>

          <div className="no-print">
            <EditPanel
              tripId={trip.id}
              editable={editable}
              tier={ent?.tier ?? "standard"}
              current={{ destinationId: plan.destinationId, days: plan.days.length, travellers: trip.travellers, style: prefs.style, pace: prefs.pace, budgetInr: prefs.budgetInr, startDate: prefs.startDate ?? "" }}
              destinations={destinations.map((d) => ({ id: d.id, name: d.name, country: d.country }))}
            />
          </div>

          <div className="no-print">
            <History tripId={trip.id} editable={editable} versions={versions.map((v) => ({ version: v.version, summary: v.changeSummary, createdAt: v.createdAt.toISOString(), generator: v.generator, destination: destinations.find((d) => d.id === v.destinationId)?.name ?? v.destinationId }))} />
          </div>

          <div className="no-print flex flex-wrap items-center gap-4">
            <PrintButton />
            <Link href="/my/trips" className="text-[15px] text-forest underline underline-offset-4">
              All my trips
            </Link>
          </div>
        </aside>
      </Container>
    </>
  );
}
