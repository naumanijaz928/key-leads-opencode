import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { companies, leads, runSources, runs, searches } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { getAdapter } from "@/features/runs/adapters";
import type { NormalizedJob } from "@/features/runs/adapters/types";
import { runBus } from "@/features/runs/bus";
import { matchesConfig, normalizeConfig } from "@/features/searches/api/queries";
import type { SearchConfig } from "@/types";

const active = new Map<string, AbortController>();

export function isRunActive(runId: string) {
  return active.has(runId);
}

export async function cancelRun(runId: string) {
  const controller = active.get(runId);
  if (controller) controller.abort();
  await db().update(runs).set({ status: "cancelled" }).where(eq(runs.id, runId));
}

function dedupKeyFor(job: NormalizedJob) {
  const identity = job.sourceJobId ?? job.url ?? `${job.title}|${job.companyName ?? ""}`;
  return `${job.source}:${identity}`.toLowerCase().slice(0, 240);
}

async function resolveCompany(
  teamId: string | null,
  job: NormalizedJob,
): Promise<string | null> {
  if (!job.companyName) return null;
  const database = db();
  const slug = slugify(job.companyName);
  if (!slug) return null;

  const conditions = teamId
    ? and(eq(companies.teamId, teamId), eq(companies.slug, slug))
    : eq(companies.slug, slug);

  const existing = await database
    .select({ id: companies.id })
    .from(companies)
    .where(conditions)
    .limit(1);

  if (existing[0]) return existing[0].id;

  const inserted = await database
    .insert(companies)
    .values({
      teamId,
      name: job.companyName,
      slug,
      website: job.url ? `https://${job.companyDomain ?? ""}`.replace(/\/$/, "") : null,
      domain: job.companyDomain,
      logoUrl: job.companyLogo,
      location: job.location,
      tech: job.tech,
      titles: job.title ? [job.title] : [],
      sources: [job.source],
    })
    .onConflictDoNothing()
    .returning({ id: companies.id });

  if (inserted[0]) return inserted[0].id;

  const fallback = await database
    .select({ id: companies.id })
    .from(companies)
    .where(conditions)
    .limit(1);
  return fallback[0]?.id ?? null;
}

async function persistJob(
  job: NormalizedJob,
  context: { runId: string; searchId: string | null; teamId: string | null },
): Promise<boolean> {
  const database = db();
  const companyId = await resolveCompany(context.teamId, job);
  const dedupKey = dedupKeyFor(job);

  const inserted = await database
    .insert(leads)
    .values({
      teamId: context.teamId,
      source: job.source,
      sourceJobId: job.sourceJobId,
      url: job.url,
      applyUrl: job.applyUrl ?? job.url,
      title: job.title.slice(0, 300),
      companyId,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      location: job.location,
      country: job.country,
      workMode: job.workMode,
      workType: job.workType,
      remoteScope: job.remoteScope,
      regions: job.regions,
      languages: job.languages,
      seniority: job.seniority,
      level: job.level,
      minYears: job.minYears,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      salaryText: job.salaryText,
      tech: job.tech,
      tags: job.tags,
      shortJd: job.shortJd,
      description: job.description,
      postedAt: job.postedAt ? new Date(job.postedAt) : null,
      verdict: "lead",
      pipeline: "new",
      searchId: context.searchId,
      runId: context.runId,
      dedupKey,
    })
    .onConflictDoNothing({ target: leads.dedupKey })
    .returning({ id: leads.id });

  return inserted.length > 0;
}

