set search_path = public;

update public.turnovers
set turnover_type = 'miscommunication'
where turnover_type = 'wind';

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
        'miscommunication',
        'other'
      )
    );
end $$;
