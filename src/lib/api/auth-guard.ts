import { ApiError } from "@/lib/api/http";
import { loadSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLogs, sessions } from "@/lib/db/schema";
import type { SessionUser } from "@/types";

export async function requireUser(): Promise<SessionUser> {
  const user = await loadSessionUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  if (user.status === "suspended") throw new ApiError(403, "Account suspended");
  return user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super_admin" && user.role !== "team_admin") {
    throw new ApiError(403, "Insufficient permissions");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    throw new ApiError(403, "Super admin access required");
  }
  return user;
}

export async function recordAudit(input: {
  teamId?: string | null;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await db()
      .insert(auditLogs)
      .values({
        teamId: input.teamId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ip: input.ip ?? null,
      });
  } catch (error) {
    console.error("[audit] failed to record", error);
  }
}

export async function startSession(input: {
  userId: string;
  teamId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await db().insert(sessions).values({
      userId: input.userId,
      teamId: input.teamId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    console.error("[session] failed to start", error);
  }
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
