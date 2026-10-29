import { requireRole } from "@/lib/auth";
import { asService } from "@/lib/db";
import { formatInr } from "@/lib/geo";
import { Chip } from "@/components/ui";
import { config } from "@/lib/config";
import { getDodoSetup } from "@/lib/payments/dodo";
import { DodoSetupButton } from "./dodo-setup";

export default async function AdminPayments() {
  await requireRole("admin", "/admin/payments");
  const { orders, events } = await asService(async (q) => ({
    orders: await q.query<{ id: string; email: string; purpose: string; tier: string; travellers: number; amount_paise: number; provider: string; status: string; failure_reason: string | null; created_at: Date; paid_at: Date | null }>(
      `select o.id, u.email, o.purpose, o.tier, o.travellers, o.amount_paise, o.provider, o.status, o.failure_reason, o.created_at, o.paid_at
       from public.payment_order o join auth.users u on u.id = o.user_id order by o.created_at desc limit 100`,
    ),
    events: await q.query<{ provider: string; event_type: string; signature_valid: boolean; received_at: Date; order_id: string | null }>(
      `select provider, event_type, signature_valid, received_at, order_id from public.payment_event order by received_at desc limit 30`,
    ),
  }));
  const setup = await getDodoSetup();
  const items = [
    { label: "API key", ok: Boolean(config.dodo) },
    { label: "₹499 product", ok: Boolean(setup.products.standard) },
    { label: "₹999 product", ok: Boolean(setup.products.group) },
    { label: "₹500 upgrade product", ok: Boolean(setup.products.upgrade) },
    { label: "Webhook", ok: Boolean(setup.webhookSecret) },
  ];
  const allDone = items.every((i) => i.ok);
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[40px]">Payments</h1>
        <p className="mt-2 text-ink-soft">Every order and provider event. Access is granted only by verified confirmation; duplicate events are ignored.</p>
      </div>
      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="font-serif text-[24px]">Dodo Payments {config.dodo ? (config.dodo.testMode ? "· Test Mode" : "· Live") : ""}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i.label}>
              <Chip tone={i.ok ? "forest" : "terracotta"}>
                {i.ok ? "✓" : "✗"} {i.label}
              </Chip>
            </li>
          ))}
        </ul>
        {config.dodo ? (
          <>
            <p className="mt-3 text-[14px] text-ink-soft">
              One click creates the three products in INR (taxes included) and the webhook to {config.appUrl}/api/payments/webhook. Safe to press again — it never creates duplicates.
            </p>
            <DodoSetupButton done={allDone} />
          </>
        ) : (
          <p className="mt-3 text-[14px] text-ink-soft">
            Add <code>DODO_PAYMENTS_API_KEY</code> in Vercel → Settings → Environment Variables (mark it Sensitive), redeploy, then come back here.
          </p>
        )}
      </section>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              {["Created", "Customer", "Purpose", "Group", "Amount", "Provider", "Status"].map((h) => (
                <th key={h} className="p-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3">{new Date(o.created_at).toLocaleString("en-IN")}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3">{o.purpose.replace("_", " ")}</td>
                <td className="p-3">
                  {o.tier === "group" ? "5+" : "1–4"} ({o.travellers})
                </td>
                <td className="nums p-3">{formatInr(o.amount_paise / 100)}</td>
                <td className="p-3">{o.provider}</td>
                <td className="p-3">
                  <Chip tone={o.status === "paid" ? "forest" : o.status === "failed" ? "terracotta" : "plain"}>{o.status}</Chip>
                  {o.failure_reason ? <span className="ml-2 text-[12px] text-ink-soft">{o.failure_reason}</span> : null}
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan={7} className="p-4 text-ink-soft">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <section>
        <h2 className="text-[26px]">Provider events</h2>
        <ul className="mt-3 space-y-2 text-[14px]">
          {events.map((e, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 rounded-[10px] bg-surface px-3 py-2">
              <span>
                {e.provider} · {e.event_type} · {e.signature_valid ? "signature ok" : "signature INVALID"}
              </span>
              <span className="text-ink-soft">{new Date(e.received_at).toLocaleString("en-IN")}</span>
            </li>
          ))}
          {!events.length ? <li className="text-ink-soft">No webhook events yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
