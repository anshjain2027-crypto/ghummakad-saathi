import { NextResponse, type NextRequest } from "next/server";
import { recordImpression } from "@/lib/sponsors";
import { visitorHash } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const ua = request.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|headless/i.test(ua)) return NextResponse.json({ ok: true, counted: false });
  const body = (await request.json().catch(() => ({}))) as { t?: string };
  const counted = body.t ? await recordImpression(body.t, await visitorHash()) : false;
  return NextResponse.json({ ok: true, counted });
}
