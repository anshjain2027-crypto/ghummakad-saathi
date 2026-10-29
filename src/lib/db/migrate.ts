import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Queryable } from "./types";

const root = process.cwd();
export const MIGRATIONS_DIR = path.join(root, "supabase", "migrations");
export const LOCAL_SHIM = path.join(root, "db", "local", "000_supabase_shim.sql");

/** Applies supabase/migrations/*.sql in filename order, once each. */
export async function runMigrations(
  exec: (sql: string) => Promise<void>,
  q: Queryable,
  opts: { includeLocalShim: boolean },
): Promise<string[]> {
  if (opts.includeLocalShim) {
    await exec(await readFile(LOCAL_SHIM, "utf8"));
  }
  await exec(`
    create table if not exists public._app_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
    alter table public._app_migrations enable row level security;
  `);
  const applied = new Set(
    (await q.query<{ name: string }>(`select name from public._app_migrations`)).map((r) => r.name),
  );
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    await exec(await readFile(path.join(MIGRATIONS_DIR, file), "utf8"));
    await q.query(`insert into public._app_migrations (name) values ($1)`, [file]);
    ran.push(file);
  }
  return ran;
}
