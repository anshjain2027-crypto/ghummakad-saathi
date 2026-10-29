import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listTrips } from "@/lib/data/trips";
import { currentDraft } from "@/lib/data/drafts";
import { getDestination } from "@/lib/data/catalog";
import { Scene } from "@/components/scene";
import { ButtonLink, Container, Empty, PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "My trips" };

export default async function MyTrips() {
  const user = await requireUser("/my/trips");
  const [trips, draft] = await Promise.all([listTrips(user.id), currentDraft(user)]);
  const draftDest = draft?.selectedDestinationId ? await getDestination(draft.selectedDestinationId) : null;

  return (
    <Container className="py-12">
      <PageHeading title="My trips" lead="Every trip you've unlocked, with its editing window." />
      {draft ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-5">
          <div>
            <p className="font-serif text-[22px]">Draft in progress{draftDest ? `: ${draftDest.name}` : ""}</p>
            <p className="text-[14px] text-ink-soft">
              {draft.preferences.days} days · {draft.preferences.travellers} travellers · not unlocked yet
            </p>
          </div>
          <ButtonLink href={draft.selectedDestinationId ? "/plan/review" : "/plan/matches"} variant="secondary">
            Continue planning
          </ButtonLink>
        </div>
      ) : null}
      {trips.length === 0 ? (
        <Empty title="No trips yet" action={<ButtonLink href="/plan">Find my trip</ButtonLink>}>
          Answer a few questions and see three places that fit you — free.
        </Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link href={`/trips/${t.id}`} className="lift block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <Scene kind={undefined} seed={t.destinationId} label="" className="aspect-[16/9]" />
                <div className="p-5">
                  <p className="font-serif text-[24px]">{t.destinationName}</p>
                  <p className="text-[14px] text-ink-soft">
                    {t.preferences.days} days · {t.travellers} travellers · version {t.currentVersion}
                  </p>
                  <p className={`mt-3 text-[14px] font-medium ${t.entitlement?.editable ? "text-forest" : "text-warning"}`}>
                    {t.entitlement?.editable ? `Editable · ${t.entitlement.daysRemaining} days left` : t.entitlement ? "Editing period ended · view only" : "Awaiting payment confirmation"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
