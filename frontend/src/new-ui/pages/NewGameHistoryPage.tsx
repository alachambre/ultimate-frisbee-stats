import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ShieldIcon from "@mui/icons-material/Shield";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { TFunction } from "i18next";
import { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import { shouldEnforcePermissions, useAuth } from "../../auth";
import { useGameDetailPageData } from "../../pages/hooks/useGameDetailPageData";
import { deleteGame } from "../../services/games";
import type {
  GameDetail,
  GameKeyMoment,
  GamePointTimeline,
  Halftime,
  PointWithPlayers,
  TurnoverWithPlayer,
} from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";
import { buildGamePointTimelineFromPoints } from "../../utils/gameTimeline";
import { queryKeys } from "../../utils/queryKeys";
import DeleteGameDialog from "../games/DeleteGameDialog";
import NewGameHistoryPointItem from "../history/NewGameHistoryPointItem";

const LazyNewGameScoreProgression = lazy(
  () => import("../games/NewGameScoreProgression"),
);

type HistoryItem =
  | {
      id: string;
      point: PointWithPlayers;
      timestamp: string;
      type: "point";
    }
  | {
      halftime: Halftime;
      id: string;
      timestamp: string;
      type: "halftime";
    };

function isPointHistoryItem(
  item: HistoryItem,
): item is Extract<HistoryItem, { type: "point" }> {
  return item.type === "point";
}

function isHalftimeHistoryItem(
  item: HistoryItem,
): item is Extract<HistoryItem, { type: "halftime" }> {
  return item.type === "halftime";
}

function getTimestamp(point: PointWithPlayers): string {
  return point.start_datetime || point.end_datetime || point.created_at;
}

function buildScoreByPointId(points: PointWithPlayers[]) {
  let our = 0;
  let opponent = 0;
  const scoreByPointId = new Map<number, { opponent: number; our: number }>();
  const orderedPoints = [...points].sort(
    (left, right) => left.point_number - right.point_number,
  );

  orderedPoints.forEach((point) => {
    if (point.status === "completed" && point.won !== null) {
      if (point.won) {
        our += 1;
      } else {
        opponent += 1;
      }
    }

    scoreByPointId.set(point.id, { opponent, our });
  });

  return scoreByPointId;
}

function buildTurnoversByPointId(turnovers?: TurnoverWithPlayer[]) {
  if (!turnovers) {
    return new Map<number, TurnoverWithPlayer[]>();
  }

  return turnovers.reduce((byPointId, turnover) => {
    const current = byPointId.get(turnover.point_id) ?? [];
    byPointId.set(turnover.point_id, [...current, turnover]);
    return byPointId;
  }, new Map<number, TurnoverWithPlayer[]>());
}

function buildPointMap(points: PointWithPlayers[]) {
  return points.reduce((pointsById, point) => {
    pointsById.set(point.id, point);
    return pointsById;
  }, new Map<number, PointWithPlayers>());
}

function getPointTurnCount(point: PointWithPlayers): number {
  return point.our_turnovers ?? 0;
}

type PointTone = "break" | "broken" | "default" | "effort" | "special";

function buildTimelineMarkersByPointId(timeline: GamePointTimeline | null) {
  return (timeline?.points ?? []).reduce((markersByPointId, point) => {
    markersByPointId.set(point.point_id, point.markers ?? []);
    return markersByPointId;
  }, new Map<number, string[]>());
}

function hasTimelineMarker(markers: string[], marker: string) {
  return markers.includes(marker);
}

function getPointTone(point: PointWithPlayers, markers: string[]): PointTone {
  if (
    hasTimelineMarker(markers, "galaxy_point") ||
    hasTimelineMarker(markers, "universe_point")
  ) {
    return "special";
  }

  if (point.status === "completed" && point.won !== null) {
    if (point.starting_on_offense && !point.won) {
      return "broken";
    }

    if (!point.starting_on_offense && point.won) {
      return "break";
    }
  }

  if (
    hasTimelineMarker(markers, "long_point") ||
    hasTimelineMarker(markers, "high_turn_point")
  ) {
    return "effort";
  }

  return "default";
}

function getToneAccentColor(tone: PointTone, theme: Theme) {
  switch (tone) {
    case "break":
      return theme.colors.performance.veryHigh;
    case "broken":
      return theme.colors.performance.veryLow;
    case "effort":
      return theme.colors.gameHistory.effort;
    case "special":
      return theme.colors.performance.medium;
    default:
      return theme.colors.newUi.primary;
  }
}

function getPointAccentColor(
  point: PointWithPlayers,
  markers: string[],
  theme: Theme,
) {
  return getToneAccentColor(getPointTone(point, markers), theme);
}

function getPointOutcomeAccentColor(point: PointWithPlayers, theme: Theme) {
  if (point.status === "completed" && point.won !== null) {
    if (!point.starting_on_offense && point.won) {
      return theme.colors.performance.veryHigh;
    }

    if (point.starting_on_offense && !point.won) {
      return theme.colors.performance.veryLow;
    }
  }

  return theme.colors.newUi.primary;
}

function getSideAccessibilityLabel(point: PointWithPlayers, t: TFunction) {
  return point.starting_on_offense
    ? t("points:history.startedOnOffense", "Started on offense")
    : t("points:history.startedOnDefense", "Started on defense");
}

function PointSideIconBadge({
  point,
  size = 24,
  t,
}: {
  point: PointWithPlayers;
  size?: number;
  t: TFunction;
}) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: point.starting_on_offense
          ? theme.colors.newUi.primarySoft
          : alpha(theme.palette.success.main, 0.1),
        borderRadius: "50%",
        color: point.starting_on_offense
          ? theme.colors.newUi.primary
          : theme.palette.success.dark,
        display: "inline-flex",
        flexShrink: 0,
        height: size,
        justifyContent: "center",
        width: size,
        "& .MuiSvgIcon-root": {
          fontSize: Math.max(14, size - 8),
        },
      })}
    >
      {point.starting_on_offense ? (
        <FlashOnIcon titleAccess={getSideAccessibilityLabel(point, t)} />
      ) : (
        <ShieldIcon titleAccess={getSideAccessibilityLabel(point, t)} />
      )}
    </Box>
  );
}

