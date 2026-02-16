// ============================================
// Enum Types
// ============================================

export type Gender = "M" | "W";
export type CompetitionStatus = "ongoing" | "completed";
export type GameStatus = "ready" | "started" | "ended";
export type PointStatus = "ready" | "running" | "scored" | "completed";
export type StrategyCategory = "offense" | "defense";
export type FieldSide = "table_left" | "table_right";

// ============================================
// Team Types
// ============================================

export interface TeamBase {
  name: string;
}

export type TeamCreate = TeamBase;

export type TeamUpdate = TeamBase;

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
  gender: Gender;
}

export interface PlayerCreate extends PlayerBase {
  team_id: number;
}

export interface PlayerUpdate {
  name?: string;
  number?: number | null;
  gender?: Gender;
}

export interface Player extends PlayerBase {
  id: number;
  team_id: number;
  created_at: string;
}

// ============================================
// Competition Types
// ============================================

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

// ============================================
// Line Types
// ============================================

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

// ============================================
// Strategy Types
// ============================================

export interface StrategyBase {
  name: string;
  description?: string | null;
  category: StrategyCategory;
}

export type StrategyCreate = StrategyBase;

export interface StrategyUpdate {
  name?: string;
  description?: string | null;
  category?: StrategyCategory;
}

export interface Strategy extends StrategyBase {
  id: number;
  created_at: string;
}

// ============================================
// Game Types
// ============================================

export interface GameBase {
  opponent_name: string;
  date?: string | null;
  comments?: string | null;
}

export interface GameCreate extends GameBase {
  competition_id: number;
  player_ids?: number[];
}

export interface GameUpdate {
  opponent_name?: string;
  status?: GameStatus;
  comments?: string | null;
}

export interface Game extends GameBase {
  id: number;
  competition_id: number;
  status: GameStatus;
  start_datetime?: string | null;
  end_datetime?: string | null;
  created_at: string;
}

export interface GameWithScore extends Game {
  our_score: number;
  opponent_score: number;
  team_name: string;
  competition_name: string;
}

// ============================================
// Point Types
// ============================================

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
  duration_seconds?: number | null; // Computed property
}

// ============================================
// Game Detail Types
// ============================================

export interface GameDetail extends GameWithScore {
  points: PointWithPlayers[];
  players: Player[];
  halftime?: Halftime | null;
}

// ============================================
// Halftime Types
// ============================================

export interface Halftime {
  id: number;
  game_id: number;
  halftime_timestamp: string; // ISO datetime with 'Z'
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
}

export interface HalftimeCreate {
  game_id: number;
  halftime_timestamp?: string | null;
  comments?: string | null;
}

export interface HalftimeUpdate {
  halftime_timestamp?: string | null;
  comments?: string | null;
}

// ============================================
// Stoppage Types
// ============================================

export type StoppageType = "call" | "injury" | "timeout" | "other";

export interface Stoppage {
  id: number;
  point_id: number;
  stoppage_type?: StoppageType;
  call_timestamp: string; // ISO datetime with 'Z'
  resume_timestamp: string | null; // ISO datetime with 'Z', null until resolved
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
}

export interface StoppageCreate {
  point_id: number;
  stoppage_type?: StoppageType;
  call_timestamp: string; // ISO datetime
  resume_timestamp?: string | null;
  comments?: string | null;
}

export interface StoppageUpdate {
  stoppage_type?: StoppageType;
  resume_timestamp?: string | null;
  comments?: string | null;
}

// ============================================
// Turnover Types
// ============================================

export interface TurnoverWithPlayer {
  id: number;
  point_id: number;
  player_id: number | null; // Optional - can be null for team turnovers
  timestamp: string; // ISO datetime with 'Z'
  comments: string | null;
  created_at: string; // ISO datetime with 'Z'
  player: Player | null; // Player details if player_id is set
}

export interface Turnover {
  id: number;
  point_id: number;
  player_id: number | null;
  timestamp: string;
  comments: string | null;
  created_at: string;
}

export interface TurnoverCreate {
  point_id: number;
  player_id?: number | null;
  timestamp: string; // ISO datetime
  comments?: string | null;
}

export interface TurnoverUpdate {
  player_id?: number | null;
  timestamp?: string;
  comments?: string | null;
}

// ============================================
// Statistics Types
// ============================================

export interface PlayerOffenseStats {
  points_played: number;
  points_won: number;
  points_lost: number;
  hold_rate: number;
  points_won_no_turnover: number;
  clean_hold_rate: number;
}

export interface PlayerDefenseStats {
  points_played: number;
  points_won: number;
  points_lost: number;
  break_rate: number;
  points_with_turnover: number;
  turnover_rate: number;
  points_won_no_turnover: number;
  clean_break_rate: number;
  points_lost_no_turnover: number;
}

export interface PlayerGameStats {
  player_id: number;
  player_name: string;
  player_number: number | null;
  points_played: number;
  effective_time_seconds: number;
  offense: PlayerOffenseStats;
  defense: PlayerDefenseStats;
}

export interface OffenseStats {
  points_started: number;
  points_won: number;
  points_lost: number;
  hold_rate: number;
  points_won_no_turnover: number;
  clean_hold_rate: number;
  broken_rate: number;
}

export interface PullStats {
  total_pulls: number;
  inbound_pulls: number;
  out_of_bounds_pulls: number;
  inbound_rate: number;
}

export interface DefenseStats {
  points_started: number;
  points_won: number;
  points_lost: number;
  break_rate: number;
  points_with_turnover: number;
  turnover_rate: number;
  points_won_no_turnover: number;
  clean_break_rate: number;
  points_lost_no_turnover: number;
  pull_stats: PullStats;
}

export interface TeamStatsBase {
  total_completed_points: number;
  offense: OffenseStats;
  defense: DefenseStats;
}

export interface GameTeamStats extends TeamStatsBase {
  game_id: number;
}

export interface CompetitionTeamStats extends TeamStatsBase {
  competition_id: number;
}

export interface TeamTeamStats extends TeamStatsBase {
  team_id: number;
}

export interface OffenseStrategyStats {
  strategy_id: number;
  strategy_name: string;
  points_played: number;
  points_won: number;
  points_lost: number;
  hold_rate: number;
  clean_holds: number;
  clean_hold_rate: number;
  quick_scores: number;
  quick_score_rate: number;
}

export interface DefenseStrategyStats {
  strategy_id: number;
  strategy_name: string;
  points_played: number;
  points_won: number;
  points_lost: number;
  break_rate: number;
  points_with_turnover: number;
  turnover_rate: number;
}

export interface StrategyStatsBase {
  offense_strategies: OffenseStrategyStats[];
  defense_strategies: DefenseStrategyStats[];
}

export interface GameStrategyStats extends StrategyStatsBase {
  game_id: number;
}

export interface CompetitionStrategyStats extends StrategyStatsBase {
  competition_id: number;
}

export interface TeamStrategyStats extends StrategyStatsBase {
  team_id: number;
}
