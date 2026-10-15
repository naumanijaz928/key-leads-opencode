import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  companies,
  leadApplications,
  leads,
  runs,
  sources,
} from "@/lib/db/schema";

export interface DashboardStats {
  totalLeads: number;
  newLeadsThisWeek: number;
  companies: number;
  applications: number;
  runCount: number;
  sourcesEnabled: number;
  lastRun: {
    id: string;
    status: string;
    newLeads: number;
    createdAt: string;
  } | null;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const database = db();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalLeadsRow] = await database
      .select({ value: count() })
      .from(leads)
      .where(eq(leads.verdict, "lead"));

    const [weekLeadsRow] = await database
      .select({ value: count() })
      .from(leads)
      .where(and(eq(leads.verdict, "lead"), gte(leads.createdAt, weekAgo)));

    const [companiesRow] = await database
      .select({ value: count() })
      .from(companies);

    const [applicationsRow] = await database
      .select({ value: count() })
      .from(leadApplications);

    const [runsRow] = await database.select({ value: count() }).from(runs);

    const [sourcesRow] = await database
      .select({ value: count() })
      .from(sources)
      .where(eq(sources.enabled, true));

    const lastRunRows = await database
      .select({
        id: runs.id,
        status: runs.status,
        newLeads: runs.newLeads,
        createdAt: runs.createdAt,
      })
      .from(runs)
      .orderBy(desc(runs.createdAt))
      .limit(1);

    const lastRun = lastRunRows[0];

    return {
      totalLeads: totalLeadsRow?.value ?? 0,
      newLeadsThisWeek: weekLeadsRow?.value ?? 0,
      companies: companiesRow?.value ?? 0,
      applications: applicationsRow?.value ?? 0,
      runCount: runsRow?.value ?? 0,
      sourcesEnabled: sourcesRow?.value ?? 0,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            status: lastRun.status,
            newLeads: lastRun.newLeads,
            createdAt: lastRun.createdAt.toISOString(),
          }
        : null,
    };
  } catch {
    return null;
  }
}
