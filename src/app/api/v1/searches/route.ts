import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { createSearch, listSearches } from "@/features/searches/api/queries";
import { searchSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  await requireUser();
  return ok({ items: await listSearches() });
});

export const POST = withRoute(async (request) => {
  const user = await requireUser();
  const body = validate(searchSchema, await readJson(request));

  const profile = await createSearch({
    name: body.name,
    description: body.description ?? null,
    isDefault: body.isDefault,
    priority: body.priority,
    config: body.config,
    teamId: user.teamId,
    createdBy: user.id,
  });

  return ok({ profile }, 201);
});
