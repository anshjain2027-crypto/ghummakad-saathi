import "server-only";
import { asService, one } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres, so it works across
 * serverless instances. Returns false when the caller is over the limit.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const row = await asService((q) =>
    one<{ count: number }>(
      q,
      `insert into public.rate_limit_bucket (key, window_start, count)
       values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
       on conflict (key, window_start) do update set count = public.rate_limit_bucket.count + 1
       returning count`,
      [key, windowSeconds],
    ),
  );
  return (row?.count ?? 0) <= limit;
}

export class RateLimitedError extends Error {
  constructor(message = "You're doing that a bit fast. Please wait a moment and try again.") {
    super(message);
  }
}
