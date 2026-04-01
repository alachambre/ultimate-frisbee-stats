import { Typography, Box, Grid, Divider } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslation } from "react-i18next";
import type { TeamStatsBase } from "../../types";
import CircularStat from "./CircularStat";

interface TeamStatisticsProps {
  teamStats: TeamStatsBase;
  showFieldSideStats?: boolean;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
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

interface FieldSideMetricSummaryProps {
  title: string;
  color: string;
  leftSummary: string;
  rightSummary: string;
}

function FieldSideMetricSummary({
  title,
  color,
  leftSummary,
  rightSummary,
}: FieldSideMetricSummaryProps) {
  const { t } = useTranslation("statistics");

  return (
    <Box sx={{ mt: 2.5, mx: "auto", width: "100%", maxWidth: 520 }}>
      <Typography
        variant="caption"
        fontWeight="bold"
        color="text.secondary"
        sx={{
          mb: 1.25,
          display: "block",
          textAlign: "center",
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: 2,
              border: 1,
              borderColor: alpha(color, 0.16),
              bgcolor: alpha(color, 0.06),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("teamStats.leftSide")}
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ color }}>
              {leftSummary}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: 2,
              border: 1,
              borderColor: alpha(color, 0.16),
              bgcolor: alpha(color, 0.06),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("teamStats.rightSide")}
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ color }}>
              {rightSummary}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function TeamStatistics({
  teamStats,
  showFieldSideStats = false,
}: TeamStatisticsProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
  const offenseLeftSummary =
    teamStats.field_side_stats.table_left.offense.points_started > 0
      ? `${formatPercent(teamStats.field_side_stats.table_left.offense.hold_rate)} (${teamStats.field_side_stats.table_left.offense.points_won}/${teamStats.field_side_stats.table_left.offense.points_started})`
      : "-";
  const offenseRightSummary =
    teamStats.field_side_stats.table_right.offense.points_started > 0
      ? `${formatPercent(teamStats.field_side_stats.table_right.offense.hold_rate)} (${teamStats.field_side_stats.table_right.offense.points_won}/${teamStats.field_side_stats.table_right.offense.points_started})`
      : "-";
  const defenseLeftSummary =
    teamStats.field_side_stats.table_left.defense.points_started > 0
      ? `${formatPercent(teamStats.field_side_stats.table_left.defense.break_rate)} (${teamStats.field_side_stats.table_left.defense.points_won}/${teamStats.field_side_stats.table_left.defense.points_started})`
      : "-";
  const defenseRightSummary =
    teamStats.field_side_stats.table_right.defense.points_started > 0
      ? `${formatPercent(teamStats.field_side_stats.table_right.defense.break_rate)} (${teamStats.field_side_stats.table_right.defense.points_won}/${teamStats.field_side_stats.table_right.defense.points_started})`
      : "-";

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

      {/* Offense Statistics */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
          <Typography variant="h6">{t("teamStats.offense")}</Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 4 }}>
            <CircularStat
              label={t("teamStats.hold")}
              percentage={teamStats.offense.hold_rate}
              count={teamStats.offense.points_won}
              total={teamStats.offense.points_started}
              color={(theme) => theme.colors.offense.main}
              tooltip={t("tooltips.holdRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <CircularStat
              label={t("teamStats.cleanHold")}
              percentage={teamStats.offense.clean_hold_rate}
              count={teamStats.offense.points_won_no_turnover}
              total={teamStats.offense.points_started}
              color={(theme) => theme.colors.offense.light}
              tooltip={t("tooltips.cleanPointRate")}
            />
          </Grid>
        </Grid>
        {showFieldSideStats && hasTrackedOffenseFieldSideStats(teamStats) && (
          <FieldSideMetricSummary
            title={t("teamStats.holdByFieldSide")}
            color={theme.colors.offense.main}
            leftSummary={offenseLeftSummary}
            rightSummary={offenseRightSummary}
          />
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Defense Statistics */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
          <Typography variant="h6">{t("teamStats.defense")}</Typography>
        </Box>
        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.turnover")}
              percentage={teamStats.defense.turnover_rate}
              count={teamStats.defense.points_with_turnover}
              total={teamStats.defense.points_started}
              color={(theme) => theme.colors.defense.main}
              tooltip={t("tooltips.turnoverRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.break")}
              percentage={teamStats.defense.break_rate}
              count={teamStats.defense.points_won}
              total={teamStats.defense.points_started}
              color={(theme) => theme.colors.defense.dark}
              tooltip={t("tooltips.breakRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.cleanBreak")}
              percentage={teamStats.defense.clean_break_rate}
              count={teamStats.defense.points_won_no_turnover}
              total={teamStats.defense.points_started}
              color={(theme) => theme.colors.defense.light}
              tooltip={t("tooltips.cleanBreakRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <CircularStat
              label={t("teamStats.pullInbound")}
              percentage={teamStats.defense.pull_stats.inbound_rate}
              count={teamStats.defense.pull_stats.inbound_pulls}
              total={teamStats.defense.pull_stats.total_pulls}
              color={(theme) => theme.colors.pull.main}
              tooltip={t("tooltips.pullRate")}
            />
          </Grid>
        </Grid>
        {showFieldSideStats && hasTrackedDefenseFieldSideStats(teamStats) && (
          <FieldSideMetricSummary
            title={t("teamStats.breakByFieldSide")}
            color={theme.colors.defense.main}
            leftSummary={defenseLeftSummary}
            rightSummary={defenseRightSummary}
          />
        )}
      </Box>
    </Box>
  );
}
