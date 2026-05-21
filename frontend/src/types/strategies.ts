import type { StrategyCategory } from "./enums";

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
