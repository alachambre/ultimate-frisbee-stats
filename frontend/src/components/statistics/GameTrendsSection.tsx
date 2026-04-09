import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartDataset,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { GamePointTimeline } from "../../types";
import LoadingState from "../shared/LoadingState";
import {
  getBreakMarkerFlags,
  getGameTrendsTickStep,
  prependChartOrigin,
} from "./gameTrendsLayout";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend, zoomPlugin);

type GameTrendMetric = "duration" | "score" | "turnovers";

interface GameTrendsSectionProps {
  timeline?: GamePointTimeline;
  isLoading: boolean;
  error?: Error | null;
  embedded?: boolean;
  teamName?: string;
  opponentName?: string;
}

type TrendDataset = ChartDataset<"line", { x: number; y: number }[]>;

interface MarkerLegendItemProps {
  label: string;
  color: string;
}

function SeriesLegendItem({ label, color }: MarkerLegendItemProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 18,
          height: 0,
          borderTop: "3px solid",
          borderColor: color,
          borderRadius: 999,
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function MarkerLegendItem({ label, color }: MarkerLegendItemProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: color,
          border: "2px solid",
          borderColor: "background.paper",
          boxSizing: "content-box",
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
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

function buildSeriesPoints(xValues: number[], yValues: number[]) {
  return xValues.map((x, index) => ({
    x,
    y: yValues[index] ?? 0,
  }));
}

export default function GameTrendsSection({
  timeline,
  isLoading,
  error,
  embedded = false,
  teamName,
  opponentName,
}: GameTrendsSectionProps) {
  const { t, i18n } = useTranslation("statistics");
  const theme = useTheme();
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const [metric, setMetric] = useState<GameTrendMetric>("score");
  const outerSx = embedded ? { p: { xs: 2, sm: 3 } } : { mb: 3, p: { xs: 2, sm: 3 } };
  const isFrench = i18n.language.startsWith("fr");
  const ourSeriesLabel = teamName?.trim() || t("charts.ourScore");
  const opponentSeriesLabel = opponentName?.trim() || t("charts.opponentScore");
  const breakMarkerLabel = t("charts.breakMarker", {
    defaultValue: isFrench ? "Point de break" : "Break point",
  });
  const brokenMarkerLabel = t("charts.brokenMarker", {
    defaultValue: isFrench ? "Point breaké" : "Broken point",
  });

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

  const pointNumbers = prependChartOrigin(timeline.points.map((point) => point.point_number));
  const pointCount = pointNumbers.length;
  const tickStep = getGameTrendsTickStep(pointCount);
  const maxX = pointNumbers[pointNumbers.length - 1];
  const ourSeriesColor = theme.colors.offense.main;
  const opponentSeriesColor = theme.colors.performance.veryLow;
  const breakMarkerFlags = getBreakMarkerFlags(timeline.points);
  const buildMarkerRadii = (flags: boolean[]) => flags.map((isMarked) => (isMarked ? 7 : 0));
  const buildMarkerBorders = (flags: boolean[]) => flags.map((isMarked) => (isMarked ? 3 : 0));
  const buildMarkerColors = (flags: boolean[], color: string) =>
    flags.map((isMarked) => (isMarked ? color : "transparent"));

  const breakMarkerRadii = buildMarkerRadii(breakMarkerFlags.ourBreaks);
  const brokenMarkerRadii = buildMarkerRadii(breakMarkerFlags.opponentBreaks);
  const breakMarkerBorders = buildMarkerBorders(breakMarkerFlags.ourBreaks);
  const brokenMarkerBorders = buildMarkerBorders(breakMarkerFlags.opponentBreaks);
  const breakMarkerBackgrounds = buildMarkerColors(breakMarkerFlags.ourBreaks, ourSeriesColor);
  const brokenMarkerBackgrounds = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    opponentSeriesColor
  );
  const breakMarkerBorderColors = buildMarkerColors(
    breakMarkerFlags.ourBreaks,
    theme.palette.background.paper
  );
  const brokenMarkerBorderColors = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    theme.palette.background.paper
  );

  const durationMarkerRadii = pointNumbers.map((_, index) =>
    breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index] ? 7 : 0
  );
  const durationMarkerBorders = pointNumbers.map((_, index) =>
    breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index] ? 3 : 0
  );
  const durationMarkerBackgrounds = pointNumbers.map((_, index) =>
    breakMarkerFlags.ourBreaks[index]
      ? ourSeriesColor
      : breakMarkerFlags.opponentBreaks[index]
        ? opponentSeriesColor
        : "transparent"
  );
  const durationMarkerBorderColors = pointNumbers.map((_, index) => {
    if (breakMarkerFlags.ourBreaks[index]) {
      return theme.palette.background.paper;
    }

    if (breakMarkerFlags.opponentBreaks[index]) {
      return theme.palette.background.paper;
    }

    return "transparent";
  });

  const chartByMetric: Record<
    GameTrendMetric,
    {
      title: string;
      yAxisLabel: string;
      formatValue: (value: number) => string;
      integerYAxis: boolean;
      datasets: TrendDataset[];
    }
  > = {
    duration: {
      title: t("charts.duration"),
      yAxisLabel: t("charts.durationYAxis"),
      formatValue: (value: number) => formatDuration(value),
      integerYAxis: false,
      datasets: [
        {
          label: t("charts.durationSeries"),
          borderColor: ourSeriesColor,
          backgroundColor: alpha(ourSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.duration_seconds))
          ),
          tension: 0.22,
          pointStyle: "circle",
          pointRadius: durationMarkerRadii,
          pointBorderWidth: durationMarkerBorders,
          pointBackgroundColor: durationMarkerBackgrounds,
          pointBorderColor: durationMarkerBorderColors,
        },
      ],
    },
    score: {
      title: t("charts.score"),
      yAxisLabel: t("charts.scoreYAxis"),
      formatValue: (value: number) => String(Math.round(value)),
      integerYAxis: true,
      datasets: [
        {
          label: ourSeriesLabel,
          borderColor: ourSeriesColor,
          backgroundColor: alpha(ourSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.our_score_after))
          ),
          tension: 0.28,
          cubicInterpolationMode: "monotone" as const,
          pointStyle: "circle",
          pointRadius: breakMarkerRadii,
          pointBorderWidth: breakMarkerBorders,
          pointBackgroundColor: breakMarkerBackgrounds,
          pointBorderColor: breakMarkerBorderColors,
        },
        {
          label: opponentSeriesLabel,
          borderColor: opponentSeriesColor,
          backgroundColor: alpha(opponentSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.opponent_score_after))
          ),
          tension: 0.28,
          cubicInterpolationMode: "monotone" as const,
          pointStyle: "circle",
          pointRadius: brokenMarkerRadii,
          pointBorderWidth: brokenMarkerBorders,
          pointBackgroundColor: brokenMarkerBackgrounds,
          pointBorderColor: brokenMarkerBorderColors,
        },
      ],
    },
    turnovers: {
      title: t("charts.turnovers"),
      yAxisLabel: t("charts.turnoversYAxis"),
      formatValue: (value: number) => String(Math.round(value)),
      integerYAxis: true,
      datasets: [
        {
          label: ourSeriesLabel,
          borderColor: ourSeriesColor,
          backgroundColor: alpha(ourSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.our_turnovers))
          ),
          tension: 0.2,
          pointStyle: "circle",
          pointRadius: breakMarkerRadii,
          pointBorderWidth: breakMarkerBorders,
          pointBackgroundColor: breakMarkerBackgrounds,
          pointBorderColor: breakMarkerBorderColors,
        },
        {
          label: opponentSeriesLabel,
          borderColor: opponentSeriesColor,
          backgroundColor: alpha(opponentSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.opponent_turnovers))
          ),
          tension: 0.2,
          pointStyle: "circle",
          pointRadius: brokenMarkerRadii,
          pointBorderWidth: brokenMarkerBorders,
          pointBackgroundColor: brokenMarkerBackgrounds,
          pointBorderColor: brokenMarkerBorderColors,
        },
      ],
    },
  } as const;

  const selectedChart = chartByMetric[metric];

  const chartData: ChartData<"line"> = {
    datasets: selectedChart.datasets.map((dataset) => ({
      ...dataset,
      borderWidth: 3,
      pointStyle: dataset.pointStyle ?? "circle",
      pointRadius: dataset.pointRadius ?? 0,
      pointHoverRadius: 5,
      pointHitRadius: 14,
      pointBorderWidth: dataset.pointBorderWidth ?? 0,
      pointBackgroundColor: dataset.pointBackgroundColor ?? "transparent",
      pointBorderColor: dataset.pointBorderColor ?? dataset.borderColor,
      fill: false,
    })),
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    animation: false,
    normalized: true,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: maxX,
        title: {
          display: true,
          text: t("charts.xAxis"),
          color: theme.palette.text.secondary,
        },
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 1,
          maxRotation: 0,
          color: theme.palette.text.secondary,
          callback: (tickValue) => {
            const value = Number(tickValue);
            if (value === 0 || value === maxX || value % tickStep === 0) {
              return String(value);
            }

            return "";
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: selectedChart.yAxisLabel,
          color: theme.palette.text.secondary,
        },
        ticks: {
          precision: selectedChart.integerYAxis ? 0 : undefined,
          stepSize: selectedChart.integerYAxis ? 1 : undefined,
          color: theme.palette.text.secondary,
          callback: (tickValue) => selectedChart.formatValue(Number(tickValue)),
        },
        grid: {
          color: alpha(theme.palette.text.primary, 0.12),
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 12,
          boxHeight: 6,
          padding: 18,
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        usePointStyle: true,
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: alpha(theme.palette.text.primary, 0.12),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          title: (items: TooltipItem<"line">[]) => {
            const pointValue = items[0]?.parsed.x ?? 0;
            return `${t("charts.xAxis")} ${pointValue}`;
          },
          label: (item: TooltipItem<"line">) =>
            `${item.dataset.label}: ${selectedChart.formatValue(item.parsed.y ?? 0)}`,
          labelColor: (item: TooltipItem<"line">) => {
            const datasetBorderColor = item.dataset.borderColor;
            const seriesColor =
              typeof datasetBorderColor === "string"
                ? datasetBorderColor
                : Array.isArray(datasetBorderColor) && typeof datasetBorderColor[0] === "string"
                  ? datasetBorderColor[0]
                  : theme.palette.text.primary;

            return {
              borderColor: seriesColor,
              backgroundColor: seriesColor,
              borderWidth: 1,
              borderRadius: 2,
            };
          },
          labelPointStyle: () => ({
            pointStyle: "line",
            rotation: 0,
          }),
        },
      },
      zoom: {
        limits: {
          x: { min: 0, max: maxX, minRange: 3 },
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
  };

  const handleResetZoom = () => {
    const zoomableChart = chartRef.current as (ChartJS<"line"> & {
      resetZoom?: () => void;
    }) | null;

    zoomableChart?.resetZoom?.();
  };

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

        <ToggleButtonGroup
          size="small"
          exclusive
          value={metric}
          onChange={(_event, nextMetric: GameTrendMetric | null) => {
            if (nextMetric) {
              setMetric(nextMetric);
              handleResetZoom();
            }
          }}
          aria-label={t("charts.metricLabel")}
          sx={{
            flexWrap: "wrap",
            gap: 1,
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

      <Box
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {selectedChart.title}
          </Typography>
          <Button size="small" onClick={handleResetZoom}>
            {t("charts.resetZoom")}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2.5,
            mb: 1.5,
          }}
        >
          {selectedChart.datasets.map((dataset) => (
            <SeriesLegendItem
              key={dataset.label ?? "series"}
              label={dataset.label ?? ""}
              color={typeof dataset.borderColor === "string" ? dataset.borderColor : ourSeriesColor}
            />
          ))}
          <MarkerLegendItem
            label={breakMarkerLabel}
            color={ourSeriesColor}
          />
          <MarkerLegendItem
            label={brokenMarkerLabel}
            color={opponentSeriesColor}
          />
        </Box>

        <Box sx={{ height: 320 }}>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </Box>
      </Box>
    </Paper>
  );
}
