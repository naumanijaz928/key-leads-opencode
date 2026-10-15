export type Role = "super_admin" | "team_admin" | "member";

export type ProfileStatus = "active" | "pending" | "suspended";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type Verdict = "lead" | "reject";

export type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export type RunSourceStatus =
  | "pending"
  | "running"
  | "ok"
  | "failed"
  | "skipped"
  | "not_configured";

export type LeadPipeline = "new" | "contacted" | "applied" | "closed";

export interface SessionUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  status: ProfileStatus;
  teamId: string | null;
  teamName: string | null;
}

export interface Lead {
  id: string;
  source: string;
  sourceJobId: string | null;
  url: string | null;
  applyUrl: string | null;
  title: string;
  companyId: string | null;
  companyName: string | null;
  companyLogo: string | null;
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
  verdict: Verdict;
  rejectReason: string | null;
  score: number | null;
  priority: number | null;
  pipeline: LeadPipeline;
  searchId: string | null;
  runId: string | null;
  viewed: boolean;
  applied: boolean;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  domain: string | null;
  logoUrl: string | null;
  location: string | null;
  size: string | null;
  status: string;
  openRoles: number;
  tech: string[];
  titles: string[];
  sources: string[];
  ownerId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchProfile {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  priority: number;
  config: SearchConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SearchConfig {
  search_terms: string[];
  title_include: string[];
  title_exclude: string[];
  tech_any: string[];
  tech_exclude: string[];
  min_years: number | null;
  level_exclude: string[];
  unknown_level_ok: boolean;
  remote_policy: "remote_only" | "remote_or_hybrid" | "any";
  regions_include: string[];
  regions_exclude: string[];
  languages: string[];
  window_hours: number;
  sources: string[];
  priority: number;
}

export interface Run {
  id: string;
  status: RunStatus;
  trigger: string;
  searchId: string | null;
  startedBy: string | null;
  totalSources: number;
  completedSources: number;
  fetched: number;
  matched: number;
  newLeads: number;
  dropped: number;
  warnings: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface RunSource {
  id: string;
  runId: string;
  sourceKey: string;
  name: string;
  status: RunSourceStatus;
  fetched: number;
  matched: number;
  newLeads: number;
  dropped: number;
  skipped: number;
  warnings: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface SourceRow {
  id: string;
  key: string;
  name: string;
  category: "keyless" | "keyed" | "scraped" | "provider" | "manual";
  description: string | null;
  requiresKey: boolean;
  keyEnvVar: string | null;
  enabled: boolean;
  configured: boolean;
  status: string;
  lastRunAt: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
