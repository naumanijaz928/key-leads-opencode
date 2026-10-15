import { desc, eq } from "drizzle-orm";

import { ok, withRoute } from "@/lib/api/http";
import { requireManager } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles, sessions } from "@/lib/db/schema";

export const GET = withRoute(async () => {
  const actor = await requireManager();

  const where =
    actor.role === "super_admin" || !actor.teamId
      ? undefined
      : eq(sessions.teamId, actor.teamId);

  const rows = await db()
    .select({
      id: sessions.id,
      userId: sessions.userId,
      email: profiles.email,
      fullName: profiles.fullName,
      ip: sessions.ip,
      userAgent: sessions.userAgent,
      createdAt: sessions.createdAt,
      lastActiveAt: sessions.lastActiveAt,
      endedAt: sessions.endedAt,
    })
    .from(sessions)
    .leftJoin(profiles, eq(sessions.userId, profiles.id))
    .where(where)
    .orderBy(desc(sessions.createdAt))
    .limit(300);

  return ok({ items: rows });
});
