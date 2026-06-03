import { Box, Paper, Typography } from "@mui/material";
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
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";

import type { GamePointTimeline } from "../../types";
import {
  getGameTrendsTickStep,
  getBreakMarkerFlags,
  prependChartOrigin,
} from "../../components/statistics/gameTrendsLayout";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend);

interface NewGameScoreProgressionProps {
  timeline: GamePointTimeline;
  teamName: string;
  opponentName: string;
}

function buildSeriesPoints(xValues: number[], yValues: number[]) {
  return xValues.map((x, index) => ({
    x,
    y: yValues[index] ?? 0,
  }));
}

function buildMarkerRadii(flags: boolean[], baseRadius = 0) {
  return flags.map((isMarked, index) =>
    index === 0 ? 0 : isMarked ? 6 : baseRadius,
  );
}

function buildMarkerBorders(flags: boolean[]) {
  return flags.map((isMarked) => (isMarked ? 2 : 0));
}

function buildMarkerColors(
  flags: boolean[],
  markedColor: string,
  baseColor: string,
) {
  return flags.map((isMarked, index) =>
    index === 0 ? "transparent" : isMarked ? markedColor : baseColor,
  );
}

function LegendLineItem({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
      <Box
        aria-hidden="true"
        sx={{
          borderTop: "3px solid",
          borderColor: color,
          borderRadius: 999,
          height: 0,
          width: 18,
        }}
      />
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
    </Box>
  );
}

function LegendMarkerItem({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          bgcolor: color,
          border: "2px solid",
          borderColor: theme.palette.background.paper,
          borderRadius: "50%",
          boxSizing: "content-box",
          height: 9,
          width: 9,
        })}
      />
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
    </Box>
  );
}

