import { describe, expect, test } from "vitest";
import { checkExternalUrl, PARTNER_HOSTS, withUtm } from "@/lib/urls";

describe("external URL safety", () => {
  test.each([
    ["http://example.com", "https"],
    ["https://user:pw@example.com", "credentials"],
    ["https://127.0.0.1/admin", "Private"],
    ["https://localhost:3000", "Private"],
    ["https://192.168.1.4", "Private"],
    ["https://10.0.0.1", "Private"],
    ["https://[::1]/", "Private"],
    ["https://intranet/", "public domain"],
    ["javascript:alert(1)", "https"],
    ["not a url", "valid"],
  ])("rejects %s", (raw, reason) => {
    const r = checkExternalUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(reason);
  });

  test("accepts a normal https link", () => {
    expect(checkExternalUrl("https://example.com/stay?x=1").ok).toBe(true);
  });

  test("allowlist blocks look-alike partner hosts", () => {
    expect(checkExternalUrl("https://www.booking.com/searchresults.html", { allowlist: PARTNER_HOSTS }).ok).toBe(true);
    expect(checkExternalUrl("https://booking.com.evil.example/x", { allowlist: PARTNER_HOSTS }).ok).toBe(false);
  });

  test("adds UTM tags", () => {
    const u = withUtm(new URL("https://example.com/a?b=1"), "spring");
    expect(u.searchParams.get("utm_campaign")).toBe("spring");
    expect(u.searchParams.get("b")).toBe("1");
  });
});
