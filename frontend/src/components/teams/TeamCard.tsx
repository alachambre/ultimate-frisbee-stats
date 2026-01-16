import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardActionArea,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { Team } from "../../types";

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  const playerCount = team.players?.length || 0;

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
        to={`/teams/${team.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              {team.name}
            </Typography>
            <ChevronRightIcon color="action" />
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Chip
              icon={<GroupIcon />}
              label={`${playerCount} ${playerCount === 1 ? "Player" : "Players"}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(team.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
