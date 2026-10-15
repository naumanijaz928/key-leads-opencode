-- KeyLeads row level security
--
-- Defence in depth for Supabase clients that authenticate with the anon key.
-- The Next.js server talks to Postgres with the service connection string, which
-- bypasses RLS; these policies constrain browser-side access.
--
-- Apply after the generated migration:
--   psql "$DATABASE_URL" -f supabase/policies.sql

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'team_admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_team_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.team_access(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_super_admin()
      or target is null
      or target = public.current_team_id();
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.teams            enable row level security;
alter table public.profiles         enable row level security;
alter table public.team_members     enable row level security;
alter table public.invitations      enable row level security;
alter table public.signup_requests  enable row level security;
alter table public.companies        enable row level security;
alter table public.searches         enable row level security;
alter table public.sources          enable row level security;
alter table public.leads            enable row level security;
alter table public.lead_views       enable row level security;
alter table public.lead_applications enable row level security;
alter table public.lead_hides       enable row level security;
alter table public.notes            enable row level security;
alter table public.runs             enable row level security;
alter table public.run_sources      enable row level security;
alter table public.settings         enable row level security;
alter table public.sessions         enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.hide_reasons     enable row level security;

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------

drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select using (public.is_super_admin() or id = public.current_team_id());

drop policy if exists teams_write on public.teams;
create policy teams_write on public.teams
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid() or public.team_access(team_id)
  );

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------

drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select using (public.team_access(team_id));

drop policy if exists team_members_write on public.team_members;
create policy team_members_write on public.team_members
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------------

drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select using (public.is_manager() and public.team_access(team_id));

drop policy if exists invitations_write on public.invitations;
create policy invitations_write on public.invitations
  for all using (public.is_manager() and public.team_access(team_id))
  with check (public.is_manager());

-- ---------------------------------------------------------------------------
-- signup_requests
-- ---------------------------------------------------------------------------

drop policy if exists signup_requests_select on public.signup_requests;
create policy signup_requests_select on public.signup_requests
  for select using (public.is_super_admin());

drop policy if exists signup_requests_insert on public.signup_requests;
create policy signup_requests_insert on public.signup_requests
  for insert with check (true);

drop policy if exists signup_requests_decide on public.signup_requests;
create policy signup_requests_decide on public.signup_requests
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Team scoped domain tables
-- ---------------------------------------------------------------------------

do $$
declare
  tbl text;
begin
  foreach tbl in array array['companies', 'searches', 'leads', 'runs', 'settings']
  loop
    execute format('drop policy if exists %I_team on public.%I', tbl, tbl);
    execute format(
      'create policy %I_team on public.%I for all using (public.team_access(team_id)) with check (public.team_access(team_id))',
      tbl, tbl
    );
  end loop;
end;
$$;

-- notes are scoped through their parent entity's team by the API layer only;
-- restrict to authenticated users with manager access or the author.
drop policy if exists notes_access on public.notes;
create policy notes_access on public.notes
  for all using (author_id = auth.uid() or public.is_manager())
  with check (author_id = auth.uid() or public.is_manager());

-- run_sources inherit access from their parent run.
drop policy if exists run_sources_access on public.run_sources;
create policy run_sources_access on public.run_sources
  for all using (
    exists (
      select 1 from public.runs r
      where r.id = run_sources.run_id and public.team_access(r.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.runs r
      where r.id = run_sources.run_id and public.team_access(r.team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Per-user lead interactions
-- ---------------------------------------------------------------------------

do $$
declare
  tbl text;
begin
  foreach tbl in array array['lead_views', 'lead_applications', 'lead_hides']
  loop
    execute format('drop policy if exists %I_owner on public.%I', tbl, tbl);
    execute format(
      'create policy %I_owner on public.%I for all using (user_id = auth.uid() or public.is_super_admin()) with check (user_id = auth.uid())',
      tbl, tbl
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Global catalogues
-- ---------------------------------------------------------------------------

drop policy if exists sources_select on public.sources;
create policy sources_select on public.sources
  for select using (auth.uid() is not null);

drop policy if exists sources_write on public.sources;
create policy sources_write on public.sources
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists hide_reasons_select on public.hide_reasons;
create policy hide_reasons_select on public.hide_reasons
  for select using (auth.uid() is not null);

drop policy if exists hide_reasons_write on public.hide_reasons;
create policy hide_reasons_write on public.hide_reasons
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- sessions & audit_logs
-- ---------------------------------------------------------------------------

drop policy if exists sessions_access on public.sessions;
create policy sessions_access on public.sessions
  for select using (user_id = auth.uid() or (public.is_manager() and public.team_access(team_id)));

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions
  for insert with check (user_id = auth.uid());

drop policy if exists audit_logs_access on public.audit_logs;
create policy audit_logs_access on public.audit_logs
  for select using (public.is_manager() and public.team_access(team_id));

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert with check (auth.uid() is not null);
