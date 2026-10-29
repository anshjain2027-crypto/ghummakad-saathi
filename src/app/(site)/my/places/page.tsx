import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { myPins, mySubmissions } from "@/lib/data/community";
import { PLACE_CATEGORIES } from "@/lib/domain";
import { deletePinAction } from "@/app/actions/community";
import { ButtonLink, Chip, Container, Empty, PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Saved places" };

const STATUS: Record<string, { label: string; tone: "forest" | "terracotta" | "plain" }> = {
  approved: { label: "Public", tone: "forest" },
  pending: { label: "Awaiting review", tone: "terracotta" },
  rejected: { label: "Not approved", tone: "plain" },
};

export default async function MyPlaces() {
  const user = await requireUser("/my/places");
  const [pins, subs] = await Promise.all([myPins(user.id), mySubmissions(user.id)]);
  return (
    <Container className="py-12">
      <PageHeading title="Saved places" lead="Your private pins are visible only to you. Public submissions show their review status." />
      <section aria-labelledby="private">
        <h2 id="private" className="text-[28px]">
          Private pins
        </h2>
        {pins.length === 0 ? (
          <div className="mt-4">
            <Empty title="Nothing saved yet" action={<ButtonLink href="/map">Open the map</ButtonLink>}>
              Tap “Save privately” on any place, or drop your own private pin on the map.
            </Empty>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {pins.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="min-w-0">
                  {p.placeId ? (
                    <Link href={`/places/${p.placeId}`} className="font-serif text-[20px] hover:text-forest">
                      {p.name}
                    </Link>
                  ) : (
                    <Link href={`/map?lat=${p.lat}&lng=${p.lng}&z=14`} className="font-serif text-[20px] hover:text-forest">
                      {p.name}
                    </Link>
                  )}
                  <p className="text-[13px] text-ink-soft">{p.placeId ? PLACE_CATEGORIES.find((c) => c.id === p.category)?.label : "Your own pin"}</p>
                  {p.note ? <p className="mt-1 text-[14px]">{p.note}</p> : null}
                </div>
                <form action={deletePinAction.bind(null, p.id)}>
                  <button className="min-h-11 text-[14px] text-ink-soft underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="subs" className="mt-14">
        <h2 id="subs" className="text-[28px]">
          Places you&rsquo;ve shared
        </h2>
        {subs.length === 0 ? (
          <p className="mt-3 text-ink-soft">You haven&rsquo;t submitted any public places yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {subs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/places/${s.id}`} className="font-medium hover:text-forest">
                    {s.name}
                  </Link>
                  {s.rejectionReason ? <p className="text-[13px] text-ink-soft">{s.rejectionReason}</p> : null}
                </div>
                <Chip tone={STATUS[s.status]?.tone ?? "plain"}>{STATUS[s.status]?.label ?? s.status}</Chip>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
