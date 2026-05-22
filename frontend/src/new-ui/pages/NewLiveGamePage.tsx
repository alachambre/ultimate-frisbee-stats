import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import { getAllGames, getGameLiveState } from "../../services/games";
import { queryKeys } from "../../utils/queryKeys";
import { buildNewLiveGamesView } from "../live/buildNewLiveGamesView";
import NewLiveGameBoard from "../live/NewLiveGameBoard";
import NewLiveGamesList from "../live/NewLiveGamesList";

function parseRouteGameId(routeGameId?: string) {
  if (!routeGameId) {
    return undefined;
  }

  const parsedId = Number(routeGameId);
  return Number.isFinite(parsedId) ? parsedId : undefined;
}

export default function NewLiveGamePage() {
  const { gameId } = useParams();
  const { t } = useTranslation("navigation");
  const routeGameId = parseRouteGameId(gameId);

  const {
    data: games = [],
    error: gamesError,
    isLoading: isLoadingGames,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const liveView = useMemo(
    () =>
      buildNewLiveGamesView({
        games,
        selectedGameId: routeGameId,
      }),
    [games, routeGameId]
  );

  const {
    data: liveState,
    error: liveStateError,
    isLoading: isLoadingLiveState,
  } = useQuery({
    queryKey: liveView.selectedGame
      ? queryKeys.gameLiveState(liveView.selectedGame.id)
      : ["gameLiveState", "none"],
    queryFn: () => getGameLiveState(liveView.selectedGame!.id),
    enabled: liveView.selectedGame !== null,
    refetchInterval: 15_000,
  });

  if (isLoadingGames) {
    return <LoadingState message={t("newUiPages.liveGame.loading")} />;
  }

  if (gamesError) {
    return <ErrorState message={t("newUiPages.liveGame.error")} />;
  }

  const shouldShowBoard = liveView.selectedGame !== null;
  const isBoardLoading = shouldShowBoard && isLoadingLiveState;
  const isSelectedGameLive = liveState?.status === "started";

  if (liveStateError) {
    return <ErrorState message={t("newUiPages.liveGame.liveStateError")} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography color="text.secondary" variant="overline">
            {t("newUiPages.liveGame.eyebrow")}
          </Typography>
          <Typography component="h1" gutterBottom variant="h4">
            {t("newUiPages.liveGame.heading")}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {t("newUiPages.liveGame.copy")}
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.5}>
              <Typography component="h2" fontWeight={800} variant="h6">
                {t("newUiPages.liveGame.listTitle")}
              </Typography>
              <NewLiveGamesList
                emptyLabel={t("newUiPages.liveGame.empty")}
                games={liveView.liveGames}
                selectedGameId={liveView.selectedGame?.id}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {isBoardLoading ? (
              <LoadingState message={t("newUiPages.liveGame.liveStateLoading")} />
            ) : liveView.selectedGame && liveState && isSelectedGameLive ? (
              <NewLiveGameBoard
                game={liveView.selectedGame}
                liveState={liveState}
              />
            ) : (
              <Paper
                elevation={0}
                sx={(theme) => ({
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                  color: "text.secondary",
                  p: { xs: 3, md: 5 },
                  textAlign: "center",
                })}
              >
                <Typography fontWeight={800} variant="h6">
                  {routeGameId === undefined
                    ? t("newUiPages.liveGame.empty")
                    : t("newUiPages.liveGame.requestedGameUnavailable")}
                </Typography>
                <Typography variant="body2">
                  {routeGameId === undefined
                    ? t("newUiPages.liveGame.emptyCopy")
                    : t("newUiPages.liveGame.requestedGameUnavailableCopy")}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
