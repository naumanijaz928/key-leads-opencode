import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validators";

export const POST = withRoute(async (request) => {
  const body = validate(forgotPasswordSchema, await readJson(request));
  const origin = new URL(request.url).origin;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(body.email.toLowerCase(), {
    redirectTo: `${origin}/reset-password`,
  });

  return ok({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
});
