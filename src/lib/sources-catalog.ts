export type SourceCategory =
  | "keyless"
  | "keyed"
  | "scraped"
  | "provider"
  | "manual";

export interface SourceDefinition {
  key: string;
  name: string;
  category: SourceCategory;
  description: string;
  requiresKey: boolean;
  keyEnvVar: string | null;
  docs?: string;
}

export const SOURCE_CATALOG: SourceDefinition[] = [
  {
    key: "remoteok",
    name: "RemoteOK",
    category: "keyless",
    description: "Public JSON feed of remote jobs. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://remoteok.com/api",
  },
  {
    key: "remotive",
    name: "Remotive",
    category: "keyless",
    description:
      "Public remote jobs API. Attribution and a backlink are required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://remotive.com/api/remote-jobs",
  },
  {
    key: "himalayas",
    name: "Himalayas",
    category: "keyless",
    description:
      "Remote jobs API. Runs without a key; set HIMALAYAS_API_KEY for higher limits.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://himalayas.app/jobs/api",
  },
  {
    key: "jobicy",
    name: "Jobicy",
    category: "keyless",
    description: "Public remote jobs API, paginated. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://jobicy.com/api/v2/remote-jobs",
  },
  {
    key: "arbeitnow",
    name: "Arbeitnow",
    category: "keyless",
    description: "Public job board API. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://www.arbeitnow.com/api/job-board-api",
  },
  {
    key: "workingnomads",
    name: "Working Nomads",
    category: "keyless",
    description: "Exposed remote jobs feed. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://www.workingnomads.com/api/exposed_jobs",
  },
  {
    key: "4dayweek",
    name: "4 Day Week",
    category: "keyless",
    description: "Public jobs API for 4-day-week companies. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://4dayweek.io/api/jobs",
  },
  {
    key: "landingjobs",
    name: "Landing.jobs",
    category: "keyless",
    description: "Tech jobs API. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://landing.jobs/api/v1",
  },
  {
    key: "jobspresso",
    name: "Jobspresso",
    category: "keyless",
    description: "Curated remote jobs via RSS. No key required.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "hn",
    name: "Hacker News (Who is hiring)",
    category: "keyless",
    description: "Monthly hiring threads via the Algolia API. No key required.",
    requiresKey: false,
    keyEnvVar: null,
    docs: "https://hn.algolia.com/api/v1",
  },
  {
    key: "torre",
    name: "Torre",
    category: "keyless",
    description: "Public jobs API. No key required.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "ats",
    name: "ATS boards (Greenhouse/Lever/Ashby/Workable)",
    category: "keyless",
    description:
      "Company career boards exposed as public JSON. Configure companies in the source settings.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "yc",
    name: "Y Combinator startups",
    category: "keyless",
    description: "YC company job boards. No key required.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "adzuna",
    name: "Adzuna",
    category: "keyed",
    description: "Multi-country jobs API. Register for a free app id and key.",
    requiresKey: true,
    keyEnvVar: "ADZUNA_APP_KEY",
    docs: "https://developer.adzuna.com",
  },
  {
    key: "jooble",
    name: "Jooble",
    category: "keyed",
    description:
      "Aggregated jobs. One free key per country domain. 500 requests per key.",
    requiresKey: true,
    keyEnvVar: "JOOBLE_API_KEY",
    docs: "https://jooble.org/api/about",
  },
  {
    key: "muse",
    name: "The Muse",
    category: "keyed",
    description: "General job coverage with a free API key.",
    requiresKey: true,
    keyEnvVar: "MUSE_API_KEY",
    docs: "https://www.themuse.com/developers/api/v2",
  },
  {
    key: "findwork",
    name: "Findwork.dev",
    category: "keyed",
    description: "Developer-focused jobs with a free API token.",
    requiresKey: true,
    keyEnvVar: "FINDWORK_API_KEY",
    docs: "https://findwork.dev/developers/",
  },
  {
    key: "jsearch",
    name: "JSearch (RapidAPI)",
    category: "keyed",
    description:
      "Aggregates LinkedIn, Indeed and Glassdoor via Google for Jobs. 200 calls/month free.",
    requiresKey: true,
    keyEnvVar: "RAPIDAPI_KEY",
    docs: "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch",
  },
  {
    key: "reed",
    name: "Reed",
    category: "keyed",
    description: "UK job board with a free API key.",
    requiresKey: true,
    keyEnvVar: "REED_API_KEY",
    docs: "https://www.reed.co.uk/developers",
  },
  {
    key: "usajobs",
    name: "USAJobs",
    category: "keyed",
    description: "US federal postings. Free key plus a contact email.",
    requiresKey: true,
    keyEnvVar: "USAJOBS_KEY",
    docs: "https://developer.usajobs.gov",
  },
  {
    key: "careerjet",
    name: "Careerjet",
    category: "keyed",
    description: "Job aggregator with a free API key.",
    requiresKey: true,
    keyEnvVar: "CAREERJET_KEY",
  },
  {
    key: "indeed",
    name: "Indeed",
    category: "scraped",
    description:
      "Collected by the Python collector using python-jobspy. No API key.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "glassdoor",
    name: "Glassdoor",
    category: "scraped",
    description:
      "Collected by the Python collector using python-jobspy. No API key.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    category: "scraped",
    description:
      "Guest transport by default; swap to a provider via LINKEDIN_TRANSPORT.",
    requiresKey: false,
    keyEnvVar: null,
  },
  {
    key: "wellfound",
    name: "Wellfound",
    category: "provider",
    description:
      "Startup jobs via the Apify Wellfound Scraper. Requires APIFY_TOKEN.",
    requiresKey: true,
    keyEnvVar: "APIFY_TOKEN",
    docs: "https://apify.com",
  },
  {
    key: "manual",
    name: "Manual import",
    category: "manual",
    description: "Paste a job URL to add it as a lead by hand.",
    requiresKey: false,
    keyEnvVar: null,
  },
];

export const HIDE_REASONS = [
  { key: "not_remote", label: "Not remote", sort: 1 },
  { key: "location", label: "Location mismatch", sort: 2 },
  { key: "stack", label: "Stack mismatch", sort: 3 },
  { key: "seniority", label: "Seniority mismatch", sort: 4 },
  { key: "agency", label: "Agency / staffing", sort: 5 },
  { key: "duplicate", label: "Duplicate", sort: 6 },
  { key: "closed", label: "Closed / expired", sort: 7 },
  { key: "contacted", label: "Already contacted", sort: 8 },
  { key: "low_quality", label: "Low quality", sort: 9 },
  { key: "other", label: "Other", sort: 10 },
];
