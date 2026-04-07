import {
  Typography,
  Box,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import type { TeamStatsBase } from "../../types";
import CircularStat from "./CircularStat";
import {
  BREAK_RATE_VALUE_MIDPOINT,
  CLEAN_BREAK_RATE_VALUE_MIDPOINT,
  HOLD_RATE_VALUE_MIDPOINT,
  TURNOVER_RATE_VALUE_MIDPOINT,
  getValueGradientColor,
  getValueGradientTrackColor,
} from "./statValueColors";
import TurnoverCountSummary from "./TurnoverCountSummary";

interface TeamStatisticsProps {
  teamStats: TeamStatsBase;
  showFieldSideStats?: boolean;
}

function hasTrackedOffenseFieldSideStats(teamStats: TeamStatsBase): boolean {
  return (
    teamStats.field_side_stats.table_left.offense.points_started +
      teamStats.field_side_stats.table_right.offense.points_started >
    0
  );
}

function hasTrackedDefenseFieldSideStats(teamStats: TeamStatsBase): boolean {
  return (
    teamStats.field_side_stats.table_left.defense.points_started +
      teamStats.field_side_stats.table_right.defense.points_started >
    0
  );
}

interface FieldSideProgressRowProps {
  label: string;
  percentage: number;
  count: number;
  total: number;
  valueGradientMidpoint?: number;
}

function FieldSideProgressRow({
  label,
  percentage,
  count,
  total,
  valueGradientMidpoint,
}: FieldSideProgressRowProps) {
  const theme = useTheme();
  const hasData = total > 0;
  const percentLabel = hasData ? `${Math.round(percentage * 100)}%` : "-";
  const barColor = getValueGradientColor(theme, percentage, hasData, valueGradientMidpoint);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 0.75,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold" sx={{ color: barColor }}>
          {percentLabel} ({count}/{total})
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={hasData ? Math.round(percentage * 100) : 0}
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: getValueGradientTrackColor(theme, percentage, hasData, valueGradientMidpoint),
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            backgroundColor: barColor,
          },
        }}
      />
    </Box>
  );
}

interface FieldSideMetricSummaryProps {
  title: string;
  leftPercentage: number;
  leftCount: number;
  leftTotal: number;
  rightPercentage: number;
  rightCount: number;
  rightTotal: number;
  valueGradientMidpoint?: number;
}

