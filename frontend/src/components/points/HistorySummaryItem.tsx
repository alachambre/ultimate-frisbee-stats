import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import TurnoverBalanceBar from "../shared/TurnoverBalanceBar";
import {
  BREAK_RATE_VALUE_STOPS,
  HOLD_RATE_VALUE_STOPS,
  getValueGradientColor,
  getValueGradientTrackColor,
  type ValueGradientStops,
} from "../statistics/statValueColors";
import type { HistorySummarySnapshot } from "./historySummarySnapshot";

interface HistorySummaryItemProps<TActionPayload = never> {
  title: string;
  chipLabel: string;
  chipColor: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  icon: ReactNode;
  snapshot?: HistorySummarySnapshot;
  comments?: string | null;
  onDelete?: (payload: TActionPayload) => void;
  deletePayload?: TActionPayload;
  deleteAriaLabel?: string;
  isDeleting?: boolean;
}

interface SummaryMetricProps {
  label: string;
  value: string;
}

interface FieldSideRowProps {
  label: string;
  percentage: number;
  count: number;
  total: number;
  valueGradientStops: ValueGradientStops;
}

interface TurnoverSectionProps {
  title: string;
  opponentCount: number;
  ourCount: number;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  );
}

function TurnoverSection({ title, opponentCount, ourCount }: TurnoverSectionProps) {
  const { t } = useTranslation("statistics");

  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mb: 0.75, letterSpacing: 0.5 }}
      >
        {title}
      </Typography>
      <TurnoverBalanceBar
        compact
        opponentCount={opponentCount}
        ourCount={ourCount}
        opponentLabel={t("teamStats.opponentTurnovers")}
        ourLabel={t("teamStats.ourTurnovers")}
      />
    </Box>
  );
}

function FieldSideRow({
  label,
  percentage,
  count,
  total,
  valueGradientStops,
}: FieldSideRowProps) {
  const theme = useTheme();
  const hasData = total > 0;
  const barColor = getValueGradientColor(theme, percentage, hasData, valueGradientStops);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" fontWeight="bold" sx={{ color: barColor }}>
          {hasData ? `${Math.round(percentage * 100)}%` : "-"} ({count}/{total})
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={hasData ? Math.round(percentage * 100) : 0}
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: getValueGradientTrackColor(theme, percentage, hasData, valueGradientStops),
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            backgroundColor: barColor,
          },
        }}
      />
    </Box>
  );
}

export default function HistorySummaryItem<TActionPayload = never>({
  title,
  chipLabel,
  chipColor,
  icon,
  snapshot,
  comments,
  onDelete,
  deletePayload,
  deleteAriaLabel,
  isDeleting = false,
}: HistorySummaryItemProps<TActionPayload>) {
  const { t } = useTranslation(["points", "common", "statistics"]);
  const theme = useTheme();

  const hasHoldByFieldSideData = snapshot
    ? snapshot.holdByFieldSide.table_left.pointsStarted +
        snapshot.holdByFieldSide.table_right.pointsStarted >
      0
    : false;
  const hasBreakByFieldSideData = snapshot
    ? snapshot.breakByFieldSide.table_left.pointsStarted +
        snapshot.breakByFieldSide.table_right.pointsStarted >
      0
    : false;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
          </Box>
          {onDelete && deletePayload !== undefined && deleteAriaLabel && (
            <Tooltip title={t("common:action.delete")}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => onDelete(deletePayload)}
                  aria-label={deleteAriaLabel}
                  color="error"
                  disabled={isDeleting}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Chip label={chipLabel} color={chipColor} size="small" />
        </Box>

        {snapshot && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.06),
              border: 1,
              borderColor: alpha(theme.palette.warning.main, 0.18),
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <SummaryMetric
                label={t("statistics:teamStats.score")}
                value={`${snapshot.ourScore} - ${snapshot.opponentScore}`}
              />
              {snapshot.elapsedSeconds != null && (
                <SummaryMetric
                  label={t("points:tracker.elapsedTime")}
                  value={formatDuration(snapshot.elapsedSeconds)}
                />
              )}
              <SummaryMetric
                label={t("points:history.offenseTime")}
                value={formatDuration(snapshot.offenseElapsedSeconds)}
              />
              <SummaryMetric
                label={t("points:history.defenseTime")}
                value={formatDuration(snapshot.defenseElapsedSeconds)}
              />
            </Box>

            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <TurnoverSection
                title={t("statistics:teamStats.offense")}
                opponentCount={snapshot.offenseTurnovers.opponentTurnovers}
                ourCount={snapshot.offenseTurnovers.ourTurnovers}
              />
              <TurnoverSection
                title={t("statistics:teamStats.defense")}
                opponentCount={snapshot.defenseTurnovers.opponentTurnovers}
                ourCount={snapshot.defenseTurnovers.ourTurnovers}
              />
            </Stack>

            {(hasHoldByFieldSideData || hasBreakByFieldSideData) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  {hasHoldByFieldSideData && (
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: "block", mb: 1, letterSpacing: 0.5 }}
                      >
                        {t("statistics:teamStats.holdByFieldSide")}
                      </Typography>
                      <Stack spacing={1.25}>
                        <FieldSideRow
                          label={t("statistics:teamStats.leftSide")}
                          percentage={snapshot.holdByFieldSide.table_left.rate}
                          count={snapshot.holdByFieldSide.table_left.pointsWon}
                          total={snapshot.holdByFieldSide.table_left.pointsStarted}
                          valueGradientStops={HOLD_RATE_VALUE_STOPS}
                        />
                        <FieldSideRow
                          label={t("statistics:teamStats.rightSide")}
                          percentage={snapshot.holdByFieldSide.table_right.rate}
                          count={snapshot.holdByFieldSide.table_right.pointsWon}
                          total={snapshot.holdByFieldSide.table_right.pointsStarted}
                          valueGradientStops={HOLD_RATE_VALUE_STOPS}
                        />
                      </Stack>
                    </Box>
                  )}

                  {hasBreakByFieldSideData && (
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ display: "block", mb: 1, letterSpacing: 0.5 }}
                      >
                        {t("statistics:teamStats.breakByFieldSide")}
                      </Typography>
                      <Stack spacing={1.25}>
                        <FieldSideRow
                          label={t("statistics:teamStats.leftSide")}
                          percentage={snapshot.breakByFieldSide.table_left.rate}
                          count={snapshot.breakByFieldSide.table_left.pointsWon}
                          total={snapshot.breakByFieldSide.table_left.pointsStarted}
                          valueGradientStops={BREAK_RATE_VALUE_STOPS}
                        />
                        <FieldSideRow
                          label={t("statistics:teamStats.rightSide")}
                          percentage={snapshot.breakByFieldSide.table_right.rate}
                          count={snapshot.breakByFieldSide.table_right.pointsWon}
                          total={snapshot.breakByFieldSide.table_right.pointsStarted}
                          valueGradientStops={BREAK_RATE_VALUE_STOPS}
                        />
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </>
            )}
          </Box>
        )}

        {comments && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {comments}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
