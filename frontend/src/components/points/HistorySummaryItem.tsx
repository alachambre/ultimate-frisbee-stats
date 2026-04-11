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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import {
  BREAK_RATE_VALUE_STOPS,
  HOLD_RATE_VALUE_STOPS,
  getValueGradientColor,
  getValueGradientTrackColor,
  type ValueGradientStops,
} from "../statistics/statValueColors";
import TurnoverBalanceBar from "../shared/TurnoverBalanceBar";
import type { TurnoverTypeBucket, TurnoverTypePhaseStats } from "../../types";
import { TURNOVER_TYPES, getTurnoverTypeLabel } from "../../utils/turnoverTypes";
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
  detailsLabel?: string;
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

interface TurnoverTypeBucketSectionProps {
  title: string;
  bucket: TurnoverTypeBucket;
  color: string;
}

const sectionTitleSx = {
  display: "block",
  mb: 0.25,
  letterSpacing: 0.5,
  fontWeight: 700,
} as const;

function formatSummaryDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

function getTurnoverTypeEntries(bucket: TurnoverTypeBucket) {
  return TURNOVER_TYPES.map((turnoverType, index) => ({
    turnoverType,
    index,
    stats: bucket.by_type[turnoverType],
  }))
    .filter((entry) => entry.stats.count > 0)
    .sort((left, right) => {
      if (right.stats.count !== left.stats.count) {
        return right.stats.count - left.stats.count;
      }
      return left.index - right.index;
    });
}

