import { sourceKey } from "@/lib/env";
import {
  detectTech,
  detectWorkMode,
  parseSalary,
  stripHtml,
  toIso,
} from "@/features/runs/normalize";
import { asArray, fetchJson, str, strList } from "@/features/runs/adapters/http";
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
    workMode: null,
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

function terms(context: { searchTerms: string[] }) {
  return context.searchTerms.length ? context.searchTerms : ["software engineer"];
}

const adzuna: SourceAdapter = {
  key: "adzuna",
  name: "Adzuna",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "ADZUNA_APP_ID",
  isConfigured: () =>
    Boolean(sourceKey("ADZUNA_APP_ID") && sourceKey("ADZUNA_APP_KEY")),
  collect: async (context) => {
    const appId = sourceKey("ADZUNA_APP_ID") as string;
    const appKey = sourceKey("ADZUNA_APP_KEY") as string;
    const country = sourceKey("ADZUNA_COUNTRY") ?? "gb";
    const what = encodeURIComponent(terms(context)[0]);
    const data = await fetchJson<Record<string, unknown>>(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=${context.limit}&what=${what}&content-type=application/json`,
    );
    return asArray(data, "results").map((item) => {
      const description = stripHtml(str(item, "description"));
      const company = item.company as Record<string, unknown> | undefined;
      const location = item.location as Record<string, unknown> | undefined;
      return {
        ...blank("adzuna"),
        sourceJobId: str(item, "id"),
        url: str(item, "redirect_url"),
        applyUrl: str(item, "redirect_url"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(company, "display_name"),
        location: str(location, "display_name"),
        workMode: detectWorkMode(str(location, "display_name"), str(item, "title"), description),
        tech: detectTech(str(item, "title"), description),
        tags: strList(item, "category"),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryMin: typeof item.salary_min === "number" ? item.salary_min : null,
        salaryMax: typeof item.salary_max === "number" ? item.salary_max : null,
        postedAt: toIso(str(item, "created")),
      } satisfies NormalizedJob;
    });
  },
};

const jooble: SourceAdapter = {
  key: "jooble",
  name: "Jooble",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "JOOBLE_API_KEY",
  isConfigured: () => Boolean(sourceKey("JOOBLE_API_KEY")),
  collect: async (context) => {
    const key = sourceKey("JOOBLE_API_KEY") as string;
    const base = sourceKey("JOOBLE_API_URL") ?? "https://jooble.org";
    const data = await fetchJson<Record<string, unknown>>(`${base}/api/${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keywords: terms(context).join(" "), page: "1" }),
    });
    return asArray(data, "jobs").map((item) => {
      const description = stripHtml(str(item, "snippet"));
      const salary = parseSalary(str(item, "salary"));
      return {
        ...blank("jooble"),
        sourceJobId: str(item, "id"),
        url: str(item, "link"),
        applyUrl: str(item, "link"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(item, "company"),
        location: str(item, "location"),
        workType: str(item, "type"),
        workMode: detectWorkMode(str(item, "location"), str(item, "title"), description),
        tech: detectTech(str(item, "title"), description),
        description,
        shortJd: description,
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: salary.currency,
        salaryText: salary.text,
        postedAt: toIso(str(item, "updated")),
      } satisfies NormalizedJob;
    });
  },
};

const muse: SourceAdapter = {
  key: "muse",
  name: "The Muse",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "MUSE_API_KEY",
  isConfigured: () => Boolean(sourceKey("MUSE_API_KEY")),
  collect: async () => {
    const key = sourceKey("MUSE_API_KEY") as string;
    const data = await fetchJson<Record<string, unknown>>(
      `https://www.themuse.com/api/public/jobs?api_key=${key}&page=1&descending=true`,
    );
    return asArray(data, "results").map((item) => {
      const description = stripHtml(str(item, "contents"));
      const company = item.company as Record<string, unknown> | undefined;
      const refs = item.refs as Record<string, unknown> | undefined;
      const locations = Array.isArray(item.locations)
        ? (item.locations as Record<string, unknown>[]).map((entry) => str(entry, "name"))
        : [];
      return {
        ...blank("muse"),
        sourceJobId: str(item, "id"),
        url: str(refs, "landing_page"),
        applyUrl: str(refs, "landing_page"),
        title: str(item, "name") ?? "Untitled",
        companyName: str(company, "name"),
        location: locations.filter(Boolean).join(", ") || null,
        workMode: detectWorkMode(locations.join(" "), str(item, "name"), description),
        level: strList(item, "levels")[0] ?? null,
        tech: detectTech(str(item, "name"), description),
        tags: Array.isArray(item.categories)
          ? (item.categories as Record<string, unknown>[]).map((c) => str(c, "name")).filter(Boolean) as string[]
          : [],
        description,
        shortJd: description?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "publication_date")),
      } satisfies NormalizedJob;
    });
  },
};

