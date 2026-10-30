import { NextResponse, type NextRequest } from "next/server";
import { asService } from "@/lib/db";
import { config, integrationSummary } from "@/lib/config";

type AiCheck = { endpoint: string; ok: boolean; modelListed: boolean | null; status: number | null };
let aiCache: { at: number; result: AiCheck[] } | null = null;

/** Checks the AI key is valid and the model exists via GET /models (no tokens spent). Cached 10 min. */
async function checkAi(): Promise<AiCheck[]> {
  if (aiCache && Date.now() - aiCache.at < 10 * 60_000) return aiCache.result;
  const eps = [config.llm.primary, config.llm.fallback].filter((e): e is NonNullable<typeof e> => !!e);
  const result = await Promise.all(
    eps.map(async (ep): Promise<AiCheck> => {
      const host = new URL(ep.baseUrl).host;
      try {
        const res = await fetch(`${ep.baseUrl.replace(/\/$/, "")}/models`, { headers: { authorization: `Bearer ${ep.apiKey}` }, signal: AbortSignal.timeout(6000), cache: "no-store" });
        if (!res.ok) return { endpoint: `${ep.label} (${host})`, ok: false, modelListed: null, status: res.status };
        const body = (await res.json().catch(() => null)) as { data?: { id: string }[] } | null;
        const ids = body?.data?.map((m) => m.id) ?? [];
        return { endpoint: `${ep.label} (${host})`, ok: true, modelListed: ids.length ? ids.includes(ep.model) : null, status: res.status };
      } catch {
        return { endpoint: `${ep.label} (${host})`, ok: false, modelListed: null, status: null };
      }
    }),
  );
  aiCache = { at: Date.now(), result };
  return result;
}

/** Liveness + database check (no secrets). `?deep=1` also verifies the AI endpoints. */
export async function GET(request: NextRequest) {
  try {
    const r = await asService((q) => q.query<{ n: number }>(`select count(*)::int as n from public.destination`));
    const deep = request.nextUrl.searchParams.get("deep") === "1";
    return NextResponse.json({ ok: true, destinations: r[0]?.n ?? 0, integrations: integrationSummary(), ...(deep ? { ai: await checkAi() } : {}) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 200) }, { status: 503 });
  }
}
