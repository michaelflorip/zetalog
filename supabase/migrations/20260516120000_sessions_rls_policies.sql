-- Sessions RLS: own-row writes/reads + public read for leaderboard (is_public profiles)
-- Safe to re-run: drops named policies first.

alter table public.sessions enable row level security;

drop policy if exists "Users can insert their own sessions" on public.sessions;
drop policy if exists "Users can view their own sessions" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_select_public_profiles" on public.sessions;
drop policy if exists "sessions_select_public_profiles_anon" on public.sessions;

-- Inserts: JWT subject must match row user_id (attempt_number/source are not checked here)
create policy "sessions_insert_own"
  on public.sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Dashboard / play: read own rows
create policy "sessions_select_own"
  on public.sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Leaderboard: read sessions for users who opted into public Hall of Fame
create policy "sessions_select_public_profiles"
  on public.sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = sessions.user_id
        and p.is_public is true
    )
  );

create policy "sessions_select_public_profiles_anon"
  on public.sessions
  for select
  to anon
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = sessions.user_id
        and p.is_public is true
    )
  );
