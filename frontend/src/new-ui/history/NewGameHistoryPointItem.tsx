import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CommentIcon from "@mui/icons-material/Comment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FemaleIcon from "@mui/icons-material/Female";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import MaleIcon from "@mui/icons-material/Male";
import ShieldIcon from "@mui/icons-material/Shield";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { getStoppagesByPoint } from "../../services/stoppages";
import { getTurnoversByPoint } from "../../services/turnovers";
import type {
  PointWithPlayers,
  Stoppage,
  TurnoverWithPlayer,
} from "../../types";
import { queryKeys } from "../../utils/queryKeys";
import NewGameHistoryChronology from "./NewGameHistoryChronology";

interface NewGameHistoryPointItemProps {
  defaultExpanded?: boolean;
  point: PointWithPlayers;
  scoreAfter?: {
    opponent: number;
    our: number;
  };
  turnovers?: TurnoverWithPlayer[];
}

function formatDuration(totalSeconds?: number | null): string | null {
  if (totalSeconds == null) {
    return null;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getGenderLabel(
  point: PointWithPlayers,
  t: TFunction,
): { icon: ReactElement; label: string } | null {
  const menCount = point.players.filter((player) => player.gender === "M").length;
  const womenCount = point.players.filter(
    (player) => player.gender === "W",
  ).length;

  if (menCount === 0 && womenCount === 0) {
    return null;
  }

  if (menCount >= womenCount) {
    return {
      icon: <MaleIcon />,
      label: t("dialog.start.men", "Men"),
    };
  }

  return {
    icon: <FemaleIcon />,
    label: t("dialog.start.women", "Women"),
  };
}

type OutcomeChip = {
  color: "error" | "success";
  key: string;
  label: string;
  variant: ChipProps["variant"];
};

function getOutcomeChips(point: PointWithPlayers, t: TFunction): OutcomeChip[] {
  if (point.status !== "completed" || point.won === null) {
    return [];
  }

  if (point.starting_on_offense) {
    if (point.won) {
      return [
        {
          color: "success",
          key: "hold",
          label:
            (point.our_turnovers ?? 0) === 0
              ? t("history.cleanHold", "Clean hold")
              : t("history.hold", "Hold"),
          variant: "outlined",
        },
      ];
    }

    return [
      {
        color: "error",
        key: "broken",
        label: t("history.broken", "Broken"),
        variant: "filled",
      },
    ];
  }

  if (point.won) {
    return [
      {
        color: "success",
        key: "break",
        label: t("history.breakOutcome", "Break"),
        variant: "filled",
      },
    ];
  }

  return [
    {
      color: "error",
      key: "lost",
      label: t("history.lost", "Lost"),
      variant: "outlined",
    },
  ];
}

function getTurnLabel(turns: number, t: TFunction): string {
  if (turns === 0) {
    return t("history.zeroTurn", "0 turn");
  }

  return t("history.turnCount", { count: turns, defaultValue: "{{count}} turns" });
}

function getTurnChipColor(turns: number) {
  if (turns > 4) {
    return "veryLow";
  }

  if (turns > 2) {
    return "low";
  }

  return null;
}

export default function NewGameHistoryPointItem({
  defaultExpanded = false,
  point,
  scoreAfter,
  turnovers: providedTurnovers,
}: NewGameHistoryPointItemProps) {
  const { t } = useTranslation("points");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const durationLabel = formatDuration(point.duration_seconds);
  const sideAccessibilityLabel = point.starting_on_offense
    ? t("history.startedOnOffense", "Started on offense")
    : t("history.startedOnDefense", "Started on defense");
  const genderLabel = getGenderLabel(point, t);
  const outcomeChips = getOutcomeChips(point, t);
  const sortedPlayers = useMemo(
    () =>
      [...point.players].sort((left, right) => {
        if (left.gender !== right.gender) {
          return left.gender === "M" ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      }),
    [point.players],
  );

  const shouldFetchChronology = expanded && Boolean(point.start_datetime);
  const { data: stoppages = [] } = useQuery<Stoppage[]>({
    queryKey: queryKeys.stoppages(point.id),
    queryFn: () => getStoppagesByPoint(point.id),
    enabled: shouldFetchChronology,
  });
  const { data: fetchedTurnovers = [] } = useQuery<TurnoverWithPlayer[]>({
    queryKey: queryKeys.turnovers(point.id),
    queryFn: () => getTurnoversByPoint(point.id),
    enabled: shouldFetchChronology && providedTurnovers === undefined,
  });
  const turnovers = providedTurnovers ?? fetchedTurnovers;
  const ourTurnovers = point.our_turnovers ?? 0;
  const turnLabel = getTurnLabel(ourTurnovers, t);
  const turnChipColor = getTurnChipColor(ourTurnovers);

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        "&:before": { display: "none" },
      })}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          alignItems: "stretch",
          bgcolor: "background.paper",
          px: { xs: 2, sm: 2.5 },
          py: 1.25,
          "& .MuiAccordionSummary-content": {
            display: "block",
            minWidth: 0,
          },
          "& .MuiAccordionSummary-expandIconWrapper": {
            alignSelf: "flex-end",
            mb: 1,
          },
        }}
      >
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack alignItems="center" direction="row" spacing={1}>
              {point.starting_on_offense ? (
                <FlashOnIcon
                  fontSize="small"
                  sx={(theme) => ({ color: theme.colors.newUi.primary })}
                  titleAccess={sideAccessibilityLabel}
                />
              ) : (
                <ShieldIcon
                  fontSize="small"
                  sx={(theme) => ({ color: theme.colors.newUi.primary })}
                  titleAccess={sideAccessibilityLabel}
                />
              )}
              <Typography component="h2" fontWeight={900} variant="h6">
                {t("history.point", "Point")} {point.point_number}
              </Typography>
              {durationLabel && (
                <Typography
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                  variant="body2"
                >
                  {durationLabel}
                </Typography>
              )}
            </Stack>
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.75}
              sx={{ mt: 1 }}
            >
              {point.status === "running" && (
                <Chip
                  label={t("status.running", "Running")}
                  size="small"
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.success.main, 0.14),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
                    color: theme.palette.success.dark,
                    fontWeight: 800,
                  })}
                />
              )}
              <Chip
                label={turnLabel}
                size="small"
                sx={(theme) => {
                  if (!turnChipColor) {
                    return { fontWeight: 700 };
                  }

                  return {
                    bgcolor: alpha(theme.colors.performance[turnChipColor], 0.14),
                    borderColor: alpha(
                      theme.colors.performance[turnChipColor],
                      0.45,
                    ),
                    color: theme.colors.performance[turnChipColor],
                    fontWeight: 800,
                  };
                }}
                variant="outlined"
              />
              {outcomeChips.map((chip) => (
                <Chip
                  color={chip.color}
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  sx={{ fontWeight: 800 }}
                  variant={chip.variant}
                />
              ))}
            </Stack>
          </Box>
          {scoreAfter && (
            <Box sx={{ flexShrink: 0, textAlign: "right" }}>
              <Typography fontWeight={900} variant="h6">
                {scoreAfter.our} - {scoreAfter.opponent}
              </Typography>
            </Box>
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails
        sx={(theme) => ({
          bgcolor: "background.paper",
          borderTop: `1px solid ${theme.palette.divider}`,
          p: { xs: 2, sm: 2.5 },
        })}
      >
        {point.comments && (
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              mb: 2,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 0.5 }}>
              <CommentIcon
                fontSize="small"
                sx={(theme) => ({
                  color: theme.colors.newUi.primary,
                })}
              />
              <Typography fontWeight={700} variant="body2">
                {t("history.comment", "Comment")}
              </Typography>
            </Box>
            <Typography
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap" }}
              variant="body2"
            >
              {point.comments}
            </Typography>
          </Box>
        )}

        {sortedPlayers.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Stack
              alignItems="center"
              direction="row"
              flexWrap="wrap"
              gap={0.75}
              sx={{ mb: 1 }}
            >
              <Typography fontWeight={800} variant="subtitle2">
                {t("tracker.playersOnField", "Players on field")}
              </Typography>
              {genderLabel && (
                <Stack
                  alignItems="center"
                  component="span"
                  direction="row"
                  spacing={0.25}
                  sx={{
                    color: "text.secondary",
                    fontStyle: "italic",
                    "& .MuiSvgIcon-root": {
                      fontSize: 16,
                    },
                  }}
                >
                  <Typography color="text.secondary" component="span" variant="body2">
                    (
                  </Typography>
                  {genderLabel.icon}
                  <Typography
                    color="text.secondary"
                    component="span"
                    fontStyle="italic"
                    variant="body2"
                  >
                    {genderLabel.label}
                  </Typography>
                  <Typography color="text.secondary" component="span" variant="body2">
                    )
                  </Typography>
                </Stack>
              )}
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {sortedPlayers.map((player) => (
                <Chip
                  icon={player.gender === "M" ? <MaleIcon /> : <FemaleIcon />}
                  key={player.id}
                  label={player.name}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}

        <NewGameHistoryChronology
          point={point}
          stoppages={stoppages}
          t={t}
          title={t("pointEvents", "Chronology")}
          turnovers={turnovers}
        />

        {point.status === "completed" && point.won && (
          <Box
            sx={{
              alignItems: "center",
              color: "success.main",
              display: "flex",
              gap: 1,
              mt: 2,
            }}
          >
            <CheckCircleIcon fontSize="small" />
            <Typography fontWeight={700} variant="body2">
              {t("history.weScored", "We scored!")}
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
