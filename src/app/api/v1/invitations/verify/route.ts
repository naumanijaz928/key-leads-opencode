import { eq } from "drizzle-orm";

import { ok, withRoute } from "@/lib/api/http";
import { db } from "@/lib/db";
import { invitations, teams } from "@/lib/db/schema";

export const GET = withRoute(async (request) => {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return ok({ valid: false, reason: "missing_token" });
  }

  const rows = await db()
    .select({
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      teamName: teams.name,
    })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .where(eq(invitations.token, token))
    .limit(1);

  const invitation = rows[0];

  if (!invitation) return ok({ valid: false, reason: "not_found" });
  if (invitation.status !== "pending") {
    return ok({ valid: false, reason: "used" });
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    return ok({ valid: false, reason: "expired" });
  }

  return ok({
    valid: true,
    email: invitation.email,
    role: invitation.role,
    teamName: invitation.teamName,
  });
});
