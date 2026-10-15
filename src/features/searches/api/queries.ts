import { and, asc, desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, searches } from "@/lib/db/schema";
import { searchConfigSchema } from "@/lib/validators";
import type { SearchConfig, SearchProfile } from "@/types";

export function normalizeConfig(input: unknown): SearchConfig {
  const parsed = searchConfigSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : searchConfigSchema.parse({});
}

function toProfile(row: Record<string, unknown>): SearchProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    description: (row.description as string) ?? null,
    isDefault: Boolean(row.isDefault),
    priority: Number(row.priority ?? 0),
    config: normalizeConfig(row.config),
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  };
}

export async function listSearches(): Promise<SearchProfile[]> {
  const rows = await db()
    .select()
    .from(searches)
    .orderBy(desc(searches.isDefault), desc(searches.priority), asc(searches.name));

  return rows.map((row) => toProfile(row as Record<string, unknown>));
}

export async function getSearch(id: string): Promise<SearchProfile | null> {
  const rows = await db().select().from(searches).where(eq(searches.id, id)).limit(1);
  const row = rows[0];
  return row ? toProfile(row as Record<string, unknown>) : null;
}

export async function createSearch(input: {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  priority?: number;
  config?: Partial<SearchConfig>;
  teamId?: string | null;
  createdBy?: string | null;
}): Promise<SearchProfile> {
  const config = normalizeConfig({ ...input.config, priority: input.priority ?? input.config?.priority ?? 0 });
  const [row] = await db()
    .insert(searches)
    .values({
      name: input.name,
      description: input.description ?? null,
      isDefault: input.isDefault ?? false,
      priority: input.priority ?? config.priority,
      config: config as unknown as Record<string, unknown>,
      teamId: input.teamId ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  return toProfile(row as Record<string, unknown>);
}

export async function updateSearch(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    isDefault?: boolean;
    priority?: number;
    config?: Partial<SearchConfig>;
  },
): Promise<SearchProfile | null> {
  const existing = await getSearch(id);
  if (!existing) return null;

  const config = input.config
    ? normalizeConfig({ ...existing.config, ...input.config })
    : undefined;

  const [row] = await db()
    .update(searches)
    .set({
      name: input.name ?? undefined,
      description: input.description ?? undefined,
      isDefault: input.isDefault ?? undefined,
      priority: input.priority ?? undefined,
      config: config
        ? (config as unknown as Record<string, unknown>)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(searches.id, id))
    .returning();

  return row ? toProfile(row as Record<string, unknown>) : null;
}

export async function deleteSearch(id: string) {
  await db().delete(searches).where(eq(searches.id, id));
}

function includesAny(haystack: string, needles: string[]) {
  if (needles.length === 0) return false;
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export function matchesConfig(
  config: SearchConfig,
  lead: {
    title: string;
    tech: string[];
    workMode: string | null;
    minYears: number | null;
  },
): boolean {
  if (config.title_include.length && !includesAny(lead.title, config.title_include))
    return false;
  if (includesAny(lead.title, config.title_exclude)) return false;
  if (config.title_exclude.length && includesAny(lead.title, config.title_exclude))
    return false;

  if (config.tech_any.length) {
    const techMatch = config.tech_any.some((needle) =>
      lead.tech.some((tech) => tech.toLowerCase().includes(needle.toLowerCase())),
    );
    if (!techMatch) return false;
  }
  if (config.tech_exclude.length) {
    const techBlocked = config.tech_exclude.some((needle) =>
      lead.tech.some((tech) => tech.toLowerCase().includes(needle.toLowerCase())),
    );
    if (techBlocked) return false;
  }

  if (config.remote_policy === "remote_only" && lead.workMode !== "remote")
    return false;
  if (
    config.remote_policy === "remote_or_hybrid" &&
    lead.workMode !== "remote" &&
    lead.workMode !== "hybrid"
  )
    return false;

  if (config.min_years !== null && lead.minYears !== null && lead.minYears > config.min_years)
    return false;

  return true;
}

export async function previewSearch(config: SearchConfig, limit = 500) {
  const conditions: SQL[] = [eq(leads.verdict, "lead")];
  const rows = await db()
    .select({
      title: leads.title,
      tech: leads.tech,
      workMode: leads.workMode,
      minYears: leads.minYears,
    })
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  const matched = rows.filter((row) =>
    matchesConfig(config, {
      title: row.title,
      tech: row.tech ?? [],
      workMode: row.workMode,
      minYears: row.minYears,
    }),
  );

  return {
    scanned: rows.length,
    matched: matched.length,
    sample: matched.slice(0, 8).map((row) => row.title),
  };
}
