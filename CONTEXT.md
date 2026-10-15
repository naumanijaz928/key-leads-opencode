# CONTEXT.md

Domain + contracts for KeyLeads. Read with `AGENTS.md`.

Status: the full product is implemented and builds clean (`lint`, `typecheck`,
`build`, `test` all pass). Remaining external dependency: live Supabase project
and optional source API keys.

## Product

Find remote software jobs ("leads") from many platforms, triage them as a BD team, and
manage the people who do that. Own stack, own API, own data. Runs are triggered manually.

## Roles

| Capability | member | team_admin | super_admin |
|---|---|---|---|
| View/apply/hide/note leads | ✓ | ✓ | ✓ |
| Add from LinkedIn / import | ✓ | ✓ | ✓ |
| Manage searches | ✓ | ✓ | ✓ |
| Toggle sources | — | ✓ | ✓ |
| Trigger a run ("Run now") | ✓ | ✓ | ✓ |
| Invite members | — | ✓ | ✓ |
| Approve self-signups | — | — | ✓ |
| Manage teams / roles / access | — | view own team | ✓ |
| Session & action logs | — | own team | all |

The first-ever sign-up becomes `super_admin` automatically (bootstrap); every
later self-signup lands in the `pending` waiting list.

## Flows

**Invite**: admin invites (email + role + team) → `invitations` row + token → Resend email →
`/accept-invite?token=…` → set name/password → Supabase Auth user + profile + membership.

**Self-signup**: `/signup` → `pending` profile → appears in super-admin **Access** waiting
list → approve/reject (email notified) → login enabled.

**Manual run**: `POST /api/v1/runs` creates a `runs` row (`queued`) plus a `run_sources`
row per chosen source, then an in-process executor marks it `running`, runs each adapter,
normalizes + dedups (`leads.dedup_key`), upserts companies, writes leads, and updates
per-source progress → `done | failed | cancelled`. The UI streams
`GET /api/v1/runs/:id/stream` (SSE) only while the run is active, then the connection closes.

## Routes (web)

`(auth)`: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/accept-invite`, `/pending`
`(app)`: `/`, `/leads`, `/companies`, `/runs`, `/import`, `/searches`, `/sources`, `/profile`, `/settings`
`admin`: `/admin/teams`, `/admin/access`, `/admin/sessions`, `/admin/actions`

## API (`/api/v1`, Next route handlers + Drizzle)

- **auth**: `POST /auth/signup|login|logout|forgot-password|reset-password|accept-invite`; `GET|PATCH /me`
- **teams/admin**: `GET|POST|PATCH|DELETE /teams` (id via `?id=`) ; `GET|POST|DELETE /teams/:id/members`
  (`userId` via `?userId=`); `GET|POST|DELETE /invitations` (`id` via `?id=`); `GET|POST /invitations/verify`;
  `GET|POST /signup-requests` (POST decides); `GET|PATCH /users`; `GET /sessions`; `GET /audit-logs`
- **leads**: `GET /leads`; `GET /leads/:id`; `POST /leads/:id/view`; `POST|DELETE /leads/:id/apply`;
  `POST|DELETE /leads/:id/hide`; `POST /leads/import`; `GET /leads/roles`; `GET /hide-reasons`
- **companies**: `GET /companies`; `GET|PATCH /companies/:id` (detail returns the company + its leads)
- **searches**: `GET|POST /searches`; `GET|PATCH|DELETE /searches/:id`; `POST /searches/:id/preview`
- **sources**: `GET /sources`; `PATCH /sources/:id`
- **runs**: `GET|POST /runs`; `GET|DELETE /runs/:id` (DELETE cancels); `GET /runs/:id/stream` (SSE)
- **settings/export**: `GET|PATCH /settings`; `GET /export/leads?format=csv|json`

All responses are `{ ... }` JSON; errors are `{ error, details? }`.

## Data model (Postgres, Drizzle `src/lib/db/schema.ts`)

`teams`, `profiles`, `team_members`, `invitations`, `signup_requests`, `companies`,
`searches`, `sources`, `leads`, `lead_views`, `lead_applications`, `lead_hides`, `notes`,
`runs`, `run_sources`, `settings`, `sessions`, `audit_logs`, `hide_reasons`.

`profiles.id` = `auth.users.id`. Tenant data scoped by `team_id`. `leads.dedup_key` is a
unique index used for idempotent inserts. RLS lives in `supabase/policies.sql`.

## Sources → fetch method

Implemented adapters (`src/features/runs/adapters/`):

| Source | Method | Env key |
|---|---|---|
| RemoteOK, Remotive, Himalayas, Jobicy, Arbeitnow, Hacker News | public JSON | none |
| Adzuna | REST | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADZUNA_COUNTRY` |
| Jooble | REST | `JOOBLE_API_KEY`, `JOOBLE_API_URL` |
| The Muse | REST | `MUSE_API_KEY` |
| Findwork.dev | REST | `FINDWORK_API_KEY` |
| JSearch (RapidAPI) | REST | `RAPIDAPI_KEY` |
| Reed | REST | `REED_API_KEY` |
| USAJobs | REST | `USAJOBS_KEY`, `USAJOBS_EMAIL` |
| Careerjet | REST | `CAREERJET_KEY` |
| Indeed, Glassdoor | `python-jobspy` (collector) | `COLLECTOR_URL`, `COLLECTOR_TOKEN` |
| Wellfound | Apify Wellfound Scraper | `APIFY_TOKEN`, `APIFY_WELLFOUND_ACTOR` |
| LinkedIn | guest transport | `LINKEDIN_TRANSPORT=guest` |
| Manual | paste / extension | — |

The remaining keyless boards (Working Nomads, 4 Day Week, Landing.jobs, Jobspresso, Torre,
ATS boards, YC) are catalogued in `src/lib/sources-catalog.ts` and seeded; add an adapter
in the same shape to enable them. Missing key ⇒ adapter skipped and shown as "not
configured". Attribution/backlink required for Remotive and Himalayas (Settings toggle).

## Collector

`collector/` is a FastAPI app exposing `GET /health` and
`GET /jobs?source=indeed|glassdoor&q=&limit=` backed by `python-jobspy`. Run with
`uvicorn main:app --port 8000`. Python 3.11–3.13 recommended (3.14 may be too new for the
Selenium/`jobspy` dependency chain).

## Env

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL                        # Postgres (pooler) for Drizzle
RESEND_API_KEY, EMAIL_FROM
COLLECTOR_URL, COLLECTOR_TOKEN
ADZUNA_APP_ID, ADZUNA_APP_KEY, ADZUNA_COUNTRY, JOOBLE_API_KEY, JOOBLE_API_URL
MUSE_API_KEY, FINDWORK_API_KEY, RAPIDAPI_KEY, REED_API_KEY
USAJOBS_KEY, USAJOBS_EMAIL, CAREERJET_KEY
APIFY_TOKEN, APIFY_WELLFOUND_ACTOR
LINKEDIN_TRANSPORT=guest
```

## Lead statuses / reasons

`verdict`: lead | reject · `work_mode`: remote | hybrid | onsite · pipeline: new | contacted | applied | closed
Hide reasons: `not_remote, location, stack, seniority, agency, duplicate, closed, contacted, low_quality, other`.

## Reference

`ref-images/` holds screenshots of the original tool used only as a UX reference
(Leads, Add from LinkedIn, Companies, Searches, Sources, Runs, Settings, modals).
