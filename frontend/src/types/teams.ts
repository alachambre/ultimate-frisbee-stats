import type { Player } from "./players";

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
