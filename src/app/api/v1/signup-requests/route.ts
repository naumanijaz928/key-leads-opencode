import { desc, eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireSuperAdmin } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { profiles, signupRequests } from "@/lib/db/schema";
import {
  sendEmail,
  signupApprovedEmail,
  signupRejectedEmail,
} from "@/lib/email";
import { approveSignupSchema } from "@/lib/validators";

export const GET = withRoute(async (request) => {
  await requireSuperAdmin();
  const status = new URL(request.url).searchParams.get("status") ?? "pending";

  const rows = await db()
    .select()
    .from(signupRequests)
    .where(eq(signupRequests.status, status))
    .orderBy(desc(signupRequests.createdAt))
    .limit(200);

  return ok({ items: rows });
});

export const POST = withRoute(async (request) => {
  const actor = await requireSuperAdmin();
  const body = validate(approveSignupSchema, await readJson(request));

  const [row] = await db()
    .select()
    .from(signupRequests)
    .where(eq(signupRequests.id, body.id))
    .limit(1);

  if (!row) throw new ApiError(404, "Sign-up request not found");
  if (row.status !== "pending") {
    throw new ApiError(400, "This request has already been decided");
  }

  const approve = body.action === "approve";

  await db()
    .update(signupRequests)
    .set({
      status: approve ? "approved" : "rejected",
      decidedBy: actor.id,
      decidedAt: new Date(),
    })
    .where(eq(signupRequests.id, row.id));

  if (row.userId) {
    await db()
      .update(profiles)
      .set(
        approve
          ? {
              role: body.role,
              status: "active",
              teamId: body.teamId ?? null,
              updatedAt: new Date(),
            }
          : { status: "suspended", updatedAt: new Date() },
      )
      .where(eq(profiles.id, row.userId));
  }

  const template = approve ? signupApprovedEmail() : signupRejectedEmail();
  await sendEmail({
    to: row.email,
    subject: template.subject,
    html: template.html,
  });

  return ok({ success: true, status: approve ? "approved" : "rejected" });
});
