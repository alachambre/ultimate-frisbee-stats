import {
  Alert,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import LoadingState from "../shared/LoadingState";
import type { EvolutionMetricDefinition, TeamEvolutionResponse } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface StatisticsEvolutionTableProps {
  evolution?: TeamEvolutionResponse;
  isLoading: boolean;
  error: Error | null;
}

function formatMetricValue(metric: EvolutionMetricDefinition, value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }

  if (metric.format === "percentage") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
      style: "percent",
    }).format(value);
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function getDefaultPresetMetrics(
  evolution: TeamEvolutionResponse
): EvolutionMetricDefinition[] {
  const metricsById = new Map(evolution.metrics.map((metric) => [metric.id, metric]));
  const defaultPreset = evolution.presets.find(
    (preset) => preset.id === evolution.default_preset_id
  );
  const metricIds = defaultPreset?.metric_ids ?? evolution.metrics.slice(0, 2).map((metric) => metric.id);

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

  const defaultPresetMetrics = getDefaultPresetMetrics(evolution);
  const hasRows = evolution.games.length > 0;

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
                <TableCell align="right">{t("statistics:evolution.completedPoints")}</TableCell>
                {defaultPresetMetrics.map((metric) => (
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
                    {game.our_score} - {game.opponent_score}
                  </TableCell>
                  <TableCell align="right">{game.completed_points}</TableCell>
                  {defaultPresetMetrics.map((metric) => (
                    <TableCell key={metric.id} align="right">
                      {formatMetricValue(metric, game.metrics[metric.id])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
