import { asc, eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireSuperAdmin } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles, teams } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { adminUpdateUserSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  await requireSuperAdmin();

  const rows = await db()
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
      status: profiles.status,
      teamId: profiles.teamId,
      teamName: teams.name,
      createdAt: profiles.createdAt,
      lastSeenAt: profiles.lastSeenAt,
    })
    .from(profiles)
    .leftJoin(teams, eq(profiles.teamId, teams.id))
    .orderBy(asc(profiles.createdAt));

  return ok({ items: rows });
});

export const PATCH = withRoute(async (request) => {
  const actor = await requireSuperAdmin();
  const body = validate(adminUpdateUserSchema, await readJson(request));

  if (body.id === actor.id && body.status && body.status !== "active") {
    throw new ApiError(400, "You cannot disable your own account");
  }

  const [user] = await db()
    .update(profiles)
    .set({
      role: body.role ?? undefined,
      status: body.status ?? undefined,
      teamId: body.teamId === undefined ? undefined : body.teamId,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, body.id))
    .returning();

  if (!user) throw new ApiError(404, "User not found");

  return ok({ user: { ...user, slug: slugify(user.fullName ?? user.email ?? "") } });
});
