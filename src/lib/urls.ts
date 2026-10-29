/**
 * Outbound URL safety. Every external link a user can be sent to passes
 * through here: https only, no credentials, no IP literals / private hosts
 * (SSRF + phishing), and partner links restricted to an allowlist.
 */

export const PARTNER_HOSTS = [
  "www.booking.com",
  "booking.com",
  "www.kayak.co.in",
  "www.kayak.com",
  "www.skyscanner.co.in",
  "www.skyscanner.net",
  "www.irctc.co.in",
  "www.district.in",
  "in.bookmyshow.com",
  "www.google.com",
  "maps.google.com",
  "www.openstreetmap.org",
] as const;

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[?::1\]?|\[?fc|\[?fd|.*\.local$|.*\.internal$)/i;
const IP_LITERAL = /^(\d{1,3}\.){3}\d{1,3}$|^\[.*\]$/;

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

export function checkExternalUrl(raw: string, opts: { allowlist?: readonly string[] } = {}): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "Not a valid URL" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "Only https links are allowed" };
  if (url.username || url.password) return { ok: false, reason: "Links must not contain credentials" };
  const host = url.hostname.toLowerCase();
  if (PRIVATE_HOST.test(host) || IP_LITERAL.test(host)) return { ok: false, reason: "Private or IP-address hosts are not allowed" };
  if (!host.includes(".")) return { ok: false, reason: "Host must be a public domain" };
  if (/[^\x20-\x7e]/.test(raw)) return { ok: false, reason: "Links must use plain ASCII (punycode for international domains)" };
  if (opts.allowlist && !opts.allowlist.includes(host)) return { ok: false, reason: "Host is not an approved partner" };
  return { ok: true, url };
}

export function withUtm(url: URL, campaign: string, source = "ghummakad_saathi", medium = "referral"): URL {
  const out = new URL(url.toString());
  out.searchParams.set("utm_source", source);
  out.searchParams.set("utm_medium", medium);
  out.searchParams.set("utm_campaign", campaign);
  return out;
}

export const SPONSORED_REL = "sponsored nofollow noopener noreferrer";
export const REFERRAL_REL = "nofollow noopener noreferrer";
