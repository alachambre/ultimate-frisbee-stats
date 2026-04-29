import { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
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
import LoadingState from "../shared/LoadingState";
import type {
  EvolutionMetricDefinition,
  EvolutionMetricUnit,
  TeamEvolutionGame,
  TeamEvolutionResponse,
} from "../../types";
import { formatDate, formatDateTime } from "../../utils/dateFormatting";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

type EvolutionChartMode = "auto" | "line" | "bar";
type EvolutionChartType = "line" | "bar";

interface StatisticsEvolutionTableProps {
  evolution?: TeamEvolutionResponse;
  isLoading: boolean;
  error: Error | null;
}

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedCheckboxIcon = <CheckBoxIcon fontSize="small" />;

function formatMetricValue(
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

function getDefaultPresetMetrics(
  evolution: TeamEvolutionResponse,
  metricsById: Map<string, EvolutionMetricDefinition>
): EvolutionMetricDefinition[] {
  const defaultPreset = evolution.presets.find(
    (preset) => preset.id === evolution.default_preset_id
  );
  const metricIds =
    defaultPreset?.metric_ids ?? evolution.metrics.slice(0, 2).map((metric) => metric.id);

  return metricIds
    .map((metricId) => metricsById.get(metricId))
    .filter((metric): metric is EvolutionMetricDefinition => metric !== undefined);
}

function getCompatibleMetrics(
  metrics: EvolutionMetricDefinition[],
  preferredMetric?: EvolutionMetricDefinition
): EvolutionMetricDefinition[] {
  if (metrics.length === 0) {
    return [];
  }

  const targetUnit = preferredMetric?.unit ?? metrics[0].unit;
  return metrics.filter((metric) => metric.unit === targetUnit);
}

function resolveChartType(
  mode: EvolutionChartMode,
  unit: EvolutionMetricUnit | undefined
): EvolutionChartType {
  if (mode === "line" || mode === "bar") {
    return mode;
  }

  return unit === "percentage" ? "line" : "bar";
}

function getScoreLabel(game: TeamEvolutionGame): string {
  return `${game.our_score} - ${game.opponent_score}`;
}

export default function StatisticsEvolutionTable({
  evolution,
  isLoading,
  error,
}: StatisticsEvolutionTableProps) {
  const { t, i18n } = useTranslation(["statistics", "common"]);
  const theme = useTheme();
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<EvolutionChartMode>("auto");

  const metricsById = useMemo(
    () => new Map((evolution?.metrics ?? []).map((metric) => [metric.id, metric])),
    [evolution?.metrics]
  );
  const defaultPresetMetrics = useMemo(
    () => (evolution ? getDefaultPresetMetrics(evolution, metricsById) : []),
    [evolution, metricsById]
  );
  const selectedMetrics = useMemo(() => {
    const metricsFromSelection = selectedMetricIds
      .map((metricId) => metricsById.get(metricId))
      .filter((metric): metric is EvolutionMetricDefinition => metric !== undefined);

    return getCompatibleMetrics(
      metricsFromSelection.length > 0 ? metricsFromSelection : defaultPresetMetrics
    );
  }, [defaultPresetMetrics, metricsById, selectedMetricIds]);
  const selectedUnit = selectedMetrics[0]?.unit;
  const chartType = resolveChartType(chartMode, selectedUnit);
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
    () => evolution?.games.map((game) => formatDate(game.date, i18n.language, "monthDay")) ?? [],
    [evolution?.games, i18n.language]
  );
  const chartDatasets = useMemo(() => {
    return selectedMetrics.map((metric, index) => {
      const seriesColor = colorPalette[index % colorPalette.length];
      const baseDataset = {
        label: metric.label,
        data: evolution?.games.map((game) => game.metrics[metric.id] ?? 0) ?? [],
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
  }, [chartType, colorPalette, evolution?.games, selectedMetrics]);

  if (isLoading) {
    return <LoadingState message={t("statistics:evolution.loading")} showColdStartHint={false} />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {t("common:messages.error")}: {error.message}
      </Alert>
    );
  }

  if (!evolution) {
    return null;
  }

  const hasRows = evolution.games.length > 0;
  const hasMetrics = selectedMetrics.length > 0;
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
              `${t("statistics:evolution.score")}: ${getScoreLabel(game)}`,
              `${t("statistics:evolution.completedPoints")}: ${game.completed_points}`,
            ];
          },
          label: (item: TooltipItem<EvolutionChartType>) => {
            const metric = selectedMetrics[item.datasetIndex];
            if (!metric) {
              return `${item.dataset.label}: ${item.formattedValue}`;
            }

            return `${metric.label}: ${formatMetricValue(
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

  const handleMetricSelection = (
    nextMetrics: EvolutionMetricDefinition[],
    changedMetric?: EvolutionMetricDefinition
  ) => {
    const compatibleMetrics = getCompatibleMetrics(nextMetrics, changedMetric);
    setSelectedMetricIds(compatibleMetrics.map((metric) => metric.id));
  };

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TimelineIcon sx={{ color: theme.colors.pull.main }} />
          <Typography variant="h5" fontWeight="bold">
            {t("statistics:evolution.title")}
          </Typography>
        </Box>
        {evolution.omitted_games_count > 0 && (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={t("statistics:evolution.omittedGames", {
              count: evolution.omitted_games_count,
            })}
          />
        )}
      </Box>

      {!hasRows ? (
        <Alert severity="info">{t("statistics:evolution.empty")}</Alert>
      ) : !hasMetrics ? (
        <Alert severity="info">{t("statistics:evolution.noMetrics")}</Alert>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {t("statistics:evolution.chartTitle")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedUnit
                    ? t("statistics:evolution.metricUnitContext", {
                        unit:
                          selectedUnit === "percentage"
                            ? t("statistics:evolution.metricUnitPercentage")
                            : t("statistics:evolution.metricUnitCount"),
                      })
                    : ""}
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Autocomplete<EvolutionMetricDefinition, true, false, false>
                  multiple
                  disableCloseOnSelect
                  size="small"
                  options={evolution.metrics}
                  value={selectedMetrics}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.label}
                  onChange={(_event, nextMetrics, _reason, details) =>
                    handleMetricSelection(nextMetrics, details?.option)
                  }
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={key} {...optionProps}>
                        <Checkbox
                          icon={checkboxIcon}
                          checkedIcon={checkedCheckboxIcon}
                          checked={selected}
                          sx={{ mr: 1 }}
                        />
                        <ListItemText
                          primary={option.label}
                          secondary={t("statistics:evolution.metricOptionContext", {
                            group: option.group,
                            unit:
                              option.unit === "percentage"
                                ? t("statistics:evolution.metricUnitPercentage")
                                : t("statistics:evolution.metricUnitCount"),
                          })}
                        />
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label={t("statistics:evolution.metricsLabel")} />
                  )}
                  sx={{ minWidth: { xs: "100%", sm: 280 } }}
                />

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={chartMode}
                  onChange={(_event, nextMode: EvolutionChartMode | null) => {
                    if (nextMode) {
                      setChartMode(nextMode);
                    }
                  }}
                  aria-label={t("statistics:evolution.chartMode")}
                  sx={{
                    flexWrap: "wrap",
                    gap: 0.75,
                    "& .MuiToggleButtonGroup-grouped": {
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      px: 1.25,
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <ToggleButton value="auto">
                    <AutoGraphIcon fontSize="small" sx={{ mr: 0.75 }} />
                    {t("statistics:evolution.chartModeAuto")}
                  </ToggleButton>
                  <ToggleButton value="line">
                    <ShowChartIcon fontSize="small" sx={{ mr: 0.75 }} />
                    {t("statistics:evolution.chartModeLine")}
                  </ToggleButton>
                  <ToggleButton value="bar">
                    <BarChartIcon fontSize="small" sx={{ mr: 0.75 }} />
                    {t("statistics:evolution.chartModeBar")}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            <Box sx={{ height: { xs: 300, sm: 360 } }}>
              <Chart
                type={chartType}
                data={chartData}
                options={chartOptions}
                role="img"
                aria-label={t("statistics:evolution.chartAriaLabel")}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              {t("statistics:evolution.tableTitle")}
            </Typography>
            <TableContainer
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflowX: "auto",
              }}
            >
              <Table size="small" aria-label={t("statistics:evolution.tableAriaLabel")}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("statistics:evolution.date")}</TableCell>
                    <TableCell>{t("statistics:evolution.game")}</TableCell>
                    <TableCell>{t("statistics:evolution.competition")}</TableCell>
                    <TableCell align="right">{t("statistics:evolution.score")}</TableCell>
                    <TableCell align="right">
                      {t("statistics:evolution.completedPoints")}
                    </TableCell>
                    {selectedMetrics.map((metric) => (
                      <TableCell key={metric.id} align="right">
                        {metric.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evolution.games.map((game) => (
                    <TableRow key={game.game_id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(game.date, i18n.language)}
                      </TableCell>
                      <TableCell>{game.opponent_name}</TableCell>
                      <TableCell>{game.competition_name}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {getScoreLabel(game)}
                      </TableCell>
                      <TableCell align="right">{game.completed_points}</TableCell>
                      {selectedMetrics.map((metric) => (
                        <TableCell key={metric.id} align="right">
                          {formatMetricValue(metric, game.metrics[metric.id], i18n.language)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
