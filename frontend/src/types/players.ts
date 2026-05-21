import type { Gender } from "./enums";

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