function getRunningPoint(points: PointWithPlayers[]) {
  return [...points]
    .sort((left, right) => right.point_number - left.point_number)
    .find((point) => point.status === "running" || point.status === "scored");
}

function buildHistorySummary(points: PointWithPlayers[]) {
  const completedPoints = points.filter(
    (point) => point.status === "completed" && point.won !== null,
  );

  return {
    breakCount: completedPoints.filter(
      (point) => !point.starting_on_offense && point.won,
    ).length,
    brokenCount: completedPoints.filter(
      (point) => point.starting_on_offense && !point.won,
    ).length,
    pointCount: points.length,
    runningPoint: getRunningPoint(points),
  };
}

function formatPointDuration(totalSeconds?: number | null): string | null {
  if (totalSeconds == null) {
    return null;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getPointOutcomeLabel(point: PointWithPlayers, t: TFunction) {
  if (point.status === "running") {
    return t("points:status.running", "Running");
  }

  if (point.status !== "completed" || point.won === null) {
    return t(`points:status.${point.status}`, point.status);
  }

  if (point.starting_on_offense) {
    if (point.won) {
      return (point.our_turnovers ?? 0) === 0
        ? t("points:history.cleanHold", "Clean hold")
        : t("points:history.hold", "Hold");
    }

    return t("points:history.broken", "Broken");
  }

  return point.won
    ? t("points:history.breakOutcome", "Break")
    : t("points:history.lost", "Lost");
}

function getMomentAccentColor(momentType: string, theme: Theme) {
  switch (momentType) {
    case "galaxy_point":
    case "universe_point":
      return theme.colors.performance.medium;
    case "broken":
    case "break_run_against_us":
    case "counter_break_against_us":
      return theme.colors.performance.veryLow;
    case "break":
    case "break_run_for_us":
    case "counter_break_for_us":
      return theme.colors.performance.veryHigh;
    case "high_turn_point":
    case "long_point":
      return theme.colors.gameHistory.effort;
    default:
      return theme.colors.newUi.primary;
  }
}

function getMomentTitle(moment: GameKeyMoment, t: TFunction) {
  return t(
    `newUiPages.gameHistory.keyMomentTypes.${moment.type}`,
    moment.type,
  );
}

function getPointCharacteristicMoment(
  pointId: number | null,
  moments: GameKeyMoment[],
) {
  if (pointId === null) {
    return null;
  }

  return moments
    .filter((moment) => moment.point_ids.includes(pointId))
    .sort((left, right) => {
      if (left.importance !== right.importance) {
        return right.importance - left.importance;
      }

      return Math.min(...left.point_ids) - Math.min(...right.point_ids);
    })[0] ?? null;
}

function getPointMarkerCharacteristicLabel(markers: string[], t: TFunction) {
  const marker = [
    "universe_point",
    "galaxy_point",
    "high_turn_point",
    "long_point",
    "broken",
    "break",
  ].find((candidate) => hasTimelineMarker(markers, candidate));

  return marker
    ? t(`newUiPages.gameHistory.keyMomentTypes.${marker}`, marker)
    : null;
}

function getPointCharacteristicLabel(
  pointId: number | null,
  markers: string[],
  moments: GameKeyMoment[],
  t: TFunction,
) {
  const characteristicMoment = getPointCharacteristicMoment(pointId, moments);

  return characteristicMoment
    ? getMomentTitle(characteristicMoment, t)
    : getPointMarkerCharacteristicLabel(markers, t);
}

function getMomentDescription(moment: GameKeyMoment, t: TFunction) {
  return t(
    `newUiPages.gameHistory.keyMomentDescriptions.${moment.type}`,
    "",
  );
}

function getPointRangeLabel(
  moment: GameKeyMoment,
  pointsById: Map<number, PointWithPlayers>,
  t: TFunction,
) {
  const pointNumbers = moment.point_ids
    .map((pointId) => pointsById.get(pointId)?.point_number)
    .filter((pointNumber): pointNumber is number => pointNumber !== undefined)
    .sort((left, right) => left - right);

  if (pointNumbers.length === 0) {
    return null;
  }

  if (pointNumbers.length === 1) {
    return t("newUiPages.gameHistory.pointLabel", {
      pointNumber: pointNumbers[0],
    });
  }

  return t("newUiPages.gameHistory.pointRangeLabel", {
    firstPointNumber: pointNumbers[0],
    lastPointNumber: pointNumbers[pointNumbers.length - 1],
  });
}

function getCurrentPointIds(game: GameDetail | null) {
  if (!game || game.status !== "started") {
    return new Set<number>();
  }

  const currentPoint = getRunningPoint(game.points);
  return currentPoint ? new Set([currentPoint.id]) : new Set<number>();
}

function getResultLabel(game: GameDetail, t: TFunction) {
  if (game.our_score > game.opponent_score) {
    return t("newUiPages.gameHistory.resultWon", {
      teamName: game.team_name,
    });
  }

  if (game.opponent_score > game.our_score) {
    return t("newUiPages.gameHistory.resultWon", {
      teamName: game.opponent_name,
    });
  }

  return t("newUiPages.gameHistory.resultDraw");
}

function getLiveScoreContext(game: GameDetail, t: TFunction) {
  const margin = Math.abs(game.our_score - game.opponent_score);

  if (margin === 0) {
    return t("newUiPages.gameHistory.liveTied");
  }

  return t("newUiPages.gameHistory.liveLeading", {
    count: margin,
    teamName:
      game.our_score > game.opponent_score ? game.team_name : game.opponent_name,
  });
}

function KeyMomentsSection({
  moments,
  onSelectPoint,
  pointsById,
  scoreByPointId,
  selectedPointId,
  t,
}: {
  moments: GameKeyMoment[];
  onSelectPoint: (pointId: number) => void;
  pointsById: Map<number, PointWithPlayers>;
  scoreByPointId: Map<number, { opponent: number; our: number }>;
  selectedPointId: number | null;
  t: TFunction;
}) {
  if (moments.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: { xs: "none", md: "block" },
        p: { xs: 1.5, sm: 2 },
      })}
    >
      <Stack
        alignItems={{ xs: "flex-start", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={0.5}
        sx={{ mb: 1.5 }}
      >
        <Typography fontWeight={900} variant="h6">
          {t("newUiPages.gameHistory.keyMoments")}
        </Typography>
        <Typography color="text.secondary" fontWeight={700} variant="body2">
          {t("newUiPages.gameHistory.keyMomentCount", {
            count: moments.length,
          })}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: { xs: "auto", md: "visible" },
          pb: { xs: 0.5, md: 0 },
        }}
      >
        {moments.map((moment) => {
          const point = pointsById.get(moment.primary_point_id);
          if (!point) {
            return null;
          }

          const scoreAfter = scoreByPointId.get(point.id);
          const isSelected = selectedPointId === point.id;
          const pointRangeLabel = getPointRangeLabel(moment, pointsById, t);
          const description = getMomentDescription(moment, t);
          const durationLabel = formatPointDuration(point.duration_seconds);
          const turnCount = getPointTurnCount(point);
          const isSpecialMoment =
            moment.type === "galaxy_point" || moment.type === "universe_point";

          return (
            <ButtonBase
              aria-label={t("newUiPages.gameHistory.selectKeyMoment", {
                label: getMomentTitle(moment, t),
                pointNumber: point.point_number,
              })}
              aria-pressed={isSelected}
              key={moment.id}
              onClick={() => onSelectPoint(point.id)}
              sx={(theme) => {
                const accent = getMomentAccentColor(moment.type, theme);
                return {
                  alignItems: "stretch",
                  bgcolor: isSelected ? alpha(accent, 0.07) : "background.paper",
                  border: `1px solid ${
                    isSelected
                      ? alpha(accent, 0.52)
                      : alpha(theme.palette.text.primary, 0.1)
                  }`,
                  borderRadius: 1,
                  boxShadow: isSelected
                    ? `0 8px 20px ${alpha(accent, 0.1)}`
                    : "none",
                  flex: { xs: "0 0 244px", md: "1 1 0" },
                  justifyContent: "flex-start",
                  minHeight: 130,
                  overflow: "hidden",
                  textAlign: "left",
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "box-shadow"],
                    { duration: theme.transitions.duration.short },
                  ),
                  "&:hover": {
                    bgcolor: alpha(accent, 0.05),
                    borderColor: alpha(accent, 0.42),
                  },
                  "&:focus-visible": {
                    boxShadow: `0 0 0 3px ${alpha(accent, 0.22)}`,
                    outline: 0,
                  },
                };
              }}
              type="button"
            >
              <Box sx={{ display: "flex", minWidth: 0, width: "100%" }}>
                <Box
                  aria-hidden="true"
                  sx={(theme) => ({
                    bgcolor: getMomentAccentColor(moment.type, theme),
                    flexShrink: 0,
                    width: 5,
                  })}
                />
                <Stack spacing={1} sx={{ minWidth: 0, p: 1.25, width: "100%" }}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Stack
                      alignItems="center"
                      direction="row"
                      spacing={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <PointSideIconBadge point={point} t={t} />
                      {isSpecialMoment && (
                        <EmojiEventsIcon
                          titleAccess={getMomentTitle(moment, t)}
                          sx={(theme) => ({
                            color: getMomentAccentColor(moment.type, theme),
                            flexShrink: 0,
                            fontSize: 18,
                          })}
                        />
                      )}
                      <Typography component="p" fontWeight={900} noWrap variant="subtitle2">
                        {getMomentTitle(moment, t)}
                      </Typography>
                    </Stack>
                    {scoreAfter && (
                      <Typography fontWeight={900} variant="body2">
                        {scoreAfter.our} - {scoreAfter.opponent}
                      </Typography>
                    )}
                  </Stack>
                  {description && (
                    <Typography
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                      variant="body2"
                    >
                      {description}
                    </Typography>
                  )}
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {pointRangeLabel && (
                      <Chip
                        label={pointRangeLabel}
                        size="small"
                        sx={{ fontWeight: 800 }}
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={getPointOutcomeLabel(point, t)}
                      size="small"
                      sx={(theme) => ({
                        bgcolor: alpha(
                          getPointOutcomeAccentColor(point, theme),
                          0.1,
                        ),
                        color: getPointOutcomeAccentColor(point, theme),
                        fontWeight: 800,
                      })}
                    />
                    {moment.type === "long_point" && durationLabel && (
                      <Chip
                        label={durationLabel}
                        size="small"
                        sx={{ fontWeight: 800 }}
                        variant="outlined"
                      />
                    )}
                    {moment.type === "high_turn_point" && (
                      <Chip
                        label={t("newUiPages.gameHistory.turnSummary", {
                          count: turnCount,
                        })}
                        size="small"
                        sx={{ fontWeight: 800 }}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Paper>
  );
}

function PointSelectButton({
  isCurrent,
  isSelected,
  markers,
  onSelect,
  point,
  scoreAfter,
  t,
  variant,
}: {
  isCurrent: boolean;
  isSelected: boolean;
  markers: string[];
  onSelect: () => void;
  point: PointWithPlayers;
  scoreAfter?: { opponent: number; our: number };
  t: TFunction;
  variant: "rail" | "strip";
}) {
  const durationLabel = formatPointDuration(point.duration_seconds);
  const turnCount = getPointTurnCount(point);

  return (
    <ButtonBase
      aria-label={t("newUiPages.gameHistory.selectPoint", {
        pointNumber: point.point_number,
      })}
      aria-pressed={isSelected}
      onClick={onSelect}
      sx={(theme) => {
        const accent = getPointAccentColor(point, markers, theme);
        return {
          alignItems: "stretch",
          bgcolor: isSelected ? alpha(accent, 0.07) : "background.paper",
          border: `1px solid ${
            isSelected
              ? alpha(accent, 0.46)
              : alpha(theme.palette.text.primary, 0.08)
          }`,
          borderRadius: 1,
          boxShadow: isSelected
            ? `0 8px 20px ${alpha(accent, 0.1)}`
            : "none",
          flex: variant === "strip" ? "0 0 220px" : "0 0 auto",
          justifyContent: "flex-start",
          overflow: "hidden",
          textAlign: "left",
          transition: theme.transitions.create(
            ["background-color", "border-color", "box-shadow"],
            { duration: theme.transitions.duration.short },
          ),
          width: variant === "rail" ? "100%" : "auto",
          "&:hover": {
            bgcolor: alpha(accent, 0.05),
            borderColor: alpha(accent, 0.34),
          },
          "&:focus-visible": {
            boxShadow: `0 0 0 3px ${alpha(accent, 0.2)}`,
            outline: 0,
          },
        };
      }}
      type="button"
    >
      <Box sx={{ display: "flex", minWidth: 0, width: "100%" }}>
        <Box
          aria-hidden="true"
          sx={(theme) => ({
            bgcolor: getPointAccentColor(point, markers, theme),
            flexShrink: 0,
            width: 4,
          })}
        />
        <Stack
          direction={variant === "rail" ? "row" : "column"}
          justifyContent="space-between"
          spacing={1}
          sx={{ minWidth: 0, p: 1.2, width: "100%" }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack alignItems="center" direction="row" spacing={0.75}>
              <PointSideIconBadge point={point} t={t} />
              <Typography component="p" fontWeight={900} noWrap variant="subtitle2">
                {t("newUiPages.gameHistory.pointLabel", {
                  pointNumber: point.point_number,
                })}
              </Typography>
              {isCurrent && (
                <Chip
                  label={t("newUiPages.gameHistory.current")}
                  size="small"
                  sx={(theme) => ({
                    bgcolor: theme.colors.newUi.primarySoft,
                    color: theme.colors.newUi.primary,
                    fontWeight: 800,
                    height: 22,
                  })}
                />
              )}
            </Stack>
            <Stack
              alignItems="center"
              direction="row"
              flexWrap="wrap"
              gap={0.75}
              sx={{ mt: 0.75 }}
            >
              <Typography color="text.secondary" variant="caption">
                {getPointOutcomeLabel(point, t)}
              </Typography>
              {durationLabel && (
                <Typography color="text.secondary" variant="caption">
                  {durationLabel}
                </Typography>
              )}
              <Typography color="text.secondary" variant="caption">
                {t("newUiPages.gameHistory.turnSummary", {
                  count: turnCount,
                })}
              </Typography>
            </Stack>
          </Box>
          {scoreAfter && (
            <Typography
              component="p"
              fontWeight={900}
              sx={{ whiteSpace: "nowrap" }}
              variant="subtitle2"
            >
              {scoreAfter.our} - {scoreAfter.opponent}
            </Typography>
          )}
        </Stack>
      </Box>
    </ButtonBase>
  );
}

function HalftimeListItem({
  halftime,
  language,
  t,
  variant,
}: {
  halftime: Halftime;
  language?: string;
  t: TFunction;
  variant: "rail" | "strip";
}) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "stretch",
        bgcolor: alpha(theme.colors.performance.medium, 0.07),
        border: `1px dashed ${alpha(theme.colors.performance.medium, 0.42)}`,
        borderRadius: 1,
        display: "flex",
        flex: variant === "strip" ? "0 0 220px" : "0 0 auto",
        overflow: "hidden",
        textAlign: "left",
        width: variant === "rail" ? "100%" : "auto",
      })}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          bgcolor: theme.colors.performance.medium,
          flexShrink: 0,
          width: 4,
        })}
      />
      <Stack
        direction={variant === "rail" ? "row" : "column"}
        justifyContent="space-between"
        spacing={1}
        sx={{ minWidth: 0, p: 1.2, width: "100%" }}
      >
        <Stack alignItems="center" direction="row" spacing={0.75} sx={{ minWidth: 0 }}>
          <Box
            sx={(theme) => ({
              alignItems: "center",
              bgcolor: alpha(theme.colors.performance.medium, 0.14),
              borderRadius: "50%",
              color: theme.palette.warning.dark,
              display: "inline-flex",
              flexShrink: 0,
              height: 24,
              justifyContent: "center",
              width: 24,
              "& .MuiSvgIcon-root": {
                fontSize: 16,
              },
            })}
          >
            <AccessTimeFilledIcon titleAccess={t("points:history.halfTime")} />
          </Box>
          <Typography component="p" fontWeight={900} noWrap variant="subtitle2">
            {t("points:history.halfTime")}
          </Typography>
        </Stack>
        <Typography color="text.secondary" variant="caption">
          {formatDateTime(halftime.halftime_timestamp, language)}
        </Typography>
        {halftime.comments && (
          <Typography
            color="text.secondary"
            noWrap={variant === "rail"}
            variant="caption"
          >
            {halftime.comments}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function MobilePointSelector({
  currentPointIds,
  historyItems,
  keyMoments,
  language,
  markersByPointId,
  onSelectPoint,
  scoreByPointId,
  selectedPointId,
  t,
}: {
  currentPointIds: Set<number>;
  historyItems: HistoryItem[];
  keyMoments: GameKeyMoment[];
  language?: string;
  markersByPointId: Map<number, string[]>;
  onSelectPoint: (pointId: number) => void;
  scoreByPointId: Map<number, { opponent: number; our: number }>;
  selectedPointId: number | null;
  t: TFunction;
}) {
  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const selectedItem = historyItems.find(
    (item) => isPointHistoryItem(item) && item.point.id === selectedPointId,
  );
  const selectedPoint =
    selectedItem && isPointHistoryItem(selectedItem) ? selectedItem.point : null;
  const selectedScore = selectedPoint ? scoreByPointId.get(selectedPoint.id) : null;
  const selectedMarkers = selectedPoint
    ? markersByPointId.get(selectedPoint.id) ?? []
    : [];
  const selectedCharacteristicLabel = getPointCharacteristicLabel(
    selectedPoint?.id ?? null,
    selectedMarkers,
    keyMoments,
    t,
  );
  const selectedDurationLabel = selectedPoint
    ? formatPointDuration(selectedPoint.duration_seconds)
    : null;
  const selectedTurnCount = selectedPoint ? getPointTurnCount(selectedPoint) : 0;
  const isOpen = Boolean(anchorElement);
  const menuId = "game-history-mobile-point-menu";

  const handleClose = () => setAnchorElement(null);
  const handleSelectPoint = (pointId: number) => {
    onSelectPoint(pointId);
    handleClose();
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: { xs: "block", md: "none" },
        p: 1.5,
      })}
    >
      <Typography fontWeight={900} sx={{ mb: 1 }} variant="subtitle1">
        {t("newUiPages.gameHistory.pointList")}
      </Typography>
      <Button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen ? "true" : undefined}
        aria-haspopup="menu"
        endIcon={<KeyboardArrowDownIcon />}
        fullWidth
        onClick={(event) => setAnchorElement(event.currentTarget)}
        sx={(theme) => {
          const accent =
            selectedPoint != null
              ? getPointAccentColor(selectedPoint, selectedMarkers, theme)
              : theme.colors.newUi.primary;

          return {
            alignItems: "stretch",
            borderColor: alpha(accent, 0.36),
            color: "text.primary",
            justifyContent: "space-between",
            minHeight: 72,
            px: 1.25,
            py: 1,
            textAlign: "left",
            textTransform: "none",
            "&:hover": {
              bgcolor: alpha(accent, 0.04),
              borderColor: alpha(accent, 0.48),
            },
            "& .MuiButton-endIcon": {
              alignSelf: "center",
              color: "text.secondary",
              ml: 1,
            },
          };
        }}
        variant="outlined"
      >
        {selectedPoint ? (
          <Stack spacing={0.35} sx={{ minWidth: 0, width: "100%" }}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              spacing={1}
            >
              <Stack
                alignItems="center"
                direction="row"
                spacing={0.75}
                sx={{ minWidth: 0 }}
              >
                <PointSideIconBadge point={selectedPoint} t={t} />
                <Typography fontWeight={900} noWrap variant="subtitle2">
                  {t("newUiPages.gameHistory.pointLabel", {
                    pointNumber: selectedPoint.point_number,
                  })}
                  {selectedCharacteristicLabel
                    ? ` - ${selectedCharacteristicLabel}`
                    : ""}
                </Typography>
                {currentPointIds.has(selectedPoint.id) && (
                  <Chip
                    label={t("newUiPages.gameHistory.current")}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: theme.colors.newUi.primarySoft,
                      color: theme.colors.newUi.primary,
                      fontWeight: 800,
                      height: 22,
                    })}
                  />
                )}
              </Stack>
              {selectedScore && (
                <Typography fontWeight={900} sx={{ whiteSpace: "nowrap" }} variant="body2">
                  {selectedScore.our} - {selectedScore.opponent}
                </Typography>
              )}
            </Stack>
            <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
              <Typography color="text.secondary" variant="caption">
                {getPointOutcomeLabel(selectedPoint, t)}
              </Typography>
              {selectedDurationLabel && (
                <Typography color="text.secondary" variant="caption">
                  {selectedDurationLabel}
                </Typography>
              )}
              <Typography color="text.secondary" variant="caption">
                {t("newUiPages.gameHistory.turnSummary", {
                  count: selectedTurnCount,
                })}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Typography color="text.secondary" fontWeight={800} variant="body2">
            {t("newUiPages.gameHistory.choosePoint")}
          </Typography>
        )}
      </Button>

      <Menu
        anchorEl={anchorElement}
        id={menuId}
        MenuListProps={{
          "aria-label": t("newUiPages.gameHistory.pointPickerAriaLabel"),
          dense: true,
        }}
        onClose={handleClose}
        open={isOpen}
        slotProps={{
          paper: {
            sx: {
              maxHeight: "min(70vh, 520px)",
              mt: 0.75,
              width: anchorElement?.clientWidth,
            },
          },
        }}
      >
        {historyItems.map((item) => {
          if (isHalftimeHistoryItem(item)) {
            return (
              <MenuItem disabled key={item.id} sx={{ opacity: 1, py: 1.1 }}>
                <Stack spacing={0.25} sx={{ minWidth: 0, width: "100%" }}>
                  <Stack alignItems="center" direction="row" spacing={0.75}>
                    <Box
                      sx={(theme) => ({
                        alignItems: "center",
                        bgcolor: alpha(theme.colors.performance.medium, 0.14),
                        borderRadius: "50%",
                        color: theme.palette.warning.dark,
                        display: "inline-flex",
                        flexShrink: 0,
                        height: 24,
                        justifyContent: "center",
                        width: 24,
                        "& .MuiSvgIcon-root": {
                          fontSize: 16,
                        },
                      })}
                    >
                      <AccessTimeFilledIcon titleAccess={t("points:history.halfTime")} />
                    </Box>
                    <Typography color="text.primary" fontWeight={900} variant="subtitle2">
                      {t("points:history.halfTime")}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="caption">
                    {formatDateTime(item.halftime.halftime_timestamp, language)}
                    {item.halftime.comments ? ` · ${item.halftime.comments}` : ""}
                  </Typography>
                </Stack>
              </MenuItem>
            );
          }

          const markers = markersByPointId.get(item.point.id) ?? [];
          const scoreAfter = scoreByPointId.get(item.point.id);
          const characteristicLabel = getPointCharacteristicLabel(
            item.point.id,
            markers,
            keyMoments,
            t,
          );
          const durationLabel = formatPointDuration(item.point.duration_seconds);
          const turnCount = getPointTurnCount(item.point);
          const isSelected = selectedPointId === item.point.id;

          return (
            <MenuItem
              key={item.id}
              onClick={() => handleSelectPoint(item.point.id)}
              selected={isSelected}
              sx={(theme) => {
                const accent = getPointAccentColor(item.point, markers, theme);

                return {
                  borderLeft: `4px solid ${accent}`,
                  minHeight: 72,
                  py: 1,
                  whiteSpace: "normal",
                  "&.Mui-selected": {
                    bgcolor: alpha(accent, 0.08),
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: alpha(accent, 0.12),
                  },
                };
              }}
            >
              <Stack spacing={0.35} sx={{ minWidth: 0, width: "100%" }}>
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={0.75}
                    sx={{ minWidth: 0 }}
                  >
                    <PointSideIconBadge point={item.point} t={t} />
                    <Typography fontWeight={900} noWrap variant="subtitle2">
                      {t("newUiPages.gameHistory.pointLabel", {
                        pointNumber: item.point.point_number,
                      })}
                      {characteristicLabel ? ` - ${characteristicLabel}` : ""}
                    </Typography>
                    {currentPointIds.has(item.point.id) && (
                      <Chip
                        label={t("newUiPages.gameHistory.current")}
                        size="small"
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primarySoft,
                          color: theme.colors.newUi.primary,
                          fontWeight: 800,
                          height: 22,
                        })}
                      />
                    )}
                  </Stack>
                  {scoreAfter && (
                    <Typography fontWeight={900} sx={{ whiteSpace: "nowrap" }} variant="body2">
                      {scoreAfter.our} - {scoreAfter.opponent}
                    </Typography>
                  )}
                </Stack>
                <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
                  <Typography color="text.secondary" variant="caption">
                    {getPointOutcomeLabel(item.point, t)}
                  </Typography>
                  {durationLabel && (
                    <Typography color="text.secondary" variant="caption">
                      {durationLabel}
                    </Typography>
                  )}
                  <Typography color="text.secondary" variant="caption">
                    {t("newUiPages.gameHistory.turnSummary", {
                      count: turnCount,
                    })}
                  </Typography>
                </Stack>
              </Stack>
            </MenuItem>
          );
        })}
      </Menu>
    </Paper>
  );
}

