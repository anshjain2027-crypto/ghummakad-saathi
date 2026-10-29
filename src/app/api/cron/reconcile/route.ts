import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { asService } from "@/lib/db";
import { getDodoPayment } from "@/lib/payments/dodo";
import { fulfillOrder, markOrderStatus } from "@/lib/payments/orders";
import { refreshPhotos } from "@/lib/photos";

export const maxDuration = 300;

/**
 * Daily housekeeping (Vercel Cron, see vercel.json):
 *  - reconcile Dodo orders stuck in "pending" that have a known payment id,
 *  - expire stale unpaid orders and drafts,
 *  - prune old rate-limit buckets,
 *  - flag Google-sourced coordinates older than 30 days (Places caching policy).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!config.cronSecret || auth !== `Bearer ${config.cronSecret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const result = { reconciled: 0, expiredOrders: 0, deletedDrafts: 0, prunedBuckets: 0, staleGoogleCoords: 0 };

  if (config.dodo) {
    const pending = await asService((q) =>
      q.query<{ id: string; provider_payment_id: string }>(
        `select id, provider_payment_id from public.payment_order where provider = 'dodo' and status = 'pending' and provider_payment_id is not null and created_at > now() - interval '3 days' limit 50`,
      ),
    );
    for (const o of pending) {
      try {
        const p = await getDodoPayment(o.provider_payment_id);
        if (p.status === "succeeded" && String(p.metadata?.order_id) === o.id) {
          await fulfillOrder(o.id, { providerPaymentId: p.payment_id, paidAt: new Date(p.created_at ?? Date.now()), source: "reconcile", amountPaise: p.total_amount, productId: p.product_cart?.[0]?.product_id ?? null });
          result.reconciled++;
        } else if (p.status === "failed" || p.status === "cancelled") {
          await markOrderStatus(o.id, p.status === "failed" ? "failed" : "cancelled", "Reconciled from provider");
        }
      } catch (e) {
        console.error("reconcile", o.id, e);
      }
    }
  }

  await asService(async (q) => {
    result.expiredOrders = (await q.query(`update public.payment_order set status = 'cancelled', failure_reason = 'Expired unpaid', updated_at = now() where status in ('created','pending') and created_at < now() - interval '3 days' returning id`)).length;
    result.deletedDrafts = (await q.query(`delete from public.trip_draft d where expires_at < now() and not exists (select 1 from public.trip_plan t where t.draft_id = d.id) and not exists (select 1 from public.payment_order o where o.draft_id = d.id) returning id`)).length;
    result.prunedBuckets = (await q.query(`delete from public.rate_limit_bucket where window_start < now() - interval '2 days' returning key`)).length;
    result.staleGoogleCoords = (await q.query(`select id from public.place where coords_source = 'google' and coords_cached_at < now() - interval '30 days'`)).length;
  });
  const photos = await refreshPhotos({ limit: 40 });
  return NextResponse.json({ ok: true, ...result, photos });
}
