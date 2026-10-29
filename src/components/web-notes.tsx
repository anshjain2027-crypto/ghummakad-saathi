import { recentTravelNotes } from "@/lib/search/exa";

/** "Recent from the web" — linked, attributed headlines via Exa. Renders nothing without a key or results. */
export async function WebNotes({ destination }: { destination: { id: string; name: string; region: string; country: string } }) {
  const notes = await recentTravelNotes(destination);
  if (!notes.length) return null;
  return (
    <section aria-labelledby="web-notes" className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
      <h2 id="web-notes" className="font-serif text-[22px]">
        Recent from the web
      </h2>
      <p className="mt-1 text-[13px] text-ink-soft">Headlines found by web search. We haven&rsquo;t verified them — check the source before you travel.</p>
      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li key={n.url}>
            <a href={n.url} target="_blank" rel="nofollow noopener noreferrer" className="text-[15px] font-medium text-forest underline-offset-4 hover:underline">
              {n.title}
            </a>
            <p className="text-[13px] text-ink-soft">
              {n.source}
              {n.publishedDate ? ` · ${new Date(n.publishedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
