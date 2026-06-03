import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { TFunction } from "i18next";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getStoppagesByPoint } from "../../../services/stoppages";
import { getTurnoversByPoint } from "../../../services/turnovers";
import type {
  PointWithPlayers,
  Stoppage,
  TurnoverWithPlayer,
} from "../../../types";
import { getStoppageTypeLabel } from "../../../utils/stoppageTypes";
import { getTurnoverTypeLabel } from "../../../utils/turnoverTypes";
import { queryKeys } from "../../../utils/queryKeys";

interface LivePointActivitySummaryProps {
  activePointId?: number;
  currentPoint: PointWithPlayers;
  stoppages: Stoppage[];
  turnovers: TurnoverWithPlayer[];
}

type LivePointChronologyEvent = {
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

function getCurrentPointTurnCounts(
  turnovers: TurnoverWithPlayer[],
  startingOnOffense: boolean,
) {
  return turnovers.reduce(
    (counts, _turnover, index) => {
      const hadPossession =
        index % 2 === 0 ? startingOnOffense : !startingOnOffense;

      if (hadPossession) {
        counts.our += 1;
      } else {
        counts.opponent += 1;
      }

      return counts;
    },
    { our: 0, opponent: 0 },
  );
}

function getCurrentPointEvents({
  currentPoint,
  stoppages,
  turnovers,
  t,
}: {
  currentPoint: PointWithPlayers;
  stoppages: Stoppage[];
  turnovers: TurnoverWithPlayer[];
  t: TFunction;
}) {
  const events: LivePointChronologyEvent[] = [
    {
      id: "point-start",
      label: `${t("pointStart", "Point start")} ${
        currentPoint.starting_on_offense
          ? t("tracker.inOffense", "in offense")
          : t("tracker.inDefense", "in defense")
      }`,
      timestamp: currentPoint.start_datetime!,
    },
    ...turnovers.map((turnover, index): LivePointChronologyEvent => {
      const hadPossession =
        index % 2 === 0
          ? currentPoint.starting_on_offense
          : !currentPoint.starting_on_offense;
      const detailParts = [
        getTurnoverTypeLabel(t, turnover.turnover_type),
        turnover.player
          ? `${t("turnoverBy", "By")} ${turnover.player.name}`
          : null,
        turnover.comments,
      ].filter(Boolean);

      return {
        detail: detailParts.join(" - "),
        id: `turnover-${turnover.id}`,
        label: hadPossession
          ? t("events.ourTurnover", "Our turnover")
          : t("events.opponentTurnover", "Opponent turnover"),
        timestamp: turnover.timestamp,
        tone: hadPossession ? "error" : "success",
      };
    }),
    ...stoppages.map((stoppage): LivePointChronologyEvent => {
      const detailParts = [
        stoppage.resume_timestamp
          ? `${t("callDuration", "Duration")}: ${formatElapsedTime(
              stoppage.call_timestamp,
              stoppage.resume_timestamp,
            )}`
          : null,
        stoppage.comments,
      ].filter(Boolean);

      return {
        detail: detailParts.join(" - "),
        id: `stoppage-${stoppage.id}`,
        label: getStoppageTypeLabel(t, stoppage.stoppage_type),
        timestamp: stoppage.call_timestamp,
      };
    }),
    ...((currentPoint.status === "scored" ||
      currentPoint.status === "completed") &&
    currentPoint.end_datetime &&
    currentPoint.won !== null &&
    currentPoint.won !== undefined
      ? [
          {
            id: "point-scored",
            label: currentPoint.won
              ? t("history.weScored", "We scored!")
              : t("history.theyScored", "They scored"),
            timestamp: currentPoint.end_datetime,
            tone: currentPoint.won ? "success" : "error",
          } satisfies LivePointChronologyEvent,
        ]
      : []),
  ];

  return events.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function FieldPointMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Box
      aria-label={`${label}: ${value}`}
      role="group"
      sx={(theme) => ({
        bgcolor: theme.palette.background.default,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        minWidth: 0,
        p: 1.5,
      })}
    >
      <Typography
        color="text.secondary"
        component="p"
        fontWeight={700}
        variant="caption"
      >
        {label}
      </Typography>
      <Typography component="p" fontWeight={900} variant="h5">
        {value}
      </Typography>
    </Box>
  );
}

export function LivePointActivitySummary({
  activePointId,
  currentPoint,
  stoppages,
  turnovers,
}: LivePointActivitySummaryProps) {
  const { t } = useTranslation("points");
  const shouldUseProvidedEvents = currentPoint.id === activePointId;
  const shouldFetchPointEvents =
    Boolean(currentPoint.start_datetime) && !shouldUseProvidedEvents;

  const { data: fetchedStoppages = [] } = useQuery<Stoppage[]>({
    queryKey: queryKeys.stoppages(currentPoint.id),
    queryFn: () => getStoppagesByPoint(currentPoint.id),
    enabled: shouldFetchPointEvents,
  });

  const { data: fetchedTurnovers = [] } = useQuery<TurnoverWithPlayer[]>({
    queryKey: queryKeys.turnovers(currentPoint.id),
    queryFn: () => getTurnoversByPoint(currentPoint.id),
    enabled: shouldFetchPointEvents,
  });

  if (!currentPoint.start_datetime) {
    return null;
  }

  const pointStartTime = currentPoint.start_datetime;
  const currentPointStoppages = shouldUseProvidedEvents
    ? stoppages
    : fetchedStoppages;
  const currentPointTurnovers = shouldUseProvidedEvents
    ? turnovers
    : fetchedTurnovers;
  const turnCounts = getCurrentPointTurnCounts(
    currentPointTurnovers,
    currentPoint.starting_on_offense,
  );
  const currentPointEvents = getCurrentPointEvents({
    currentPoint,
    stoppages: currentPointStoppages,
    turnovers: currentPointTurnovers,
    t,
  });
  const chronologyLabel = t("pointEvents", "Chronology");

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          mb: 2,
        }}
      >
        <FieldPointMetric
          label={t("history.ourTurns", "Our turns")}
          value={turnCounts.our}
        />
        <FieldPointMetric
          label={t("history.opponentTurns", "Their turns")}
          value={turnCounts.opponent}
        />
        <FieldPointMetric
          label={t("tracker.stoppages", "Stoppages")}
          value={currentPointStoppages.length}
        />
      </Box>
      <Box
        aria-label={chronologyLabel}
        role="region"
        sx={{
          maxHeight: { xs: 220, sm: 300 },
          mb: 2,
          overflowY: "auto",
          scrollPaddingBottom: { xs: 9, sm: 0 },
        }}
      >
        <Typography fontWeight={700} sx={{ mb: 1 }} variant="subtitle2">
          {chronologyLabel} ({currentPointEvents.length})
        </Typography>
        <TableContainer
          sx={{
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Table aria-label={chronologyLabel} size="small">
            <TableBody>
              {currentPointEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell
                    sx={{
                      borderColor: "divider",
                      py: 1,
                      width: "100%",
                    }}
                  >
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
    </Box>
  );
}
