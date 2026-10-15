import { and, asc, count, desc, eq, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { companies, leads } from "@/lib/db/schema";
import type { Company, Paginated } from "@/types";

export interface CompanyFilters {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

function toCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    website: (row.website as string) ?? null,
    domain: (row.domain as string) ?? null,
    logoUrl: (row.logoUrl as string) ?? null,
    location: (row.location as string) ?? null,
    size: (row.size as string) ?? null,
    status: String(row.status),
    openRoles: (row.openRoles as number) ?? 0,
    tech: (row.tech as string[]) ?? [],
    titles: (row.titles as string[]) ?? [],
    sources: (row.sources as string[]) ?? [],
    ownerId: (row.ownerId as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  };
}

export async function listCompanies(
  filters: CompanyFilters,
): Promise<Paginated<Company>> {
  const database = db();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));

  const conditions: SQL[] = [];
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      or(
        sql`${companies.name} ilike ${like}`,
        sql`${companies.domain} ilike ${like}`,
      ) as SQL,
    );
  }
  if (filters.status) conditions.push(eq(companies.status, filters.status));

  const where = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await database
    .select({ value: count() })
    .from(companies)
    .where(where);

  const rows = await database
    .select()
    .from(companies)
    .where(where)
    .orderBy(desc(companies.openRoles), asc(companies.name))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = totalRow?.value ?? 0;

  return {
    items: rows.map((row) => toCompany(row as Record<string, unknown>)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCompany(id: string): Promise<Company | null> {
  const rows = await db()
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);

  const row = rows[0];
  return row ? toCompany(row as Record<string, unknown>) : null;
}

export async function getCompanyLeads(id: string, limit = 50) {
  return db()
    .select({
      id: leads.id,
      title: leads.title,
      source: leads.source,
      location: leads.location,
      workMode: leads.workMode,
      postedAt: leads.postedAt,
      url: leads.url,
    })
    .from(leads)
    .where(eq(leads.companyId, id))
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}
