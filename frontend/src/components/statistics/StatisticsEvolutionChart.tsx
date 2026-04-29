import { useMemo } from "react";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { EvolutionMetricDefinition, TeamEvolutionResponse } from "../../types";
import { formatDate, formatDateTime } from "../../utils/dateFormatting";
import {
  formatEvolutionMetricValue,
  getEvolutionScoreLabel,
  resolveEvolutionChartType,
  type EvolutionChartMode,
  type EvolutionChartType,
} from "./statisticsEvolutionUtils";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

interface StatisticsEvolutionChartProps {
  evolution: TeamEvolutionResponse;
  selectedMetrics: EvolutionMetricDefinition[];
  chartMode: EvolutionChartMode;
}

export default function StatisticsEvolutionChart({
  evolution,
  selectedMetrics,
  chartMode,
}: StatisticsEvolutionChartProps) {
  const { t, i18n } = useTranslation(["statistics", "common"]);
  const theme = useTheme();
  const selectedUnit = selectedMetrics[0]?.unit;
  const chartType = resolveEvolutionChartType(chartMode, selectedUnit);
  const colorPalette = useMemo(
    () => [
      theme.colors.offense.main,
      theme.colors.pull.main,
      theme.colors.performance.veryLow,
      theme.colors.performance.high,
      theme.colors.women.main,
      theme.colors.performance.low,
      theme.colors.performance.veryHigh,
    ],
    [
      theme.colors.offense.main,
      theme.colors.performance.high,
      theme.colors.performance.low,
      theme.colors.performance.veryHigh,
      theme.colors.performance.veryLow,
      theme.colors.pull.main,
      theme.colors.women.main,
    ]
  );
  const chartLabels = useMemo(
    () => evolution.games.map((game) => formatDate(game.date, i18n.language, "monthDay")),
    [evolution.games, i18n.language]
  );
  const chartDatasets = useMemo(() => {
    return selectedMetrics.map((metric, index) => {
      const seriesColor = colorPalette[index % colorPalette.length];
      const baseDataset = {
        label: metric.label,
        data: evolution.games.map((game) => game.metrics[metric.id] ?? 0),
        borderColor: seriesColor,
        backgroundColor:
          chartType === "bar" ? alpha(seriesColor, 0.62) : alpha(seriesColor, 0.16),
      };

      if (chartType === "bar") {
        return {
          ...baseDataset,
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 32,
        } as ChartDataset<"bar", number[]>;
      }

      return {
        ...baseDataset,
        borderWidth: 3,
        tension: 0.24,
        cubicInterpolationMode: "monotone" as const,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHitRadius: 10,
      } as ChartDataset<"line", number[]>;
    }) as ChartDataset<EvolutionChartType, number[]>[];
  }, [chartType, colorPalette, evolution.games, selectedMetrics]);
  const chartData: ChartData<EvolutionChartType, number[], string> = {
    labels: chartLabels,
    datasets: chartDatasets,
  };
  const yAxisLabel =
    selectedUnit === "percentage"
      ? t("statistics:evolution.metricUnitPercentage")
      : t("statistics:evolution.metricUnitCount");
  const chartOptions: ChartOptions<EvolutionChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 45,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        max: selectedUnit === "percentage" ? 1 : undefined,
        title: {
          display: true,
          text: yAxisLabel,
          color: theme.palette.text.secondary,
        },
        ticks: {
          precision: selectedUnit === "percentage" ? undefined : 0,
          color: theme.palette.text.secondary,
          callback: (tickValue) => {
            const numericValue = Number(tickValue);
            if (selectedUnit === "percentage") {
              return new Intl.NumberFormat(i18n.language, {
                maximumFractionDigits: 0,
                style: "percent",
              }).format(numericValue);
            }

            return new Intl.NumberFormat(i18n.language, {
              maximumFractionDigits: 0,
            }).format(numericValue);
          },
        },
        grid: {
          color: alpha(theme.palette.text.primary, 0.12),
        },
      },
    },
    plugins: {
      legend: {
        display: selectedMetrics.length > 1,
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 6,
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: alpha(theme.palette.text.primary, 0.12),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: TooltipItem<EvolutionChartType>[]) => {
            const game = evolution.games[items[0]?.dataIndex ?? -1];
            if (!game) {
              return "";
            }

            return `${game.opponent_name} - ${formatDateTime(game.date, i18n.language)}`;
          },
          beforeBody: (items: TooltipItem<EvolutionChartType>[]) => {
            const game = evolution.games[items[0]?.dataIndex ?? -1];
            if (!game) {
              return [];
            }

            return [
              `${t("statistics:evolution.competition")}: ${game.competition_name}`,
              `${t("statistics:evolution.score")}: ${getEvolutionScoreLabel(game)}`,
              `${t("statistics:evolution.completedPoints")}: ${game.completed_points}`,
            ];
          },
          label: (item: TooltipItem<EvolutionChartType>) => {
            const metric = selectedMetrics[item.datasetIndex];
            if (!metric) {
              return `${item.dataset.label}: ${item.formattedValue}`;
            }

            return `${metric.label}: ${formatEvolutionMetricValue(
              metric,
              item.parsed.y ?? undefined,
              i18n.language
            )}`;
          },
          labelColor: (item: TooltipItem<EvolutionChartType>) => {
            const seriesColor = colorPalette[item.datasetIndex % colorPalette.length];
            return {
              borderColor: seriesColor,
              backgroundColor: seriesColor,
              borderWidth: 1,
              borderRadius: 2,
            };
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: { xs: 300, sm: 360 } }}>
      <Chart
        type={chartType}
        data={chartData}
        options={chartOptions}
        role="img"
        aria-label={t("statistics:evolution.chartAriaLabel")}
      />
    </Box>
  );
}
