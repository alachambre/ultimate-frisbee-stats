import type {
  EvolutionMetricDefinition,
  EvolutionMetricUnit,
  TeamEvolutionGame,
} from "../../types";

export type EvolutionChartMode = "auto" | "line" | "bar";
export type EvolutionChartType = "line" | "bar";
export type EvolutionTranslator = (
  key: string,
  options: { defaultValue: string; [key: string]: unknown }
) => string;

export function localizeEvolutionMetric(
  metric: EvolutionMetricDefinition,
  translate: EvolutionTranslator
): EvolutionMetricDefinition {
  return {
    ...metric,
    label: translate(`statistics:evolution.metrics.${metric.id}.label`, {
      defaultValue: metric.label,
    }),
    description: translate(`statistics:evolution.metrics.${metric.id}.description`, {
      defaultValue: metric.description,
    }),
  };
}

export function getEvolutionMetricGroupLabel(
  group: string,
  translate: EvolutionTranslator
): string {
  return translate(`statistics:evolution.metricGroups.${group}`, {
    defaultValue: group,
  });
}

export function formatEvolutionMetricValue(
  metric: EvolutionMetricDefinition,
  value?: number,
  locale?: string
): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }

  if (metric.format === "percentage") {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: "percent",
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCompatibleEvolutionMetrics(
  metrics: EvolutionMetricDefinition[],
  preferredMetric?: EvolutionMetricDefinition
): EvolutionMetricDefinition[] {
  if (metrics.length === 0) {
    return [];
  }

  const targetUnit = preferredMetric?.unit ?? metrics[0].unit;
  return metrics.filter((metric) => metric.unit === targetUnit);
}

export function resolveEvolutionChartType(
  mode: EvolutionChartMode,
  unit: EvolutionMetricUnit | undefined
): EvolutionChartType {
  if (mode === "line" || mode === "bar") {
    return mode;
  }

  return unit === "percentage" ? "line" : "bar";
}

export function getEvolutionScoreLabel(game: TeamEvolutionGame): string {
  return `${game.our_score} - ${game.opponent_score}`;
}

export function getEvolutionChartLabel(game: TeamEvolutionGame): string {
  return game.opponent_name;
}