const findwork: SourceAdapter = {
  key: "findwork",
  name: "Findwork.dev",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "FINDWORK_API_KEY",
  isConfigured: () => Boolean(sourceKey("FINDWORK_API_KEY")),
  collect: async (context) => {
    const key = sourceKey("FINDWORK_API_KEY") as string;
    const data = await fetchJson<Record<string, unknown>>(
      `https://findwork.dev/api/jobs/?search=${encodeURIComponent(terms(context)[0])}`,
      { headers: { authorization: `Token ${key}` } },
    );
    return asArray(data, "results").map((item) => {
      const description = stripHtml(str(item, "text"));
      return {
        ...blank("findwork"),
        sourceJobId: str(item, "id"),
        url: str(item, "url"),
        applyUrl: str(item, "url"),
        title: str(item, "role") ?? "Untitled",
        companyName: str(item, "company_name"),
        companyLogo: str(item, "logo"),
        location: str(item, "location"),
        workMode: item.remote === true ? "remote" : detectWorkMode(str(item, "location"), description),
        workType: str(item, "employment_type"),
        tech: detectTech(str(item, "keywords"), str(item, "role"), description),
        tags: strList(item, "keywords"),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        postedAt: toIso(str(item, "date_posted")),
      } satisfies NormalizedJob;
    });
  },
};

const jsearch: SourceAdapter = {
  key: "jsearch",
  name: "JSearch (RapidAPI)",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "RAPIDAPI_KEY",
  isConfigured: () => Boolean(sourceKey("RAPIDAPI_KEY")),
  collect: async (context) => {
    const key = sourceKey("RAPIDAPI_KEY") as string;
    const query = encodeURIComponent(`${terms(context)[0]} remote`);
    const data = await fetchJson<Record<string, unknown>>(
      `https://jsearch.p.rapidapi.com/search?query=${query}&page=1&num_pages=1`,
      {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      },
    );
    return asArray(data, "data").map((item) => {
      const description = stripHtml(str(item, "job_description"));
      const city = str(item, "job_city");
      const country = str(item, "job_country");
      return {
        ...blank("jsearch"),
        sourceJobId: str(item, "job_id"),
        url: str(item, "job_apply_link"),
        applyUrl: str(item, "job_apply_link"),
        title: str(item, "job_title") ?? "Untitled",
        companyName: str(item, "employer_name"),
        companyLogo: str(item, "employer_logo"),
        location: [city, country].filter(Boolean).join(", ") || null,
        country,
        workMode: item.job_is_remote === true ? "remote" : detectWorkMode(city, description),
        workType: str(item, "job_employment_type"),
        tech: detectTech(str(item, "job_title"), description),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryMin: typeof item.job_min_salary === "number" ? item.job_min_salary : null,
        salaryMax: typeof item.job_max_salary === "number" ? item.job_max_salary : null,
        salaryCurrency: str(item, "job_salary_currency"),
        postedAt: toIso(str(item, "job_posted_at_datetime_utc")),
      } satisfies NormalizedJob;
    });
  },
};

const reed: SourceAdapter = {
  key: "reed",
  name: "Reed",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "REED_API_KEY",
  isConfigured: () => Boolean(sourceKey("REED_API_KEY")),
  collect: async (context) => {
    const key = sourceKey("REED_API_KEY") as string;
    const auth = Buffer.from(`${key}:`).toString("base64");
    const data = await fetchJson<Record<string, unknown>>(
      `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(
        terms(context)[0],
      )}&resultsToTake=${Math.min(100, context.limit)}`,
      { headers: { authorization: `Basic ${auth}` } },
    );
    return asArray(data, "results").map((item) => {
      const description = stripHtml(str(item, "jobDescription"));
      return {
        ...blank("reed"),
        sourceJobId: str(item, "jobId"),
        url: str(item, "jobUrl"),
        applyUrl: str(item, "jobUrl"),
        title: str(item, "jobTitle") ?? "Untitled",
        companyName: str(item, "employerName"),
        location: str(item, "locationName"),
        workMode: detectWorkMode(str(item, "locationName"), description),
        tech: detectTech(str(item, "jobTitle"), description),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryMin: typeof item.minimumSalary === "number" ? item.minimumSalary : null,
        salaryMax: typeof item.maximumSalary === "number" ? item.maximumSalary : null,
        salaryCurrency: str(item, "currency"),
        postedAt: toIso(str(item, "date")),
      } satisfies NormalizedJob;
    });
  },
};

