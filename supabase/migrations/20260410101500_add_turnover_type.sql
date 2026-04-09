set search_path = public;

alter table public.turnovers
  add column if not exists turnover_type text;

update public.turnovers
set turnover_type = 'other'
where turnover_type is null;

alter table public.turnovers
  alter column turnover_type set default 'other',
  alter column turnover_type set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'turnovers_turnover_type_check'
  ) then
    alter table public.turnovers drop constraint turnovers_turnover_type_check;
  end if;

  alter table public.turnovers
    add constraint turnovers_turnover_type_check
    check (
      turnover_type in (
        'defended_pass',
        'missed_pass',
        'defended_huck',
        'missed_huck',
        'drop',
        'stall_out',
        'wind',
        'other'
      )
    );
end $$;
