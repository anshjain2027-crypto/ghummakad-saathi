import "server-only";
import { config } from "@/lib/config";
import type { Queryable, Database } from "./types";
import { createPgliteDatabase } from "./pglite";
import { createPostgresDatabase } from "./postgres";
import { CATALOGUE_VERSION, seedDatabase } from "@/lib/seed";

export type { Queryable } from "./types";

declare global {
   
  var __gsDb: Promise<Database> | undefined;
}

function getDatabase(): Promise<Database> {
  if (!globalThis.__gsDb) {
    globalThis.__gsDb = config.db.url ? bootPostgres(config.db.url) : createPgliteDatabase(config.db.pgliteDir);
  }
  return globalThis.__gsDb;
}

/** Production: (re)seed the editorial catalogue on boot when its version changes (idempotent upserts). */
async function bootPostgres(url: string): Promise<Database> {
  const db = createPostgresDatabase(url);
  try {
    await db.transaction(async (q) => {
      const r = await q.query<{ v: unknown }>(`select value as v from public.app_setting where key = 'catalogue_version'`);
      const current = r[0]?.v;
      const version = typeof current === "string" && current.startsWith('"') ? JSON.parse(current) : current;
      if (version !== CATALOGUE_VERSION) {
        await q.query(`select pg_advisory_xact_lock(4207001)`);
        const again = await q.query<{ v: unknown }>(`select value as v from public.app_setting where key = 'catalogue_version'`);
        const v2 = again[0]?.v;
        if ((typeof v2 === "string" && v2.startsWith('"') ? JSON.parse(v2) : v2) !== CATALOGUE_VERSION) await seedDatabase(q, { demo: false });
      }
    });
  } catch (e) {
    console.error("catalogue seed check failed", e);
  }
  return db;
}

/**
 * Privileged access. Bypasses RLS. Only call after an explicit server-side
 * authorisation check (payments, entitlements, moderation, sponsor billing).
 */
export async function asService<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  return db.transaction(fn);
}

/** Run as a signed-in user. Every statement is filtered by RLS policies. */
export async function asUser<T>(userId: string, fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  return db.transaction(async (q) => {
    await q.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await q.query(`set local role authenticated`);
    return fn(q);
  });
}

/** Run as an anonymous visitor (role `anon`). */
export async function asAnon<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await getDatabase();
  return db.transaction(async (q) => {
    await q.query(`select set_config('request.jwt.claims', '', true)`);
    await q.query(`set local role anon`);
    return fn(q);
  });
}

export async function one<T>(q: Queryable, sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q.query<T>(sql, params);
  return rows[0];
}
