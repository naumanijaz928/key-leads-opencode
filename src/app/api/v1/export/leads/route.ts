import { and, desc, eq, type SQL } from "drizzle-orm";

import { withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const GET = withRoute(async (request) => {
  await requireUser();
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "csv";

  const conditions: SQL[] = [eq(leads.verdict, "lead")];
  if (params.get("source")) conditions.push(eq(leads.source, params.get("source") as string));
  if (params.get("scope") === "applied") {
    conditions.push(eq(leads.pipeline, "applied"));
  }

  const rows = await db()
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(5000);

  const columns = [
    "id",
    "source",
    "title",
    "companyName",
    "location",
    "workMode",
    "tech",
    "salaryText",
    "url",
    "postedAt",
    "pipeline",
    "createdAt",
  ] as const;

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": 'attachment; filename="keyleads-export.json"',
      },
    });
  }

  const header = columns.join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = (row as Record<string, unknown>)[column];
          return csvEscape(Array.isArray(value) ? value.join("|") : value);
        })
        .join(","),
    )
    .join("\n");

  return new Response(`${header}\n${body}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="keyleads-export.csv"',
    },
  });
});
