import { Paper, Typography, Box, Grid, Divider } from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslation } from "react-i18next";
import type { TeamStatsBase } from "../../types";
import CircularStat from "./CircularStat";

interface TeamStatisticsProps {
  teamStats: TeamStatsBase;
}

export default function TeamStatistics({ teamStats }: TeamStatisticsProps) {
  const { t } = useTranslation("statistics");

  if (teamStats.total_completed_points === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
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
              total={teamStats.offense.points_won}
              color={(theme) => theme.colors.offense.light}
              tooltip={t("tooltips.cleanPointRate")}
            />
          </Grid>
        </Grid>
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
      </Box>
    </Paper>
  );
}
