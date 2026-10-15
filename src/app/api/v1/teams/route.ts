import { asc, eq, sql } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireManager, requireSuperAdmin } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { teamMembers, teams } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { createTeamSchema, updateTeamSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  const actor = await requireManager();

  const where =
    actor.role === "super_admin" || !actor.teamId
      ? undefined
      : eq(teams.id, actor.teamId);

  const rows = await db()
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt,
      memberCount: sql<number>`count(${teamMembers.userId})::int`,
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(where)
    .groupBy(teams.id)
    .orderBy(asc(teams.name));

  return ok({ items: rows });
});

export const POST = withRoute(async (request) => {
  const actor = await requireSuperAdmin();
  const body = validate(createTeamSchema, await readJson(request));

  const slug = slugify(body.name);
  const existing = await db()
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError(409, "A team with a similar name already exists");
  }

  const [team] = await db()
    .insert(teams)
    .values({ name: body.name, slug, ownerId: actor.id })
    .returning();

  return ok({ team }, 201);
});

export const PATCH = withRoute(async (request) => {
  await requireSuperAdmin();
  const body = validate(updateTeamSchema, await readJson(request));
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "Missing team id");

  const [team] = await db()
    .update(teams)
    .set({ name: body.name ?? undefined, updatedAt: new Date() })
    .where(eq(teams.id, id))
    .returning();

  if (!team) throw new ApiError(404, "Team not found");

  return ok({ team });
});

export const DELETE = withRoute(async (request) => {
  await requireSuperAdmin();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "Missing team id");

  await db().delete(teams).where(eq(teams.id, id));

  return ok({ success: true });
});
