import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { asUser } from "@/lib/db";

/** Data export (DPDP-style access request): everything this user can read about themselves, via RLS. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const data = await asUser(user.id, async (q) => ({
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, display_name: user.displayName },
    private_pins: await q.query(`select * from public.private_saved_place`),
    submissions: await q.query(`select id, name, category, description, lat, lng, status, created_at from public.place where created_by = auth.uid()`),
    reviews: await q.query(`select * from public.place_review where user_id = auth.uid()`),
    reports: await q.query(`select * from public.review_report where reporter_id = auth.uid()`),
    trips: await q.query(`select * from public.trip_plan`),
    trip_versions: await q.query(`select trip_id, version, change_summary, created_at from public.trip_edit_history`),
    payments: await q.query(`select id, purpose, tier, amount_paise, currency, status, created_at, paid_at from public.payment_order`),
    entitlements: await q.query(`select * from public.trip_entitlement`),
  }));
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="ghummakad-saathi-data.json"` },
  });
}
