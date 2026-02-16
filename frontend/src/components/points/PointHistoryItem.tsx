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
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import CommentIcon from "@mui/icons-material/Comment";
import { useTranslation } from "react-i18next";
import type { PointWithPlayers } from "../../types";
import { PointEventsHistory } from "./PointEventsHistory";

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
  const [playersExpanded, setPlayersExpanded] = useState(false);
  const [chronologyExpanded, setChronologyExpanded] = useState(false);

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {point.starting_on_offense ? (
              <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
            ) : (
              <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
            )}
            <Typography variant="h6" fontWeight="bold">
              {t("points:history.point")} #{point.point_number}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <IconButton
              size="small"
              onClick={() => onEdit(point)}
              aria-label={t("common:ariaLabel.editPoint")}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(point)}
              aria-label={t("common:ariaLabel.deletePoint")}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Status badges row */}
        <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
          {isCompleted && (
            <Chip
              icon={isWon ? <CheckCircleIcon /> : <CancelIcon />}
              label={isWon ? t("points:dialog.finish.won") : t("points:dialog.finish.lost")}
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
              size="small"
              sx={(theme) => point.starting_on_offense ? {
                bgcolor: theme.colors.offense.main,
                color: theme.palette.common.white,
                '& .MuiChip-label': {
                  color: theme.palette.common.white
                }
              } : {
                bgcolor: theme.colors.defense.main,
                color: theme.palette.common.white,
                '& .MuiChip-label': {
                  color: theme.palette.common.white
                }
              }}
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

        {/* Strategy and comments with styled boxes */}
        {(point.strategy || point.comments) && (
          <Box mb={2}>
            {point.strategy && (
              <Box
                sx={{
                  p: 2,
                  mb: point.comments ? 2 : 0,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: (theme) => point.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiObjectsIcon
                    fontSize="small"
                    sx={{
                      color: (theme) => point.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      color: (theme) => point.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  >
                    {point.starting_on_offense
                      ? t("points:tracker.offense", "Offense")
                      : t("points:tracker.defense", "Defense")
                    } / {point.strategy.name}
                  </Typography>
                </Box>
              </Box>
            )}
            {point.comments && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: (theme) => point.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CommentIcon
                    fontSize="small"
                    sx={{
                      color: (theme) => point.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      color: (theme) => point.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  >
                    {t("points:tracker.comment")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {point.comments}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Expandable player list */}
        <Accordion
          expanded={playersExpanded}
          onChange={() => setPlayersExpanded(!playersExpanded)}
          elevation={0}
          sx={{ mt: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">
                {playersExpanded ? t("common:action.hide") : t("common:action.show")} {t("common:players")}
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
                  sx={(theme) => ({
                    backgroundColor: player.gender === "M" ? theme.palette.primary.main : theme.palette.secondary.main,
                    color: theme.palette.common.white,
                    "& .MuiChip-icon": {
                      color: theme.palette.common.white,
                    },
                  })}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Expandable chronology */}
        <Accordion
          expanded={chronologyExpanded}
          onChange={() => setChronologyExpanded(!chronologyExpanded)}
          elevation={0}
          sx={{ mt: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              {chronologyExpanded ? t("common:action.hide") : t("common:action.show")} {t("points:pointEvents")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <PointEventsHistory
              pointId={point.id}
              startingOnOffense={point.starting_on_offense}
              pointStartTime={point.start_datetime}
              strategy={point.strategy}
              pull={point.pull}
              pointStatus={point.status}
              endDateTime={point.end_datetime}
              won={point.won}
              fieldSide={point.field_side}
            />
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
