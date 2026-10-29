import { NextResponse, type NextRequest } from "next/server";
import { asService } from "@/lib/db";
import { getCurrentUser, visitorHash } from "@/lib/auth";
import { checkExternalUrl, PARTNER_HOSTS } from "@/lib/urls";

/**
 * Outbound partner handoff (Booking.com, KAYAK, IRCTC…). Only allowlisted
 * partner hosts; counts the referral without sensitive details.
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? "";
  const provider = (request.nextUrl.searchParams.get("p") ?? "unknown").slice(0, 40);
  const context = (request.nextUrl.searchParams.get("c") ?? "trip").slice(0, 40);
  const check = checkExternalUrl(u, { allowlist: PARTNER_HOSTS });
  if (!check.ok) return NextResponse.redirect(new URL("/my/trips?link=blocked", request.url));
  const user = await getCurrentUser().catch(() => null);
  const session = await visitorHash();
  await asService((q) =>
    q.query(
      `insert into public.outbound_click (user_id, session_hash, provider, target_host, context, is_affiliate) values ($1, $2, $3, $4, $5, $6)`,
      [user?.id ?? null, session, provider, check.url.hostname, context, /[?&](aid|a|associateid)=/.test(check.url.search)],
    ),
  ).catch(() => undefined);
  const res = NextResponse.redirect(check.url.toString(), 302);
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
