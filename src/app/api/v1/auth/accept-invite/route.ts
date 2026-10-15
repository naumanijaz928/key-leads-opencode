import { eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { clientIp, recordAudit, startSession } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { invitations, profiles, teamMembers } from "@/lib/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptInviteSchema } from "@/lib/validators";

export const POST = withRoute(async (request) => {
  const body = validate(acceptInviteSchema, await readJson(request));

  const [invitation] = await db()
    .select()
    .from(invitations)
    .where(eq(invitations.token, body.token))
    .limit(1);

  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.status !== "pending") {
    throw new ApiError(400, "This invitation has already been used");
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "This invitation has expired");
  }

  const email = invitation.email.toLowerCase();
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.fullName },
  });

  let userId = data?.user?.id ?? null;

  if (!userId) {
    const existing = await db()
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    userId = existing[0]?.id ?? null;
  }

  if (!userId) {
    throw new ApiError(400, error?.message ?? "Could not create account");
  }

  await db()
    .insert(profiles)
    .values({
      id: userId,
      email,
      fullName: body.fullName,
      role: invitation.role,
      status: "active",
      teamId: invitation.teamId,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: body.fullName,
        role: invitation.role,
        status: "active",
        teamId: invitation.teamId,
      },
    });

  if (invitation.teamId) {
    await db()
      .insert(teamMembers)
      .values({
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      })
      .onConflictDoNothing();
  }

  await db()
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id));

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password: body.password });

  await startSession({
    userId,
    teamId: invitation.teamId,
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  await recordAudit({
    actorId: userId,
    teamId: invitation.teamId,
    action: "auth.accept_invite",
    entityType: "invitation",
    entityId: invitation.id,
  });

  return ok({ status: "active" });
});
