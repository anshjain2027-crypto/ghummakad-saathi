import "server-only";
import { z } from "zod";

/**
 * Single source of truth for runtime configuration. Every integration is
 * optional: when its keys are absent the app runs in a clearly-labelled
 * demo/fixture mode instead of pretending to be live.
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: optional,
  SESSION_SECRET: optional,
  ADMIN_EMAILS: optional,
  DEMO_MODE: optional,

  DATABASE_URL: optional,
  NEXT_PUBLIC_SUPABASE_URL: optional,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optional,

  DODO_PAYMENTS_API_KEY: optional,
  DODO_PAYMENTS_WEBHOOK_KEY: optional,
  DODO_PAYMENTS_ENVIRONMENT: optional,
  DODO_PRODUCT_STANDARD: optional,
  DODO_PRODUCT_GROUP: optional,
  DODO_PRODUCT_UPGRADE: optional,

  NEXT_PUBLIC_GOOGLE_MAPS_KEY: optional,
  NEXT_PUBLIC_GOOGLE_MAP_ID: optional,
  GOOGLE_MAPS_SERVER_KEY: optional,

  LLM_BASE_URL: optional,
  LLM_API_KEY: optional,
  LLM_MODEL: optional,
  LLM_FALLBACK_BASE_URL: optional,
  LLM_FALLBACK_API_KEY: optional,
  LLM_FALLBACK_MODEL: optional,
  LLM_DAILY_CALLS_PER_USER: optional,

  EXA_API_KEY: optional,

  BOOKING_AFFILIATE_ID: optional,
  KAYAK_AFFILIATE_ID: optional,
  SKYSCANNER_AFFILIATE_ID: optional,

  CRON_SECRET: optional,
  PGLITE_DATA_DIR: optional,
});

const env = EnvSchema.parse(process.env);

const isProd = env.NODE_ENV === "production";
const demoMode = env.DEMO_MODE === "true" || (!env.DATABASE_URL && env.DEMO_MODE !== "false");

if (isProd && !env.SESSION_SECRET && !demoMode) {
  throw new Error("SESSION_SECRET is required in production.");
}

export const config = {
  env: env.NODE_ENV,
  isProd,
  /** Demo mode = local PGlite database + demo sign-in + mock payments. */
  demoMode,
  appUrl: env.APP_URL ?? "http://localhost:3000",
  sessionSecret: env.SESSION_SECRET ?? "dev-only-insecure-session-secret-change-me-please",
  adminEmails: (env.ADMIN_EMAILS ?? (demoMode && !isProd ? "admin@ghummakad.demo" : ""))
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  db: {
    url: env.DATABASE_URL,
    pgliteDir: env.PGLITE_DATA_DIR,
  },

  supabase:
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? { url: env.NEXT_PUBLIC_SUPABASE_URL, anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
      : undefined,

  dodo: env.DODO_PAYMENTS_API_KEY
    ? {
        apiKey: env.DODO_PAYMENTS_API_KEY,
        webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
        testMode: env.DODO_PAYMENTS_ENVIRONMENT !== "live_mode",
        baseUrl:
          env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
            ? "https://live.dodopayments.com"
            : "https://test.dodopayments.com",
        products: {
          standard: env.DODO_PRODUCT_STANDARD,
          group: env.DODO_PRODUCT_GROUP,
          upgrade: env.DODO_PRODUCT_UPGRADE,
        },
      }
    : undefined,

  maps: {
    browserKey: env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    mapId: env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    serverKey: env.GOOGLE_MAPS_SERVER_KEY ?? env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  },

  llm: {
    primary:
      env.LLM_BASE_URL && env.LLM_API_KEY && env.LLM_MODEL
        ? { baseUrl: env.LLM_BASE_URL, apiKey: env.LLM_API_KEY, model: env.LLM_MODEL, label: "primary" }
        : undefined,
    fallback:
      env.LLM_FALLBACK_BASE_URL && env.LLM_FALLBACK_API_KEY && env.LLM_FALLBACK_MODEL
        ? {
            baseUrl: env.LLM_FALLBACK_BASE_URL,
            apiKey: env.LLM_FALLBACK_API_KEY,
            model: env.LLM_FALLBACK_MODEL,
            label: "fallback",
          }
        : undefined,
    dailyCallsPerUser: Number(env.LLM_DAILY_CALLS_PER_USER ?? 200),
  },

  exaKey: env.EXA_API_KEY,

  affiliates: {
    booking: env.BOOKING_AFFILIATE_ID,
    kayak: env.KAYAK_AFFILIATE_ID,
    skyscanner: env.SKYSCANNER_AFFILIATE_ID,
  },

  cronSecret: env.CRON_SECRET,
} as const;

export type IntegrationMode = "live" | "test" | "demo";

/** Human-readable integration state, used by /admin/provider-status and footers. */
export function integrationSummary() {
  return {
    database: config.db.url ? "Supabase Postgres" : "Local demo database (PGlite)",
    auth: config.supabase ? "Supabase Auth (email code)" : "Demo sign-in (code shown on screen)",
    payments: config.dodo
      ? config.dodo.testMode
        ? "Dodo Payments test mode"
        : "Dodo Payments live"
      : "Demo payment gateway (no money moves)",
    maps: config.maps.browserKey ? "Google Maps" : "Preview map (OpenStreetMap tiles)",
    ai: config.llm.primary ? `LLM: ${config.llm.primary.model}` : "Deterministic planner (no LLM key)",
    search: config.exaKey ? "Exa web search" : "Off",
  };
}
