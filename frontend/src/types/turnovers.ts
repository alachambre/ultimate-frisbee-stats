import type { TurnoverType } from "./enums";
import type { Player } from "./players";

export interface TurnoverWithPlayer {
  id: number;
  point_id: number;
  player_id: number | null; // Optional - can be null for team turnovers
  turnover_type?: TurnoverType;
  timestamp: string; // ISO datetime with 'Z'
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
  player: Player | null; // Player details if player_id is set
}

export interface Turnover {
  id: number;
  point_id: number;
  player_id: number | null;
  turnover_type?: TurnoverType;
  timestamp: string;
  comments: string | null;
  created_at: string;
}

export interface TurnoverCreate {
  point_id: number;
  player_id?: number | null;
  turnover_type?: TurnoverType;
  timestamp: string; // ISO datetime
  comments?: string | null;
}

export interface TurnoverUpdate {
  player_id?: number | null;
  turnover_type?: TurnoverType;
  timestamp?: string;
  comments?: string | null;
}
