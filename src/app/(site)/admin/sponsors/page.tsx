import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { setBusinessStatusAction } from "@/app/actions/admin";
import { Chip } from "@/components/ui";
import { BusinessForm } from "./business-form";

export default async function AdminSponsors() {
  await requireRole("admin", "/admin/sponsors");
  const rows = await asService((q) =>
    q.query<{ id: string; name: string; service_type: string; website: string | null; status: string; is_demo: boolean; campaigns: number }>(
      `select b.*, (select count(*)::int from public.sponsor_campaign c where c.business_id = b.id) as campaigns
       from public.sponsor_business b order by b.created_at desc`,
    ),
  );
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[40px]">Sponsors</h1>
        <p className="mt-2 text-ink-soft">Approved local businesses. Billing is handled outside the site for now; campaigns are created on the Campaigns page.</p>
      </div>
      <BusinessForm />
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {rows.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">
                {b.name} {b.is_demo ? <Chip tone="sand">demo</Chip> : null}
              </p>
              <p className="text-[13px] capitalize text-ink-soft">
                {b.service_type.replace("_", " ")} · {b.campaigns} campaigns {b.website ? `· ${b.website}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Chip tone={b.status === "active" ? "forest" : "terracotta"}>{b.status}</Chip>
              <form action={setBusinessStatusAction.bind(null, b.id, b.status === "active" ? "suspended" : "active")}>
                <button className="min-h-11 text-[14px] underline">{b.status === "active" ? "Suspend" : "Reactivate"}</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