export default function NewGameScoreProgression({
  timeline,
  teamName,
  opponentName,
}: NewGameScoreProgressionProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();

  if (timeline.points.length === 0) {
    return null;
  }

  const pointNumbers = prependChartOrigin(
    timeline.points.map((point) => point.point_number),
  );
  const maxX = pointNumbers[pointNumbers.length - 1] ?? 0;
  const tickStep = getGameTrendsTickStep(pointNumbers.length);
  const ourSeriesColor = theme.colors.newUi.primary;
  const opponentSeriesColor = theme.colors.performance.veryLow;
  const breakMarkerColor = ourSeriesColor;
  const brokenMarkerColor = opponentSeriesColor;
  const breakMarkerFlags = getBreakMarkerFlags(timeline.points);
  const basePointFill = alpha(ourSeriesColor, 0.12);
  const opponentPointFill = alpha(opponentSeriesColor, 0.12);
  const maxScore = Math.max(
    0,
    ...timeline.points.flatMap((point) => [
      point.our_score_after,
      point.opponent_score_after,
    ]),
  );

  const chartData: ChartData<"line"> = {
    datasets: [
      {
        label: teamName,
        borderColor: ourSeriesColor,
        backgroundColor: alpha(ourSeriesColor, 0.14),
        data: buildSeriesPoints(
          pointNumbers,
          prependChartOrigin(
            timeline.points.map((point) => point.our_score_after),
          ),
        ),
        cubicInterpolationMode: "monotone",
        tension: 0.22,
        borderWidth: 3,
        pointRadius: buildMarkerRadii(breakMarkerFlags.ourBreaks),
        pointHoverRadius: buildMarkerRadii(breakMarkerFlags.ourBreaks, 4),
        pointHitRadius: 8,
        pointBorderWidth: buildMarkerBorders(breakMarkerFlags.ourBreaks),
        pointHoverBorderWidth: buildMarkerBorders(
          breakMarkerFlags.ourBreaks,
        ),
        pointBackgroundColor: buildMarkerColors(
          breakMarkerFlags.ourBreaks,
          breakMarkerColor,
          "transparent",
        ),
        pointHoverBackgroundColor: buildMarkerColors(
          breakMarkerFlags.ourBreaks,
          breakMarkerColor,
          basePointFill,
        ),
        pointBorderColor: buildMarkerColors(
          breakMarkerFlags.ourBreaks,
          theme.palette.background.paper,
          "transparent",
        ),
        pointHoverBorderColor: buildMarkerColors(
          breakMarkerFlags.ourBreaks,
          theme.palette.background.paper,
          alpha(ourSeriesColor, 0.72),
        ),
        fill: false,
      },
      {
        label: opponentName,
        borderColor: opponentSeriesColor,
        backgroundColor: alpha(opponentSeriesColor, 0.12),
        data: buildSeriesPoints(
          pointNumbers,
          prependChartOrigin(
            timeline.points.map((point) => point.opponent_score_after),
          ),
        ),
        cubicInterpolationMode: "monotone",
        tension: 0.22,
        borderWidth: 3,
        borderDash: [7, 5],
        pointRadius: buildMarkerRadii(breakMarkerFlags.opponentBreaks),
        pointHoverRadius: buildMarkerRadii(
          breakMarkerFlags.opponentBreaks,
          4,
        ),
        pointHitRadius: 8,
        pointBorderWidth: buildMarkerBorders(
          breakMarkerFlags.opponentBreaks,
        ),
        pointHoverBorderWidth: buildMarkerBorders(
          breakMarkerFlags.opponentBreaks,
        ),
        pointBackgroundColor: buildMarkerColors(
          breakMarkerFlags.opponentBreaks,
          brokenMarkerColor,
          "transparent",
        ),
        pointHoverBackgroundColor: buildMarkerColors(
          breakMarkerFlags.opponentBreaks,
          brokenMarkerColor,
          opponentPointFill,
        ),
        pointBorderColor: buildMarkerColors(
          breakMarkerFlags.opponentBreaks,
          theme.palette.background.paper,
          "transparent",
        ),
        pointHoverBorderColor: buildMarkerColors(
          breakMarkerFlags.opponentBreaks,
          theme.palette.background.paper,
          alpha(opponentSeriesColor, 0.72),
        ),
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    normalized: true,
    interaction: {
      mode: "index",
      axis: "x",
      intersect: false,
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: maxX + 0.4,
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
        suggestedMax: maxScore + 0.6,
        title: {
          display: true,
          text: t("charts.scoreYAxis"),
          color: theme.palette.text.secondary,
        },
        ticks: {
          precision: 0,
          stepSize: 1,
          color: theme.palette.text.secondary,
          callback: (tickValue) => String(Math.round(Number(tickValue))),
        },
        grid: {
          color: alpha(theme.palette.text.primary, 0.1),
        },
      },
    },
    plugins: {
      legend: {
        display: false,
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
        cornerRadius: 8,
        callbacks: {
          title: (items: TooltipItem<"line">[]) => {
            const pointValue = items[0]?.parsed.x ?? 0;
            return `${t("charts.xAxis")} ${pointValue}`;
          },
          label: (item: TooltipItem<"line">) =>
            `${item.dataset.label}: ${Math.round(item.parsed.y ?? 0)}`,
        },
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: "1px solid",
        borderColor: theme.palette.divider,
        borderRadius: 1,
        p: { xs: 2, sm: 2.5 },
      })}
    >
      <Box
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography fontWeight={800} variant="h6">
          {t("charts.title")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <LegendLineItem color={ourSeriesColor} label={teamName} />
          <LegendLineItem color={opponentSeriesColor} label={opponentName} />
          <LegendMarkerItem
            color={breakMarkerColor}
            label={t("charts.breakMarker")}
          />
          <LegendMarkerItem
            color={brokenMarkerColor}
            label={t("charts.brokenMarker")}
          />
        </Box>
      </Box>

      <Typography color="text.secondary" fontWeight={700} sx={{ mb: 1 }} variant="subtitle2">
        {t("charts.score")}
      </Typography>

      <Box sx={{ height: { xs: 220, sm: 280 } }}>
        <Line data={chartData} options={chartOptions} />
      </Box>
    </Paper>
  );
}
