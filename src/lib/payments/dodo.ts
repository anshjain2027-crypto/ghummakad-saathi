import "server-only";
import { Webhook } from "standardwebhooks";
import { config } from "@/lib/config";
import type { Tier } from "@/lib/pricing";

/**
 * Dodo Payments (merchant of record) — hosted checkout.
 * Docs (verified 29 Oct 2026):
 *   POST /checkouts           https://docs.dodopayments.com/api-reference/checkout-sessions/create
 *   GET  /payments/{id}       https://docs.dodopayments.com/api-reference/payments/get-payments-1
 *   Webhooks: Standard Webhooks (webhook-id / webhook-timestamp / webhook-signature)
 */

export type DodoPurpose = "trip_purchase" | "tier_upgrade" | "renewal";

export function dodoProductFor(purpose: DodoPurpose, tier: Tier): string | undefined {
  const p = config.dodo?.products;
  if (!p) return undefined;
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
export function verifyDodoWebhook(rawBody: string, headers: Headers): DodoWebhookEvent {
  const secret = config.dodo?.webhookKey;
  if (!secret) throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not set");
  const wh = new Webhook(secret);
  return wh.verify(rawBody, {
    "webhook-id": headers.get("webhook-id") ?? "",
    "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
    "webhook-signature": headers.get("webhook-signature") ?? "",
  }) as DodoWebhookEvent;
}
