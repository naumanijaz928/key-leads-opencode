import { and, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  companies,
  hideReasons,
  leadApplications,
  leadHides,
  leadViews,
  leads,
} from "@/lib/db/schema";
import type { Lead, Paginated, WorkMode } from "@/types";

export interface LeadFilters {
  q?: string;
  source?: string;
  verdict?: string;
  workMode?: string;
  company?: string;
  pipeline?: string;
  tech?: string;
  scope?: "all" | "viewed" | "applied" | "hidden" | "unseen";
  sort?: "recent" | "oldest" | "priority" | "company";
  page?: number;
  pageSize?: number;
}

const leadSelection = {
  id: leads.id,
  source: leads.source,
  sourceJobId: leads.sourceJobId,
  url: leads.url,
  applyUrl: leads.applyUrl,
  title: leads.title,
  companyId: leads.companyId,
  companyName: leads.companyName,
  companyLogo: leads.companyLogo,
  location: leads.location,
  country: leads.country,
  workMode: leads.workMode,
  workType: leads.workType,
  remoteScope: leads.remoteScope,
  regions: leads.regions,
  languages: leads.languages,
  seniority: leads.seniority,
  level: leads.level,
  minYears: leads.minYears,
  salaryMin: leads.salaryMin,
  salaryMax: leads.salaryMax,
  salaryCurrency: leads.salaryCurrency,
  salaryText: leads.salaryText,
  tech: leads.tech,
  tags: leads.tags,
  shortJd: leads.shortJd,
  description: leads.description,
  postedAt: leads.postedAt,
  verdict: leads.verdict,
  rejectReason: leads.rejectReason,
  score: leads.score,
  priority: leads.priority,
  pipeline: leads.pipeline,
  searchId: leads.searchId,
  runId: leads.runId,
  createdAt: leads.createdAt,
  updatedAt: leads.updatedAt,
};

type LeadRow = {
  [K in keyof typeof leadSelection]: unknown;
};

function toLead(
  row: Record<string, unknown>,
  flags: { viewed: boolean; applied: boolean; hidden: boolean },
): Lead {
  return {
    id: String(row.id),
    source: String(row.source),
    sourceJobId: (row.sourceJobId as string) ?? null,
    url: (row.url as string) ?? null,
    applyUrl: (row.applyUrl as string) ?? null,
    title: String(row.title),
    companyId: (row.companyId as string) ?? null,
    companyName: (row.companyName as string) ?? null,
    companyLogo: (row.companyLogo as string) ?? null,
    location: (row.location as string) ?? null,
    country: (row.country as string) ?? null,
    workMode: (row.workMode as WorkMode) ?? null,
    workType: (row.workType as string) ?? null,
    remoteScope: (row.remoteScope as string) ?? null,
    regions: (row.regions as string[]) ?? [],
    languages: (row.languages as string[]) ?? [],
    seniority: (row.seniority as string) ?? null,
    level: (row.level as string) ?? null,
    minYears: (row.minYears as number) ?? null,
    salaryMin: (row.salaryMin as number) ?? null,
    salaryMax: (row.salaryMax as number) ?? null,
    salaryCurrency: (row.salaryCurrency as string) ?? null,
    salaryText: (row.salaryText as string) ?? null,
    tech: (row.tech as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    shortJd: (row.shortJd as string) ?? null,
    description: (row.description as string) ?? null,
    postedAt: row.postedAt ? new Date(row.postedAt as string).toISOString() : null,
    verdict: (row.verdict as Lead["verdict"]) ?? "lead",
    rejectReason: (row.rejectReason as string) ?? null,
    score: (row.score as number) ?? null,
    priority: (row.priority as number) ?? 0,
    pipeline: (row.pipeline as Lead["pipeline"]) ?? "new",
    searchId: (row.searchId as string) ?? null,
    runId: (row.runId as string) ?? null,
    viewed: flags.viewed,
    applied: flags.applied,
    hidden: flags.hidden,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  };
}

function buildWhere(userId: string, filters: LeadFilters): SQL | undefined {
  const conditions: SQL[] = [];

  conditions.push(eq(leads.verdict, filters.verdict ?? "lead"));

  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      or(
        sql`${leads.title} ilike ${like}`,
        sql`${leads.companyName} ilike ${like}`,
        sql`${leads.shortJd} ilike ${like}`,
        sql`${leads.tech}::text ilike ${like}`,
      ) as SQL,
    );
  }

  if (filters.source) conditions.push(eq(leads.source, filters.source));
  if (filters.workMode) conditions.push(eq(leads.workMode, filters.workMode));
  if (filters.pipeline) conditions.push(eq(leads.pipeline, filters.pipeline));
  if (filters.company) {
    conditions.push(sql`${leads.companyName} ilike ${`%${filters.company}%`}`);
  }
  if (filters.tech) {
    conditions.push(sql`${leads.tech}::text ilike ${`%${filters.tech}%`}`);
  }

  const scope = filters.scope ?? "all";
  const viewedSub = sql`exists (select 1 from ${leadViews} where ${leadViews.leadId} = ${leads.id} and ${leadViews.userId} = ${userId})`;
  const appliedSub = sql`exists (select 1 from ${leadApplications} where ${leadApplications.leadId} = ${leads.id} and ${leadApplications.userId} = ${userId})`;
  const hiddenSub = sql`exists (select 1 from ${leadHides} where ${leadHides.leadId} = ${leads.id} and ${leadHides.userId} = ${userId})`;

  if (scope === "hidden") {
    conditions.push(hiddenSub as SQL);
  } else {
    conditions.push(sql`not (${hiddenSub})`);
  }

  if (scope === "viewed") conditions.push(viewedSub as SQL);
  if (scope === "unseen") conditions.push(sql`not (${viewedSub})`);
  if (scope === "applied") conditions.push(appliedSub as SQL);

  return and(...conditions);
}