const usajobs: SourceAdapter = {
  key: "usajobs",
  name: "USAJobs",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "USAJOBS_KEY",
  isConfigured: () => Boolean(sourceKey("USAJOBS_KEY") && sourceKey("USAJOBS_EMAIL")),
  collect: async (context) => {
    const key = sourceKey("USAJOBS_KEY") as string;
    const email = sourceKey("USAJOBS_EMAIL") as string;
    const data = await fetchJson<Record<string, unknown>>(
      `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(
        terms(context)[0],
      )}&ResultsPerPage=${Math.min(50, context.limit)}`,
      {
        headers: {
          host: "data.usajobs.gov",
          "user-agent": email,
          "authorization-key": key,
        },
      },
    );
    const result = data.SearchResult as Record<string, unknown> | undefined;
    return asArray(result, "SearchResultItems").map((entry) => {
      const descriptor = (entry.MatchedObjectDescriptor ?? {}) as Record<string, unknown>;
      const description = stripHtml(str(descriptor, "QualificationSummary", "UserArea"));
      const locations = asArray(descriptor.PositionLocation, "LocationName")
        .map((l) => str(l, "LocationName"))
        .filter(Boolean);
      const remuneration = asArray(descriptor.PositionRemuneration, "MinimumRange")
        .map((r) => str(r, "MinimumRange"))
        .filter(Boolean);
      return {
        ...blank("usajobs"),
        sourceJobId: str(descriptor, "PositionID"),
        url: str(descriptor, "PositionURI"),
        applyUrl: str(descriptor, "ApplyURI") ?? str(descriptor, "PositionURI"),
        title: str(descriptor, "PositionTitle") ?? "Untitled",
        companyName: str(descriptor, "OrganizationName"),
        location: locations.join(", ") || null,
        country: "US",
        workMode: detectWorkMode(locations.join(" "), description),
        tech: detectTech(str(descriptor, "PositionTitle"), description),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryText: remuneration.join(" – ") || null,
        postedAt: toIso(str(descriptor, "PublicationStartDate")),
      } satisfies NormalizedJob;
    });
  },
};

const careerjet: SourceAdapter = {
  key: "careerjet",
  name: "Careerjet",
  category: "keyed",
  requiresKey: true,
  keyEnvVar: "CAREERJET_KEY",
  isConfigured: () => Boolean(sourceKey("CAREERJET_KEY")),
  collect: async (context) => {
    const key = sourceKey("CAREERJET_KEY") as string;
    const data = await fetchJson<Record<string, unknown>>(
      `http://public.api.careerjet.net/search?keywords=${encodeURIComponent(
        terms(context)[0],
      )}&location=&affid=${key}&user_ip=0.0.0.0&user_agent=KeyLeads`,
    );
    return asArray(data, "jobs").map((item) => {
      const description = stripHtml(str(item, "description"));
      const salary = parseSalary(str(item, "salary"));
      return {
        ...blank("careerjet"),
        sourceJobId: str(item, "url"),
        url: str(item, "url"),
        applyUrl: str(item, "url"),
        title: str(item, "title") ?? "Untitled",
        companyName: str(item, "company"),
        location: str(item, "locations"),
        workMode: detectWorkMode(str(item, "locations"), str(item, "title"), description),
        tech: detectTech(str(item, "title"), description),
        description,
        shortJd: description?.slice(0, 240) ?? null,
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: salary.currency,
        salaryText: salary.text,
        postedAt: toIso(str(item, "date")),
      } satisfies NormalizedJob;
    });
  },
};

export const keyedAdapters: SourceAdapter[] = [
  adzuna,
  jooble,
  muse,
  findwork,
  jsearch,
  reed,
  usajobs,
  careerjet,
];
