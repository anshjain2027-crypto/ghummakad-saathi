import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { setProviderModeAction } from "@/app/actions/admin";
import { inputClass } from "@/components/ui";

const MODES = [
  ["mock", "Demo / mock"],
  ["redirect", "Outbound redirect"],
  ["sandbox_approved", "Sandbox approved"],
  ["approved_api", "Production approved"],
  ["disabled", "Unavailable"],
] as const;

export default async function ProviderStatus() {
  await requireRole("admin", "/admin/provider-status");
  const rows = await asService((q) =>
    q.query<{ provider: string; category: string; mode: string; notes: string; docs_url: string | null; verified_at: Date | null }>(
      `select provider, category, mode, notes, docs_url, verified_at from public.provider_adapter_status order by category, provider`,
    ),
  );
  return (
    <div>
      <h1 className="text-[40px]">Providers</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Record what each partner has actually approved. Only change a provider to &ldquo;Production approved&rdquo; once you have a signed agreement and credentials — an open-source SDK or scraper is not permission.
      </p>
      <ul className="mt-8 space-y-3">
        {rows.map((r) => (
          <li key={r.provider} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-serif text-[22px]">{r.provider.replace("_", " ")}</p>
              <p className="text-[13px] capitalize text-ink-soft">
                {r.category} · verified {r.verified_at ? new Date(r.verified_at).toLocaleDateString("en-IN") : "never"}
              </p>
            </div>
            <p className="mt-1 text-[14px]">{r.notes}</p>
            {r.docs_url ? (
              <a href={r.docs_url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-forest underline">
                Partner documentation
              </a>
            ) : null}
            <form action={setProviderModeAction.bind(null, r.provider)} className="mt-3 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`m-${r.provider}`}>
                Mode
              </label>
              <select id={`m-${r.provider}`} name="mode" defaultValue={r.mode} className={`${inputClass} w-56`}>
                {MODES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input name="notes" placeholder="Note (optional)" aria-label="Note" className={`${inputClass} w-64`} />
              <button className="min-h-11 px-2 text-[14px] font-medium text-forest underline">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
