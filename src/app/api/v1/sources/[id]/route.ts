import { ApiError, ok, readJson, withRoute } from "@/lib/api/http";
import { requireSuperAdmin, requireUser } from "@/lib/api/auth-guard";
import { setSourceEnabled } from "@/features/sources/api/queries";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withRoute<Ctx>(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = (await readJson(request)) as { enabled?: boolean };

  if (typeof body.enabled !== "boolean") {
    throw new ApiError(422, "enabled must be a boolean");
  }

  if (user.role === "member") {
    await requireSuperAdmin();
  }

  const source = await setSourceEnabled(id, body.enabled);
  if (!source) throw new ApiError(404, "Source not found");

  return ok({ source });
});
