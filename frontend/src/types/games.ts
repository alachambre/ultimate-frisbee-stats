import type { GameStatus } from "./enums";
import type { Halftime } from "./halftimes";
import type { Player } from "./players";
import type { PointWithPlayers } from "./points";
import type { GamePointTimeline } from "./statistics";
import type { Stoppage } from "./stoppages";
import type { TurnoverWithPlayer } from "./turnovers";

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
  date?: string | null;
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

export interface GameDetail extends GameWithScore {
  points: PointWithPlayers[];
  players: Player[];
  halftime?: Halftime | null;
  timeline?: GamePointTimeline | null;
}

export interface GameLiveState {
  game_id: number;
  status: GameStatus;
  our_score: number;
  opponent_score: number;
  active_point: PointWithPlayers | null;
  active_point_turnovers: TurnoverWithPlayer[];
  active_point_stoppages: Stoppage[];
}
