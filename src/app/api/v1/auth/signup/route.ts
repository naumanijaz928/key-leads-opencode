import { eq, sql } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { db } from "@/lib/db";
import { profiles, signupRequests } from "@/lib/db/schema";
import { sendEmail, signupReceivedEmail } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { signupSchema } from "@/lib/validators";

export const POST = withRoute(async (request) => {
  const body = validate(signupSchema, await readJson(request));
  const email = body.email.toLowerCase();

  const existing = await db()
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const [countRow] = await db()
    .select({ value: sql<number>`count(*)::int` })
    .from(profiles);

  const isFirstUser = (countRow?.value ?? 0) === 0;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.fullName },
  });

  if (error || !data.user) {
    throw new ApiError(400, error?.message ?? "Could not create account");
  }

  const userId = data.user.id;

  await db().insert(profiles).values({
    id: userId,
    email,
    fullName: body.fullName,
    role: isFirstUser ? "super_admin" : "member",
    status: isFirstUser ? "active" : "pending",
  });

  if (!isFirstUser) {
    await db().insert(signupRequests).values({
      userId,
      email,
      fullName: body.fullName,
      note: body.note ?? null,
      status: "pending",
    });
  }

  const template = signupReceivedEmail();
  await sendEmail({ to: email, subject: template.subject, html: template.html });

  return ok({
    status: isFirstUser ? "active" : "pending",
    message: isFirstUser
      ? "Account created. You are the first user, so you have super admin access."
      : "Request received. A super admin will review your account.",
  });
});
