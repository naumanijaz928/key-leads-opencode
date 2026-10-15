import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sources } from "@/lib/db/schema";
import { SOURCE_CATALOG } from "@/lib/sources-catalog";
import { sourceKey } from "@/lib/env";
import type { SourceRow } from "@/types";

function configured(row: { requiresKey: boolean; keyEnvVar: string | null }) {
  if (!row.requiresKey) return true;
  if (!row.keyEnvVar) return true;
  return Boolean(sourceKey(row.keyEnvVar));
}

function toRow(row: Record<string, unknown>): SourceRow {
  const requiresKey = Boolean(row.requiresKey);
  const keyEnvVar = (row.keyEnvVar as string) ?? null;
  return {
    id: String(row.id),
    key: String(row.key),
    name: String(row.name),
    category: String(row.category) as SourceRow["category"],
    description: (row.description as string) ?? null,
    requiresKey,
    keyEnvVar,
    enabled: Boolean(row.enabled),
    configured: configured({ requiresKey, keyEnvVar }),
    status: String(row.status),
    lastRunAt: row.lastRunAt
      ? new Date(row.lastRunAt as string).toISOString()
      : null,
  };
}

export async function listSources(): Promise<SourceRow[]> {
  const database = db();

  await database
    .insert(sources)
    .values(
      SOURCE_CATALOG.map((source) => ({
        key: source.key,
        name: source.name,
        category: source.category,
        description: source.description,
        requiresKey: source.requiresKey,
        keyEnvVar: source.keyEnvVar,
      })),
    )
    .onConflictDoNothing({ target: sources.key });

  const rows = await database.select().from(sources).orderBy(asc(sources.name));
  return rows.map((row) => toRow(row as Record<string, unknown>));
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  const [row] = await db()
    .update(sources)
    .set({ enabled })
    .where(eq(sources.id, id))
    .returning();
  return row ? toRow(row as Record<string, unknown>) : null;
}

export async function deleteSource(id: string) {
  await db().delete(sources).where(eq(sources.id, id));
}

export async function createSource(input: {
  key: string;
  name: string;
  category: SourceRow["category"];
  description?: string | null;
  requiresKey?: boolean;
  keyEnvVar?: string | null;
}) {
  const [row] = await db()
    .insert(sources)
    .values({
      key: input.key,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      requiresKey: input.requiresKey ?? false,
      keyEnvVar: input.keyEnvVar ?? null,
    })
    .returning();
  return toRow(row as Record<string, unknown>);
}
