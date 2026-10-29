import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { moderationQueue } from "@/lib/data/community";
import { resolveReportAction } from "@/app/actions/community";
import { Button, Empty } from "@/components/ui";

export default async function AdminReports() {
  await requireRole("moderator", "/admin/reviews");
  const { reports } = await moderationQueue();
  return (
    <div>
      <h1 className="text-[40px]">Reports</h1>
      <p className="mt-2 text-ink-soft">Upholding a report hides the review (or removes the community place). Every decision is logged.</p>
      <div className="mt-8 space-y-4">
        {reports.length === 0 ? (
          <Empty title="No open reports" />
        ) : (
          reports.map((r) => (
            <article key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <p className="text-[13px] font-semibold capitalize text-terracotta-deep">{r.reason.replace("_", " ")}</p>
              <p className="mt-1">&ldquo;{r.target}&rdquo;</p>
              {r.details ? <p className="mt-1 text-[14px] text-ink-soft">Reporter: {r.details}</p> : null}
              <p className="mt-2 text-[13px] text-ink-soft">
                {r.reviewId ? "Review" : "Place"} · {new Date(r.createdAt).toLocaleString("en-IN")}
                {r.placeId ? (
                  <>
                    {" "}
                    · <Link className="underline" href={`/places/${r.placeId}`}>Open place</Link>
                  </>
                ) : null}
              </p>
              <div className="mt-4 flex gap-3">
                <form action={resolveReportAction.bind(null, r.id, "upheld")}>
                  <Button type="submit" variant="danger">
                    Uphold and hide
                  </Button>
                </form>
                <form action={resolveReportAction.bind(null, r.id, "dismissed")}>
                  <Button type="submit" variant="secondary">
                    Dismiss
                  </Button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
