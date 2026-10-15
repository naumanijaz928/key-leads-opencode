import { and, eq } from "drizzle-orm";

import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { recordAudit, requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { leadHides, leads } from "@/lib/db/schema";
import { hideLeadSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute<Ctx>(async (request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const body = validate(hideLeadSchema, await readJson(request).catch(() => ({})));

  await db()
    .insert(leadHides)
    .values({
      leadId: id,
      userId: user.id,
      reason: body.reason,
      note: body.note ?? null,
    })
    .onConflictDoUpdate({
      target: [leadHides.leadId, leadHides.userId],
      set: { reason: body.reason, note: body.note ?? null },
    });

  await db()
    .update(leads)
    .set({ verdict: "reject", rejectReason: body.reason, updatedAt: new Date() })
    .where(eq(leads.id, id));

  await recordAudit({
    actorId: user.id,
    teamId: user.teamId,
    action: "lead.hide",
    entityType: "lead",
    entityId: id,
    metadata: { reason: body.reason },
  });

  return ok({ hidden: true });
});

export const DELETE = withRoute<Ctx>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  await db()
    .delete(leadHides)
    .where(and(eq(leadHides.leadId, id), eq(leadHides.userId, user.id)));

  await db()
    .update(leads)
    .set({ verdict: "lead", rejectReason: null, updatedAt: new Date() })
    .where(eq(leads.id, id));

  return ok({ hidden: false });
});
