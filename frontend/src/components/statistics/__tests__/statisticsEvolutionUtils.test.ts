import { describe, expect, it } from "vitest";
import type { TeamEvolutionGame } from "../../../types";
import {
  getEvolutionChartLabel,
  getEvolutionMetricGroupLabel,
  getEvolutionScoreLabel,
  localizeEvolutionMetric,
  type EvolutionTranslator,
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
  const translate: EvolutionTranslator = (key, options) => {
    const translations: Record<string, string> = {
      "statistics:evolution.metrics.offense_our_turnovers.label": "Turns O-line",
      "statistics:evolution.metrics.offense_our_turnovers.description":
        "Turns commis par nous sur les points commences en attaque.",
      "statistics:evolution.metricGroups.turnovers": "Turns",
    };

    return translations[key] ?? options.defaultValue;
  };

  it("uses opponent names as evolution chart labels", () => {
    expect(getEvolutionChartLabel(evolutionGame)).toBe("Rivals");
  });

  it("formats evolution score labels", () => {
    expect(getEvolutionScoreLabel(evolutionGame)).toBe("2 - 1");
  });

  it("localizes metric labels and descriptions by metric id", () => {
    const metric = {
      id: "offense_our_turnovers",
      label: "O-line turns",
      description: "Possession turnovers committed by us on points started on offense.",
      unit: "count" as const,
      group: "turnovers",
      format: "integer" as const,
      higher_is_better: false,
    };

    expect(localizeEvolutionMetric(metric, translate)).toMatchObject({
      label: "Turns O-line",
      description: "Turns commis par nous sur les points commences en attaque.",
    });
  });

  it("localizes metric group labels", () => {
    expect(getEvolutionMetricGroupLabel("turnovers", translate)).toBe("Turns");
    expect(getEvolutionMetricGroupLabel("unknown", translate)).toBe("unknown");
  });
});
