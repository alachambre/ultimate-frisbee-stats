import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { GameLiveState, GameWithScore, PointWithPlayers } from "../../types";

interface NewLiveGameBoardProps {
  game: GameWithScore;
  liveState: GameLiveState;
}

function getPointStatusLabel(
  point: PointWithPlayers,
  t: ReturnType<typeof useTranslation<["navigation"]>>["t"]
) {
  if (point.status === "running") {
    return t("newUiPages.liveGame.board.pointRunning", {
      defaultValue: "Point running",
    });
  }

  if (point.status === "ready") {
    return t("newUiPages.liveGame.board.pointReady", {
      defaultValue: "Line ready",
    });
  }

  if (point.status === "scored") {
    return t("newUiPages.liveGame.board.pointScored", {
      defaultValue: "Point scored",
    });
  }

  return t("newUiPages.liveGame.board.pointCompleted", {
    defaultValue: "Point completed",
  });
}

export default function NewLiveGameBoard({
  game,
  liveState,
}: NewLiveGameBoardProps) {
  const { t } = useTranslation(["navigation"]);
  const activePoint = liveState.active_point;
  const score = `${liveState.our_score} - ${liveState.opponent_score}`;
  const possessionLabel = activePoint?.starting_on_offense
    ? t("newUiPages.liveGame.board.startingOffense", {
        defaultValue: "Starting on offense",
      })
    : t("newUiPages.liveGame.board.startingDefense", {
        defaultValue: "Starting on defense",
      });

  return (
    <Paper
      component="section"
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
      })}
    >
      <Box
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          p: { xs: 2, md: 3 },
        })}
      >
        <Stack
          alignItems={{ xs: "flex-start", sm: "center" }}
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Chip
              color="primary"
              label={t("newUiPages.liveGame.board.live", {
                defaultValue: "Live",
              })}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography component="h1" fontWeight={800} variant="h4">
              {game.opponent_name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {game.competition_name}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Typography
              aria-label={t("newUiPages.liveGame.board.currentScore", {
                defaultValue: "Current score",
              })}
              component="p"
              fontWeight={900}
              variant="h2"
            >
              {score}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {game.team_name}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack divider={<Divider />} spacing={0}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activePoint ? (
            <Stack spacing={1.5}>
              <Stack
                alignItems={{ xs: "flex-start", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography component="h2" fontWeight={800} variant="h6">
                    {t("newUiPages.liveGame.board.pointNumber", {
                      defaultValue: "Point {{pointNumber}}",
                      pointNumber: activePoint.point_number,
                    })}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {possessionLabel}
                  </Typography>
                </Box>
                <Chip label={getPointStatusLabel(activePoint, t)} />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                <MetricTile
                  label={t("newUiPages.liveGame.board.ourTurns", {
                    defaultValue: "Our turns",
                  })}
                  value={activePoint.our_turnovers ?? 0}
                />
                <MetricTile
                  label={t("newUiPages.liveGame.board.opponentTurns", {
                    defaultValue: "Opponent turns",
                  })}
                  value={activePoint.opponent_turnovers ?? 0}
                />
                <MetricTile
                  label={t("newUiPages.liveGame.board.turnovers", {
                    defaultValue: "Turnovers",
                  })}
                  value={liveState.active_point_turnovers.length}
                />
                <MetricTile
                  label={t("newUiPages.liveGame.board.stoppages", {
                    defaultValue: "Stoppages",
                  })}
                  value={liveState.active_point_stoppages.length}
                />
              </Box>
            </Stack>
          ) : (
            <Box sx={{ py: { xs: 2, md: 3 }, textAlign: "center" }}>
              <Typography component="h2" fontWeight={800} variant="h6">
                {t("newUiPages.liveGame.board.waiting", {
                  defaultValue: "Waiting for the next point",
                })}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {t("newUiPages.liveGame.board.waitingCopy", {
                  defaultValue: "The score is live. The next point will appear here.",
                })}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 1.5,
      })}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography component="p" fontWeight={800} variant="h5">
        {value}
      </Typography>
    </Paper>
  );
}
