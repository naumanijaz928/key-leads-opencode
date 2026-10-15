import {
  detectTech,
  detectWorkMode,
  domainFromUrl,
  parseSalary,
  stripHtml,
  toIso,
} from "@/features/runs/normalize";
import { asArray, fetchJson, str, strList } from "@/features/runs/adapters/http";
import type { NormalizedJob, SourceAdapter } from "@/features/runs/adapters/types";

function baseJob(source: string): Pick<
  NormalizedJob,
  | "source"
  | "sourceJobId"
  | "url"
  | "applyUrl"
  | "title"
  | "companyName"
  | "companyLogo"
  | "companyDomain"
  | "location"
  | "country"
  | "workMode"
  | "workType"
  | "remoteScope"
  | "regions"
  | "languages"
  | "seniority"
  | "level"
  | "minYears"
  | "salaryMin"
  | "salaryMax"
  | "salaryCurrency"
  | "salaryText"
  | "tech"
  | "tags"
  | "shortJd"
  | "description"
  | "postedAt"
> {
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

const remoteok: SourceAdapter = {
  key: "remoteok",
  name: "RemoteOK",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async () => {
    const data = await fetchJson<Record<string, unknown>[]>(
      "https://remoteok.com/api",
    );
    return data
      .filter((item) => str(item, "position") || str(item, "title"))
      .slice(0, 200)
      .map((item) => {
        const description = stripHtml(str(item, "description"));
        const salary = parseSalary(str(item, "salary"));
        return {
          ...baseJob("remoteok"),
          sourceJobId: str(item, "id", "slug"),
          url: str(item, "url", "apply_url"),
          applyUrl: str(item, "apply_url", "url"),
          title: str(item, "position", "title") ?? "Untitled",
          companyName: str(item, "company"),
          companyLogo: str(item, "company_logo", "logo"),
          location: str(item, "location"),
          workMode: detectWorkMode(str(item, "location")) ?? "remote",
          tags: strList(item, "tags"),
          tech: detectTech(str(item, "tags"), description),
          description,
          shortJd: description?.slice(0, 240) ?? null,
          salaryMin: salary.min,
          salaryMax: salary.max,
          salaryCurrency: salary.currency,
          salaryText: salary.text,
          postedAt: toIso(str(item, "date", "epoch")),
        } satisfies NormalizedJob;
      });
  },
};

const remotive: SourceAdapter = {
  key: "remotive",
  name: "Remotive",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async ({ searchTerms, limit }) => {
    const search = searchTerms[0] ? `&search=${encodeURIComponent(searchTerms[0])}` : "";
    const data = await fetchJson<Record<string, unknown>>(
      `https://remotive.com/api/remote-jobs?limit=${limit}${search}`,
    );
    return asArray(data, "jobs").map((item) => {
      const description = stripHtml(str(item, "description"));
      const salary = parseSalary(str(item, "salary"));
      return {
        ...baseJob("remotive"),
        sourceJobId: str(item, "id"),
        url: str(item, "url"),
        applyUrl: str(item, "url"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(item, "company_name"),
        companyLogo: str(item, "company_logo"),
        location: str(item, "candidate_required_location"),
        workType: str(item, "job_type"),
        regions: strList(item, "candidate_required_location"),
        tags: strList(item, "tags"),
        tech: detectTech(str(item, "tags"), str(item, "title"), description),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: salary.currency,
        salaryText: salary.text,
        postedAt: toIso(str(item, "publication_date")),
      } satisfies NormalizedJob;
    });
  },
};

const himalayas: SourceAdapter = {
  key: "himalayas",
  name: "Himalayas",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async ({ limit }) => {
    const data = await fetchJson<Record<string, unknown>>(
      `https://himalayas.app/jobs/api?limit=${limit}`,
    );
    return asArray(data, "jobs").map((item) => {
      const description = stripHtml(str(item, "description", "excerpt"));
      return {
        ...baseJob("himalayas"),
        sourceJobId: str(item, "guid", "id"),
        url: str(item, "applicationLink", "guid"),
        applyUrl: str(item, "applicationLink", "guid"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(item, "companyName"),
        companyLogo: str(item, "companyLogo"),
        companyDomain: str(item, "companyUrl") ? domainFromUrl(str(item, "companyUrl")) : null,
        location: strList(item, "locationRestrictions").join(", ") || null,
        regions: strList(item, "locationRestrictions"),
        languages: strList(item, "timezones"),
        tech: detectTech(str(item, "title"), str(item, "categories"), description),
        tags: strList(item, "categories"),
        seniority: strList(item, "seniority")[0] ?? null,
        description,
        shortJd: description?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "pubDate")),
      } satisfies NormalizedJob;
    });
  },
};

const jobicy: SourceAdapter = {
  key: "jobicy",
  name: "Jobicy",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async ({ limit }) => {
    const data = await fetchJson<Record<string, unknown>>(
      `https://jobicy.com/api/v2/remote-jobs?count=${Math.min(50, limit)}`,
    );
    return asArray(data, "jobs").map((item) => {
      const description = stripHtml(str(item, "jobDescription", "jobExcerpt"));
      return {
        ...baseJob("jobicy"),
        sourceJobId: str(item, "id"),
        url: str(item, "url"),
        applyUrl: str(item, "url"),
        title: str(item, "jobTitle") ?? "Untitled",
        companyName: str(item, "companyName"),
        companyLogo: str(item, "companyLogo"),
        location: strList(item, "jobGeo").join(", ") || null,
        workType: str(item, "jobType"),
        level: str(item, "jobLevel"),
        tech: detectTech(str(item, "jobTitle"), str(item, "jobIndustry"), description),
        tags: strList(item, "jobIndustry"),
        description,
        shortJd: stripHtml(str(item, "jobExcerpt")) ?? description?.slice(0, 240) ?? null,
        salaryMin: str(item, "annualSalaryMin") ? Number(str(item, "annualSalaryMin")) : null,
        salaryMax: str(item, "annualSalaryMax") ? Number(str(item, "annualSalaryMax")) : null,
        salaryCurrency: str(item, "salaryCurrency"),
        postedAt: toIso(str(item, "pubDate")),
      } satisfies NormalizedJob;
    });
  },
};

const arbeitnow: SourceAdapter = {
  key: "arbeitnow",
  name: "Arbeitnow",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async () => {
    const data = await fetchJson<Record<string, unknown>>(
      "https://www.arbeitnow.com/api/job-board-api",
    );
    return asArray(data, "data").map((item) => {
      const description = stripHtml(str(item, "description"));
      const location = str(item, "location");
      const remote = item.remote === true;
      return {
        ...baseJob("arbeitnow"),
        sourceJobId: str(item, "slug"),
        url: str(item, "url"),
        applyUrl: str(item, "url"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(item, "company_name"),
        location,
        workMode: remote ? "remote" : detectWorkMode(location, description),
        workType: strList(item, "job_types")[0] ?? null,
        tech: detectTech(str(item, "tags"), str(item, "title"), description),
        tags: strList(item, "tags"),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "created_at")),
      } satisfies NormalizedJob;
    });
  },
};

const hn: SourceAdapter = {
  key: "hn",
  name: "Hacker News",
  category: "keyless",
  requiresKey: false,
  isConfigured: () => true,
  collect: async ({ limit }) => {
    const data = await fetchJson<Record<string, unknown>>(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(
        "hiring remote",
      )}&tags=comment&hitsPerPage=${Math.min(60, limit)}`,
    );
    return asArray(data, "hits").map((item) => {
      const text = stripHtml(str(item, "comment_text"), 4000);
      return {
        ...baseJob("hn"),
        sourceJobId: str(item, "objectID"),
        url: `https://news.ycombinator.com/item?id=${str(item, "objectID")}`,
        title: text?.slice(0, 120) ?? "HN hiring comment",
        companyName: str(item, "author"),
        workMode: "remote",
        tech: detectTech(text),
        description: text,
        shortJd: text?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "created_at")),
      } satisfies NormalizedJob;
    });
  },
};

export const keylessAdapters: SourceAdapter[] = [
  remoteok,
  remotive,
  himalayas,
  jobicy,
  arbeitnow,
  hn,
];
