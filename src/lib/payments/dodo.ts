import "server-only";
import { Webhook } from "standardwebhooks";
import { config } from "@/lib/config";
import { asService, one, type Queryable } from "@/lib/db";
import type { Tier } from "@/lib/pricing";

/**
 * Dodo Payments (merchant of record) — hosted checkout.
 * Docs (verified 29 Oct 2026):
 *   POST /checkouts           https://docs.dodopayments.com/api-reference/checkout-sessions/create
 *   GET  /payments/{id}       https://docs.dodopayments.com/api-reference/payments/get-payments-1
 *   Webhooks: Standard Webhooks (webhook-id / webhook-timestamp / webhook-signature)
 */

export type DodoPurpose = "trip_purchase" | "tier_upgrade" | "renewal";

/**
 * Products + webhook secret can come from env vars (take priority) or from the
 * one-click admin setup, which stores them in app_setting (service-role only;
 * RLS has no policies on that table, so no browser client can read it).
 */
export type DodoSetup = {
  products: { standard?: string; group?: string; upgrade?: string };
  webhookId?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  completedAt?: string;
};

export const dodoSettingKey = () => `dodo_setup:${config.dodo?.testMode === false ? "live" : "test"}`;

async function readStoredSetup(q?: Queryable): Promise<DodoSetup> {
  const read = (qq: Queryable) =>
    one<{ value: DodoSetup | string }>(qq, `select value from public.app_setting where key = $1`, [dodoSettingKey()]);
  const row = q ? await read(q) : await asService(read);
  if (!row) return { products: {} };
  const v = typeof row.value === "string" ? (JSON.parse(row.value) as DodoSetup) : row.value;
  return { ...v, products: v.products ?? {} };
}

export async function getDodoSetup(q?: Queryable): Promise<DodoSetup> {
  const stored = config.dodo ? await readStoredSetup(q).catch(() => ({ products: {} }) as DodoSetup) : ({ products: {} } as DodoSetup);
  const envP: DodoSetup["products"] = config.dodo?.products ?? {};
  return {
    ...stored,
    products: {
      standard: envP.standard || stored.products.standard,
      group: envP.group || stored.products.group,
      upgrade: envP.upgrade || stored.products.upgrade,
    },
    webhookSecret: config.dodo?.webhookKey || stored.webhookSecret,
  };
}

export async function dodoProductFor(purpose: DodoPurpose, tier: Tier, q?: Queryable): Promise<string | undefined> {
  if (!config.dodo) return undefined;
  const p = (await getDodoSetup(q)).products;
  if (purpose === "tier_upgrade") return p.upgrade;
  return tier === "group" ? p.group : p.standard;
}

