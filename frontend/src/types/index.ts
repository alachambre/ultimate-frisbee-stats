// ============================================
// Team Types
// ============================================

export interface TeamBase {
  name: string;
}

export interface TeamCreate extends TeamBase {}

export interface TeamUpdate extends TeamBase {}

export interface Team extends TeamBase {
  id: number;
  created_at: string;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

// ============================================
// Player Types
// ============================================

export interface PlayerBase {
  name: string;
  number?: number | null;
}

export interface PlayerCreate extends PlayerBase {
  team_id: number;
}

export interface PlayerUpdate extends PlayerBase {}

export interface Player extends PlayerBase {
  id: number;
  team_id: number;
  created_at: string;
}

// ============================================
// Game Types
// ============================================

export interface GameBase {
  opponent_name: string;
  date?: string | null;
}

export interface GameCreate extends GameBase {
  team_id: number;
}

export interface GameUpdate {
  opponent_name?: string;
  status?: "in_progress" | "finished";
}

export interface Game extends GameBase {
  id: number;
  team_id: number;
  status: "in_progress" | "finished";
  created_at: string;
}

export interface GameWithScore extends Game {
  our_score: number;
  opponent_score: number;
  team_name: string;
}

// ============================================
// Point Types
// ============================================

export interface PointBase {
  starting_on_offense: boolean;
}

export interface PointCreate extends PointBase {
  game_id: number;
  player_ids: number[];
  start_datetime?: string | null; // Defaults to now if null
}

export interface PointFinish {
  won: boolean;
  end_datetime?: string | null; // Defaults to now if null
}

export interface PointUpdate {
  starting_on_offense?: boolean;
  won?: boolean | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  status?: "active" | "completed";
  player_ids?: number[] | null;
}

export interface Point extends PointBase {
  id: number;
  game_id: number;
  point_number: number;
  won: boolean | null; // Nullable while active
  status: "active" | "completed";
  start_datetime: string | null;
  end_datetime: string | null;
  created_at: string;
}

export interface PointWithPlayers extends Point {
  players: Player[];
  duration_seconds?: number | null; // Computed property
}

// ============================================
// Game Detail Types
// ============================================

export interface GameDetail extends GameWithScore {
  points: PointWithPlayers[];
}
