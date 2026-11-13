import posthog from "posthog-js";

/**
 * PostHog product analytics (page views, sessions). Off unless
 * NEXT_PUBLIC_POSTHOG_KEY is set in Vercel. Requests go through /ingest
 * (rewritten to PostHog in next.config.ts), so the CSP stays 'self'.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key && /^phc_[A-Za-z0-9]+$/.test(key)) {
  try {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "https://eu.posthog.com" : "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  } catch {
    // Analytics must never break the site.
  }
}
