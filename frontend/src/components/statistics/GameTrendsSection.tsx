import { useState } from "react";
import {
  Alert,
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import { alpha, useTheme } from "@mui/material/styles";
import { ChartsReferenceLine, LineChart } from "@mui/x-charts";
import { useTranslation } from "react-i18next";
import type { GamePointTimeline } from "../../types";
import LoadingState from "../shared/LoadingState";
import {
  getGameTrendsChartWidth,
  getGameTrendsTickStep,
  shouldShowGameTrendMark,
  usesScrollableGameTrendsLayout,
} from "./gameTrendsLayout";

type GameTrendMetric = "duration" | "score" | "turnovers";

interface GameTrendsSectionProps {
  timeline?: GamePointTimeline;
  isLoading: boolean;
  error?: Error | null;
  embedded?: boolean;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${String(remainingMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function GameTrendsSection({
  timeline,
  isLoading,
  error,
  embedded = false,
}: GameTrendsSectionProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
  const [metric, setMetric] = useState<GameTrendMetric>("score");
  const outerSx = embedded ? { p: { xs: 2, sm: 3 } } : { mb: 3, p: { xs: 2, sm: 3 } };

  if (isLoading) {
    return (
      <Paper sx={outerSx}>
        <LoadingState showColdStartHint={false} message={t("charts.loading")} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={embedded ? undefined : { mb: 3 }}>
        {t("common:messages.error")}: {error.message}
      </Alert>
    );
  }

  if (!timeline || timeline.points.length === 0) {
    return (
      <Paper sx={outerSx}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t("charts.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("charts.empty")}
        </Typography>
      </Paper>
    );
  }

  const xValues = timeline.points.map((point) => point.point_number);
  const pointCount = timeline.points.length;
  const usesScrollableLayout = usesScrollableGameTrendsLayout(pointCount);
  const tickStep = getGameTrendsTickStep(pointCount);
  const chartWidth = getGameTrendsChartWidth(pointCount);
  const halftimeMarkerX =
    timeline.halftime_after_point_number != null &&
    timeline.halftime_after_point_number < timeline.points[timeline.points.length - 1].point_number
      ? timeline.halftime_after_point_number + 0.5
      : null;
  const ourSeriesColor = theme.colors.offense.main;
  const opponentSeriesColor = theme.colors.performance.veryLow;
  const showTickLabel = (_value: number, index: number) =>
    index === 0 || index === pointCount - 1 || index % tickStep === 0;

  const commonSeriesConfig = {
    showMark: ({ index }: { index: number }) => shouldShowGameTrendMark(index, pointCount),
  };

  const chartByMetric = {
    duration: {
      title: t("charts.duration"),
      yAxisLabel: t("charts.durationYAxis"),
          series: [
        {
          data: timeline.points.map((point) => point.duration_seconds),
          label: t("charts.durationSeries"),
          color: ourSeriesColor,
          valueFormatter: (value: number | null) =>
            value == null ? "-" : formatDuration(value),
          ...commonSeriesConfig,
        },
      ],
    },
    score: {
      title: t("charts.score"),
      yAxisLabel: t("charts.scoreYAxis"),
      series: [
        {
          data: timeline.points.map((point) => point.our_score_after),
          label: t("charts.ourScore"),
          color: ourSeriesColor,
          curve: "stepAfter" as const,
          ...commonSeriesConfig,
        },
        {
          data: timeline.points.map((point) => point.opponent_score_after),
          label: t("charts.opponentScore"),
          color: opponentSeriesColor,
          curve: "stepAfter" as const,
          ...commonSeriesConfig,
        },
      ],
    },
    turnovers: {
      title: t("charts.turnovers"),
      yAxisLabel: t("charts.turnoversYAxis"),
      series: [
        {
          data: timeline.points.map((point) => point.our_turnovers),
          label: t("charts.ourTurns"),
          color: ourSeriesColor,
          ...commonSeriesConfig,
        },
        {
          data: timeline.points.map((point) => point.opponent_turnovers),
          label: t("charts.opponentTurns"),
          color: opponentSeriesColor,
          ...commonSeriesConfig,
        },
      ],
    },
  } as const;

  const selectedChart = chartByMetric[metric];

  return (
    <Paper elevation={embedded ? 0 : 1} sx={outerSx}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
          mb: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <TimelineIcon sx={{ color: theme.colors.pull.main }} />
            <Typography variant="h6" fontWeight="bold">
              {t("charts.title")}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t("charts.description")}
          </Typography>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            overflowX: { xs: "auto", sm: "visible" },
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={metric}
            onChange={(_event, nextMetric: GameTrendMetric | null) => {
              if (nextMetric) {
                setMetric(nextMetric);
              }
            }}
            aria-label={t("charts.metricLabel")}
            sx={{
              flexWrap: { xs: "nowrap", sm: "wrap" },
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: 999,
                border: "1px solid",
                borderColor: "divider",
                px: 1.5,
                whiteSpace: "nowrap",
              },
            }}
          >
            <ToggleButton value="score">{t("charts.score")}</ToggleButton>
            <ToggleButton value="duration">{t("charts.duration")}</ToggleButton>
            <ToggleButton value="turnovers">{t("charts.turnovers")}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
          {selectedChart.title}
        </Typography>
        <Box
          sx={{
            overflowX: usesScrollableLayout ? "auto" : "visible",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Box sx={{ minWidth: chartWidth ?? "100%" }}>
            <LineChart
              {...(chartWidth ? { width: chartWidth } : {})}
              height={320}
              margin={{ left: 56, right: 20, top: 20, bottom: 42 }}
              grid={{ horizontal: true, vertical: false }}
              xAxis={[
                {
                  data: xValues,
                  scaleType: "linear",
                  label: t("charts.xAxis"),
                  tickMinStep: 1,
                  tickInterval: showTickLabel,
                  tickLabelInterval: showTickLabel,
                  valueFormatter: (value: number) => String(value),
                  min: Math.max(0.5, xValues[0] - 0.5),
                  max: xValues[xValues.length - 1] + 0.5,
                },
              ]}
              yAxis={[
                {
                  label: selectedChart.yAxisLabel,
                  valueFormatter:
                    metric === "duration"
                      ? (value: number) => formatDuration(Math.round(value))
                      : (value: number) => String(Math.round(value)),
                },
              ]}
              series={selectedChart.series}
              hideLegend={selectedChart.series.length === 1}
              sx={{
                "& .MuiChartsAxis-label": {
                  fill: theme.palette.text.secondary,
                },
              }}
            >
              {halftimeMarkerX != null && (
                <ChartsReferenceLine
                  x={halftimeMarkerX}
                  label={t("charts.halftime")}
                  lineStyle={{
                    stroke: theme.palette.divider,
                    strokeDasharray: "6 4",
                  }}
                  labelStyle={{
                    fill: theme.palette.text.secondary,
                  }}
                />
              )}
            </LineChart>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
