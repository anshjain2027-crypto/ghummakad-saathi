import { NextResponse } from "next/server";
import { asService } from "@/lib/db";
import { integrationSummary } from "@/lib/config";

/** Liveness + database check (no secrets). */
export async function GET() {
  try {
    const r = await asService((q) => q.query<{ n: number }>(`select count(*)::int as n from public.destination`));
    return NextResponse.json({ ok: true, destinations: r[0]?.n ?? 0, integrations: integrationSummary() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 200) }, { status: 503 });
  }
}
