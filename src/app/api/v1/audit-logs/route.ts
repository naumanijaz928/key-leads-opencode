import { desc, eq } from "drizzle-orm";

import { ok, withRoute } from "@/lib/api/http";
import { requireManager } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";

export const GET = withRoute(async (request) => {
  const actor = await requireManager();
  const params = new URL(request.url).searchParams;
  const limit = Math.min(300, Number(params.get("limit") ?? 150) || 150);

  const where =
    actor.role === "super_admin" || !actor.teamId
      ? undefined
      : eq(auditLogs.teamId, actor.teamId);

  const rows = await db()
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
      actorName: profiles.fullName,
      actorEmail: profiles.email,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return ok({ items: rows });
});
