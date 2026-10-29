import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currentDraft, draftMatches } from "@/lib/data/drafts";
import { listDestinations } from "@/lib/data/catalog";
import { noMatchAdvice } from "@/lib/planner/matching";
import { sponsoredFor } from "@/lib/sponsors";
import { COMPANIONS, MOODS, STYLES } from "@/lib/domain";
import { Scene } from "@/components/scene";
import { Band } from "@/components/money";
import { SponsoredSlot } from "@/components/sponsored";
import { ButtonLink, Chip, Container, Empty, Illustrative } from "@/components/ui";

export const metadata: Metadata = { title: "Your matches" };

export default async function MatchesPage() {
  const user = await getCurrentUser();
  const draft = await currentDraft(user);
  if (!draft) redirect("/plan");
  const prefs = draft.preferences;
  const [stored, destinations] = await Promise.all([draftMatches(draft.id), listDestinations()]);
  const byId = new Map(destinations.map((d) => [d.id, d]));
  const matches = stored.map((m) => ({ ...m, destination: byId.get(m.destinationId)! })).filter((m) => m.destination);
  const sponsored = matches[0] ? await sponsoredFor({ placement: "match_support", destinationId: matches[0].destinationId, countryCode: matches[0].destination.countryCode }) : [];
  const cur = prefs.displayCurrency;

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[38px] sm:text-[54px]">{matches.length ? (matches.length === 3 ? "Three places match your mood." : `${matches.length === 1 ? "One place matches" : "Two places match"} your mood.`) : "Nothing fits quite yet."}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="forest">{MOODS.find((m) => m.id === prefs.mood)?.label}</Chip>
            <Chip>
              {COMPANIONS.find((c) => c.id === prefs.companion)?.label} · {prefs.travellers}
            </Chip>
            <Chip>{STYLES.find((s) => s.id === prefs.style)?.label}</Chip>
            <Chip tone="plain">{prefs.days} days</Chip>
            <Chip tone="plain">
              <Band band={[prefs.budgetInr, prefs.budgetInr]} currency={cur} /> total
            </Chip>
          </div>
        </div>
        <Link href="/plan?edit=1" className="min-h-11 py-2 text-[15px] text-forest underline underline-offset-4">
          Adjust preferences
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="mt-10">
          <Empty title="Let's widen the search a little" action={<ButtonLink href="/plan?edit=1">Adjust preferences</ButtonLink>}>
            <ul className="mt-2 space-y-1 text-left">
              {noMatchAdvice(destinations, prefs).map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </Empty>
        </div>
      ) : (
        <ol className="scroller -mx-4 mt-10 flex gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {matches.map((m, i) => (
            <li key={m.destinationId} className="w-[84vw] shrink-0 sm:w-[60vw] lg:w-auto" style={{ animation: `rise-in 300ms var(--ease) ${i * 120}ms both` }}>
              <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <div className="relative">
                  <Scene kind={m.destination.scene} seed={m.destination.id} label={`${m.destination.name}, ${m.destination.region}`} photoUrl={m.destination.heroImageUrl} credit={m.destination.imageCredit} className="aspect-[4/3]" />
                  {m.estimate.closest ? (
                    <span className="absolute left-3 top-3 rounded-[8px] bg-cream px-2.5 py-1 text-[13px] font-semibold text-forest">Closest match</span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-[30px]">{m.destination.name}</h2>
                  <p className="text-[15px] text-ink-soft">
                    {m.destination.region}, {m.destination.country}
                  </p>
                  <h3 className="mt-5 font-sans text-[14px] font-semibold text-forest">Why it fits you</h3>
                  <ul className="mt-2 space-y-1.5 text-[15px]">
                    {m.reasons.slice(0, 3).map((r) => (
                      <li key={r.text} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" aria-hidden />
                        {r.text}
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-5 grid grid-cols-2 gap-3 rounded-[14px] bg-cream p-4 text-[14px]">
                    <div>
                      <dt className="text-ink-soft">Estimated trip</dt>
                      <dd className="font-semibold">
                        <Band band={m.estimate.total} currency={cur} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Suggested</dt>
                      <dd className="font-semibold">{m.estimate.suggestedDays} days</dd>
                    </div>
                  </dl>
                  {m.estimate.withinBudget === "stretch" ? <p className="mt-2 text-[13px] text-warning">A little over your budget — simpler stays bring it in.</p> : null}
                  {m.estimate.seasonCaveat ? <p className="mt-2 text-[13px] text-warning">Season note: {m.estimate.seasonCaveat}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.destination.experienceTags.slice(0, 3).map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                  <div className="mt-auto pt-6">
                    <ButtonLink href={`/plan/destinations/${m.destinationId}`} className="w-full">
                      Explore this trip
                    </ButtonLink>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}

      {matches.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Illustrative />
          <p className="text-[13px] text-ink-soft">Matches are ranked only on your answers. Sponsors can&rsquo;t change this order.</p>
        </div>
      ) : null}

      {sponsored.length ? (
        <div className="mt-12">
          <SponsoredSlot items={sponsored} heading="Sponsored, near your closest match" />
        </div>
      ) : null}
    </Container>
  );
}
