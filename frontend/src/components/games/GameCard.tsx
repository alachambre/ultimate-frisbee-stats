import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Chip,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { GameWithScore } from "../../types";

interface GameCardProps {
  game: GameWithScore;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/games/${game.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              {game.opponent_name}
            </Typography>
            <ChevronRightIcon color="action" />
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {game.date
                ? new Date(game.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date not set"}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="h4" fontWeight="bold">
              {game.our_score} - {game.opponent_score}
            </Typography>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={game.status === "in_progress" ? "In Progress" : "Finished"}
              color={game.status === "in_progress" ? "primary" : "success"}
              size="small"
            />
            <Chip label={game.team_name} variant="outlined" size="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
