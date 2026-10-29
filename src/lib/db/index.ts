import "server-only";
import { config } from "@/lib/config";
import type { Queryable, Database } from "./types";
import { createPgliteDatabase } from "./pglite";
import { createPostgresDatabase } from "./postgres";
import { seedDatabase } from "@/lib/seed";

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

/** Production: seed the editorial catalogue on first boot if it is empty (idempotent). */
async function bootPostgres(url: string): Promise<Database> {
  const db = createPostgresDatabase(url);
  try {
    await db.transaction(async (q) => {
      const r = await q.query<{ n: number }>(`select count(*)::int as n from public.destination`);
      if (Number(r[0]?.n ?? 0) === 0) await seedDatabase(q, { demo: false });
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
