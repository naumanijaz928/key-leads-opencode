import { isCollectorConfigured } from "@/lib/env";
import { fetchJson } from "@/features/runs/adapters/http";
import type { NormalizedJob, SourceAdapter } from "@/features/runs/adapters/types";

interface CollectorJob extends Partial<NormalizedJob> {
  title?: string;
}

async function collectVia(
  source: "indeed" | "glassdoor",
  searchTerms: string[],
  limit: number,
): Promise<NormalizedJob[]> {
  const base = process.env.COLLECTOR_URL as string;
  const token = process.env.COLLECTOR_TOKEN;
  const url = `${base.replace(/\/$/, "")}/jobs?source=${source}&q=${encodeURIComponent(
    searchTerms[0] ?? "software engineer",
  )}&limit=${limit}`;

  const jobs = await fetchJson<CollectorJob[]>(url, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  return jobs.map((job) => ({
    source,
    sourceJobId: job.sourceJobId ?? null,
    url: job.url ?? null,
    applyUrl: job.applyUrl ?? job.url ?? null,
    title: job.title ?? "Untitled",
    companyName: job.companyName ?? null,
    companyLogo: job.companyLogo ?? null,
    companyDomain: job.companyDomain ?? null,
    location: job.location ?? null,
    country: job.country ?? null,
    workMode: job.workMode ?? "remote",
    workType: job.workType ?? null,
    remoteScope: job.remoteScope ?? null,
    regions: job.regions ?? [],
    languages: job.languages ?? [],
    seniority: job.seniority ?? null,
    level: job.level ?? null,
    minYears: job.minYears ?? null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: job.salaryCurrency ?? null,
    salaryText: job.salaryText ?? null,
    tech: job.tech ?? [],
    tags: job.tags ?? [],
    shortJd: job.shortJd ?? null,
    description: job.description ?? null,
    postedAt: job.postedAt ?? null,
  }));
}

function makeCollectorAdapter(source: "indeed" | "glassdoor", name: string): SourceAdapter {
  return {
    key: source,
    name,
    category: "scraped",
    requiresKey: true,
    keyEnvVar: "COLLECTOR_URL",
    isConfigured: () => isCollectorConfigured(),
    collect: (context) =>
      collectVia(source, context.searchTerms, context.limit),
  };
}

export const collectorAdapters: SourceAdapter[] = [
  makeCollectorAdapter("indeed", "Indeed (collector)"),
  makeCollectorAdapter("glassdoor", "Glassdoor (collector)"),
];
