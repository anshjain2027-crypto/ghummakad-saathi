import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { addBudgetAction, reverseClickAction, setCampaignStatusAction } from "@/app/actions/admin";
import { formatInr } from "@/lib/geo";
import { Chip, inputClass } from "@/components/ui";
import { CampaignForm } from "./campaign-form";

type Row = {
  id: string; name: string; business: string; status: string; placements: string[]; destination_ids: string[]; start_at: Date; end_at: Date;
  cpc_paise: number; budget_cap_paise: number; spent_paise: number; is_demo: boolean; impressions: number; clicks: number; billable: number; invalid: number;
};

export default async function AdminCampaigns() {
  await requireRole("admin", "/admin/campaigns");
  const { rows, businesses, clicks, destinations, byPlacement } = await asService(async (q) => ({
    rows: await q.query<Row>(
      `select c.id, c.name, b.name as business, c.status, c.placements, c.destination_ids, c.start_at, c.end_at, c.cpc_paise, c.budget_cap_paise, c.spent_paise, c.is_demo,
         (select count(*)::int from public.sponsor_impression i where i.campaign_id = c.id) as impressions,
         (select count(*)::int from public.sponsor_click k where k.campaign_id = c.id) as clicks,
         (select count(*)::int from public.sponsor_click k where k.campaign_id = c.id and k.billable) as billable,
         (select count(*)::int from public.sponsor_click k where k.campaign_id = c.id and not k.billable) as invalid
       from public.sponsor_campaign c join public.sponsor_business b on b.id = c.business_id order by c.created_at desc`,
    ),
    businesses: await q.query<{ id: string; name: string }>(`select id, name from public.sponsor_business where status = 'active' order by name`),
    destinations: await q.query<{ id: string; name: string }>(`select id, name from public.destination order by name`),
    clicks: await q.query<{ id: string; campaign: string; placement: string; billable: boolean; invalid_reason: string | null; cost_paise: number; created_at: Date; reversed_at: Date | null }>(
      `select k.id, c.name as campaign, k.placement, k.billable, k.invalid_reason, k.cost_paise, k.created_at, k.reversed_at
       from public.sponsor_click k join public.sponsor_campaign c on c.id = k.campaign_id order by k.created_at desc limit 50`,
    ),
    byPlacement: await q.query<{ placement: string; day: string; impressions: number; clicks: number }>(
      `select placement, day::text, count(*)::int as impressions, 0 as clicks from public.sponsor_impression
       where day > current_date - 14 group by placement, day order by day desc, placement limit 60`,
    ),
  }));
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[40px]">Campaigns</h1>
        <p className="mt-2 text-ink-soft">Cost-per-click. Clicks from bots, duplicates within 30 minutes, expired links or paused/exhausted campaigns are logged but never billed. Campaigns pause automatically when the budget runs out.</p>
      </div>
      <CampaignForm businesses={businesses} destinations={destinations} />
      <div className="space-y-4">
        {rows.map((c) => (
          <article key={c.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-serif text-[22px]">
                  {c.name} {c.is_demo ? <Chip tone="sand">demo</Chip> : null}
                </p>
                <p className="text-[13px] text-ink-soft">
                  {c.business} · {c.placements.join(", ")} · {c.destination_ids.length ? c.destination_ids.join(", ") : "all destinations"} · {new Date(c.start_at).toLocaleDateString("en-IN")} → {new Date(c.end_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <Chip tone={c.status === "active" ? "forest" : c.status === "exhausted" ? "terracotta" : "plain"}>{c.status}</Chip>
            </div>
            <dl className="nums mt-4 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-5">
              <Stat k="CPC" v={formatInr(c.cpc_paise / 100)} />
              <Stat k="Spent / budget" v={`${formatInr(c.spent_paise / 100)} / ${formatInr(c.budget_cap_paise / 100)}`} />
              <Stat k="Impressions" v={String(c.impressions)} />
              <Stat k="Billable clicks" v={String(c.billable)} />
              <Stat k="Invalid clicks" v={String(c.invalid)} />
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px]">
              {c.status !== "active" ? (
                <form action={setCampaignStatusAction.bind(null, c.id, "active")}>
                  <button className="min-h-11 font-medium text-forest underline">Activate</button>
                </form>
              ) : (
                <form action={setCampaignStatusAction.bind(null, c.id, "paused")}>
                  <button className="min-h-11 underline">Pause</button>
                </form>
              )}
              <form action={setCampaignStatusAction.bind(null, c.id, "ended")}>
                <button className="min-h-11 underline">End</button>
              </form>
              <form action={addBudgetAction.bind(null, c.id)} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`b-${c.id}`}>
                  Add budget in rupees
                </label>
                <input id={`b-${c.id}`} name="addInr" type="number" min={1} placeholder="₹ add" className={`${inputClass} w-28`} />
                <button className="min-h-11 underline">Add budget</button>
              </form>
            </div>
          </article>
        ))}
      </div>

      <section>
        <h2 className="text-[26px]">Recent clicks</h2>
        <p className="mt-1 text-[14px] text-ink-soft">Reverse a billable click if a sponsor disputes it and you agree it was invalid. Spend is restored and the action is audited.</p>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="p-3 font-medium">When</th>
                <th className="p-3 font-medium">Campaign</th>
                <th className="p-3 font-medium">Placement</th>
                <th className="p-3 font-medium">Billed</th>
                <th className="p-3 font-medium">Note</th>
                <th className="p-3 font-medium">Dispute</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((k) => (
                <tr key={k.id} className="border-b border-line last:border-0">
                  <td className="p-3">{new Date(k.created_at).toLocaleString("en-IN")}</td>
                  <td className="p-3">{k.campaign}</td>
                  <td className="p-3">{k.placement}</td>
                  <td className="nums p-3">{k.billable ? formatInr(k.cost_paise / 100) : "—"}</td>
                  <td className="p-3 text-ink-soft">{k.invalid_reason ?? ""}</td>
                  <td className="p-3">
                    {k.billable && !k.reversed_at ? (
                      <form action={reverseClickAction.bind(null, k.id)} className="flex gap-2">
                        <input name="reason" placeholder="Reason" aria-label="Reason" className={`${inputClass} min-h-9 w-36`} />
                        <button className="underline">Reverse</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!clicks.length ? (
                <tr>
                  <td colSpan={6} className="p-4 text-ink-soft">
                    No clicks yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[26px]">Impressions by placement (14 days)</h2>
        <ul className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          {byPlacement.map((r) => (
            <li key={`${r.placement}-${r.day}`} className="nums flex justify-between rounded-[10px] bg-surface px-3 py-2">
              <span>
                {r.day} · {r.placement}
              </span>
              <span>{r.impressions}</span>
            </li>
          ))}
          {!byPlacement.length ? <li className="text-ink-soft">No impressions recorded yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[10px] bg-cream p-3">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
