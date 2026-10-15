import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireManager } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { invitations, profiles, teams } from "@/lib/db/schema";
import { inviteEmail, sendEmail } from "@/lib/email";
import { inviteSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  const actor = await requireManager();

  const where =
    actor.role === "super_admin" || !actor.teamId
      ? undefined
      : eq(invitations.teamId, actor.teamId);

  const rows = await db()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      teamId: invitations.teamId,
      teamName: teams.name,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .leftJoin(teams, eq(invitations.teamId, teams.id))
    .where(where)
    .orderBy(desc(invitations.createdAt))
    .limit(200);

  return ok({ items: rows });
});

export const POST = withRoute(async (request) => {
  const actor = await requireManager();
  const body = validate(inviteSchema, await readJson(request));

  const email = body.email.toLowerCase();
  const teamId =
    actor.role === "super_admin" ? (body.teamId ?? null) : actor.teamId;
  const role =
    actor.role === "super_admin"
      ? body.role
      : body.role === "super_admin"
        ? "member"
        : body.role;

  const existingProfile = await db()
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existingProfile.length > 0) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invitation] = await db()
    .insert(invitations)
    .values({
      email,
      role,
      teamId,
      token,
      invitedBy: actor.id,
      expiresAt,
    })
    .returning();

  const origin = new URL(request.url).origin;
  const link = `${origin}/accept-invite?token=${token}`;
  const template = inviteEmail({
    link,
    role,
    inviter: actor.fullName ?? undefined,
  });
  await sendEmail({ to: email, subject: template.subject, html: template.html });

  return ok({ invitation, inviteLink: link }, 201);
});

export const DELETE = withRoute(async (request) => {
  const actor = await requireManager();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "Missing invitation id");

  const where =
    actor.role === "super_admin" || !actor.teamId
      ? eq(invitations.id, id)
      : and(eq(invitations.id, id), eq(invitations.teamId, actor.teamId));

  await db().delete(invitations).where(where);

  return ok({ success: true });
});
