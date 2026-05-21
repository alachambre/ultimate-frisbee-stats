import type { FieldSide, PointStatus } from "./enums";
import type { Player } from "./players";
import type { Strategy } from "./strategies";

export interface PointBase {
  starting_on_offense: boolean;
  field_side?: FieldSide | null;
  pull?: boolean | null;
  comments?: string | null;
}

export interface PointCreate extends PointBase {
  game_id: number;
  player_ids?: number[]; // Optional - can select players after creating point
  strategy_id?: number | null;
  start_datetime?: string | null; // Defaults to now if null
}

export interface PointFinish {
  won: boolean;
  comments?: string | null;
  end_datetime?: string | null; // Defaults to now if null
}

export interface PointUpdate {
  starting_on_offense?: boolean;
  won?: boolean | null;
  field_side?: FieldSide | null;
  pull?: boolean | null;
  strategy_id?: number | null;
  comments?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  status?: PointStatus;
  player_ids?: number[] | null;
}

export interface Point extends PointBase {
  id: number;
  game_id: number;
  point_number: number;
  won: boolean | null; // Nullable while not completed
  status: PointStatus;
  strategy_id?: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  created_at: string;
}

export interface PointWithPlayers extends Point {
  players: Player[];
  strategy?: Strategy | null;
  our_turnovers?: number;
  opponent_turnovers?: number;
  duration_seconds?: number | null; // Computed property
}
