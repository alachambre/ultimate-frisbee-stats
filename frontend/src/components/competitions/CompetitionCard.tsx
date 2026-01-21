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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { Competition } from "../../types";

interface CompetitionCardProps {
  competition: Competition;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

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
        to={`/competitions/${competition.id}`}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={1}
          >
            <Typography variant="h5" component="h2" fontWeight="bold">
              {competition.name}
            </Typography>
            <ChevronRightIcon color="action" />
          </Box>

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
              }}
            >
              {competition.description}
            </Typography>
          )}

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {formatDateRange(competition.start_date, competition.end_date)}
            </Typography>
          </Box>

          <Chip
            label={competition.status}
            size="small"
            color={competition.status === "ongoing" ? "success" : "default"}
            sx={{ textTransform: "capitalize" }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
