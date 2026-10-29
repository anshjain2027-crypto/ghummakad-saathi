import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { config } from "@/lib/config";

export default async function AdminReferrals() {
  await requireRole("admin", "/admin/referrals");
  const rows = await asService((q) =>
    q.query<{ provider: string; context: string; n: number; affiliate: number }>(
      `select provider, context, count(*)::int n, count(*) filter (where is_affiliate)::int affiliate
       from public.outbound_click where created_at > now() - interval '30 days' group by provider, context order by n desc`,
    ),
  );
  const ids: [string, string | undefined][] = [
    ["Booking.com affiliate ID", config.affiliates.booking],
    ["KAYAK affiliate ID", config.affiliates.kayak],
    ["Skyscanner associate ID", config.affiliates.skyscanner],
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[40px]">Referrals</h1>
        <p className="mt-2 text-ink-soft">Outbound clicks to booking partners over the last 30 days. Affiliate IDs are added as environment variables once each programme approves you.</p>
      </div>
      <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {ids.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3 text-[15px]">
            <dt>{k}</dt>
            <dd className={v ? "font-medium text-forest" : "text-ink-soft"}>{v ? "Configured" : "Not set — links are plain redirects"}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Module</th>
              <th className="p-3 font-medium">Clicks</th>
              <th className="p-3 font-medium">With affiliate tag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.provider}-${r.context}`} className="nums border-b border-line last:border-0">
                <td className="p-3">{r.provider}</td>
                <td className="p-3">{r.context}</td>
                <td className="p-3">{r.n}</td>
                <td className="p-3">{r.affiliate}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="p-4 text-ink-soft">
                  No partner clicks yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
