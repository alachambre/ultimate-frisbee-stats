import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { PlayerGameStats } from "../../types";

interface GamePlayerStatsCardProps {
  stats: PlayerGameStats;
  highlight?: "high" | "low" | null;
  onDelete?: () => void;
}

/**
 * Format seconds to rounded-down minutes
 */
function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export default function GamePlayerStatsCard({
  stats,
  highlight,
  onDelete,
}: GamePlayerStatsCardProps) {
  const highlightColor = highlight === "high"
    ? "success.main"
    : highlight === "low"
      ? "warning.main"
      : null;

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: highlightColor ? 3 : undefined,
        borderLeftColor: highlightColor || undefined,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body1" fontWeight="medium" mb={0.5}>
              {stats.player_name} - {stats.points_played} pts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatMinutes(stats.effective_time_seconds)}
            </Typography>
          </Box>
          {onDelete && (
            <IconButton
              onClick={onDelete}
              color="error"
              size="small"
              aria-label={`Remove ${stats.player_name}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
