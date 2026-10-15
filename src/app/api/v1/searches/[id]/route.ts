import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import {
  deleteSearch,
  getSearch,
  updateSearch,
} from "@/features/searches/api/queries";
import { searchSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute<Ctx>(async (_request, context) => {
  await requireUser();
  const { id } = await context.params;
  const profile = await getSearch(id);
  if (!profile) throw new ApiError(404, "Search not found");
  return ok({ profile });
});

export const PATCH = withRoute<Ctx>(async (request, context) => {
  await requireUser();
  const { id } = await context.params;
  const body = validate(searchSchema.partial(), await readJson(request));

  const profile = await updateSearch(id, {
    name: body.name,
    description: body.description,
    isDefault: body.isDefault,
    priority: body.priority,
    config: body.config,
  });

  if (!profile) throw new ApiError(404, "Search not found");
  return ok({ profile });
});

export const DELETE = withRoute<Ctx>(async (_request, context) => {
  await requireUser();
  const { id } = await context.params;
  await deleteSearch(id);
  return ok({ success: true });
});
