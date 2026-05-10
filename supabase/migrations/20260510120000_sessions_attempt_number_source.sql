-- Sessions: per-day attempt sequence + provenance
-- Apply with: supabase db push (or run SQL in Supabase SQL editor)

alter table public.sessions
  add column if not exists attempt_number integer,
  add column if not exists source text not null default 'zetavant';

comment on column public.sessions.attempt_number is
  'Ordinal for this user on the local calendar day when the session was saved (client-computed).';

comment on column public.sessions.source is
  'Origin of the session row; default zetavant.';
