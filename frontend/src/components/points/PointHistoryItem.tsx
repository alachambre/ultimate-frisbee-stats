import { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import type { PointWithPlayers } from "../../types";

interface PointHistoryItemProps {
  point: PointWithPlayers;
  onEdit: (point: PointWithPlayers) => void;
  onDelete: (point: PointWithPlayers) => void;
}

export default function PointHistoryItem({
  point,
  onEdit,
  onDelete,
}: PointHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const isWon = point.won === true;
  const isActive = point.status === "active";

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight="bold">
              Point #{point.point_number}
            </Typography>
            {!isActive && (
              <Chip
                icon={isWon ? <CheckCircleIcon /> : <CancelIcon />}
                label={isWon ? "Won" : "Lost"}
                color={isWon ? "success" : "error"}
                size="small"
              />
            )}
            {isActive && (
              <Chip
                label="Active"
                color="primary"
                size="small"
              />
            )}
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => onEdit(point)}
              aria-label="edit point"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(point)}
              aria-label="delete point"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={1}>
          <Typography variant="body2" color="text.secondary">
            Duration: <strong>{formatDuration(point.duration_seconds)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Players: <strong>{point.players.length}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {point.starting_on_offense ? "Offense" : "Defense"}
          </Typography>
        </Box>

        {/* Expandable player list */}
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          elevation={0}
          sx={{ mt: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              {expanded ? "Hide" : "Show"} Players
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {point.players.map((player) => (
                <Chip
                  key={player.id}
                  label={
                    player.number !== null && player.number !== undefined
                      ? `${player.name} #${player.number}`
                      : player.name
                  }
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
