import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { myReviews } from "@/lib/data/community";
import { WORTH_GOING } from "@/lib/domain";
import { ButtonLink, Container, Empty, PageHeading, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "My reviews" };

export default async function MyReviews() {
  const user = await requireUser("/my/reviews");
  const reviews = await myReviews(user.id);
  return (
    <Container className="py-12">
      <PageHeading title="My reviews" lead="Edit or delete any review from its place page." />
      {reviews.length === 0 ? (
        <Empty title="No reviews yet" action={<ButtonLink href="/map">Find a place to review</ButtonLink>}>
          Been somewhere good? Tell other travellers whether it&rsquo;s worth going.
        </Empty>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/places/${r.placeId}`} className="font-serif text-[22px] hover:text-forest">
                  {r.placeName}
                </Link>
                <Stars value={r.rating} />
              </div>
              <p className="text-[13px] text-ink-soft">
                Worth going: {WORTH_GOING.find((w) => w.id === r.worthGoing)?.label}
                {r.status !== "published" ? " · hidden by a moderator" : ""}
              </p>
              {r.comment ? <p className="mt-2">{r.comment}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
