import type { FieldSide, TurnoverType } from "./enums";

export type EvolutionMetricUnit = "count" | "percentage";
export type EvolutionMetricFormat = "integer" | "percentage";

export interface EvolutionMetricDefinition {
  id: string;
  label: string;
  description: string;
  unit: EvolutionMetricUnit;
  group: string;
  format: EvolutionMetricFormat;
  higher_is_better: boolean;
}

export interface EvolutionMetricPreset {
  id: string;
  label: string;
  metric_ids: string[];
}

export interface TeamEvolutionFilters {
  competition_ids: number[];
  game_ids: number[];
  player_ids: number[];
}

export interface TeamEvolutionGame {
  game_id: number;
  competition_id: number;
  competition_name: string;
  opponent_name: string;
  date: string;
  our_score: number;
  opponent_score: number;
  completed_points: number;
  metrics: Record<string, number>;
}

export interface TeamEvolutionResponse {
  team_id: number;
  filters: TeamEvolutionFilters;
  default_preset_id: string;
  omitted_games_count: number;
  metrics: EvolutionMetricDefinition[];
  presets: EvolutionMetricPreset[];
  games: TeamEvolutionGame[];
}

export interface PlayerOffenseStats {
  points_played: number;
  points_won: number;
  points_lost: number;
  hold_rate: number;
  points_won_no_turnover: number;
  clean_hold_rate: number;
  our_turnovers?: number;
  opponent_turnovers?: number;
}

export interface PlayerDefenseStats {
  points_played: number;
  points_won: number;
  points_lost: number;
  break_rate: number;
  points_with_turnover: number;
  turnover_rate: number;
  conversion_rate: number;
  points_won_no_turnover: number;
  clean_break_rate: number;
  clean_conversion_rate: number;
  points_lost_no_turnover: number;
  our_turnovers?: number;
  opponent_turnovers?: number;
}

export interface TurnoverTypeCount {
  count: number;
  percentage: number;
}

export interface TurnoverTypeBucket {
  total_turnovers: number;
  by_type: Record<TurnoverType, TurnoverTypeCount>;
}

export interface TurnoverTypePhaseStats {
  our_possession_turnovers: TurnoverTypeBucket;
  opponent_possession_turnovers: TurnoverTypeBucket;
}

export interface TurnoverTypeStats {
  all_points: TurnoverTypePhaseStats;
  started_on_offense: TurnoverTypePhaseStats;
  started_on_defense: TurnoverTypePhaseStats;
}

export interface PlayerGameStats {
  player_id: number;
  player_name: string;
  player_number: number | null;
  points_played: number;
  effective_time_seconds: number;
  turnover_type_stats?: TurnoverTypeStats;
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
  our_turnovers?: number;
  opponent_turnovers?: number;
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
  conversion_rate: number;
  points_won_no_turnover: number;
  clean_break_rate: number;
  clean_conversion_rate: number;
  points_lost_no_turnover: number;
  our_turnovers?: number;
  opponent_turnovers?: number;
  pull_stats: PullStats;
}

export interface FieldSideOffenseStats {
  points_started: number;
  points_won: number;
  hold_rate: number;
}

export interface FieldSideDefenseStats {
  points_started: number;
  points_won: number;
  break_rate: number;
}

export interface FieldSideSplitStats {
  offense: FieldSideOffenseStats;
  defense: FieldSideDefenseStats;
}

export interface FieldSideStats {
  table_left: FieldSideSplitStats;
  table_right: FieldSideSplitStats;
}

export interface TeamStatsBase {
  total_completed_points: number;
  turnover_type_stats?: TurnoverTypeStats;
  offense: OffenseStats;
  defense: DefenseStats;
  field_side_stats: FieldSideStats;
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
  turnover_type_stats?: TurnoverTypeStats;
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

export interface GamePointTimelinePoint {
  point_id: number;
  point_number: number;
  starting_on_offense: boolean;
  won: boolean;
  field_side?: FieldSide | null;
  duration_seconds: number;
  our_turnovers: number;
  opponent_turnovers: number;
  our_score_after: number;
  opponent_score_after: number;
}

export interface GamePointTimeline {
  game_id: number;
  halftime_after_point_number?: number | null;
  points: GamePointTimelinePoint[];
}
