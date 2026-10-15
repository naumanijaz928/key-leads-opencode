import { and, asc, eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireManager, requireSuperAdmin } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles, teamMembers } from "@/lib/db/schema";
import { teamMemberSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute<Ctx>(async (_request, context) => {
  const actor = await requireManager();
  const { id } = await context.params;

  if (actor.role !== "super_admin" && actor.teamId && actor.teamId !== id) {
    throw new ApiError(403, "You can only view your own team");
  }

  const rows = await db()
    .select({
      userId: teamMembers.userId,
      role: teamMembers.role,
      createdAt: teamMembers.createdAt,
      email: profiles.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(teamMembers)
    .leftJoin(profiles, eq(teamMembers.userId, profiles.id))
    .where(eq(teamMembers.teamId, id))
    .orderBy(asc(teamMembers.createdAt));

  return ok({ items: rows });
});

export const POST = withRoute<Ctx>(async (request, context) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const raw = (await readJson(request)) as Record<string, unknown>;
  const body = validate(teamMemberSchema, { ...raw, teamId: id });

  const userRows = await db()
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, body.userId))
    .limit(1);

  if (userRows.length === 0) throw new ApiError(404, "User not found");

  await db()
    .insert(teamMembers)
    .values({ teamId: id, userId: body.userId, role: body.role })
    .onConflictDoUpdate({
      target: [teamMembers.teamId, teamMembers.userId],
      set: { role: body.role },
    });

  await db()
    .update(profiles)
    .set({ teamId: id, role: body.role, updatedAt: new Date() })
    .where(eq(profiles.id, body.userId));

  return ok({ success: true }, 201);
});

export const DELETE = withRoute<Ctx>(async (request, context) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) throw new ApiError(400, "Missing userId");

  await db()
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, userId)));

  return ok({ success: true });
});
