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
  type ChartEvent,
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

function getDistanceToSegmentSquared(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSquared === 0) {
    const distanceX = pointX - startX;
    const distanceY = pointY - startY;
    return distanceX * distanceX + distanceY * distanceY;
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / segmentLengthSquared
    )
  );
  const projectedX = startX + projection * deltaX;
  const projectedY = startY + projection * deltaY;
  const distanceX = pointX - projectedX;
  const distanceY = pointY - projectedY;

  return distanceX * distanceX + distanceY * distanceY;
}

function getHoveredDatasetIndex(
  chart: ChartJS<"line">,
  event: ChartEvent,
  datasets: TrendDataset[],
  thresholdPx = 18
) {
  const pointerX = event.x;
  const pointerY = event.y;

  if (typeof pointerX !== "number" || typeof pointerY !== "number") {
    return null;
  }

  const { left, right, top, bottom } = chart.chartArea;
  if (pointerX < left || pointerX > right || pointerY < top || pointerY > bottom) {
    return null;
  }

  const xScale = chart.scales.x;
  const yScale = chart.scales.y;
  const thresholdSquared = thresholdPx * thresholdPx;
  let bestDatasetIndex: number | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  datasets.forEach((dataset, datasetIndex) => {
    const points = dataset.data;

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];

      if (
        typeof start?.x !== "number" ||
        typeof start?.y !== "number" ||
        typeof end?.x !== "number" ||
        typeof end?.y !== "number"
      ) {
        continue;
      }

      const distanceSquared = getDistanceToSegmentSquared(
        pointerX,
        pointerY,
        xScale.getPixelForValue(start.x),
        yScale.getPixelForValue(start.y),
        xScale.getPixelForValue(end.x),
        yScale.getPixelForValue(end.y)
      );

      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestDatasetIndex = datasetIndex;
      }
    }
  });

  return bestDistanceSquared <= thresholdSquared ? bestDatasetIndex : null;
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
  const hoveredDatasetIndexRef = useRef<number | null>(null);
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
  const xAxisMax = maxX + 0.4;
  const ourSeriesColor = theme.colors.offense.main;
  const opponentSeriesColor = theme.colors.performance.veryLow;
  const breakMarkerFlags = getBreakMarkerFlags(timeline.points);
  const subtleOurPointFill = alpha(ourSeriesColor, 0.14);
  const subtleOpponentPointFill = alpha(opponentSeriesColor, 0.14);
  const subtleOurPointBorder = alpha(ourSeriesColor, 0.72);
  const subtleOpponentPointBorder = alpha(opponentSeriesColor, 0.72);
  const buildMarkerRadii = (flags: boolean[], baseRadius: number) =>
    flags.map((isMarked, index) => {
      if (index === 0) {
        return 0;
      }

      return isMarked ? 7 : baseRadius;
    });
  const buildMarkerBorders = (flags: boolean[], baseBorderWidth: number) =>
    flags.map((isMarked, index) => {
      if (index === 0) {
        return 0;
      }

      return isMarked ? 3 : baseBorderWidth;
    });
  const buildMarkerColors = (flags: boolean[], highlightedColor: string, baseColor: string) =>
    flags.map((isMarked, index) => {
      if (index === 0) {
        return "transparent";
      }

      return isMarked ? highlightedColor : baseColor;
    });

  const breakMarkerRadii = buildMarkerRadii(breakMarkerFlags.ourBreaks, 0);
  const brokenMarkerRadii = buildMarkerRadii(breakMarkerFlags.opponentBreaks, 0);
  const breakMarkerBorders = buildMarkerBorders(breakMarkerFlags.ourBreaks, 0);
  const brokenMarkerBorders = buildMarkerBorders(breakMarkerFlags.opponentBreaks, 0);
  const breakMarkerBackgrounds = buildMarkerColors(
    breakMarkerFlags.ourBreaks,
    ourSeriesColor,
    "transparent"
  );
  const brokenMarkerBackgrounds = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    opponentSeriesColor,
    "transparent"
  );
  const breakMarkerBorderColors = buildMarkerColors(
    breakMarkerFlags.ourBreaks,
    theme.palette.background.paper,
    "transparent"
  );
  const brokenMarkerBorderColors = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    theme.palette.background.paper,
    "transparent"
  );
  const breakMarkerHoverRadii = buildMarkerRadii(breakMarkerFlags.ourBreaks, 4);
  const brokenMarkerHoverRadii = buildMarkerRadii(breakMarkerFlags.opponentBreaks, 4);
  const breakMarkerHoverBorders = buildMarkerBorders(breakMarkerFlags.ourBreaks, 2);
  const brokenMarkerHoverBorders = buildMarkerBorders(breakMarkerFlags.opponentBreaks, 2);
  const breakMarkerHoverBackgrounds = buildMarkerColors(
    breakMarkerFlags.ourBreaks,
    ourSeriesColor,
    subtleOurPointFill
  );
  const brokenMarkerHoverBackgrounds = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    opponentSeriesColor,
    subtleOpponentPointFill
  );
  const breakMarkerHoverBorderColors = buildMarkerColors(
    breakMarkerFlags.ourBreaks,
    theme.palette.background.paper,
    subtleOurPointBorder
  );
  const brokenMarkerHoverBorderColors = buildMarkerColors(
    breakMarkerFlags.opponentBreaks,
    theme.palette.background.paper,
    subtleOpponentPointBorder
  );

  const durationMarkerRadii = pointNumbers.map((_, index) =>
    index === 0
      ? 0
      : breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index]
        ? 7
        : 0
  );
  const durationMarkerBorders = pointNumbers.map((_, index) =>
    breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index]
      ? 3
      : 0
  );
  const durationMarkerBackgrounds = pointNumbers.map((_, index) =>
    index === 0
      ? "transparent"
      : breakMarkerFlags.ourBreaks[index]
      ? ourSeriesColor
      : breakMarkerFlags.opponentBreaks[index]
        ? opponentSeriesColor
        : "transparent"
  );
  const durationMarkerHoverRadii = pointNumbers.map((_, index) =>
    index === 0
      ? 0
      : breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index]
        ? 7
        : 4
  );
  const durationMarkerHoverBorders = pointNumbers.map((_, index) =>
    breakMarkerFlags.ourBreaks[index] || breakMarkerFlags.opponentBreaks[index] ? 3 : 2
  );
  const durationMarkerHoverBackgrounds = pointNumbers.map((_, index) =>
    index === 0
      ? "transparent"
      : breakMarkerFlags.ourBreaks[index]
      ? ourSeriesColor
      : breakMarkerFlags.opponentBreaks[index]
        ? opponentSeriesColor
        : subtleOurPointFill
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
  const durationMarkerHoverBorderColors = pointNumbers.map((_, index) => {
    if (breakMarkerFlags.ourBreaks[index]) {
      return theme.palette.background.paper;
    }

    if (breakMarkerFlags.opponentBreaks[index]) {
      return theme.palette.background.paper;
    }

    return subtleOurPointBorder;
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
          pointHoverRadius: durationMarkerHoverRadii,
          pointBorderWidth: durationMarkerBorders,
          pointHoverBorderWidth: durationMarkerHoverBorders,
          pointBackgroundColor: durationMarkerBackgrounds,
          pointHoverBackgroundColor: durationMarkerHoverBackgrounds,
          pointBorderColor: durationMarkerBorderColors,
          pointHoverBorderColor: durationMarkerHoverBorderColors,
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
          pointHoverRadius: breakMarkerHoverRadii,
          pointBorderWidth: breakMarkerBorders,
          pointHoverBorderWidth: breakMarkerHoverBorders,
          pointBackgroundColor: breakMarkerBackgrounds,
          pointHoverBackgroundColor: breakMarkerHoverBackgrounds,
          pointBorderColor: breakMarkerBorderColors,
          pointHoverBorderColor: breakMarkerHoverBorderColors,
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
          pointHoverRadius: brokenMarkerHoverRadii,
          pointBorderWidth: brokenMarkerBorders,
          pointHoverBorderWidth: brokenMarkerHoverBorders,
          pointBackgroundColor: brokenMarkerBackgrounds,
          pointHoverBackgroundColor: brokenMarkerHoverBackgrounds,
          pointBorderColor: brokenMarkerBorderColors,
          pointHoverBorderColor: brokenMarkerHoverBorderColors,
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
          pointHoverRadius: breakMarkerHoverRadii,
          pointBorderWidth: breakMarkerBorders,
          pointHoverBorderWidth: breakMarkerHoverBorders,
          pointBackgroundColor: breakMarkerBackgrounds,
          pointHoverBackgroundColor: breakMarkerHoverBackgrounds,
          pointBorderColor: breakMarkerBorderColors,
          pointHoverBorderColor: breakMarkerHoverBorderColors,
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
          pointHoverRadius: brokenMarkerHoverRadii,
          pointBorderWidth: brokenMarkerBorders,
          pointHoverBorderWidth: brokenMarkerHoverBorders,
          pointBackgroundColor: brokenMarkerBackgrounds,
          pointHoverBackgroundColor: brokenMarkerHoverBackgrounds,
          pointBorderColor: brokenMarkerBorderColors,
          pointHoverBorderColor: brokenMarkerHoverBorderColors,
        },
      ],
    },
  } as const;

  const selectedChart = chartByMetric[metric];
  const maxYValue = Math.max(
    0,
    ...selectedChart.datasets.flatMap((dataset) =>
      dataset.data.map((point) => (typeof point?.y === "number" ? point.y : 0))
    )
  );
  const yAxisSuggestedMax = selectedChart.integerYAxis
    ? maxYValue + 0.6
    : maxYValue + Math.max(maxYValue * 0.08, 5);

  const chartData: ChartData<"line"> = {
    datasets: selectedChart.datasets.map((dataset) => ({
      ...dataset,
      borderWidth: 3,
      pointStyle: dataset.pointStyle ?? "circle",
      pointRadius: dataset.pointRadius ?? 0,
      pointHoverRadius: dataset.pointHoverRadius ?? 5,
      pointHitRadius: 8,
      pointBorderWidth: dataset.pointBorderWidth ?? 0,
      pointHoverBorderWidth: dataset.pointHoverBorderWidth ?? dataset.pointBorderWidth ?? 0,
      pointBackgroundColor: dataset.pointBackgroundColor ?? "transparent",
      pointHoverBackgroundColor:
        dataset.pointHoverBackgroundColor ?? dataset.pointBackgroundColor ?? "transparent",
      pointBorderColor: dataset.pointBorderColor ?? dataset.borderColor,
      pointHoverBorderColor:
        dataset.pointHoverBorderColor ?? dataset.pointBorderColor ?? dataset.borderColor,
      fill: false,
    })),
  };

  const applyPointVisibility = (chart: ChartJS<"line">, hoveredDatasetIndex: number | null) => {
    selectedChart.datasets.forEach((_datasetConfig, datasetIndex) => {
      const dataset = chart.data.datasets[datasetIndex];
      if (!dataset) {
        return;
      }

      const isHoveredDataset = hoveredDatasetIndex === datasetIndex;
      const showRegularPoints =
        selectedChart.datasets.length === 1 ? isHoveredDataset : isHoveredDataset;

      const pointRadius =
        datasetIndex === 0
          ? showRegularPoints
            ? breakMarkerHoverRadii
            : breakMarkerRadii
          : showRegularPoints
            ? brokenMarkerHoverRadii
            : brokenMarkerRadii;
      const pointBorderWidth =
        datasetIndex === 0
          ? showRegularPoints
            ? breakMarkerHoverBorders
            : breakMarkerBorders
          : showRegularPoints
            ? brokenMarkerHoverBorders
            : brokenMarkerBorders;
      const pointBackgroundColor =
        datasetIndex === 0
          ? showRegularPoints
            ? breakMarkerHoverBackgrounds
            : breakMarkerBackgrounds
          : showRegularPoints
            ? brokenMarkerHoverBackgrounds
            : brokenMarkerBackgrounds;
      const pointBorderColor =
        datasetIndex === 0
          ? showRegularPoints
            ? breakMarkerHoverBorderColors
            : breakMarkerBorderColors
          : showRegularPoints
            ? brokenMarkerHoverBorderColors
            : brokenMarkerBorderColors;

      if (selectedChart.datasets.length === 1) {
        dataset.pointRadius = isHoveredDataset ? durationMarkerHoverRadii : durationMarkerRadii;
        dataset.pointBorderWidth = isHoveredDataset
          ? durationMarkerHoverBorders
          : durationMarkerBorders;
        dataset.pointBackgroundColor = isHoveredDataset
          ? durationMarkerHoverBackgrounds
          : durationMarkerBackgrounds;
        dataset.pointBorderColor = isHoveredDataset
          ? durationMarkerHoverBorderColors
          : durationMarkerBorderColors;
        return;
      }

      dataset.pointRadius = pointRadius;
      dataset.pointBorderWidth = pointBorderWidth;
      dataset.pointBackgroundColor = pointBackgroundColor;
      dataset.pointBorderColor = pointBorderColor;
    });

    chart.update("none");
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: (event, _elements, chart) => {
      const nextHoveredDatasetIndex = getHoveredDatasetIndex(
        chart as ChartJS<"line">,
        event,
        selectedChart.datasets
      );
      chart.canvas.style.cursor = nextHoveredDatasetIndex !== null ? "pointer" : "default";
      if (hoveredDatasetIndexRef.current === nextHoveredDatasetIndex) {
        return;
      }

      hoveredDatasetIndexRef.current = nextHoveredDatasetIndex;
      applyPointVisibility(chart as ChartJS<"line">, nextHoveredDatasetIndex);
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: true,
    },
    animation: false,
    normalized: true,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: xAxisMax,
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
        suggestedMax: yAxisSuggestedMax,
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
        intersect: true,
        position: "nearest",
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
          x: { min: 0, max: xAxisMax, minRange: 3 },
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
              hoveredDatasetIndexRef.current = null;
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
