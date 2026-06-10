import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { TFunction } from "i18next";

import type { PointWithPlayers, Stoppage, TurnoverWithPlayer } from "../../../types";
import { getStoppageTypeLabel } from "../../../utils/stoppageTypes";
import { getTurnoverTypeLabel } from "../../../utils/turnoverTypes";

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
    <Box aria-label={title} role="region" sx={{ mt: 2.5 }}>
      <Typography fontWeight={900} sx={{ mb: 1 }} variant="subtitle2">
        {title} ({events.length})
      </Typography>
      <Box
        sx={(theme) => ({
          bgcolor: alpha(theme.colors.newUi.primary, 0.03),
          border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          borderRadius: 1,
          boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.02)}`,
          overflow: "hidden",
        })}
      >
        {events.map((event, index) => {
          const isFirst = index === 0;
          const isLast = index === events.length - 1;

          return (
            <Box
              key={event.id}
              sx={(theme) => {
                const eventColor =
                  event.tone === "error"
                    ? theme.palette.error.main
                    : event.tone === "success"
                      ? theme.palette.success.main
                      : theme.colors.newUi.primary;

                return {
                  bgcolor:
                    event.id === "point-scored"
                      ? alpha(eventColor, 0.06)
                      : "background.paper",
                  borderTop: isFirst
                    ? "none"
                    : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  display: "grid",
                  gap: { xs: 1, sm: 1.25 },
                  gridTemplateColumns: "28px minmax(0, 1fr) auto",
                  px: { xs: 1.25, sm: 1.5 },
                  py: 1.25,
                };
              }}
            >
              <Box
                sx={(theme) => ({
                  alignItems: "flex-start",
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                  pt: 0.25,
                  "&:before": {
                    bgcolor: alpha(theme.palette.text.primary, 0.12),
                    bottom: isLast ? "50%" : theme.spacing(-1.25),
                    content: '""',
                    position: "absolute",
                    top: isFirst ? "50%" : theme.spacing(-1.25),
                    width: 2,
                  },
                })}
              >
                <Box
                  aria-hidden
                  sx={(theme) => {
                    const eventColor =
                      event.tone === "error"
                        ? theme.palette.error.main
                        : event.tone === "success"
                          ? theme.palette.success.main
                          : theme.colors.newUi.primary;

                    return {
                      alignItems: "center",
                      bgcolor: eventColor,
                      border: `2px solid ${theme.palette.background.paper}`,
                      borderRadius: "50%",
                      boxShadow: `0 0 0 2px ${alpha(eventColor, 0.14)}`,
                      color: theme.palette.common.white,
                      display: "flex",
                      height: event.id === "point-start" ? 18 : 14,
                      justifyContent: "center",
                      mt: event.id === "point-start" ? 0 : 0.25,
                      position: "relative",
                      width: event.id === "point-start" ? 18 : 14,
                      zIndex: 1,
                      "& .MuiSvgIcon-root": {
                        fontSize: 14,
                      },
                    };
                  }}
                >
                  {event.id === "point-start" && <PlayArrowIcon />}
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  color={
                    event.tone === "error"
                      ? "error.main"
                      : event.tone === "success"
                        ? "success.main"
                        : "text.primary"
                  }
                  fontWeight={800}
                  variant="body2"
                >
                  {event.label}
                </Typography>
                {event.detail && (
                  <Typography
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.35, mt: 0.25 }}
                    variant="caption"
                  >
                    {event.detail}
                  </Typography>
                )}
              </Box>

              <Typography
                color="text.secondary"
                fontWeight={900}
                sx={{ pt: 0.1, whiteSpace: "nowrap" }}
                variant="body2"
              >
                {formatElapsedTime(pointStartTime, event.timestamp)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
