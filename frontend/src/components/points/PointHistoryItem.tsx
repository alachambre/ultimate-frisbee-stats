import { useState, useMemo } from "react";
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
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["points", "common"]);
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const isWon = point.won === true;
  const isCompleted = point.status === "completed";
  const isRunning = point.status === "running";
  const isScored = point.status === "scored";
  const isReady = point.status === "ready";

  // Break logic: winning on defense = break (positive), losing on offense = broken (negative)
  // Only applies to completed points
  const isBreak = isCompleted && isWon && !point.starting_on_offense;
  const isBroken = isCompleted && !isWon && point.starting_on_offense;

  // Sort players by gender (Men first) then by name
  const sortedPlayers = useMemo(() => {
    return [...point.players].sort((a, b) => {
      // Sort by gender first (M before W)
      if (a.gender !== b.gender) {
        return a.gender === "M" ? -1 : 1;
      }
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  }, [point.players]);

  // Calculate mixity
  const menCount = point.players.filter((p) => p.gender === "M").length;
  const womenCount = point.players.filter((p) => p.gender === "W").length;
  const isMixityMen = menCount === 4 && womenCount === 3;
  const isMixityWomen = menCount === 3 && womenCount === 4;

  return (
    <Card variant="outlined">
      <CardContent>
        {/* Title row with icon and action buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {point.starting_on_offense ? (
              <FlashOnIcon color="primary" />
            ) : (
              <ShieldIcon color="secondary" />
            )}
            <Typography variant="h6" fontWeight="bold">
              {t("points:history.point")} #{point.point_number}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
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

        {/* Status badges row */}
        <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
          {isCompleted && (
            <Chip
              icon={isWon ? <CheckCircleIcon /> : <CancelIcon />}
              label={isWon ? t("points:dialog.finish.won", "Won") : t("points:dialog.finish.lost", "Lost")}
              color={isWon ? "success" : "error"}
              size="small"
            />
          )}
          {isBreak && (
            <Chip
              label={t("points:history.break")}
              color="primary"
              size="small"
              sx={{ fontWeight: "bold" }}
            />
          )}
          {isBroken && (
            <Chip
              label={t("points:history.broken")}
              color="warning"
              size="small"
              sx={{ fontWeight: "bold" }}
            />
          )}
          {isRunning && (
            <Chip
              label={t("points:status.running")}
              color="primary"
              size="small"
            />
          )}
          {isScored && (
            <Chip
              label={t("points:status.scored")}
              color="success"
              size="small"
            />
          )}
          {isReady && (
            <Chip
              label={t("points:status.ready")}
              color="default"
              size="small"
            />
          )}
        </Box>

        <Box display="flex" gap={2} mb={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            {point.starting_on_offense ? t("points:tracker.offense") : t("points:tracker.defense")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("points:tracker.duration", "Duration")}: <strong>{formatDuration(point.duration_seconds)}</strong>
          </Typography>
        </Box>

        {/* Strategy */}
        {point.strategy && (
          <Box mb={1}>
            <Typography variant="body2" color="text.secondary" component="span">
              {t("points:tracker.strategy")}:{" "}
            </Typography>
            <Chip
              label={point.strategy.name}
              size="small"
              variant="outlined"
              sx={{ ml: 0.5 }}
            />
          </Box>
        )}

        {/* Additional fields */}
        {(point.pull !== null || point.comments) && (
          <Box mb={1}>
            {point.pull !== null && !point.starting_on_offense && (
              <Typography variant="body2" color="text.secondary">
                Pull: <strong>{point.pull ? t("points:dialog.start.inbounds") : t("points:dialog.start.outOfBounds")}</strong>
              </Typography>
            )}
            {point.comments && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {point.comments}
              </Typography>
            )}
          </Box>
        )}

        {/* Expandable player list */}
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          elevation={0}
          sx={{ mt: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">
                {expanded ? t("common:action.hide") : t("common:action.show")} {t("common:players")}
              </Typography>
              {(isMixityMen || isMixityWomen) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  ({t("points:dialog.start.mixity")}:
                  {isMixityMen ? (
                    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                      <MaleIcon sx={{ fontSize: 16, mr: 0.25 }} />
                      {t("points:dialog.start.men")}
                    </Box>
                  ) : (
                    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                      <FemaleIcon sx={{ fontSize: 16, mr: 0.25 }} />
                      {t("points:dialog.start.women")}
                    </Box>
                  )}
                  )
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {sortedPlayers.map((player) => (
                <Chip
                  key={player.id}
                  icon={player.gender === "M" ? <MaleIcon /> : <FemaleIcon />}
                  label={player.name}
                  size="small"
                  sx={{
                    backgroundColor: player.gender === "M" ? "primary.main" : "secondary.main",
                    color: "white",
                    "& .MuiChip-icon": {
                      color: "white",
                    },
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
