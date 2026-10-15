import { ok, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { leadViews } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute<Ctx>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  await db()
    .insert(leadViews)
    .values({ leadId: id, userId: user.id })
    .onConflictDoNothing();

  return ok({ viewed: true });
});
