import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import type { PlayerGameStats } from "../../types";

interface PlayerStatsCardProps {
  stats: PlayerGameStats;
  view: "offense" | "defense";
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format percentage
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export default function PlayerStatsCard({ stats, view }: PlayerStatsCardProps) {
  const isOffense = view === "offense";
  const relevantStats = isOffense ? stats.offense : stats.defense;
  const pointsPlayed = relevantStats.points_played;

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Player Name and Number */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`#${stats.player_number}`}
              size="small"
              sx={{ width: 45, fontWeight: "bold" }}
            />
            <Typography variant="body1" fontWeight="medium">
              {stats.player_name}
            </Typography>
          </Box>
          {isOffense ? (
            <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main, fontSize: 20 }} />
          ) : (
            <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main, fontSize: 20 }} />
          )}
        </Box>

        {/* Time and Points */}
        <Box display="flex" gap={3} mb={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Time
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatTime(stats.effective_time_seconds)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Points
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {pointsPlayed}
            </Typography>
          </Box>
        </Box>

        {/* Stats based on view */}
        {isOffense ? (
          <Box display="flex" gap={2}>
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary" display="block">
                Hold
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {pointsPlayed > 0
                  ? `${stats.offense.points_won} (${formatPercent(stats.offense.hold_rate)})`
                  : "-"}
              </Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary" display="block">
                Clean Hold
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stats.offense.points_won > 0
                  ? `${stats.offense.points_won_no_turnover} (${formatPercent(stats.offense.clean_hold_rate)})`
                  : "-"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" gap={2}>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Turnover
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {pointsPlayed > 0
                    ? `${stats.defense.points_with_turnover} (${formatPercent(stats.defense.turnover_rate)})`
                    : "-"}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Break
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {pointsPlayed > 0
                    ? `${stats.defense.points_won} (${formatPercent(stats.defense.break_rate)})`
                    : "-"}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Clean Break
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stats.defense.points_won > 0
                  ? `${stats.defense.points_won_no_turnover} (${formatPercent(stats.defense.clean_break_rate)})`
                  : "-"}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
