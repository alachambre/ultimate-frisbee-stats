import { describe, expect, it } from "vitest";
import type { TeamEvolutionGame } from "../../../types";
import {
  getEvolutionChartLabel,
  getEvolutionScoreLabel,
} from "../statisticsEvolutionUtils";

const evolutionGame: TeamEvolutionGame = {
  game_id: 10,
  competition_id: 20,
  competition_name: "Spring Cup",
  opponent_name: "Rivals",
  date: "2026-03-15T10:00:00Z",
  our_score: 2,
  opponent_score: 1,
  completed_points: 3,
  metrics: {},
};

describe("statisticsEvolutionUtils", () => {
  it("uses opponent names as evolution chart labels", () => {
    expect(getEvolutionChartLabel(evolutionGame)).toBe("Rivals");
  });

  it("formats evolution score labels", () => {
    expect(getEvolutionScoreLabel(evolutionGame)).toBe("2 - 1");
  });
});
