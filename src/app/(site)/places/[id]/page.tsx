import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { placeDetail } from "@/lib/data/community";
import { PLACE_CATEGORIES, WORTH_GOING } from "@/lib/domain";
import { Scene } from "@/components/scene";
import { Chip, Container, Notice, Stars } from "@/components/ui";
import { ReviewForm, ReportButton, SaveButton, DeleteReviewButton, EditSubmission } from "./place-actions";
import { PlaceMap } from "./place-map";

export const metadata: Metadata = { title: "Place" };

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/places/${id}`);
  const p = await placeDetail(user.id, id);
  if (!p) notFound();
  const mine = p.reviews.find((r) => r.mine);
  const worth = Object.fromEntries(WORTH_GOING.map((w) => [w.id, p.reviews.filter((r) => r.worthGoing === w.id).length]));
  const googleReviewUrl = p.googlePlaceId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(p.googlePlaceId)}` : null;

  return (
    <Container className="py-10">
      <Link href={`/map?lat=${p.lat}&lng=${p.lng}&z=13`} className="text-[15px] text-forest underline underline-offset-4">
        Back to the map
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Scene kind={p.category === "food" ? "city" : p.category === "culture" ? "culture" : "forest"} seed={p.id} label={p.name} className="aspect-[16/8] rounded-[var(--radius-card)]" />
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip tone={p.source === "curated" ? "forest" : "sand"}>{p.source === "curated" ? "Editorial pick" : "Community pin"}</Chip>
            <Chip tone="plain">{PLACE_CATEGORIES.find((c) => c.id === p.category)?.label}</Chip>
            {p.hiddenGem ? <Chip>Lesser-known</Chip> : null}
          </div>
          <h1 className="mt-3 text-[40px] sm:text-[52px]">{p.name}</h1>
          {p.status === "pending" ? (
            <div className="mt-4">
              <Notice tone="warning" title="Awaiting review">
                Only you can see this place until a moderator approves it. You can still edit or delete it.
              </Notice>
            </div>
          ) : null}
          {p.status === "rejected" ? (
            <div className="mt-4">
              <Notice tone="error" title="Not approved">
                {p.rejectionReason ?? "This submission didn't meet the community guidelines."} Edit it to send it back for review.
              </Notice>
            </div>
          ) : null}
          <p className="mt-4 max-w-2xl text-[18px] leading-relaxed">{p.description}</p>

          {p.mine && p.source === "community" ? (
            <div className="mt-6">
              <EditSubmission place={{ id: p.id, name: p.name, category: p.category, description: p.description, lat: p.lat, lng: p.lng }} />
            </div>
          ) : null}

          <section aria-labelledby="reviews" className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="reviews" className="text-[30px]">
                Explorer reviews
              </h2>
              {p.reviewCount ? (
                <p className="flex items-center gap-2 text-[15px]">
                  <Stars value={p.avgRating ?? 0} size={16} />
                  <span>
                    {p.avgRating} from {p.reviewCount}
                  </span>
                </p>
              ) : null}
            </div>
            <p className="mt-1 text-[14px] text-ink-soft">Written by Ghummakad Saathi members and stored on this site. These aren&rsquo;t Google reviews.</p>
            {p.reviewCount ? (
              <p className="mt-3 text-[15px]">
                Worth going? <strong>Yes</strong> {worth.yes} · <strong>Depends</strong> {worth.depends} · <strong>No</strong> {worth.no}
              </p>
            ) : null}

            {p.status === "approved" ? (
              <div className="mt-6">
                <ReviewForm placeId={p.id} existing={mine ? { rating: mine.rating, worthGoing: mine.worthGoing, comment: mine.comment } : null} />
                {googleReviewUrl ? (
                  <p className="mt-3 text-[13px] text-ink-soft">
                    Want to review it on Google too?{" "}
                    <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Write a Google review
                    </a>{" "}
                    (opens Google; we don&rsquo;t post anything for you).
                  </p>
                ) : null}
              </div>
            ) : null}

            <ul className="mt-8 space-y-4">
              {p.reviews.map((r) => (
                <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {r.author}
                      {r.mine ? <span className="ml-2 text-[13px] font-normal text-forest">your review</span> : null}
                      {r.isDemo ? <span className="ml-2 rounded bg-sand-soft px-1.5 py-0.5 text-[12px] font-normal">demo</span> : null}
                    </p>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    Worth going: {WORTH_GOING.find((w) => w.id === r.worthGoing)?.label} · {new Date(r.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000 ? " · edited" : ""}
                  </p>
                  {r.comment ? <p className="mt-3 text-[15px]">{r.comment}</p> : null}
                  <div className="mt-3 flex gap-4">
                    {r.mine ? <DeleteReviewButton reviewId={r.id} placeId={p.id} /> : <ReportButton target={{ reviewId: r.id }} />}
                  </div>
                </li>
              ))}
              {!p.reviews.length ? <li className="text-ink-soft">No reviews yet. Been here? Be the first.</li> : null}
            </ul>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <SaveButton placeId={p.id} saved={p.saved} />
          <div className="h-[260px] overflow-hidden rounded-[var(--radius-card)] border border-line">
            <PlaceMap lat={p.lat} lng={p.lng} name={p.name} pending={p.status === "pending"} />
          </div>
          <p className="text-[13px] text-ink-soft">
            Approximate location. <a className="underline" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer">Directions in Google Maps</a>
          </p>
          {!p.mine ? <ReportButton target={{ placeId: p.id }} label="Report this place" /> : null}
        </aside>
      </div>
    </Container>
  );
}
