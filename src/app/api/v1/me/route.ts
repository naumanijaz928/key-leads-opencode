import { eq } from "drizzle-orm";

import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { updateProfileSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  const user = await requireUser();
  return ok({ user });
});

export const PATCH = withRoute(async (request) => {
  const user = await requireUser();
  const body = validate(updateProfileSchema, await readJson(request));

  const [updated] = await db()
    .update(profiles)
    .set({
      fullName: body.fullName ?? undefined,
      avatarUrl: body.avatarUrl ?? undefined,
      timezone: body.timezone ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id))
    .returning({
      id: profiles.id,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      timezone: profiles.timezone,
    });

  return ok({ user: updated });
});
