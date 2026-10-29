import { PGlite } from "@electric-sql/pglite";
import type { Database, Queryable } from "./types";
import { runMigrations } from "./migrate";
import { seedDatabase } from "@/lib/seed";

/**
 * Demo / test driver: a real Postgres compiled to WASM, running in-process.
 * Same migrations, same RLS policies as Supabase (plus a tiny auth shim).
 *
 * `dataDir` persists to disk for local dev; omitted = in-memory (tests, and
 * Vercel previews without DATABASE_URL, where data resets on cold start).
 */
export async function createPgliteDatabase(dataDir?: string, opts: { seed?: boolean } = {}): Promise<Database> {
  const pg = await PGlite.create(dataDir ? { dataDir } : undefined);

  // PGlite is single-connection; serialise transactions so concurrent
  // requests never interleave `set local role` state.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(fn, fn);
    queue = next.catch(() => undefined);
    return next;
  };

  const raw: Queryable = {
    async query<R>(sql: string, params: unknown[] = []) {
      const res = await pg.query<R>(sql, params);
      return res.rows;
    },
  };

  await serial(async () => {
    await runMigrations((sql) => pg.exec(sql).then(() => undefined), raw, { includeLocalShim: true });
    if (opts.seed !== false) {
      await pg.transaction(async (tx) => {
        await seedDatabase({
          async query<R>(sql: string, params: unknown[] = []) {
            return (await tx.query<R>(sql, params)).rows;
          },
        });
      });
    }
  });

  return {
    transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
      return serial(() =>
        pg.transaction(async (tx) =>
          fn({
            async query<R>(sql: string, params: unknown[] = []) {
              return (await tx.query<R>(sql, params)).rows;
            },
          }),
        ),
      );
    },
  };
}
