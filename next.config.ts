import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** PostHog region ("us" or "eu"). Events go through /ingest on our own domain so ad blockers don't drop them. */
const posthogRegion = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

/**
 * Content-Security-Policy. Next.js inline bootstrap scripts need
 * 'unsafe-inline' without a nonce pipeline; everything else is allowlisted.
 * Dodo Payments uses a hosted checkout page (full redirect), so no payment
 * scripts or frames run on our origin.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com https://maps.gstatic.com https://www.clarity.ms https://*.clarity.ms`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://maps.googleapis.com https://places.googleapis.com ${supabase} ${supabase.replace("https://", "wss://")} https://*.clarity.ms https://c.bing.com`.trim(),
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://dodopayments.com https://*.dodopayments.com",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Required by the PostHog /ingest reverse proxy (its API paths end in a slash).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `https://${posthogRegion}-assets.i.posthog.com/static/:path*` },
      { source: "/ingest/array/:path*", destination: `https://${posthogRegion}-assets.i.posthog.com/array/:path*` },
      { source: "/ingest/:path*", destination: `https://${posthogRegion}.i.posthog.com/:path*` },
    ];
  },
  // This app is session-driven (auth, drafts, entitlements) and renders per request.
  cacheComponents: false,
  partialPrefetching: false,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/**": ["./supabase/migrations/**", "./db/local/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
