import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { authMode, safeNext, supabaseServer } from "@/lib/auth";

/** Supabase email-link sign-in (PKCE `code`, or `token_hash` templates). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  if (authMode !== "supabase") return NextResponse.redirect(new URL("/sign-in", url));

  const sb = await supabaseServer();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  if (error) return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}&error=link`, url));
  return NextResponse.redirect(new URL(next, url));
}
