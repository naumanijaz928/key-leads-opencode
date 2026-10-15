# KeyLeads

KeyLeads collects remote software-job leads from LinkedIn **and many other
boards**, then gives a small team a clean workspace to triage them: view, apply,
hide, note, and export.

It is a clean-room build: its own Next.js API routes (`/api/v1/*`), its own
Postgres schema (Drizzle), and its own collectors. Runs are **manual** — nothing
is scraped or scheduled until someone presses *Run now*.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (CSS-first tokens, light + dark)
- **Drizzle ORM** over Postgres (Supabase)
- **Supabase Auth** (`@supabase/ssr`) for browser sessions
- **Resend** for transactional email (dev fallback logs to console)
- **TanStack Query**, **zod v4**, **Radix UI** primitives, **lucide-react**
- **Python FastAPI + python-jobspy** collector for Indeed / Glassdoor
- **Vitest** for unit tests

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run db:push              # create tables (or db:migrate)
npm run db:seed              # seed sources, hide reasons, default team
npm run dev
```

Without Supabase env the app boots in a read-only "setup" state and shows a
notice instead of crashing.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:migrate` / `db:push` | Apply migrations / push schema |
| `npm run db:seed` | Seed reference data |

## Sources

Keyless adapters run natively in TypeScript (RemoteOK, Remotive, Himalayas,
Jobicy, Arbeitnow, Hacker News). Keyed adapters activate when their environment
variable is present (Adzuna, Jooble, The Muse, Findwork.dev, JSearch, Reed,
USAJobs, Careerjet, Wellfound via Apify). LinkedIn uses a guest transport and
can be disabled by clearing `LINKEDIN_TRANSPORT`. Indeed and Glassdoor require
the bundled collector service:

```bash
cd collector
python -m venv .venv && . .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Then set `COLLECTOR_URL=http://localhost:8000`. Any source without its key is
skipped and shown as **not configured** — never an error.

## RLS

`supabase/policies.sql` enables row level security and team-scoped policies as
defence in depth for browser (anon-key) access:

```bash
psql "$DATABASE_URL" -f supabase/policies.sql
```

## Architecture notes

- `src/app/api/v1/*` — REST endpoints (route handlers, zod validation).
- `src/features/*` — feature code (queries, hooks, adapters) colocated per domain.
- `src/features/runs/` — adapter registry, executor, SSE event bus.
- `src/lib/db/schema.ts` — the 19-table schema.
- `CONTEXT.md` — deeper notes on roles, flows, and the source matrix.
