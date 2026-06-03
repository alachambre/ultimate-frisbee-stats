import { lazy, Suspense, useMemo, useState } from "react";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import InsightsIcon from "@mui/icons-material/Insights";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import LoadingState from "../../components/shared/LoadingState";
import type { EvolutionMetricDefinition, TeamEvolutionResponse } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";
import {
  formatEvolutionMetricValue,
  getCompatibleEvolutionMetrics,
  getEvolutionMetricGroupLabel,
  getEvolutionScoreLabel,
  localizeEvolutionMetric,
  type EvolutionChartMode,
  type EvolutionTranslator,
} from "../../components/statistics/statisticsEvolutionUtils";

const StatisticsEvolutionChart = lazy(
  () => import("../../components/statistics/StatisticsEvolutionChart")
);

interface NewStatisticsEvolutionSectionProps {
  error: Error | null;
  evolution?: TeamEvolutionResponse;
  isLoading: boolean;
}

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedCheckboxIcon = <CheckBoxIcon fontSize="small" />;

function getDefaultPresetMetrics(
  evolution: TeamEvolutionResponse,
  metricsById: Map<string, EvolutionMetricDefinition>
): EvolutionMetricDefinition[] {
  const defaultPreset = evolution.presets.find(
    (preset) => preset.id === evolution.default_preset_id
  );
  const metricIds =
    defaultPreset?.metric_ids ??
    evolution.metrics.slice(0, 2).map((metric) => metric.id);

  return metricIds
    .map((metricId) => metricsById.get(metricId))
    .filter((metric): metric is EvolutionMetricDefinition => metric !== undefined);
}

function getMetricContext(
  metric: EvolutionMetricDefinition,
  translate: EvolutionTranslator
): string {
  return translate("statistics:evolution.metricOptionContext", {
    defaultValue: `${metric.group} / ${metric.unit}`,
    group: getEvolutionMetricGroupLabel(metric.group, translate),
    unit:
      metric.unit === "percentage"
        ? translate("statistics:evolution.metricUnitPercentage", {
            defaultValue: "percentage",
          })
        : translate("statistics:evolution.metricUnitCount", {
            defaultValue: "count",
          }),
  });
}

export default function NewStatisticsEvolutionSection({
  error,
  evolution,
  isLoading,
}: NewStatisticsEvolutionSectionProps) {
  const { t, i18n } = useTranslation(["statistics", "common"]);
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

  const handleMetricSelection = (
    nextMetrics: EvolutionMetricDefinition[],
    changedMetric?: EvolutionMetricDefinition
  ) => {
    const compatibleMetrics = getCompatibleEvolutionMetrics(
      nextMetrics,
      changedMetric
    );
    setSelectedMetricIds(compatibleMetrics.map((metric) => metric.id));
  };

  if (isLoading) {
    return (
      <LoadingState
        message={t("statistics:evolution.loading")}
        showColdStartHint={false}
      />
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {t("common:messages.error")}: {error.message}
      </Alert>
    );
  }

  if (!evolution) {
    return null;
  }

  if (evolution.games.length === 0) {
    return <Alert severity="info">{t("statistics:evolution.empty")}</Alert>;
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: { xs: 2, md: 2.5 },
      })}
    >
      <Stack spacing={2.5}>
        <Stack
          alignItems={{ xs: "stretch", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack alignItems="center" direction="row" spacing={1.25}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: theme.colors.newUi.primarySoft,
                borderRadius: 1,
                color: theme.colors.newUi.primary,
                display: "inline-flex",
                height: 40,
                justifyContent: "center",
                width: 40,
              })}
            >
              <TimelineIcon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={900} variant="h6">
                {t("statistics:newUi.evolution.chartTitle")}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {selectedUnit
                  ? t("statistics:evolution.metricUnitContext", {
                      unit:
                        selectedUnit === "percentage"
                          ? t("statistics:evolution.metricUnitPercentage")
                          : t("statistics:evolution.metricUnitCount"),
                    })
                  : t("statistics:newUi.evolution.chartDescription")}
              </Typography>
            </Box>
          </Stack>

          <Stack
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
          >
            <Autocomplete<EvolutionMetricDefinition, true, false, false>
              disableCloseOnSelect
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              multiple
              onChange={(_event, nextMetrics, _reason, details) =>
                handleMetricSelection(nextMetrics, details?.option)
              }
              options={localizedMetrics}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("statistics:evolution.metricsLabel")}
                />
              )}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      checked={selected}
                      checkedIcon={checkedCheckboxIcon}
                      icon={checkboxIcon}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={option.label}
                      secondary={getMetricContext(option, translateEvolution)}
                    />
                  </li>
                );
              }}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              value={selectedMetrics}
            />

            <ToggleButtonGroup
              aria-label={t("statistics:evolution.chartMode")}
              exclusive
              onChange={(_event, nextMode: EvolutionChartMode | null) => {
                if (nextMode) {
                  setChartMode(nextMode);
                }
              }}
              size="small"
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
              value={chartMode}
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

        <Box
          sx={(theme) => ({
            bgcolor: alpha(theme.colors.newUi.primary, 0.025),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 1.5, sm: 2 },
          })}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  height: { xs: 300, sm: 360 },
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
            {selectedMetrics.length > 0 ? (
              <StatisticsEvolutionChart
                chartMode={chartMode}
                evolution={evolution}
                selectedMetrics={selectedMetrics}
              />
            ) : (
              <Alert severity="info">{t("statistics:evolution.noMetrics")}</Alert>
            )}
          </Suspense>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 280px" },
          }}
        >
          <TableContainer
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflowX: "auto",
            })}
          >
            <Table
              aria-label={t("statistics:evolution.tableAriaLabel")}
              size="small"
            >
              <TableHead>
                <TableRow>
                  <TableCell>{t("statistics:evolution.game")}</TableCell>
                  <TableCell>{t("statistics:evolution.score")}</TableCell>
                  {selectedMetrics.slice(0, 2).map((metric) => (
                    <TableCell align="right" key={metric.id}>
                      {metric.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {evolution.games.slice(0, 5).map((game) => (
                  <TableRow key={game.game_id}>
                    <TableCell>
                      <Typography fontWeight={800} variant="body2">
                        {game.opponent_name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(game.date, i18n.language)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {getEvolutionScoreLabel(game)}
                    </TableCell>
                    {selectedMetrics.slice(0, 2).map((metric) => (
                      <TableCell align="right" key={metric.id}>
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

          <Stack spacing={1}>
            <Chip
              icon={<InsightsIcon />}
              label={t("statistics:newUi.evolution.completedGames", {
                count: evolution.games.length,
              })}
              sx={{ alignSelf: "flex-start", fontWeight: 900 }}
            />
            {evolution.omitted_games_count > 0 && (
              <Chip
                label={t("statistics:evolution.omittedGames", {
                  count: evolution.omitted_games_count,
                })}
                sx={(theme) => ({
                  alignSelf: "flex-start",
                  bgcolor: alpha(theme.colors.performance.low, 0.1),
                  color: theme.colors.performance.low,
                  fontWeight: 900,
                })}
              />
            )}
            <Typography color="text.secondary" variant="body2">
              {t("statistics:newUi.evolution.tablePreviewDescription")}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
