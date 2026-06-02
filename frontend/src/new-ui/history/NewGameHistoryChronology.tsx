import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import type { TFunction } from "i18next";

import type { PointWithPlayers, Stoppage, TurnoverWithPlayer } from "../../types";
import { getStoppageTypeLabel } from "../../utils/stoppageTypes";
import { getTurnoverTypeLabel } from "../../utils/turnoverTypes";

type ChronologyEvent = {
  detail?: string;
  id: string;
  label: string;
  timestamp: string;
  tone?: "error" | "success";
};

function formatElapsedTime(startTime: string, timestamp: string): string {
  const start = new Date(startTime);
  const event = new Date(timestamp);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((event.getTime() - start.getTime()) / 1000),
  );
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function buildChronologyEvents({
  point,
  stoppages,
  t,
  turnovers,
}: {
  point: PointWithPlayers;
  stoppages: Stoppage[];
  t: TFunction;
  turnovers: TurnoverWithPlayer[];
}) {
  if (!point.start_datetime) {
    return [];
  }

  const sortedTurnovers = [...turnovers].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
  const pointStartLabel = [
    t("pointStart", "Point start"),
    point.starting_on_offense
      ? t("tracker.inOffense", "in offense")
      : t("tracker.inDefense", "in defense"),
    point.strategy?.name,
  ]
    .filter(Boolean)
    .join(" - ");

  const events: ChronologyEvent[] = [
    {
      id: "point-start",
      label: pointStartLabel,
      timestamp: point.start_datetime,
    },
    ...sortedTurnovers.map((turnover, index): ChronologyEvent => {
      const hadPossession =
        index % 2 === 0
          ? point.starting_on_offense
          : !point.starting_on_offense;
      const details = [
        getTurnoverTypeLabel(t, turnover.turnover_type),
        turnover.player
          ? `${t("turnoverBy", "By")} ${turnover.player.name}`
          : null,
        turnover.comments,
      ].filter(Boolean);

      return {
        detail: details.join(" - "),
        id: `turnover-${turnover.id}`,
        label: hadPossession
          ? t("history.turnover", "Turnover")
          : t("events.opponentTurnover", "Opponent turnover"),
        timestamp: turnover.timestamp,
        tone: hadPossession ? "error" : "success",
      };
    }),
    ...stoppages.map((stoppage): ChronologyEvent => {
      const duration = stoppage.resume_timestamp
        ? `${t("callDuration", "Duration")}: ${formatElapsedTime(
            stoppage.call_timestamp,
            stoppage.resume_timestamp,
          )}`
        : null;
      const details = [duration, stoppage.comments].filter(Boolean);

      return {
        detail: details.join(" - "),
        id: `stoppage-${stoppage.id}`,
        label: getStoppageTypeLabel(t, stoppage.stoppage_type),
        timestamp: stoppage.call_timestamp,
      };
    }),
    ...((point.status === "scored" || point.status === "completed") &&
    point.end_datetime &&
    point.won !== null &&
    point.won !== undefined
      ? [
          {
            id: "point-scored",
            label: point.won
              ? t("history.weScored", "We scored!")
              : t("history.theyScored", "They scored"),
            timestamp: point.end_datetime,
            tone: point.won ? "success" : "error",
          } satisfies ChronologyEvent,
        ]
      : []),
  ];

  return events.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}

interface NewGameHistoryChronologyProps {
  point: PointWithPlayers;
  stoppages: Stoppage[];
  turnovers: TurnoverWithPlayer[];
  title: string;
  t: TFunction;
}

export default function NewGameHistoryChronology({
  point,
  stoppages,
  title,
  t,
  turnovers,
}: NewGameHistoryChronologyProps) {
  const events = buildChronologyEvents({ point, stoppages, t, turnovers });

  if (!point.start_datetime || events.length === 0) {
    return null;
  }

  const pointStartTime = point.start_datetime;

  return (
    <Box aria-label={title} role="region" sx={{ mt: 2 }}>
      <Typography fontWeight={800} sx={{ mb: 1 }} variant="subtitle2">
        {title} ({events.length})
      </Typography>
      <TableContainer
        sx={(theme) => ({
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        })}
      >
        <Table aria-label={title} size="small">
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell sx={{ borderColor: "divider", py: 1, width: 36 }}>
                  {event.id === "point-start" && (
                    <PlayArrowIcon
                      fontSize="small"
                      sx={(theme) => ({ color: theme.colors.newUi.primary })}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ borderColor: "divider", py: 1 }}>
                  <Typography
                    color={
                      event.tone === "error"
                        ? "error.main"
                        : event.tone === "success"
                          ? "success.main"
                          : "text.primary"
                    }
                    fontWeight={700}
                    variant="body2"
                  >
                    {event.label}
                  </Typography>
                  {event.detail && (
                    <Typography color="text.secondary" variant="caption">
                      {event.detail}
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    borderColor: "divider",
                    color: "text.secondary",
                    fontWeight: 800,
                    py: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatElapsedTime(pointStartTime, event.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
