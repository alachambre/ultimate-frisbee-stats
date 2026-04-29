import { lazy, Suspense, useMemo, useState } from "react";
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
  Tooltip,
  Typography,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import LoadingState from "../shared/LoadingState";
import type { EvolutionMetricDefinition, TeamEvolutionResponse } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";
import {
  formatEvolutionMetricValue,
  getCompatibleEvolutionMetrics,
  getEvolutionScoreLabel,
  getEvolutionMetricGroupLabel,
  localizeEvolutionMetric,
  type EvolutionTranslator,
  type EvolutionChartMode,
} from "./statisticsEvolutionUtils";

const StatisticsEvolutionChart = lazy(() => import("./StatisticsEvolutionChart"));

interface StatisticsEvolutionTableProps {
  evolution?: TeamEvolutionResponse;
  isLoading: boolean;
  error: Error | null;
}

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedCheckboxIcon = <CheckBoxIcon fontSize="small" />;

function getMetricContext(
  metric: EvolutionMetricDefinition,
  translate: EvolutionTranslator
): string {
  return translate("statistics:evolution.metricOptionContext", {
    group: getEvolutionMetricGroupLabel(metric.group, translate),
    unit:
      metric.unit === "percentage"
        ? translate("statistics:evolution.metricUnitPercentage", {
            defaultValue: "percentage",
          })
        : translate("statistics:evolution.metricUnitCount", {
            defaultValue: "count",
          }),
    defaultValue: `${metric.group} / ${metric.unit}`,
  });
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

export default function StatisticsEvolutionTable({
  evolution,
  isLoading,
  error,
}: StatisticsEvolutionTableProps) {
  const { t, i18n } = useTranslation(["statistics", "common"]);
  const theme = useTheme();
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[] | null>(null);
  const [chartMode, setChartMode] = useState<EvolutionChartMode>("auto");
  const translateEvolution = t as EvolutionTranslator;
  const localizedMetrics = useMemo(
    () =>
      (evolution?.metrics ?? []).map((metric) =>
        localizeEvolutionMetric(metric, translateEvolution)
      ),
    [evolution?.metrics, translateEvolution]
  );

  const metricsById = useMemo(
    () => new Map(localizedMetrics.map((metric) => [metric.id, metric])),
    [localizedMetrics]
  );
  const defaultPresetMetrics = useMemo(
    () => (evolution ? getDefaultPresetMetrics(evolution, metricsById) : []),
    [evolution, metricsById]
  );
  const selectedMetrics = useMemo(() => {
    if (selectedMetricIds === null) {
      return getCompatibleEvolutionMetrics(defaultPresetMetrics);
    }

    const metricsFromSelection = selectedMetricIds
      .map((metricId) => metricsById.get(metricId))
      .filter((metric): metric is EvolutionMetricDefinition => metric !== undefined);

    return getCompatibleEvolutionMetrics(metricsFromSelection);
  }, [defaultPresetMetrics, metricsById, selectedMetricIds]);
  const selectedUnit = selectedMetrics[0]?.unit;

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

  const handleMetricSelection = (
    nextMetrics: EvolutionMetricDefinition[],
    changedMetric?: EvolutionMetricDefinition
  ) => {
    const compatibleMetrics = getCompatibleEvolutionMetrics(nextMetrics, changedMetric);
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
                  options={localizedMetrics}
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
                          secondary={
                            <Stack spacing={0.25} component="span">
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                              >
                                {option.description}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                {getMetricContext(option, translateEvolution)}
                              </Typography>
                            </Stack>
                          }
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

            <Suspense
              fallback={
                <Box
                  sx={{
                    height: { xs: 300, sm: 360 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LoadingState
                    message={t("statistics:evolution.chartLoading")}
                    showColdStartHint={false}
                  />
                </Box>
              }
            >
              {hasMetrics ? (
                <StatisticsEvolutionChart
                  evolution={evolution}
                  selectedMetrics={selectedMetrics}
                  chartMode={chartMode}
                />
              ) : (
                <Alert severity="info">{t("statistics:evolution.noMetrics")}</Alert>
              )}
            </Suspense>
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
                        <Tooltip title={metric.description} arrow>
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 0.5,
                              cursor: "help",
                            }}
                          >
                            {metric.label}
                            <InfoOutlinedIcon
                              aria-hidden
                              sx={{
                                color: "text.secondary",
                                fontSize: 16,
                              }}
                            />
                          </Box>
                        </Tooltip>
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
                        {getEvolutionScoreLabel(game)}
                      </TableCell>
                      <TableCell align="right">{game.completed_points}</TableCell>
                      {selectedMetrics.map((metric) => (
                        <TableCell key={metric.id} align="right">
                          {formatEvolutionMetricValue(
                            metric,
                            game.metrics[metric.id],
                            i18n.language
                          )}
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
