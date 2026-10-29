import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Compact signed token: base64url(json).hexsig — used for sessions and ad-click links. */
export function signToken(payload: object, purpose: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmacHex(`${config.sessionSecret}:${purpose}`, body);
  return `${body}.${sig}`;
}

export function verifyToken<T>(token: string | undefined, purpose: string): T | undefined {
  if (!token) return undefined;
  const [body, sig] = token.split(".");
  if (!body || !sig || !/^[0-9a-f]+$/.test(sig)) return undefined;
  const expected = hmacHex(`${config.sessionSecret}:${purpose}`, body);
  if (!safeEqualHex(sig, expected)) return undefined;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}
