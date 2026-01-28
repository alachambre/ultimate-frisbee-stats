import { Card, CardContent, Typography, Box } from "@mui/material";
import type { PlayerGameStats } from "../../types";

interface GamePlayerStatsCardProps {
  stats: PlayerGameStats;
  highlight?: "high" | "low" | null;
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function GamePlayerStatsCard({ stats, highlight }: GamePlayerStatsCardProps) {
  const getBackgroundColor = () => {
    if (highlight === "high") {
      return "success.lighter"; // Green tint for high playtime
    }
    if (highlight === "low") {
      return "warning.lighter"; // Orange tint for low playtime
    }
    return undefined; // Default background
  };

  return (
    <Card variant="outlined" sx={{ backgroundColor: getBackgroundColor() }}>
      <CardContent>
        <Box>
          <Typography variant="body1" fontWeight="medium" mb={0.5}>
            {stats.player_name}
          </Typography>
          <Box display="flex" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {stats.points_played} {stats.points_played === 1 ? "pt" : "pts"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTime(stats.effective_time_seconds)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
