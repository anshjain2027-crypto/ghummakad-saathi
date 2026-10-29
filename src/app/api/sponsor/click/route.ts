import { NextResponse, type NextRequest } from "next/server";
import { recordClick } from "@/lib/sponsors";
import { visitorHash } from "@/lib/auth";

/** Signed sponsored-click endpoint → validated advertiser redirect. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const outcome = await recordClick(token, await visitorHash(), request.headers.get("user-agent") ?? "");
  if (!outcome.redirect) return NextResponse.redirect(new URL("/sponsored-disclosure?unavailable=1", request.url));
  const res = NextResponse.redirect(outcome.redirect, 302);
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
