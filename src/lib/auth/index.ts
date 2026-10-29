import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { config } from "@/lib/config";
import { asService, one } from "@/lib/db";
import { randomInt } from "node:crypto";
import { sha256, signToken, verifyToken } from "@/lib/crypto";

export type Role = "moderator" | "admin";
export type SessionUser = { id: string; email: string; displayName: string; roles: Role[] };

const SESSION_COOKIE = "gs_session";
const SESSION_TTL_S = 60 * 60 * 24 * 14;

/** Supabase Auth is only used when Supabase is fully configured (auth + database). */
export const authMode: "supabase" | "demo" = config.supabase && config.db.url ? "supabase" : "demo";

export async function supabaseServer() {
  if (!config.supabase) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const c of list) store.set(c.name, c.value, c.options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

async function resolveIdentity(): Promise<{ id: string; email: string } | null> {
  if (authMode === "supabase") {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    if (!data.user?.email) return null;
    return { id: data.user.id, email: data.user.email };
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = verifyToken<{ uid: string; email: string; exp: number }>(token, "session");
  if (!session || session.exp * 1000 < Date.now()) return null;
  return { id: session.uid, email: session.email };
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const identity = await resolveIdentity();
  if (!identity) return null;
  return asService(async (q) => {
    if (config.adminEmails.includes(identity.email.toLowerCase())) {
      await q.query(
        `insert into public.user_roles (user_id, role) values ($1, 'admin') on conflict do nothing`,
        [identity.id],
      );
    }
    const profile = await one<{ display_name: string }>(q, `select display_name from public.profiles where id = $1`, [
      identity.id,
    ]);
    const roles = await q.query<{ role: Role }>(`select role from public.user_roles where user_id = $1`, [identity.id]);
    return {
      id: identity.id,
      email: identity.email,
      displayName: profile?.display_name ?? identity.email.split("@")[0],
      roles: roles.map((r) => r.role),
    };
  });
});

export function hasRole(user: SessionUser | null, role: Role): boolean {
  if (!user) return false;
  return user.roles.includes("admin") || user.roles.includes(role);
}

export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(safeNext(next))}`);
  return user;
}

export async function requireRole(role: Role, next = "/admin"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!hasRole(user, role)) redirect("/?denied=1");
  return user;
}

/** Only same-site relative paths may be used as post-sign-in destinations (no open redirects). */
export function safeNext(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next.slice(0, 500);
}

// ───────────── Sign-in flows ─────────────

export type StartResult = { ok: true; demoCode?: string } | { ok: false; error: string };

export async function startEmailSignIn(email: string, next = "/"): Promise<StartResult> {
  if (authMode === "supabase") {
    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${config.appUrl}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
    });
    if (error) {
      const limited = error.status === 429 || /rate limit/i.test(error.message ?? "");
      console.error("supabase signInWithOtp failed", error.status, error.code ?? error.message);
      return {
        ok: false,
        error: limited
          ? "We've sent a sign-in email recently. Please check your inbox (and spam) for the latest one, or try again in a few minutes."
          : "We couldn't send a code just now. Please try again in a minute.",
      };
    }
    return { ok: true };
  }
  // Demo mode: generate a code and show it on screen (no email is sent).
  // On a public production deployment, privileged accounts never use on-screen codes.
  if (config.isProd) {
    const privileged =
      config.adminEmails.includes(email.toLowerCase()) ||
      (await asService((q) =>
        one(
          q,
          `select 1 from public.user_roles r join auth.users u on u.id = r.user_id where lower(u.email) = lower($1)`,
          [email],
        ),
      ));
    if (privileged) return { ok: false, error: "Admin accounts need Supabase Auth on a production deployment." };
  }
  const code = String(randomInt(100000, 1000000));
  await asService((q) =>
    q.query(
      `insert into auth.demo_otp (email, code_hash, attempts, expires_at) values ($1, $2, 0, now() + interval '10 minutes')
       on conflict (email) do update set code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at`,
      [email, sha256(`${email}:${code}`)],
    ),
  );
  return { ok: true, demoCode: code };
}

export async function verifyEmailCode(email: string, code: string): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  if (authMode === "supabase") {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.user) return { ok: false, error: "That code didn't work. Check it and try again." };
    return { ok: true, userId: data.user.id };
  }
  const result = await asService(async (q) => {
    const row = await one<{ code_hash: string; attempts: number; expired: boolean }>(
      q,
      `update auth.demo_otp set attempts = attempts + 1 where email = $1
       returning code_hash, attempts, expires_at < now() as expired`,
      [email],
    );
    if (!row || row.expired || row.attempts > 5) return null;
    if (row.code_hash !== sha256(`${email}:${code}`)) return null;
    await q.query(`delete from auth.demo_otp where email = $1`, [email]);
    const user = await one<{ id: string }>(
      q,
      `insert into auth.users (email) values ($1) on conflict (email) do update set email = excluded.email returning id`,
      [email],
    );
    return user?.id ?? null;
  });
  if (!result) return { ok: false, error: "That code didn't work or has expired. Request a new one." };
  const store = await cookies();
  store.set(SESSION_COOKIE, signToken({ uid: result, email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }, "session"), {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
    maxAge: SESSION_TTL_S,
  });
  return { ok: true, userId: result };
}

export async function signOut() {
  if (authMode === "supabase") {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/** Stable, non-identifying per-browser hash for dedupe (ads, outbound clicks). */
export async function visitorHash(): Promise<string> {
  const vid = (await cookies()).get("gs_vid")?.value ?? "no-visitor-cookie";
  return sha256(`${config.sessionSecret}:vid:${vid}`).slice(0, 32);
}
