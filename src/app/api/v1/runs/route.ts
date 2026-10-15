import { eq } from "drizzle-orm";

import { ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser, recordAudit } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { searches, sources } from "@/lib/db/schema";
import { createRun, listRuns, startRun } from "@/features/runs/executor";
import { createRunSchema } from "@/lib/validators";

export const GET = withRoute(async () => {
  await requireUser();
  return ok({ items: await listRuns() });
});

export const POST = withRoute(async (request) => {
  const user = await requireUser();
  const body = validate(createRunSchema, await readJson(request));

  let sourceKeys = body.sources ?? [];

  if (sourceKeys.length === 0) {
    const enabled = await db()
      .select({ key: sources.key })
      .from(sources)
      .where(eq(sources.enabled, true));
    sourceKeys = enabled.map((row) => row.key);
  }

  let searchId = body.searchId ?? null;
  if (!searchId) {
    const [defaultSearch] = await db()
      .select({ id: searches.id })
      .from(searches)
      .where(eq(searches.isDefault, true))
      .limit(1);
    searchId = defaultSearch?.id ?? null;
  }

  const run = await createRun({
    teamId: user.teamId,
    startedBy: user.id,
    searchId,
    sourceKeys,
  });

  startRun(run.id);

  await recordAudit({
    teamId: user.teamId,
    actorId: user.id,
    action: "run.create",
    entityType: "run",
    entityId: run.id,
    metadata: { sourceKeys, searchId },
  });

  return ok({ run }, 201);
});
