import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { curatedPlaces, getDestination } from "@/lib/data/catalog";
import { currentDraft, draftMatches } from "@/lib/data/drafts";
import { scoreDestination } from "@/lib/planner/matching";
import { sponsoredFor } from "@/lib/sponsors";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { priceFor } from "@/lib/pricing";
import { chooseDestinationAction } from "@/app/actions/planner";
import { Scene } from "@/components/scene";
import { Band } from "@/components/money";
import { SponsoredSlot } from "@/components/sponsored";
import { Button, ButtonLink, Chip, Container, Illustrative } from "@/components/ui";
import { DestinationMap } from "./destination-map";
import { WebNotes } from "@/components/web-notes";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = await getDestination((await params).id);
  return d ? { title: d.name, description: d.tagline } : { title: "Destination" };
}

export default async function DestinationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dest = await getDestination(id);
  if (!dest) notFound();
  const user = await getCurrentUser();
  const draft = await currentDraft(user);
  const [places, stored, sponsored] = await Promise.all([
    curatedPlaces(dest.id),
    draft ? draftMatches(draft.id) : Promise.resolve([]),
    sponsoredFor({ placement: "destination_sidebar", destinationId: dest.id, countryCode: dest.countryCode }),
  ]);
  const prefs = draft?.preferences ?? null;
  const stored1 = stored.find((m) => m.destinationId === dest.id);
  const computed = prefs ? scoreDestination(dest, prefs) : null;
  const reasons = stored1?.reasons ?? computed?.reasons ?? [];
  const estimate = stored1?.estimate ?? (computed ? { ...computed.estimate, seasonCaveat: computed.seasonCaveat, suggestedDays: prefs!.days, closest: false } : null);
  const cur = prefs?.displayCurrency ?? "INR";
  const strip = ["nature", "food", "culture", "lesser_known", "experience", "viewpoint"]
    .map((cat) => places.find((p) => p.category === cat))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);
  const price = prefs ? priceFor(prefs.travellers) : null;

  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-forest-deep text-cream">
        <Scene kind={dest.scene} seed={dest.id} label={`${dest.name} landscape`} photoUrl={dest.heroImageUrl} credit={dest.imageCredit} className="absolute inset-0 -z-10" priority />
        <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-[#0f2a23]/60 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f2a23]/90 via-[#0f2a23]/35 to-transparent" />
        <Container className="flex min-h-[64svh] flex-col justify-end pb-12 pt-24">
          <Link href={draft ? "/plan/matches" : "/plan"} className="mb-auto w-fit rounded-md py-2 text-[15px] text-cream/90 underline underline-offset-4">
            {draft ? "Back to your matches" : "Find my trip"}
          </Link>
          <p className="text-[16px] text-cream/85">
            {dest.region}, {dest.country}
          </p>
          <h1 className="mt-1 text-[48px] sm:text-[76px]">{dest.name}</h1>
          <p className="mt-3 max-w-xl font-serif text-[22px] italic text-cream/95 sm:text-[26px]">{dest.tagline}</p>
        </Container>
      </section>

      <Container className="grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-12">
          <section aria-labelledby="story">
            <h2 id="story" className="sr-only">
              About {dest.name}
            </h2>
            <p className="max-w-2xl text-[19px] leading-relaxed">{dest.story}</p>
          </section>

          {reasons.length ? (
            <section aria-labelledby="why">
              <h2 id="why" className="text-[30px]">
                Why it fits you
              </h2>
              <ul className="mt-4 space-y-2.5 text-[17px]">
                {reasons.map((r) => (
                  <li key={r.text} className="flex gap-3">
                    <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-hidden />
                    {r.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="exp">
            <h2 id="exp" className="text-[30px]">
              What your days could hold
            </h2>
            <ul className="scroller -mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
              {strip.map((p) => (
                <li key={p.id} className="w-[72vw] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface sm:w-auto">
                  <Scene kind={p.scene ?? dest.scene} seed={p.id} label={p.name} className="aspect-[16/10]" />
                  <div className="p-4">
                    <p className="text-[13px] font-medium text-forest">{PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}</p>
                    <p className="font-serif text-[21px] leading-tight">{p.name}</p>
                    <p className="mt-1 line-clamp-3 text-[14px] text-ink-soft">{p.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="where" className="space-y-4">
            <h2 id="where" className="text-[30px]">
              Where it is
            </h2>
            <div className="h-[340px] overflow-hidden rounded-[var(--radius-card)] border border-line">
              <DestinationMap center={{ lat: dest.lat, lng: dest.lng }} markers={places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, label: p.name, kind: "curated" as const }))} name={dest.name} />
            </div>
            <p className="text-[15px] text-ink-soft">{dest.gettingThere}</p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
            <dl className="grid grid-cols-2 gap-5">
              <div>
                <dt className="text-[13px] text-ink-soft">Suggested duration</dt>
                <dd className="mt-0.5 font-serif text-[22px]">
                  {dest.suggestedDaysMin}–{dest.suggestedDaysMax} days
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-soft">Travel character</dt>
                <dd className="mt-0.5 font-serif text-[22px] leading-tight">{dest.travelCharacter}</dd>
              </div>
              {estimate ? (
                <div className="col-span-2">
                  <dt className="text-[13px] text-ink-soft">
                    Estimated trip for {prefs!.travellers} · {prefs!.days} days
                  </dt>
                  <dd className="mt-0.5 font-serif text-[28px]">
                    <Band band={estimate.total} currency={cur} />
                  </dd>
                  <dd className="mt-2 grid grid-cols-2 gap-2 text-[14px] text-ink-soft">
                    <span>
                      On the trip: <Band band={estimate.onTrip} currency={cur} />
                    </span>
                    <span>
                      Getting there: {estimate.transport[1] ? <Band band={estimate.transport} currency={cur} /> : "not included"}
                    </span>
                  </dd>
                </div>
              ) : null}
            </dl>
            <Illustrative className="mt-4" />
            {estimate?.seasonCaveat ? <p className="mt-3 text-[14px] text-warning">Season note: {estimate.seasonCaveat}</p> : <p className="mt-3 text-[14px] text-ink-soft">{dest.seasonNote}</p>}
            <p className="mt-3 rounded-[12px] bg-cream p-3 text-[14px]">{dest.practicalNote}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dest.experienceTags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-forest/30 bg-forest-soft p-6">
            <p className="font-serif text-[22px]">Free preview vs your full plan</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              <li>Free: this overview, why it fits, sample places and an estimate.</li>
              <li>
                Full plan{price ? ` (₹${price.amountInr} total)` : ""}: a {prefs?.days ?? dest.suggestedDaysMin}-day itinerary with routes, food, hidden gems, daily budgets and booking links — editable for 30 days.
              </li>
            </ul>
            <form action={chooseDestinationAction.bind(null, dest.id)} className="mt-5">
              {draft ? (
                <Button type="submit" className="w-full">
                  Build my itinerary
                </Button>
              ) : (
                <ButtonLink href={`/plan`} className="w-full">
                  Find my trip
                </ButtonLink>
              )}
            </form>
          </div>

          <WebNotes destination={dest} />
          <SponsoredSlot items={sponsored} heading={`Sponsored in ${dest.name}`} compact />
        </aside>
      </Container>
    </>
  );
}
