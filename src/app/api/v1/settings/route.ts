import { eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { settings, teams } from "@/lib/db/schema";
import { settingsSchema } from "@/lib/validators";

const DEFAULTS: Record<string, unknown> = {
  default_window_hours: 72,
  default_remote_policy: "remote_only",
  email_notifications: true,
  export_format: "csv",
  attribution_enabled: true,
};

async function resolveTeamId(userTeamId: string | null, role: string) {
  if (userTeamId) return userTeamId;
  if (role !== "super_admin") return null;
  const [team] = await db().select({ id: teams.id }).from(teams).limit(1);
  return team?.id ?? null;
}

export const GET = withRoute(async () => {
  const user = await requireUser();
  const teamId = await resolveTeamId(user.teamId, user.role);
  if (!teamId) return ok({ data: DEFAULTS, teamId: null });

  const [row] = await db()
    .select()
    .from(settings)
    .where(eq(settings.teamId, teamId))
    .limit(1);

  return ok({ data: { ...DEFAULTS, ...(row?.data ?? {}) }, teamId });
});

export const PATCH = withRoute(async (request) => {
  const user = await requireUser();
  const teamId = await resolveTeamId(user.teamId, user.role);
  if (!teamId) throw new ApiError(400, "No team assigned to this account");

  const body = validate(settingsSchema, await readJson(request));

  const [existing] = await db()
    .select()
    .from(settings)
    .where(eq(settings.teamId, teamId))
    .limit(1);

  const merged = { ...DEFAULTS, ...(existing?.data ?? {}), ...body.data };

  await db()
    .insert(settings)
    .values({ teamId, data: merged })
    .onConflictDoUpdate({
      target: settings.teamId,
      set: { data: merged, updatedAt: new Date() },
    });

  return ok({ data: merged });
});
