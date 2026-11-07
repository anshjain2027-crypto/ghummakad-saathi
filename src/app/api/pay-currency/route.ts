import { NextResponse, type NextRequest } from "next/server";
import { isPayCurrency } from "@/lib/pricing";
import { PAY_CURRENCY_COOKIE } from "@/lib/pay-currency";
import { safeNext } from "@/lib/auth";

/** Lets a visitor switch between paying in rupees (India) and US dollars. */
export async function GET(request: NextRequest) {
  const c = request.nextUrl.searchParams.get("c");
  const next = safeNext(request.nextUrl.searchParams.get("next") ?? "/pricing");
  const res = NextResponse.redirect(new URL(next, request.nextUrl.origin), 303);
  if (isPayCurrency(c)) res.cookies.set(PAY_CURRENCY_COOKIE, c, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return res;
}
