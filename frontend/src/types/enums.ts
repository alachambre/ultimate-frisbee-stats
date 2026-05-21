export type Gender = "M" | "W";
export type CompetitionStatus = "ongoing" | "completed";
export type GameStatus = "ready" | "started" | "ended";
export type PointStatus = "ready" | "running" | "scored" | "completed";
export type StrategyCategory = "offense" | "defense";
export type FieldSide = "table_left" | "table_right";
export type ManagedUserRole = "team_member" | "team_analyst" | "admin";
export type TurnoverType =
  | "defended_pass"
  | "missed_pass"
  | "defended_huck"
  | "missed_huck"
  | "drop"
  | "stall_out"
  | "miscommunication"
  | "other";
