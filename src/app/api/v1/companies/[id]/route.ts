import { eq } from "drizzle-orm";

import { ApiError, ok, readJson, validate, withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { getCompany, getCompanyLeads } from "@/features/companies/api/queries";
import { companyUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute<Ctx>(async (_request, context) => {
  await requireUser();
  const { id } = await context.params;

  const company = await getCompany(id);
  if (!company) throw new ApiError(404, "Company not found");

  const companyLeads = await getCompanyLeads(id);
  return ok({ company, leads: companyLeads });
});

export const PATCH = withRoute<Ctx>(async (request, context) => {
  await requireUser();
  const { id } = await context.params;
  const body = validate(companyUpdateSchema, await readJson(request));

  const [company] = await db()
    .update(companies)
    .set({
      status: body.status ?? undefined,
      ownerId: body.ownerId ?? undefined,
      notes: body.notes ?? undefined,
      website: body.website ?? undefined,
      location: body.location ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, id))
    .returning();

  if (!company) throw new ApiError(404, "Company not found");

  return ok({ company });
});
