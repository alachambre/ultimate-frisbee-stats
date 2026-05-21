import type { Player } from "./players";

export interface LineBase {
  name: string;
  description?: string | null;
}

export interface LineCreate extends LineBase {
  team_id: number;
  player_ids?: number[];
}

export interface LineUpdate {
  name?: string;
  description?: string | null;
}

export interface Line extends LineBase {
  id: number;
  team_id: number;
  created_at: string;
}

export interface LineWithPlayers extends Line {
  players: Player[];
}
