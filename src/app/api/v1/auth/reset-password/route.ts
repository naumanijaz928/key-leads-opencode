import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { recordAudit } from "@/lib/api/auth-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validators";

export const POST = withRoute(async (request) => {
  const body = validate(resetPasswordSchema, await readJson(request));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError(401, "Reset link is invalid or has expired");
  }

  const { error } = await supabase.auth.updateUser({ password: body.password });
  if (error) throw new ApiError(400, error.message);

  await recordAudit({ actorId: user.id, action: "auth.password_reset" });

  return ok({ success: true });
});
