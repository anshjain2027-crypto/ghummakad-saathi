import "server-only";
import type { Queryable } from "@/lib/db";

export async function audit(
  q: Queryable,
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {},
) {
  await q.query(
    `insert into public.admin_audit_log (actor_id, action, target_type, target_id, details) values ($1, $2, $3, $4, $5)`,
    [actorId, action, targetType, targetId, JSON.stringify(details)],
  );
}
