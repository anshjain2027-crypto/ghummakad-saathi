import { requireRole } from "@/lib/auth";
import { asService, one } from "@/lib/db";
import { integrationSummary } from "@/lib/config";
import { formatInr } from "@/lib/geo";
import { GrantModerator } from "./grant-moderator";

export default async function AdminHome() {
  const user = await requireRole("moderator", "/admin");
  const s = await asService(async (q) => ({
    pending: (await one<{ n: number }>(q, `select count(*)::int n from public.place where status = 'pending' and source = 'community'`))!.n,
    reports: (await one<{ n: number }>(q, `select count(*)::int n from public.review_report where status = 'open'`))!.n,
    users: (await one<{ n: number }>(q, `select count(*)::int n from public.profiles`))!.n,
    paid: (await one<{ n: number; sum: number }>(q, `select count(*)::int n, coalesce(sum(amount_paise),0)::int sum from public.payment_order where status = 'paid'`))!,
    drafts: (await one<{ n: number }>(q, `select count(*)::int n from public.trip_draft where created_at > now() - interval '30 days'`))!.n,
    clicks: (await one<{ n: number; spend: number }>(q, `select count(*)::int n, coalesce(sum(cost_paise),0)::int spend from public.sponsor_click where billable and created_at > now() - interval '30 days'`))!,
    outbound: (await one<{ n: number }>(q, `select count(*)::int n from public.outbound_click where created_at > now() - interval '30 days'`))!.n,
  }));
  const stats: [string, string][] = [
    ["Pending submissions", String(s.pending)],
    ["Open reports", String(s.reports)],
    ["Members", String(s.users)],
    ["Trips planned (30 days)", String(s.drafts)],
    ["Paid orders (all time)", `${s.paid.n} · ${formatInr(s.paid.sum / 100)}`],
    ["Billable ad clicks (30 days)", `${s.clicks.n} · ${formatInr(s.clicks.spend / 100)}`],
    ["Partner referrals (30 days)", String(s.outbound)],
  ];
  return (
    <div className="space-y-10">
      <h1 className="text-[40px]">Overview</h1>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <dt className="text-[14px] text-ink-soft">{k}</dt>
            <dd className="nums mt-1 font-serif text-[30px]">{v}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h2 className="text-[26px]">Integrations right now</h2>
        <dl className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {Object.entries(integrationSummary()).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-5 py-3 text-[15px]">
              <dt className="capitalize text-ink-soft">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      {user.roles.includes("admin") ? <GrantModerator /> : null}
    </div>
  );
}
