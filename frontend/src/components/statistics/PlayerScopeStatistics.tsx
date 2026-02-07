import { Box, Chip, Divider, Grid, Paper, Typography } from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { useTranslation } from "react-i18next";
import type { PlayerGameStats } from "../../types";
import CircularStat from "./CircularStat";

interface PlayerScopeStatisticsProps {
  playerName: string;
  playerNumber?: number | null;
  teamName?: string;
  scopeLabel: string;
  contextLabel?: string;
  stats: PlayerGameStats;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlayerScopeStatistics({
  playerName,
  playerNumber,
  teamName,
  scopeLabel,
  contextLabel,
  stats,
}: PlayerScopeStatisticsProps) {
  const { t } = useTranslation("statistics");

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {playerName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teamName || "-"}
            </Typography>
          </Box>
          <Chip label={playerNumber != null ? `#${playerNumber}` : "-"} />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("playerScope.scope")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {scopeLabel}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("playerScope.context")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {contextLabel || "-"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" display="block">
                {t("playerStats.playingTime")}
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {formatTime(stats.effective_time_seconds)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <SportsScoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" display="block">
                {t("playerStats.pointsPlayed")}
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {stats.points_played}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
          <Typography variant="h6">{t("teamStats.offense")}</Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
            <CircularStat
              label={t("teamStats.hold")}
              percentage={stats.offense.hold_rate}
              count={stats.offense.points_won}
              total={stats.offense.points_played}
              color={(theme) => theme.colors.offense.main}
              tooltip={t("tooltips.holdRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
            <CircularStat
              label={t("teamStats.cleanHold")}
              percentage={stats.offense.clean_hold_rate}
              count={stats.offense.points_won_no_turnover}
              total={stats.offense.points_won}
              color={(theme) => theme.colors.offense.light}
              tooltip={t("tooltips.cleanPointRate")}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
          <Typography variant="h6">{t("teamStats.defense")}</Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
            <CircularStat
              label={t("teamStats.turnover")}
              percentage={stats.defense.turnover_rate}
              count={stats.defense.points_with_turnover}
              total={stats.defense.points_played}
              color={(theme) => theme.colors.defense.main}
              tooltip={t("tooltips.turnoverRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
            <CircularStat
              label={t("teamStats.break")}
              percentage={stats.defense.break_rate}
              count={stats.defense.points_won}
              total={stats.defense.points_played}
              color={(theme) => theme.colors.defense.dark}
              tooltip={t("tooltips.breakRate")}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
            <CircularStat
              label={t("teamStats.cleanBreak")}
              percentage={stats.defense.clean_break_rate}
              count={stats.defense.points_won_no_turnover}
              total={stats.defense.points_won}
              color={(theme) => theme.colors.defense.light}
              tooltip={t("tooltips.cleanBreakRate")}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("playerStats.offensePoints")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {stats.offense.points_played}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("playerStats.defensePoints")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {stats.defense.points_played}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("teamStats.offenseWon")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {stats.offense.points_won}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("teamStats.defenseWon")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {stats.defense.points_won}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
