import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Chip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { CompetitionWithTeam } from "../../types";

interface CompetitionCardProps {
  competition: CompetitionWithTeam;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

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
        to={`/competitions/${competition.id}`}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1, textAlign: "center", py: 4 }}>
          <EmojiEventsIcon sx={{ fontSize: 60, color: (theme) => theme.gradients.middle, mb: 2 }} />

          <Typography variant="h5" component="h2" fontWeight="bold" mb={1}>
            {competition.name}
          </Typography>

          {competition.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              mb={2}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                minHeight: "2.5em",
              }}
            >
              {competition.description}
            </Typography>
          )}

          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            <EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {formatDateRange(competition.start_date, competition.end_date)}
            </Typography>
          </Box>

          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
            <Chip
              label={competition.status}
              size="small"
              color={competition.status === "ongoing" ? "primary" : "default"}
              sx={{ textTransform: "capitalize" }}
            />
            <Chip
              label={competition.team_name}
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
