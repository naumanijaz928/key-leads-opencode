import { and, eq } from "drizzle-orm";

import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { recordAudit, requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { leadApplications, leads } from "@/lib/db/schema";
import { applyLeadSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute<Ctx>(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = validate(applyLeadSchema, await readJson(request).catch(() => ({})));

  await db()
    .insert(leadApplications)
    .values({ leadId: id, userId: user.id, status: body.status, note: body.note })
    .onConflictDoUpdate({
      target: [leadApplications.leadId, leadApplications.userId],
      set: { status: body.status, note: body.note ?? null },
    });

  await db()
    .update(leads)
    .set({ pipeline: "applied", updatedAt: new Date() })
    .where(eq(leads.id, id));

  await recordAudit({
    actorId: user.id,
    teamId: user.teamId,
    action: "lead.apply",
    entityType: "lead",
    entityId: id,
  });

  return ok({ applied: true });
});

export const DELETE = withRoute<Ctx>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  await db()
    .delete(leadApplications)
    .where(
      and(eq(leadApplications.leadId, id), eq(leadApplications.userId, user.id)),
    );

  await db()
    .update(leads)
    .set({ pipeline: "new", updatedAt: new Date() })
    .where(eq(leads.id, id));

  return ok({ applied: false });
});