async function dodoFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!config.dodo) throw new Error("Dodo Payments is not configured");
  const res = await fetch(`${config.dodo.baseUrl}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${config.dodo.apiKey}`, "content-type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Dodo ${init.method ?? "GET"} ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function createDodoCheckout(args: {
  orderId: string;
  productId: string;
  email: string;
  name: string;
  returnUrl: string;
  cancelUrl: string;
  purpose: DodoPurpose;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  const body = {
    product_cart: [{ product_id: args.productId, quantity: 1 }],
    customer: { email: args.email, name: args.name },
    return_url: args.returnUrl,
    cancel_url: args.cancelUrl,
    metadata: { order_id: args.orderId, purpose: args.purpose, app: "ghummakad-saathi" },
  };
  const res = await dodoFetch<{ session_id: string; checkout_url: string | null }>(`/checkouts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.checkout_url) throw new Error("Dodo did not return a checkout URL");
  return { sessionId: res.session_id, checkoutUrl: res.checkout_url };
}

export type DodoPayment = {
  payment_id: string;
  status: string | null;
  total_amount: number;
  currency: string;
  metadata: Record<string, string | number | boolean>;
  checkout_session_id?: string | null;
  product_cart?: { product_id: string; quantity: number }[] | null;
  created_at?: string;
};

export async function getDodoPayment(paymentId: string): Promise<DodoPayment> {
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(paymentId)) throw new Error("Invalid payment id");
  return dodoFetch<DodoPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export type DodoWebhookEvent = {
  business_id?: string;
  type: string;
  timestamp: string;
  data: DodoPayment & { payload_type?: string };
};

/** Verifies a Standard Webhooks signature over the RAW body. Throws on failure. */
export async function verifyDodoWebhook(rawBody: string, headers: Headers): Promise<DodoWebhookEvent> {
  const secret = (await getDodoSetup()).webhookSecret;
  if (!secret) throw new Error("Dodo webhook secret is not set");
  const wh = new Webhook(secret);
  return wh.verify(rawBody, {
    "webhook-id": headers.get("webhook-id") ?? "",
    "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
    "webhook-signature": headers.get("webhook-signature") ?? "",
  }) as DodoWebhookEvent;
}

// ---------------------------------------------------------------------------
// One-click setup (admin only). Idempotent: reuses anything already created.
// Docs: POST /products, POST /webhooks, GET /webhooks/{id}/secret
// ---------------------------------------------------------------------------

const PRODUCT_SPECS = [
  { slot: "standard", name: "Ghummakad Saathi Trip Plan (1-4 travellers)", paise: 49900, description: "One personalised trip plan for 1-4 travellers with 30 days of unlimited edits." },
  { slot: "group", name: "Ghummakad Saathi Trip Plan (5+ travellers)", paise: 99900, description: "One personalised trip plan for 5 or more travellers with 30 days of unlimited edits." },
  { slot: "upgrade", name: "Ghummakad Saathi Group Upgrade (4 to 5+ travellers)", paise: 50000, description: "Upgrade an existing 1-4 traveller trip plan to 5+ travellers." },
] as const;

export const DODO_WEBHOOK_EVENTS = ["payment.succeeded", "payment.failed", "payment.cancelled", "payment.processing"];

export type DodoSetupResult = { ok: boolean; steps: string[]; error?: string; setup?: DodoSetup };

export async function runDodoSetup(webhookUrl: string): Promise<DodoSetupResult> {
  if (!config.dodo) return { ok: false, steps: [], error: "Add DODO_PAYMENTS_API_KEY in Vercel first, then redeploy." };
  const steps: string[] = [];
  const setup = await readStoredSetup();
  const envP = config.dodo.products;
  try {
    for (const spec of PRODUCT_SPECS) {
      if (envP[spec.slot]) {
        steps.push(`${spec.name}: using the product ID from Vercel settings.`);
        continue;
      }
      if (setup.products[spec.slot]) {
        steps.push(`${spec.name}: already created (${setup.products[spec.slot]}).`);
        continue;
      }
      const created = await dodoFetch<{ product_id: string }>(`/products`, {
        method: "POST",
        body: JSON.stringify({
          name: spec.name,
          description: spec.description,
          tax_category: "digital_products",
          price: { type: "one_time_price", currency: "INR", price: spec.paise, discount: 0, purchasing_power_parity: false, tax_inclusive: true },
        }),
      });
      setup.products[spec.slot] = created.product_id;
      await saveSetup(setup);
      steps.push(`${spec.name}: created (${created.product_id}).`);
    }

    if (config.dodo.webhookKey) {
      steps.push("Webhook: using the signing secret from Vercel settings.");
    } else if (setup.webhookId && setup.webhookSecret && setup.webhookUrl === webhookUrl) {
      steps.push(`Webhook: already set up for ${webhookUrl}.`);
    } else {
      const wh = await dodoFetch<{ id: string }>(`/webhooks`, {
        method: "POST",
        body: JSON.stringify({ url: webhookUrl, description: "Ghummakad Saathi website", filter_types: DODO_WEBHOOK_EVENTS }),
      });
      const sec = await dodoFetch<{ secret: string }>(`/webhooks/${encodeURIComponent(wh.id)}/secret`);
      setup.webhookId = wh.id;
      setup.webhookSecret = sec.secret;
      setup.webhookUrl = webhookUrl;
      await saveSetup(setup);
      steps.push(`Webhook: created for ${webhookUrl}.`);
    }
    setup.completedAt = new Date().toISOString();
    await saveSetup(setup);
    return { ok: true, steps, setup };
  } catch (e) {
    return { ok: false, steps, error: e instanceof Error ? e.message : String(e) };
  }
}

async function saveSetup(setup: DodoSetup) {
  await asService((q) =>
    q.query(
      `insert into public.app_setting (key, value, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [dodoSettingKey(), JSON.stringify(setup)],
    ),
  );
}