function PointListRail({
  historyItems,
  language,
  currentPointIds,
  markersByPointId,
  onSelectPoint,
  scoreByPointId,
  selectedPointId,
  t,
}: {
  historyItems: HistoryItem[];
  language?: string;
  currentPointIds: Set<number>;
  markersByPointId: Map<number, string[]>;
  onSelectPoint: (pointId: number) => void;
  scoreByPointId: Map<number, { opponent: number; our: number }>;
  selectedPointId: number | null;
  t: TFunction;
}) {
  const pointCount = historyItems.filter(isPointHistoryItem).length;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        alignSelf: "start",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: { xs: "none", md: "block" },
        maxHeight: "calc(100vh - 120px)",
        overflow: "hidden",
        position: "sticky",
        top: 16,
      })}
    >
      <Stack spacing={1.25} sx={{ p: 1.5 }}>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography fontWeight={900} variant="subtitle1">
            {t("newUiPages.gameHistory.pointList")}
          </Typography>
          <Typography color="text.secondary" fontWeight={800} variant="caption">
            {t("newUiPages.gameHistory.pointCount", {
              count: pointCount,
            })}
          </Typography>
        </Stack>
        <Divider />
        <Stack
          spacing={0.8}
          sx={{
            maxHeight: "calc(100vh - 210px)",
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {historyItems.map((item) =>
            isHalftimeHistoryItem(item) ? (
              <HalftimeListItem
                halftime={item.halftime}
                key={item.id}
                language={language}
                t={t}
                variant="rail"
              />
            ) : (
              <PointSelectButton
                isCurrent={currentPointIds.has(item.point.id)}
                isSelected={selectedPointId === item.point.id}
                key={item.id}
                markers={markersByPointId.get(item.point.id) ?? []}
                onSelect={() => onSelectPoint(item.point.id)}
                point={item.point}
                scoreAfter={scoreByPointId.get(item.point.id)}
                t={t}
                variant="rail"
              />
            ),
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function SelectedPointDetail({
  characteristicLabel,
  markers,
  point,
  scoreAfter,
  t,
  turnovers,
}: {
  characteristicLabel?: string;
  markers: string[];
  point: PointWithPlayers | null;
  scoreAfter?: { opponent: number; our: number };
  t: TFunction;
  turnovers: TurnoverWithPlayer[];
}) {
  if (!point) {
    return null;
  }

  return (
    <Stack spacing={1.25}>
      <Stack
        alignItems="center"
        direction="row"
        spacing={1}
      >
        <Typography component="h2" fontWeight={900} variant="h6">
          {t("newUiPages.gameHistory.selectedPoint")}
        </Typography>
      </Stack>
      <NewGameHistoryPointItem
        accentColor={(theme) => getPointAccentColor(point, markers, theme)}
        characteristicLabel={characteristicLabel}
        point={point}
        scoreAfter={scoreAfter}
        turnovers={turnovers}
      />
    </Stack>
  );
}

export default function NewGameHistoryPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "games", "points", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [requestedSelectedPointId, setRequestedSelectedPointId] = useState<
    number | null | undefined
  >(undefined);
  const source = searchParams.get("from");
  const isFromLive = source === "live";
  const {
    game,
    gameIdNumber,
    gameTurnovers,
    isLoading,
    error,
  } = useGameDetailPageData(gameId, false, {
    includeGameTurnovers: true,
    includeLiveState: false,
  });
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading,
  );
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(gameIdNumber),
    onSuccess: async () => {
      setIsDeleteConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.games });
      navigate("/games");
    },
  });

  const historyItems = useMemo<HistoryItem[]>(() => {
    if (!game) {
      return [];
    }

    const pointItems: HistoryItem[] = game.points.map((point) => ({
      id: `point-${point.id}`,
      point,
      timestamp: getTimestamp(point),
      type: "point",
    }));
    const halftimeItems: HistoryItem[] = game.halftime
      ? [
          {
            halftime: game.halftime,
            id: `halftime-${game.halftime.id}`,
            timestamp: game.halftime.halftime_timestamp,
            type: "halftime",
          },
        ]
      : [];

    return [...pointItems, ...halftimeItems].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
  }, [game]);

  const scoreByPointId = useMemo(
    () => buildScoreByPointId(game?.points ?? []),
    [game?.points],
  );
  const scoreTimeline = useMemo(() => {
    if (!game) {
      return null;
    }

    return (
      game.timeline ??
      buildGamePointTimelineFromPoints(game.id, game.points, game.halftime)
    );
  }, [game]);
  const markersByPointId = useMemo(
    () => buildTimelineMarkersByPointId(scoreTimeline),
    [scoreTimeline],
  );
  const historySummary = useMemo(
    () => buildHistorySummary(game?.points ?? []),
    [game?.points],
  );
  const turnoversByPointId = useMemo(
    () => buildTurnoversByPointId(gameTurnovers ?? []),
    [gameTurnovers],
  );
  const pointItems = useMemo(
    () => historyItems.filter(isPointHistoryItem),
    [historyItems],
  );
  const pointsById = useMemo(
    () => buildPointMap(game?.points ?? []),
    [game?.points],
  );
  const currentPointIds = useMemo(() => getCurrentPointIds(game ?? null), [game]);
  const requestedPointIdIsAvailable =
    requestedSelectedPointId !== undefined &&
    requestedSelectedPointId !== null &&
    pointsById.has(requestedSelectedPointId);
  const keyMoments = scoreTimeline?.key_moments ?? [];
  const firstKeyMomentPointId = keyMoments.find((moment) =>
    pointsById.has(moment.primary_point_id),
  )?.primary_point_id;
  const latestPointId = pointItems[0]?.point.id ?? null;
  const activePointId =
    game?.status === "started" ? historySummary.runningPoint?.id : undefined;
  const selectedPointId =
    requestedSelectedPointId === null
      ? null
      : requestedPointIdIsAvailable
        ? requestedSelectedPointId
        : activePointId ?? firstKeyMomentPointId ?? latestPointId;
  const selectedPoint = selectedPointId ? pointsById.get(selectedPointId) ?? null : null;
  const selectedScore = selectedPointId
    ? scoreByPointId.get(selectedPointId)
    : undefined;
  const selectedMarkers = selectedPointId
    ? markersByPointId.get(selectedPointId) ?? []
    : [];
  const selectedCharacteristicLabel =
    getPointCharacteristicLabel(selectedPointId, selectedMarkers, keyMoments, t) ??
    undefined;
  const selectedTurnovers = selectedPointId
    ? turnoversByPointId.get(selectedPointId) ?? []
    : [];
  const handleSelectPoint = (pointId: number) => {
    setRequestedSelectedPointId(pointId);
  };

  if (isLoading) {
    return <LoadingState message={t("newUiPages.gameHistory.loading")} />;
  }

  if (error || !game) {
    return <ErrorState message={t("newUiPages.gameHistory.error")} />;
  }

  const backPath = isFromLive ? `/live/${gameIdNumber}` : "/games";
  const backLabel = isFromLive
    ? t("newUiPages.gameHistory.backToLive")
    : t("newUiPages.gameHistory.backToAllGames");
  const resultLabel =
    game.status === "started"
      ? historySummary.runningPoint
        ? t("newUiPages.gameHistory.livePointRunning", {
            pointNumber: historySummary.runningPoint.point_number,
          })
        : t("newUiPages.gameHistory.liveGame")
      : game.status === "ready"
        ? t("newUiPages.gameHistory.resultPending")
        : getResultLabel(game, t);
  const resultContext =
    game.status === "started"
      ? getLiveScoreContext(game, t)
      : null;
  const currentPointContext =
    game.status === "started" && historySummary.runningPoint
      ? historySummary.runningPoint.starting_on_offense
        ? t("newUiPages.gameHistory.currentOffense")
        : t("newUiPages.gameHistory.currentDefense")
      : null;
  const canDeleteGame = canEditData && game.status === "ended";

  return (
    <Container
      disableGutters
      maxWidth="lg"
      sx={{ px: { xs: 0, sm: 3 }, py: { xs: 0, md: 4 } }}
    >
      <Stack spacing={2.5}>
        <Paper
          component="header"
          elevation={0}
          sx={(theme) => ({
            bgcolor: theme.colors.newUi.primary,
            borderRadius: { xs: 0, sm: 1 },
            color: theme.palette.primary.contrastText,
            overflow: "hidden",
          })}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              spacing={1.5}
            >
              <Button
                color="inherit"
                component={Link}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "inherit",
                  fontWeight: 800,
                  minWidth: 0,
                  opacity: 0.9,
                  px: 0,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "transparent",
                    opacity: 1,
                  },
                }}
                to={backPath}
              >
                {backLabel}
              </Button>
              <Stack alignItems="center" direction="row" spacing={0.75}>
                <Chip
                  label={
                    game.status === "started"
                      ? t("newUiPages.liveGame.board.live")
                      : t(`games:status.${game.status}`)
                  }
                  size="small"
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.common.white, 0.16),
                    color: theme.palette.common.white,
                    fontWeight: 800,
                    "& .MuiChip-label": {
                      px: 1.25,
                    },
                  })}
                />
                {canDeleteGame && (
                  <Tooltip
                    title={t(
                      "newUiPages.allGames.actions.deleteGame",
                    )}
                  >
                    <IconButton
                      aria-label={t(
                        "newUiPages.allGames.actions.deleteGameAria",
                        { opponentName: game.opponent_name },
                      )}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        deleteMutation.reset();
                        setIsDeleteConfirmOpen(true);
                      }}
                      size="small"
                      sx={(theme) => ({
                        bgcolor: alpha(theme.palette.common.white, 0.14),
                        color: theme.palette.common.white,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.error.light, 0.24),
                        },
                      })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>

            <Typography
              component="h1"
              sx={{
                border: 0,
                clip: "rect(0 0 0 0)",
                height: 1,
                left: 0,
                m: -1,
                overflow: "hidden",
                p: 0,
                position: "absolute",
                top: 0,
                whiteSpace: "nowrap",
                width: 1,
              }}
            >
              {t("newUiPages.gameHistory.heading")}
            </Typography>

            <Box
              sx={{
                alignItems: { md: "stretch" },
                display: "grid",
                gap: { xs: 2, md: 3.5 },
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
                },
                mt: { xs: 2, sm: 3 },
              }}
            >
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="center"
                spacing={{ xs: 2, sm: 4 }}
                sx={{
                  minHeight: { md: 138 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <Typography
                    fontWeight={900}
                    sx={{
                      opacity: 0.95,
                      overflowWrap: "anywhere",
                      typography: { xs: "body1", sm: "h6" },
                    }}
                  >
                    {game.team_name}
                  </Typography>
                </Box>
                <Typography
                  aria-label={t("newUiPages.liveGame.board.currentScore")}
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: "3.25rem", md: "5rem" },
                    lineHeight: 0.95,
                    whiteSpace: "nowrap",
                  }}
                >
                  {game.our_score} - {game.opponent_score}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                  <Typography
                    fontWeight={900}
                    sx={{
                      opacity: 0.95,
                      overflowWrap: "anywhere",
                      typography: { xs: "body1", sm: "h6" },
                    }}
                  >
                    {game.opponent_name}
                  </Typography>
                </Box>
              </Stack>

              <Box
                aria-label={t("newUiPages.gameHistory.summaryLabel")}
                sx={(theme) => ({
                  alignSelf: "stretch",
                  bgcolor: alpha(theme.palette.common.white, 0.09),
                  border: `1px solid ${alpha(theme.palette.common.white, 0.16)}`,
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: { xs: 0, md: 138 },
                  p: { xs: 1.25, sm: 2 },
                })}
              >
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Chip
                    label={resultLabel}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: alpha(theme.palette.common.white, 0.92),
                      color:
                        game.status === "started"
                          ? theme.colors.newUi.primary
                          : game.status === "ended" &&
                              game.our_score < game.opponent_score
                            ? theme.palette.error.main
                            : theme.palette.success.main,
                      fontWeight: 900,
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    })}
                  />
                  {resultContext && (
                    <Typography
                      fontWeight={900}
                      sx={{ opacity: 0.94 }}
                      variant="body2"
                    >
                      {resultContext}
                    </Typography>
                  )}
                </Stack>

                <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                  <Stack alignItems="center" direction="row" spacing={0.9}>
                    <EmojiEventsIcon sx={{ fontSize: 18, opacity: 0.78 }} />
                    <Typography sx={{ opacity: 0.78 }} variant="body2">
                      {game.competition_name}
                    </Typography>
                  </Stack>
                  {game.date && (
                    <Stack alignItems="center" direction="row" spacing={0.9}>
                      <CalendarTodayIcon sx={{ fontSize: 18, opacity: 0.78 }} />
                      <Typography sx={{ opacity: 0.78 }} variant="body2">
                        {formatDateTime(game.date, i18n.resolvedLanguage)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={0.75}
                  sx={{ mt: 1.5 }}
                >
                  <Chip
                    label={t("newUiPages.gameHistory.pointCount", {
                      count: historySummary.pointCount,
                    })}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: alpha(theme.palette.common.white, 0.14),
                      color: alpha(theme.palette.common.white, 0.9),
                      fontWeight: 800,
                    })}
                  />
                  <Chip
                    label={t("newUiPages.gameHistory.breakCount", {
                      count: historySummary.breakCount,
                    })}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: alpha(theme.palette.common.white, 0.14),
                      color: alpha(theme.palette.common.white, 0.9),
                      fontWeight: 800,
                    })}
                  />
                  <Chip
                    label={t("newUiPages.gameHistory.brokenCount", {
                      count: historySummary.brokenCount,
                    })}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: alpha(theme.palette.common.white, 0.14),
                      color: alpha(theme.palette.common.white, 0.9),
                      fontWeight: 800,
                    })}
                  />
                  {currentPointContext && (
                    <Chip
                      icon={<FiberManualRecordIcon />}
                      label={currentPointContext}
                      size="small"
                      sx={(theme) => ({
                        bgcolor: alpha(theme.palette.common.white, 0.14),
                        color: alpha(theme.palette.common.white, 0.9),
                        fontWeight: 800,
                        "& .MuiChip-icon": {
                          color: theme.palette.success.light,
                          fontSize: 12,
                          ml: 1,
                        },
                      })}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Stack
          spacing={2}
          sx={{ px: { xs: 1.5, sm: 0 }, pb: { xs: 2, sm: 0 } }}
        >
          {scoreTimeline && scoreTimeline.points.length > 0 && (
            <Suspense fallback={null}>
              <LazyNewGameScoreProgression
                onPointSelect={handleSelectPoint}
                opponentName={game.opponent_name}
                selectedPointId={selectedPointId}
                teamName={game.team_name}
                timeline={scoreTimeline}
              />
            </Suspense>
          )}

          {historyItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={(theme) => ({
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
                color: "text.secondary",
                p: { xs: 3, sm: 5 },
                textAlign: "center",
              })}
            >
              <Typography>{t("newUiPages.gameHistory.empty")}</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              <KeyMomentsSection
                moments={keyMoments}
                onSelectPoint={handleSelectPoint}
                pointsById={pointsById}
                scoreByPointId={scoreByPointId}
                selectedPointId={selectedPointId}
                t={t}
              />

              <MobilePointSelector
                currentPointIds={currentPointIds}
                historyItems={historyItems}
                keyMoments={keyMoments}
                language={i18n.resolvedLanguage}
                markersByPointId={markersByPointId}
                onSelectPoint={handleSelectPoint}
                scoreByPointId={scoreByPointId}
                selectedPointId={selectedPointId}
                t={t}
              />

              <Box
                sx={{
                  alignItems: "start",
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 360px" },
                }}
              >
                <Stack spacing={2}>
                  <SelectedPointDetail
                    characteristicLabel={selectedCharacteristicLabel}
                    markers={selectedMarkers}
                    point={selectedPoint}
                    scoreAfter={selectedScore}
                    t={t}
                    turnovers={selectedTurnovers}
                  />
                </Stack>

                <PointListRail
                  historyItems={historyItems}
                  language={i18n.resolvedLanguage}
                  currentPointIds={currentPointIds}
                  markersByPointId={markersByPointId}
                  onSelectPoint={handleSelectPoint}
                  scoreByPointId={scoreByPointId}
                  selectedPointId={selectedPointId}
                  t={t}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Stack>
      <DeleteGameDialog
        isDeleting={deleteMutation.isPending}
        isError={deleteMutation.isError}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setIsDeleteConfirmOpen(false);
            deleteMutation.reset();
          }
        }}
        onConfirm={() => deleteMutation.mutate()}
        open={isDeleteConfirmOpen}
        opponentName={game.opponent_name}
      />
    </Container>
  );
}