async function execute(runId: string, signal: AbortSignal) {
  const database = db();
  const [run] = await database.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (!run) return;

  const profile = run.searchId
    ? (
        await database.select().from(searches).where(eq(searches.id, run.searchId)).limit(1)
      )[0]
    : undefined;

  const config = normalizeConfig(profile?.config) as SearchConfig;
  const searchTerms = config.search_terms.length
    ? config.search_terms
    : ["software engineer"];

  const sourceRows = await database
    .select()
    .from(runSources)
    .where(eq(runSources.runId, runId));

  await database
    .update(runs)
    .set({
      status: "running",
      startedAt: new Date(),
      totalSources: sourceRows.length,
    })
    .where(eq(runs.id, runId));

  runBus.publish({
    type: "progress",
    runId,
    status: "running",
    timestamp: new Date().toISOString(),
  });

  const totals = { fetched: 0, matched: 0, newLeads: 0, dropped: 0, warnings: 0 };
  let completed = 0;
  let cancelled = false;

  for (const row of sourceRows) {
    if (signal.aborted) {
      cancelled = true;
      break;
    }

    const [fresh] = await database
      .select({ status: runs.status })
      .from(runs)
      .where(eq(runs.id, runId))
      .limit(1);
    if (fresh?.status === "cancelled") {
      cancelled = true;
      break;
    }

    const adapter = getAdapter(row.sourceKey);
    completed += 1;

    if (!adapter) {
      await database
        .update(runSources)
        .set({ status: "skipped", error: "Unknown source", finishedAt: new Date() })
        .where(eq(runSources.id, row.id));
      runBus.publish({
        type: "source",
        runId,
        sourceKey: row.sourceKey,
        status: "skipped",
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    if (!adapter.isConfigured()) {
      await database
        .update(runSources)
        .set({ status: "not_configured", finishedAt: new Date() })
        .where(eq(runSources.id, row.id));
      runBus.publish({
        type: "source",
        runId,
        sourceKey: row.sourceKey,
        status: "not_configured",
        timestamp: new Date().toISOString(),
      });
      await database
        .update(runs)
        .set({ completedSources: completed })
        .where(eq(runs.id, runId));
      continue;
    }

    await database
      .update(runSources)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(runSources.id, row.id));
    runBus.publish({
      type: "source",
      runId,
      sourceKey: row.sourceKey,
      status: "running",
      timestamp: new Date().toISOString(),
    });

    try {
      const jobs = await adapter.collect({
        config,
        searchTerms,
        limit: 100,
        signal,
      });

      let matched = 0;
      let newLeads = 0;
      let dropped = 0;

      for (const job of jobs) {
        const passes = matchesConfig(config, {
          title: job.title,
          tech: job.tech,
          workMode: job.workMode,
          minYears: job.minYears,
        });
        if (!passes) {
          dropped += 1;
          continue;
        }
        matched += 1;
        const created = await persistJob(job, {
          runId,
          searchId: run.searchId,
          teamId: run.teamId,
        });
        if (created) newLeads += 1;
      }

      totals.fetched += jobs.length;
      totals.matched += matched;
      totals.newLeads += newLeads;
      totals.dropped += dropped;

      await database
        .update(runSources)
        .set({
          status: "ok",
          fetched: jobs.length,
          matched,
          newLeads,
          dropped,
          finishedAt: new Date(),
        })
        .where(eq(runSources.id, row.id));

      await database
        .update(runs)
        .set({
          fetched: totals.fetched,
          matched: totals.matched,
          newLeads: totals.newLeads,
          dropped: totals.dropped,
          completedSources: completed,
        })
        .where(eq(runs.id, runId));

      runBus.publish({
        type: "source",
        runId,
        sourceKey: row.sourceKey,
        status: "ok",
        fetched: jobs.length,
        matched,
        newLeads,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      totals.warnings += 1;

      await database
        .update(runSources)
        .set({ status: "failed", error: message, finishedAt: new Date() })
        .where(eq(runSources.id, row.id));

      await database
        .update(runs)
        .set({ warnings: totals.warnings, completedSources: completed })
        .where(eq(runs.id, runId));

      runBus.publish({
        type: "source",
        runId,
        sourceKey: row.sourceKey,
        status: "failed",
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const finalStatus = cancelled ? "cancelled" : "done";
  await database
    .update(runs)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      completedSources: completed,
      fetched: totals.fetched,
      matched: totals.matched,
      newLeads: totals.newLeads,
      dropped: totals.dropped,
      warnings: totals.warnings,
    })
    .where(eq(runs.id, runId));

  runBus.publish({
    type: "done",
    runId,
    status: finalStatus,
    fetched: totals.fetched,
    matched: totals.matched,
    newLeads: totals.newLeads,
    timestamp: new Date().toISOString(),
  });
}

export function startRun(runId: string) {
  const controller = new AbortController();
  active.set(runId, controller);

  void execute(runId, controller.signal)
    .catch(async (error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      runBus.publish({
        type: "error",
        runId,
        error: message,
        status: "failed",
        timestamp: new Date().toISOString(),
      });
      try {
        await db()
          .update(runs)
          .set({ status: "failed", error: message, finishedAt: new Date() })
          .where(eq(runs.id, runId));
      } catch (updateError) {
        console.error("[runs] failed to mark run failed", updateError);
      }
    })
    .finally(() => {
      active.delete(runId);
    });
}

export async function listRuns(limit = 30) {
  return db().select().from(runs).orderBy(desc(runs.createdAt)).limit(limit);
}

export async function getRunWithSources(id: string) {
  const database = db();
  const [run] = await database.select().from(runs).where(eq(runs.id, id)).limit(1);
  if (!run) return null;
  const sources = await database
    .select()
    .from(runSources)
    .where(eq(runSources.runId, id))
    .orderBy(runSources.sourceKey);
  return { run, sources };
}

export async function createRun(input: {
  teamId: string | null;
  startedBy: string;
  searchId?: string | null;
  sourceKeys: string[];
}) {
  const database = db();
  const [run] = await database
    .insert(runs)
    .values({
      teamId: input.teamId,
      status: "queued",
      trigger: "manual",
      searchId: input.searchId ?? null,
      startedBy: input.startedBy,
      totalSources: input.sourceKeys.length,
    })
    .returning();

  if (input.sourceKeys.length) {
    await database.insert(runSources).values(
      input.sourceKeys.map((key) => {
        const adapter = getAdapter(key);
        return {
          runId: run.id,
          sourceKey: key,
          name: adapter?.name ?? key,
          status: "pending",
        };
      }),
    );
  }

  return run;
}
