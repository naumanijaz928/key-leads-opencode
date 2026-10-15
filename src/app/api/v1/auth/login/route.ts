import { eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { clientIp, recordAudit, startSession } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";

export const POST = withRoute(async (request) => {
  const body = validate(loginSchema, await readJson(request));
  const email = body.email.toLowerCase();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });

  if (error || !data.user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const rows = await db()
    .select({
      id: profiles.id,
      role: profiles.role,
      status: profiles.status,
      teamId: profiles.teamId,
    })
    .from(profiles)
    .where(eq(profiles.id, data.user.id))
    .limit(1);

  const profile = rows[0];

  if (!profile || profile.status === "suspended") {
    await supabase.auth.signOut();
    throw new ApiError(403, "This account is not active");
  }

  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  await recordAudit({
    actorId: profile.id,
    teamId: profile.teamId,
    action: "auth.login",
    ip,
  });

  if (profile.status === "pending") {
    return ok({ status: "pending" });
  }

  await startSession({
    userId: profile.id,
    teamId: profile.teamId,
    ip,
    userAgent,
  });

  return ok({ status: "active", role: profile.role });
});
