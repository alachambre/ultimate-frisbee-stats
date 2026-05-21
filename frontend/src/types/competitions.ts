import type { CompetitionStatus } from "./enums";
import type { Player } from "./players";

export interface CompetitionBase {
  name: string;
  description?: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
}

export interface CompetitionCreate extends CompetitionBase {
  team_id: number;
  player_ids?: number[];
}

export interface CompetitionUpdate {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  status?: CompetitionStatus;
}

export interface Competition extends CompetitionBase {
  id: number;
  team_id: number;
  status: CompetitionStatus;
  created_at: string;
}

export interface CompetitionWithPlayers extends Competition {
  players: Player[];
}

export interface CompetitionWithTeam extends Competition {
  team_name: string;
}

export interface PlayerIdsRequest {
  player_ids: number[];
}
