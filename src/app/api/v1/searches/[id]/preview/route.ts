import { ok, readJson, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { normalizeConfig, previewSearch } from "@/features/searches/api/queries";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute<Ctx>(async (request, context) => {
  await requireUser();
  await context.params;
  const body = (await readJson(request).catch(() => ({}))) as {
    config?: unknown;
  };

  const config = normalizeConfig(body.config);
  return ok(await previewSearch(config));
});
