import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import type { Team } from "../../types";

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "2px solid transparent",
        background: (theme) =>
          `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) =>
            `0 8px 24px ${theme.palette.primary.main}4D`,
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/teams/${team.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1, textAlign: "center", py: 6 }}>
          <GroupIcon sx={{ fontSize: 72, color: "primary.main", mb: 3 }} />

          <Typography variant="h4" component="h2" fontWeight="bold" mb={2}>
            {team.name}
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              Created {new Date(team.created_at).toLocaleDateString("en-US", {
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