function orderBy(sort: LeadFilters["sort"]) {
  switch (sort) {
    case "oldest":
      return [sql`${leads.createdAt} asc`];
    case "company":
      return [sql`${leads.companyName} asc nulls last`];
    case "priority":
      return [desc(leads.priority), sql`${leads.createdAt} desc`];
    default:
      return [
        desc(leads.priority),
        sql`${leads.postedAt} desc nulls last`,
        sql`${leads.createdAt} desc`,
      ];
  }
}

export async function listLeads(
  userId: string,
  filters: LeadFilters,
): Promise<Paginated<Lead>> {
  const database = db();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filters.pageSize ?? 25));
  const where = buildWhere(userId, filters);

  const [totalRow] = await database
    .select({ value: count() })
    .from(leads)
    .where(where);

  const total = totalRow?.value ?? 0;

  const rows = await database
    .select(leadSelection)
    .from(leads)
    .where(where)
    .orderBy(...orderBy(filters.sort))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const ids = rows.map((row) => row.id);

  const [viewed, applied, hidden] = await Promise.all([
    ids.length
      ? database
          .select({ leadId: leadViews.leadId })
          .from(leadViews)
          .where(and(eq(leadViews.userId, userId), inArray(leadViews.leadId, ids)))
      : Promise.resolve([]),
    ids.length
      ? database
          .select({ leadId: leadApplications.leadId })
          .from(leadApplications)
          .where(
            and(
              eq(leadApplications.userId, userId),
              inArray(leadApplications.leadId, ids),
            ),
          )
      : Promise.resolve([]),
    ids.length
      ? database
          .select({ leadId: leadHides.leadId })
          .from(leadHides)
          .where(and(eq(leadHides.userId, userId), inArray(leadHides.leadId, ids)))
      : Promise.resolve([]),
  ]);

  const viewedSet = new Set(viewed.map((row) => row.leadId));
  const appliedSet = new Set(applied.map((row) => row.leadId));
  const hiddenSet = new Set(hidden.map((row) => row.leadId));

  const items = (rows as LeadRow[]).map((row) =>
    toLead(row as Record<string, unknown>, {
      viewed: viewedSet.has(row.id as string),
      applied: appliedSet.has(row.id as string),
      hidden: hiddenSet.has(row.id as string),
    }),
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLead(userId: string, id: string): Promise<Lead | null> {
  const database = db();

  const rows = await database
    .select(leadSelection)
    .from(leads)
    .where(eq(leads.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [viewed, applied, hidden] = await Promise.all([
    database
      .select({ leadId: leadViews.leadId })
      .from(leadViews)
      .where(and(eq(leadViews.userId, userId), eq(leadViews.leadId, id)))
      .limit(1),
    database
      .select({ leadId: leadApplications.leadId })
      .from(leadApplications)
      .where(and(eq(leadApplications.userId, userId), eq(leadApplications.leadId, id)))
      .limit(1),
    database
      .select({ leadId: leadHides.leadId })
      .from(leadHides)
      .where(and(eq(leadHides.userId, userId), eq(leadHides.leadId, id)))
      .limit(1),
  ]);

  return toLead(row as Record<string, unknown>, {
    viewed: viewed.length > 0,
    applied: applied.length > 0,
    hidden: hidden.length > 0,
  });
}

export async function getLeadFacets() {
  const database = db();

  const sourceRows = await database
    .select({ value: leads.source, total: count() })
    .from(leads)
    .where(eq(leads.verdict, "lead"))
    .groupBy(leads.source)
    .orderBy(desc(count()));

  const pipelineRows = await database
    .select({ value: leads.pipeline, total: count() })
    .from(leads)
    .where(eq(leads.verdict, "lead"))
    .groupBy(leads.pipeline);

  return {
    sources: sourceRows.map((row) => ({ value: row.value, total: row.total })),
    pipelines: pipelineRows.map((row) => ({
      value: row.value,
      total: row.total,
    })),
  };
}

export async function listHideReasons() {
  return db().select().from(hideReasons).orderBy(hideReasons.sort);
}

export async function getCompanyOptions() {
  return db()
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .orderBy(companies.name)
    .limit(300);
}
