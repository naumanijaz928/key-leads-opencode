import { sourceKey } from "@/lib/env";
import {
  detectTech,
  detectWorkMode,
  stripHtml,
  toIso,
} from "@/features/runs/normalize";
import { asArray, fetchJson, str } from "@/features/runs/adapters/http";
import type { NormalizedJob, SourceAdapter } from "@/features/runs/adapters/types";

function blank(source: string): NormalizedJob {
  return {
    source,
    sourceJobId: null,
    url: null,
    applyUrl: null,
    title: "",
    companyName: null,
    companyLogo: null,
    companyDomain: null,
    location: null,
    country: null,
    workMode: "remote",
    workType: null,
    remoteScope: null,
    regions: [],
    languages: [],
    seniority: null,
    level: null,
    minYears: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryText: null,
    tech: [],
    tags: [],
    shortJd: null,
    description: null,
    postedAt: null,
  };
}

const wellfound: SourceAdapter = {
  key: "wellfound",
  name: "Wellfound (Apify)",
  category: "provider",
  requiresKey: true,
  keyEnvVar: "APIFY_TOKEN",
  isConfigured: () => Boolean(sourceKey("APIFY_TOKEN")),
  collect: async (context) => {
    const token = sourceKey("APIFY_TOKEN") as string;
    const actor =
      sourceKey("APIFY_WELLFOUND_ACTOR") ?? "curious_coder~wellfound-scraper";
    const endpoint = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;

    const items = await fetchJson<Record<string, unknown>[]>(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: context.searchTerms[0] ?? "software engineer",
        remote: true,
        maxItems: context.limit,
      }),
    });

    return asArray(items, "items").map((item) => {
      const description = stripHtml(str(item, "description", "text"));
      const company = (item.company ?? {}) as Record<string, unknown>;
      return {
        ...blank("wellfound"),
        sourceJobId: str(item, "id", "slug"),
        url: str(item, "url", "jobUrl"),
        applyUrl: str(item, "applyUrl", "url"),
        title: str(item, "title", "role") ?? "Untitled",
        companyName: str(company, "name") ?? str(item, "companyName"),
        companyLogo: str(company, "logo") ?? str(item, "logo"),
        location: str(item, "location"),
        workType: str(item, "jobType"),
        salaryText: str(item, "salary", "compensation"),
        tech: detectTech(str(item, "title"), description),
        tags: Array.isArray(item.skills)
          ? (item.skills as unknown[]).filter((s): s is string => typeof s === "string")
          : [],
        description,
        shortJd: description?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "createdAt", "postedAt")),
      } satisfies NormalizedJob;
    });
  },
};

function parseLinkedInHtml(html: string): NormalizedJob[] {
  const blocks = html.split(/<li\b[^>]*>/i).slice(1);
  const jobs: NormalizedJob[] = [];

  for (const block of blocks) {
    const linkMatch = block.match(/href="([^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i);
    const titleMatch = block.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    const companyMatch = block.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
    const locationMatch = block.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const dateMatch = block.match(/datetime="([^"]+)"/i);
    const urnMatch = block.match(/data-entity-urn="([^"]+)"/i);

    const url = linkMatch?.[1]?.split("?")[0] ?? null;
    const title = stripHtml(titleMatch?.[1] ?? null, 300);
    if (!url || !title) continue;

    jobs.push({
      ...blank("linkedin"),
      sourceJobId: urnMatch?.[1] ?? url,
      url,
      applyUrl: url,
      title,
      companyName: stripHtml(companyMatch?.[1] ?? null, 200),
      location: stripHtml(locationMatch?.[1] ?? null, 200),
      workMode: detectWorkMode(stripHtml(locationMatch?.[1] ?? null, 200), title),
      tech: detectTech(title),
      postedAt: toIso(dateMatch?.[1]),
    });
  }

  return jobs;
}

const linkedin: SourceAdapter = {
  key: "linkedin",
  name: "LinkedIn (guest)",
  category: "scraped",
  requiresKey: false,
  keyEnvVar: "LINKEDIN_TRANSPORT",
  isConfigured: () => sourceKey("LINKEDIN_TRANSPORT") !== null,
  collect: async (context) => {
    const keyword = encodeURIComponent(
      `${context.searchTerms[0] ?? "software engineer"} remote`,
    );
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keyword}&location=Worldwide&start=0`;
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        accept: "text/html",
      },
      signal: context.signal,
    });
    if (!response.ok) throw new Error(`LinkedIn responded ${response.status}`);
    const html = await response.text();
    return parseLinkedInHtml(html).slice(0, context.limit);
  },
};

export const providerAdapters: SourceAdapter[] = [wellfound, linkedin];
