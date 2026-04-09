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
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import type { GamePointTimeline } from "../../types";
import LoadingState from "../shared/LoadingState";
import { getGameTrendsTickStep, prependChartOrigin } from "./gameTrendsLayout";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend, zoomPlugin);

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
}: GameTrendsSectionProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
  const chartRef = useRef<ChartJS<"line"> | null>(null);
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

  const pointNumbers = prependChartOrigin(timeline.points.map((point) => point.point_number));
  const pointCount = pointNumbers.length;
  const tickStep = getGameTrendsTickStep(pointCount);
  const maxX = pointNumbers[pointNumbers.length - 1];
  const ourSeriesColor = theme.colors.offense.main;
  const opponentSeriesColor = theme.colors.performance.veryLow;

  const chartByMetric = {
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
          label: t("charts.ourScore"),
          borderColor: ourSeriesColor,
          backgroundColor: alpha(ourSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.our_score_after))
          ),
          tension: 0.28,
          cubicInterpolationMode: "monotone" as const,
        },
        {
          label: t("charts.opponentScore"),
          borderColor: opponentSeriesColor,
          backgroundColor: alpha(opponentSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.opponent_score_after))
          ),
          tension: 0.28,
          cubicInterpolationMode: "monotone" as const,
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
          label: t("charts.ourTurns"),
          borderColor: ourSeriesColor,
          backgroundColor: alpha(ourSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.our_turnovers))
          ),
          tension: 0.2,
        },
        {
          label: t("charts.opponentTurns"),
          borderColor: opponentSeriesColor,
          backgroundColor: alpha(opponentSeriesColor, 0.16),
          data: buildSeriesPoints(
            pointNumbers,
            prependChartOrigin(timeline.points.map((point) => point.opponent_turnovers))
          ),
          tension: 0.2,
        },
      ],
    },
  } as const;

  const selectedChart = chartByMetric[metric];

  const chartData: ChartData<"line"> = {
    datasets: selectedChart.datasets.map((dataset) => ({
      ...dataset,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHitRadius: 14,
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
        display: selectedChart.datasets.length > 1,
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
        callbacks: {
          title: (items: TooltipItem<"line">[]) => {
            const pointValue = items[0]?.parsed.x ?? 0;
            return `${t("charts.xAxis")} ${pointValue}`;
          },
          label: (item: TooltipItem<"line">) =>
            `${item.dataset.label}: ${selectedChart.formatValue(item.parsed.y ?? 0)}`,
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

        <Box sx={{ height: 320 }}>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </Box>
      </Box>
    </Paper>
  );
}
