import { ApiError, ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { cancelRun, getRunWithSources } from "@/features/runs/executor";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute<Ctx>(async (_request, context) => {
  await requireUser();
  const { id } = await context.params;
  const result = await getRunWithSources(id);
  if (!result) throw new ApiError(404, "Run not found");
  return ok(result);
});

export const DELETE = withRoute<Ctx>(async (_request, context) => {
  await requireUser();
  const { id } = await context.params;
  await cancelRun(id);
  return ok({ success: true });
});