function TurnoverTypeBucketSection({
  title,
  bucket,
  color,
}: TurnoverTypeBucketSectionProps) {
  const { t } = useTranslation(["statistics", "points"]);
  const entries = getTurnoverTypeEntries(bucket);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {entries.map(({ turnoverType, stats }) => (
          <Box key={turnoverType}>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 0.25,
              }}
            >
              <Typography variant="caption">{getTurnoverTypeLabel(t, turnoverType)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(stats.percentage * 100)}% ({stats.count})
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.round(stats.percentage * 100)}
              sx={{
                height: 4,
                borderRadius: 999,
                bgcolor: alpha(color, 0.12),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  backgroundColor: color,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function createEmptyMergedTurnoverTypeBucket(): TurnoverTypeBucket {
  return {
    total_turnovers: 0,
    by_type: Object.fromEntries(
      TURNOVER_TYPES.map((turnoverType) => [turnoverType, { count: 0, percentage: 0 }]),
    ) as TurnoverTypeBucket["by_type"],
  };
}

function mergeTurnoverTypeBucket(...buckets: TurnoverTypeBucket[]): TurnoverTypeBucket {
  const mergedBucket = createEmptyMergedTurnoverTypeBucket();

  buckets.forEach((bucket) => {
    mergedBucket.total_turnovers += bucket.total_turnovers;
    TURNOVER_TYPES.forEach((turnoverType) => {
      mergedBucket.by_type[turnoverType].count += bucket.by_type[turnoverType].count;
    });
  });

  TURNOVER_TYPES.forEach((turnoverType) => {
    mergedBucket.by_type[turnoverType].percentage =
      mergedBucket.total_turnovers > 0
        ? mergedBucket.by_type[turnoverType].count / mergedBucket.total_turnovers
        : 0;
  });

  return mergedBucket;
}

function mergeTurnoverTypePhaseStats(
  ...phaseStatsList: TurnoverTypePhaseStats[]
): TurnoverTypePhaseStats {
  return {
    opponent_possession_turnovers: mergeTurnoverTypeBucket(
      ...phaseStatsList.map((phaseStats) => phaseStats.opponent_possession_turnovers),
    ),
    our_possession_turnovers: mergeTurnoverTypeBucket(
      ...phaseStatsList.map((phaseStats) => phaseStats.our_possession_turnovers),
    ),
  };
}

function TurnoverSection({ title, opponentCount, ourCount }: TurnoverSectionProps) {
  const { t } = useTranslation("statistics");

  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={sectionTitleSx}
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
  detailsLabel,
}: HistorySummaryItemProps<TActionPayload>) {
  const { t } = useTranslation(["points", "common", "statistics"]);
  const theme = useTheme();
  const globalTurnoverTypeStats = snapshot
    ? mergeTurnoverTypePhaseStats(
        snapshot.offenseTurnoverTypeStats,
        snapshot.defenseTurnoverTypeStats,
      )
    : null;
  const hasGlobalTurnoverTypeStats =
    (globalTurnoverTypeStats?.opponent_possession_turnovers.total_turnovers ?? 0) +
      (globalTurnoverTypeStats?.our_possession_turnovers.total_turnovers ?? 0) >
    0;

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
  const formatDurationWithPoints = (totalSeconds: number, pointsPlayed: number) =>
    `${formatSummaryDuration(totalSeconds)} (${t("points:history.pointsPlayedCount", { count: pointsPlayed })})`;

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
              bgcolor: alpha(theme.palette.info.main, 0.06),
              border: 1,
              borderColor: alpha(theme.palette.info.main, 0.18),
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
                  value={formatSummaryDuration(snapshot.elapsedSeconds)}
                />
              )}
              <SummaryMetric
                label={t("points:history.offenseTime")}
                value={formatDurationWithPoints(
                  snapshot.offenseElapsedSeconds,
                  snapshot.offensePointsPlayed,
                )}
              />
              <SummaryMetric
                label={t("points:history.defenseTime")}
                value={formatDurationWithPoints(
                  snapshot.defenseElapsedSeconds,
                  snapshot.defensePointsPlayed,
                )}
              />
            </Box>

            <Accordion
              disableGutters
              elevation={0}
              sx={{
                mt: 2,
                bgcolor: "transparent",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 0,
                  minHeight: "unset",
                  borderTop: 1,
                  borderColor: alpha(theme.palette.info.main, 0.2),
                  "& .MuiAccordionSummary-content": {
                    my: 1.5,
                  },
                  "& .MuiAccordionSummary-content.Mui-expanded": {
                    my: 1.5,
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {detailsLabel}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0, pb: 0 }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack spacing={1.25}>
                      <TurnoverSection
                        title={t("statistics:teamStats.offense")}
                        opponentCount={snapshot.offenseTurnovers.opponentTurnovers}
                        ourCount={snapshot.offenseTurnovers.ourTurnovers}
                      />
                      <Divider />
                      <TurnoverSection
                        title={t("statistics:teamStats.defense")}
                        opponentCount={snapshot.defenseTurnovers.opponentTurnovers}
                        ourCount={snapshot.defenseTurnovers.ourTurnovers}
                      />
                    </Stack>
                  </Box>

                  {globalTurnoverTypeStats && hasGlobalTurnoverTypeStats && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          sx={{ ...sectionTitleSx, mb: 1 }}
                        >
                          {t("statistics:turnoverTypeStats.title")}
                        </Typography>
                        <TurnoverTypeBucketSection
                          title={t("statistics:turnoverTypeStats.opponentPossessionTurnovers")}
                          bucket={globalTurnoverTypeStats.opponent_possession_turnovers}
                          color={theme.palette.success.main}
                        />
                        <Box sx={{ mt: 1.75 }}>
                          <TurnoverTypeBucketSection
                            title={t("statistics:turnoverTypeStats.ourPossessionTurnovers")}
                            bucket={globalTurnoverTypeStats.our_possession_turnovers}
                            color={theme.palette.warning.main}
                          />
                        </Box>
                      </Box>
                    </>
                  )}

                  {(hasHoldByFieldSideData || hasBreakByFieldSideData) && (
                    <>
                      <Divider />
                      <Stack spacing={2}>
                        {hasHoldByFieldSideData && (
                          <Box>
                            <Typography
                              variant="overline"
                              color="text.secondary"
                              sx={{ ...sectionTitleSx, mb: 1 }}
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
                              sx={{ ...sectionTitleSx, mb: 1 }}
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
                </Stack>
              </AccordionDetails>
            </Accordion>
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
