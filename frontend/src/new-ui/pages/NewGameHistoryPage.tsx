import { Link, useParams, useSearchParams } from "react-router-dom";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import { useGameDetailPageData } from "../../pages/hooks/useGameDetailPageData";
import type {
  GameDetail,
  Halftime,
  PointWithPlayers,
  TurnoverWithPlayer,
} from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";
import NewGameHistoryPointItem from "../history/NewGameHistoryPointItem";

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

function NewGameHistoryHalftimeItem({
  halftime,
}: {
  halftime: Halftime;
}) {
  const { t, i18n } = useTranslation(["points"]);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        bgcolor: alpha(theme.palette.warning.main, 0.06),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.22)}`,
        borderRadius: 1,
        p: { xs: 2, sm: 2.5 },
      })}
    >
      <Stack alignItems="flex-start" direction="row" spacing={1.5}>
        <Box
          sx={(theme) => ({
            alignItems: "center",
            bgcolor: alpha(theme.palette.warning.main, 0.14),
            borderRadius: "50%",
            color: theme.palette.warning.dark,
            display: "inline-flex",
            flexShrink: 0,
            height: 30,
            justifyContent: "center",
            width: 30,
          })}
        >
          <AccessTimeFilledIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={900} variant="subtitle1">
            {t("points:history.halfTime")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {formatDateTime(halftime.halftime_timestamp, i18n.resolvedLanguage)}
          </Typography>
          {halftime.comments && (
            <Typography
              color="text.secondary"
              sx={{ mt: 1, whiteSpace: "pre-wrap" }}
              variant="body2"
            >
              {halftime.comments}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function NewGameHistoryPage() {
  const { t, i18n } = useTranslation(["navigation", "games", "points", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const [requestedExpandedPointId, setRequestedExpandedPointId] = useState<
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
  const historySummary = useMemo(
    () => buildHistorySummary(game?.points ?? []),
    [game?.points],
  );
  const turnoversByPointId = useMemo(
    () => buildTurnoversByPointId(gameTurnovers ?? []),
    [gameTurnovers],
  );
  const firstPointId = historyItems.find(isPointHistoryItem)?.point.id;
  const requestedPointIdIsAvailable = historyItems.some(
    (item) =>
      item.type === "point" && item.point.id === requestedExpandedPointId,
  );
  const expandedPointId =
    requestedExpandedPointId === null
      ? null
      : requestedPointIdIsAvailable
        ? requestedExpandedPointId
        : firstPointId;

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
            <Stack spacing={1.5}>
              {historyItems.map((item) =>
                item.type === "point" ? (
                  <NewGameHistoryPointItem
                    expanded={item.point.id === expandedPointId}
                    key={item.id}
                    onExpandedChange={(isExpanded) =>
                      setRequestedExpandedPointId(
                        isExpanded ? item.point.id : null,
                      )
                    }
                    point={item.point}
                    scoreAfter={scoreByPointId.get(item.point.id)}
                    turnovers={turnoversByPointId.get(item.point.id) ?? []}
                  />
                ) : (
                  <NewGameHistoryHalftimeItem
                    halftime={item.halftime}
                    key={item.id}
                  />
                ),
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