function FieldSideMetricSummary({
  title,
  leftPercentage,
  leftCount,
  leftTotal,
  rightPercentage,
  rightCount,
  rightTotal,
  valueGradientMidpoint,
}: FieldSideMetricSummaryProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mt: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 0.25,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {t("teamStats.advancedStats")}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            display: "block",
            mb: 1.5,
            letterSpacing: 0.6,
          }}
        >
          {title}
        </Typography>
        <Stack spacing={2}>
          <FieldSideProgressRow
            label={t("teamStats.leftSide")}
            percentage={leftPercentage}
            count={leftCount}
            total={leftTotal}
            valueGradientMidpoint={valueGradientMidpoint}
          />
          <FieldSideProgressRow
            label={t("teamStats.rightSide")}
            percentage={rightPercentage}
            count={rightCount}
            total={rightTotal}
            valueGradientMidpoint={valueGradientMidpoint}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function TeamStatistics({
  teamStats,
  showFieldSideStats = false,
}: TeamStatisticsProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();

  if (teamStats.total_completed_points === 0) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{
          mb: 3,
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            bottom: -1,
            width: 64,
            height: 3,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.primary.main, 0.75),
          },
        }}
      >
        {t("teamStats.title")}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <FlashOnIcon sx={{ color: (currentTheme) => currentTheme.colors.offense.main }} />
          <Typography variant="h6">{t("teamStats.offense")}</Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 4 }}>
            <CircularStat
              label={t("teamStats.hold")}
              percentage={teamStats.offense.hold_rate}
              count={teamStats.offense.points_won}
              total={teamStats.offense.points_started}
              useValueGradient
              valueGradientMidpoint={HOLD_RATE_VALUE_MIDPOINT}
              tooltip={t("tooltips.holdRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <CircularStat
              label={t("teamStats.cleanHold")}
              percentage={teamStats.offense.clean_hold_rate}
              count={teamStats.offense.points_won_no_turnover}
              total={teamStats.offense.points_started}
              useValueGradient
              tooltip={t("tooltips.cleanPointRate")}
            />
          </Grid>
        </Grid>
        <TurnoverCountSummary
          ourCount={teamStats.offense.our_turnovers ?? 0}
          opponentCount={teamStats.offense.opponent_turnovers ?? 0}
        />
        {showFieldSideStats && hasTrackedOffenseFieldSideStats(teamStats) && (
          <FieldSideMetricSummary
            title={t("teamStats.holdByFieldSide")}
            leftPercentage={teamStats.field_side_stats.table_left.offense.hold_rate}
            leftCount={teamStats.field_side_stats.table_left.offense.points_won}
            leftTotal={teamStats.field_side_stats.table_left.offense.points_started}
            rightPercentage={teamStats.field_side_stats.table_right.offense.hold_rate}
            rightCount={teamStats.field_side_stats.table_right.offense.points_won}
            rightTotal={teamStats.field_side_stats.table_right.offense.points_started}
            valueGradientMidpoint={HOLD_RATE_VALUE_MIDPOINT}
          />
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <ShieldIcon sx={{ color: (currentTheme) => currentTheme.colors.defense.main }} />
          <Typography variant="h6">{t("teamStats.defense")}</Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.turnover")}
              percentage={teamStats.defense.turnover_rate}
              count={teamStats.defense.points_with_turnover}
              total={teamStats.defense.points_started}
              useValueGradient
              valueGradientMidpoint={TURNOVER_RATE_VALUE_MIDPOINT}
              tooltip={t("tooltips.turnoverRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.break")}
              percentage={teamStats.defense.break_rate}
              count={teamStats.defense.points_won}
              total={teamStats.defense.points_started}
              useValueGradient
              valueGradientMidpoint={BREAK_RATE_VALUE_MIDPOINT}
              tooltip={t("tooltips.breakRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.cleanBreak")}
              percentage={teamStats.defense.clean_break_rate}
              count={teamStats.defense.points_won_no_turnover}
              total={teamStats.defense.points_started}
              useValueGradient
              valueGradientMidpoint={CLEAN_BREAK_RATE_VALUE_MIDPOINT}
              tooltip={t("tooltips.cleanBreakRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.pullInbound")}
              percentage={teamStats.defense.pull_stats.inbound_rate}
              count={teamStats.defense.pull_stats.inbound_pulls}
              total={teamStats.defense.pull_stats.total_pulls}
              useValueGradient
              tooltip={t("tooltips.pullRate")}
            />
          </Grid>
        </Grid>
        <TurnoverCountSummary
          ourCount={teamStats.defense.our_turnovers ?? 0}
          opponentCount={teamStats.defense.opponent_turnovers ?? 0}
        />
        {showFieldSideStats && hasTrackedDefenseFieldSideStats(teamStats) && (
          <FieldSideMetricSummary
            title={t("teamStats.breakByFieldSide")}
            leftPercentage={teamStats.field_side_stats.table_left.defense.break_rate}
            leftCount={teamStats.field_side_stats.table_left.defense.points_won}
            leftTotal={teamStats.field_side_stats.table_left.defense.points_started}
            rightPercentage={teamStats.field_side_stats.table_right.defense.break_rate}
            rightCount={teamStats.field_side_stats.table_right.defense.points_won}
            rightTotal={teamStats.field_side_stats.table_right.defense.points_started}
            valueGradientMidpoint={BREAK_RATE_VALUE_MIDPOINT}
          />
        )}
      </Box>
    </Box>
  );
}
