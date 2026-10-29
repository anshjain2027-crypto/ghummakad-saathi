import postgres from "postgres";
import type { Database, Queryable } from "./types";

/**
 * Production driver: Supabase Postgres via the connection pooler.
 * `prepare: false` is required for Supabase's transaction-mode pooler (port 6543).
 */
export function createPostgresDatabase(url: string): Database {
  const sql = postgres(url, {
    prepare: false,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
    types: {
      // Return bigint / numeric as JS numbers for counts and scores.
      bigint: postgres.BigInt,
    },
  });

  return {
    async transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
      return (await sql.begin(async (tx) => {
        const q: Queryable = {
          async query<R>(text: string, params: unknown[] = []) {
            const rows = await tx.unsafe(text, params as never[]);
            return normaliseRows(rows as unknown as R[]);
          },
        };
        return fn(q);
      })) as T;
    },
  };
}

function normaliseRows<R>(rows: R[]): R[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      out[k] = typeof v === "bigint" ? Number(v) : v;
    }
    return out as R;
  });
}
