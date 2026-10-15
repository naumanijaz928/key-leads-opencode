import { eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { recordAudit, requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { companies, leads } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { importLeadSchema } from "@/lib/validators";

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const POST = withRoute(async (request) => {
  const user = await requireUser();
  const body = validate(importLeadSchema, await readJson(request));

  const dedupKey = `manual:${body.url}`;

  const existing = await db()
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.dedupKey, dedupKey))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError(409, "This job is already imported");
  }

  const domain = domainFromUrl(body.url);
  let companyId: string | null = null;

  if (body.company) {
    const slug = slugify(body.company);
    const [company] = await db()
      .insert(companies)
      .values({
        teamId: user.teamId,
        name: body.company,
        slug,
        domain,
        sources: [body.source],
      })
      .onConflictDoUpdate({
        target: [companies.teamId, companies.slug],
        set: { updatedAt: new Date() },
      })
      .returning({ id: companies.id });
    companyId = company?.id ?? null;
  }

  const [lead] = await db()
    .insert(leads)
    .values({
      teamId: user.teamId,
      source: body.source,
      sourceJobId: body.url,
      url: body.url,
      applyUrl: body.url,
      title: body.title ?? "Imported job",
      companyId,
      companyName: body.company ?? null,
      location: body.location ?? null,
      tech: body.tech ?? [],
      verdict: "lead",
      dedupKey,
      raw: { importedBy: user.id },
    })
    .returning({ id: leads.id });

  await recordAudit({
    actorId: user.id,
    teamId: user.teamId,
    action: "lead.import",
    entityType: "lead",
    entityId: lead.id,
  });

  return ok({ lead }, 201);
});
