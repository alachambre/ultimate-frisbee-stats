create index if not exists idx_points_game_id
  on public.points (game_id);

create index if not exists idx_points_status
  on public.points (status);

create index if not exists idx_point_players_player_id
  on public.point_players (player_id);

create index if not exists idx_turnovers_point_time
  on public.turnovers (point_id, timestamp);

create index if not exists idx_stoppages_point_time
  on public.stoppages (point_id, call_timestamp);
