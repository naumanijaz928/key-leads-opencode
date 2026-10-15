import { ApiError, ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { getLead } from "@/features/leads/api/queries";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute<Ctx>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  const lead = await getLead(user.id, id);
  if (!lead) throw new ApiError(404, "Lead not found");

  return ok({ lead });
});
