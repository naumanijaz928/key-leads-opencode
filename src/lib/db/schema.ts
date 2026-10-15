import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ownerId: uuid("owner_id"),
    ...timestamps,
  },
  (t) => [uniqueIndex("teams_slug_key").on(t.slug)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email"),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    timezone: text("timezone").default("UTC"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("profiles_email_idx").on(t.email),
    index("profiles_team_idx").on(t.teamId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("team_members_unique").on(t.teamId, t.userId)],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    status: text("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("invitations_token_key").on(t.token),
    index("invitations_email_idx").on(t.email),
  ],
);

export const signupRequests = pgTable(
  "signup_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    fullName: text("full_name"),
    note: text("note"),
    status: text("status").notNull().default("pending"),
    decidedBy: uuid("decided_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("signup_requests_status_idx").on(t.status)],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    website: text("website"),
    domain: text("domain"),
    logoUrl: text("logo_url"),
    location: text("location"),
    size: text("size"),
    status: text("status").notNull().default("new"),
    openRoles: integer("open_roles").notNull().default(0),
    tech: jsonb("tech").$type<string[]>().notNull().default([]),
    titles: jsonb("titles").$type<string[]>().notNull().default([]),
    sources: jsonb("sources").$type<string[]>().notNull().default([]),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    notes: text("notes"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("companies_team_slug_key").on(t.teamId, t.slug),
    index("companies_name_idx").on(t.name),
  ],
);

export const searches = pgTable(
  "searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    priority: integer("priority").notNull().default(0),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [index("searches_team_idx").on(t.teamId)],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull().default("keyless"),
    description: text("description"),
    requiresKey: boolean("requires_key").notNull().default(false),
    keyEnvVar: text("key_env_var"),
    enabled: boolean("enabled").notNull().default(true),
    status: text("status").notNull().default("idle"),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("sources_key_key").on(t.key)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceJobId: text("source_job_id"),
    url: text("url"),
    applyUrl: text("apply_url"),
    title: text("title").notNull(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    companyName: text("company_name"),
    companyLogo: text("company_logo"),
    location: text("location"),
    country: text("country"),
    workMode: text("work_mode"),
    workType: text("work_type"),
    remoteScope: text("remote_scope"),
    regions: jsonb("regions").$type<string[]>().notNull().default([]),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    seniority: text("seniority"),
    level: text("level"),
    minYears: integer("min_years"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency"),
    salaryText: text("salary_text"),
    tech: jsonb("tech").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    shortJd: text("short_jd"),
    description: text("description"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    verdict: text("verdict").notNull().default("lead"),
    rejectReason: text("reject_reason"),
    score: integer("score"),
    priority: integer("priority").notNull().default(0),
    pipeline: text("pipeline").notNull().default("new"),
    searchId: uuid("search_id").references(() => searches.id, {
      onDelete: "set null",
    }),
    runId: uuid("run_id"),
    dedupKey: text("dedup_key").notNull(),
    raw: jsonb("raw").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("leads_dedup_key").on(t.dedupKey),
    index("leads_source_idx").on(t.source),
    index("leads_verdict_idx").on(t.verdict),
    index("leads_company_idx").on(t.companyId),
    index("leads_posted_idx").on(t.postedAt),
    index("leads_team_idx").on(t.teamId),
  ],
);

export const leadViews = pgTable(
  "lead_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lead_views_unique").on(t.leadId, t.userId)],
);

export const leadApplications = pgTable(
  "lead_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("applied"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lead_applications_unique").on(t.leadId, t.userId)],
);

export const leadHides = pgTable(
  "lead_hides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    reason: text("reason").notNull().default("other"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lead_hides_unique").on(t.leadId, t.userId)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    body: text("body").notNull(),
    authorId: uuid("author_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notes_entity_idx").on(t.entityType, t.entityId)],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"),
    trigger: text("trigger").notNull().default("manual"),
    searchId: uuid("search_id").references(() => searches.id, {
      onDelete: "set null",
    }),
    startedBy: uuid("started_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    totalSources: integer("total_sources").notNull().default(0),
    completedSources: integer("completed_sources").notNull().default(0),
    fetched: integer("fetched").notNull().default(0),
    matched: integer("matched").notNull().default(0),
    newLeads: integer("new_leads").notNull().default(0),
    dropped: integer("dropped").notNull().default(0),
    warnings: integer("warnings").notNull().default(0),
    error: text("error"),
    params: jsonb("params").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("runs_status_idx").on(t.status), index("runs_team_idx").on(t.teamId)],
);

export const runSources = pgTable(
  "run_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id, { onDelete: "cascade" }),
    sourceKey: text("source_key").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("pending"),
    fetched: integer("fetched").notNull().default(0),
    matched: integer("matched").notNull().default(0),
    newLeads: integer("new_leads").notNull().default(0),
    dropped: integer("dropped").notNull().default(0),
    skipped: integer("skipped").notNull().default(0),
    warnings: integer("warnings").notNull().default(0),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("run_sources_run_idx").on(t.runId)],
);

export const settings = pgTable("settings", {
  teamId: uuid("team_id")
    .primaryKey()
    .references(() => teams.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_team_idx").on(t.teamId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

export const hideReasons = pgTable(
  "hide_reasons",
  {
    key: text("key").notNull(),
    label: text("label").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key] })],
);
