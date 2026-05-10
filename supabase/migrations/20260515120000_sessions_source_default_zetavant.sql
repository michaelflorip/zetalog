-- Rebrand: default session source is zetavant (existing DBs that already ran prior migration)

alter table public.sessions
  alter column source set default 'zetavant';

comment on column public.sessions.source is
  'Origin of the session row; default zetavant.';
