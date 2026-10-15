import type { SearchConfig, WorkMode } from "@/types";

export interface NormalizedJob {
  source: string;
  sourceJobId: string | null;
  url: string | null;
  applyUrl: string | null;
  title: string;
  companyName: string | null;
  companyLogo: string | null;
  companyDomain: string | null;
  location: string | null;
  country: string | null;
  workMode: WorkMode | null;
  workType: string | null;
  remoteScope: string | null;
  regions: string[];
  languages: string[];
  seniority: string | null;
  level: string | null;
  minYears: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryText: string | null;
  tech: string[];
  tags: string[];
  shortJd: string | null;
  description: string | null;
  postedAt: string | null;
}

export interface AdapterContext {
  config: SearchConfig;
  searchTerms: string[];
  limit: number;
  signal?: AbortSignal;
}

export interface SourceAdapter {
  key: string;
  name: string;
  category: "keyless" | "keyed" | "scraped" | "provider" | "manual";
  requiresKey: boolean;
  keyEnvVar?: string;
  isConfigured: () => boolean;
  collect: (context: AdapterContext) => Promise<NormalizedJob[]>;
}
