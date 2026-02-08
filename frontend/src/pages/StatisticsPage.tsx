import { useEffect, useRef, useState } from "react";
import { Alert, Box, Container, Divider, Paper, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";
import StatisticsConfigurationPanel from "../components/statistics/StatisticsConfigurationPanel";
import CompetitionStatisticsTabs from "../components/statistics/CompetitionStatisticsTabs";
import PlayerScopeStatistics from "../components/statistics/PlayerScopeStatistics";
import StatisticsSectionContainer from "../components/statistics/StatisticsSectionContainer";
import type { GameWithScore } from "../types";
import { useStatisticsPageData } from "./hooks/useStatisticsPageData";

export default function StatisticsPage() {
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(true);
  const [shouldScrollToPlayerStats, setShouldScrollToPlayerStats] = useState(false);
  const playerStatisticsTopRef = useRef<HTMLDivElement | null>(null);
  const {
    mode,
    teamId,
    competitionId,
    gameId,
    playerId,
    activeScope,
    updateSelection,
    isExporting,
    handleExportCSV,

    teams,
    isLoadingTeams,
    teamsError,
    selectedTeam,
    sortedTeams,

    competitionsForTeam,
    teamGames,
    selectedCompetition,
    gamesForCompetition,
    selectedGame,
    playersForTeam,
    selectedPlayer,
    selectedPlayerStats,
    playerStatsById,
    statisticsPathItems,

    controlsLoading,
    controlsError,
    isScopeLoading,
    scopeError,
    canExport,
    competitionFlowDisabled,
    playerFlowDisabled,

    teamStats,
    teamPlayerStats,
    teamStrategyStats,
    competitionTeamStats,
    competitionPlayerStats,
    competitionStrategyStats,
    gameTeamStats,
    gamePlayerStats,
    gameStrategyStats,
  } = useStatisticsPageData();

  const buildScopeOverview = (games: GameWithScore[]) => {
    const endedGames = games.filter((game) => game.status === "ended");
    const wins = endedGames.filter((game) => game.our_score > game.opponent_score).length;
    const losses = endedGames.filter((game) => game.our_score < game.opponent_score).length;
    const draws = endedGames.filter((game) => game.our_score === game.opponent_score).length;
    const decidedGames = wins + losses;

    return {
      gamesCount: games.length,
      wins,
      losses,
      draws,
      winRate: decidedGames > 0 ? wins / decidedGames : 0,
    };
  };

  const teamScopeOverview = buildScopeOverview(teamGames);
  const competitionScopeOverview = buildScopeOverview(gamesForCompetition);

  const isMobileViewport =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width:600px)").matches;

  useEffect(() => {
    if (!shouldScrollToPlayerStats || !isMobileViewport) {
      return;
    }

    const canScrollToPlayerStats =
      !controlsLoading &&
      !controlsError &&
      teamId !== undefined &&
      !isScopeLoading &&
      !scopeError &&
      activeScope === "player" &&
      selectedPlayer &&
      selectedPlayerStats;

    if (!canScrollToPlayerStats) {
      return;
    }

    window.setTimeout(() => {
      playerStatisticsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setShouldScrollToPlayerStats(false);
    }, 140);
  }, [
    shouldScrollToPlayerStats,
    isMobileViewport,
    controlsLoading,
    controlsError,
    teamId,
    isScopeLoading,
    scopeError,
    activeScope,
    selectedPlayer,
    selectedPlayerStats,
  ]);

  if (isLoadingTeams) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (teamsError || !teams) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:messages.error")}: {teamsError?.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={t("statistics:page.globalTitle")} />

      <StatisticsConfigurationPanel
        isConfigurationExpanded={isConfigurationExpanded}
        onToggleConfigurationExpanded={() =>
          setIsConfigurationExpanded((prev) => !prev)
        }
        mode={mode}
        teamId={teamId}
        competitionId={competitionId}
        gameId={gameId}
        playerId={playerId}
        sortedTeams={sortedTeams}
        competitionsForTeam={competitionsForTeam}
        gamesForCompetition={gamesForCompetition}
        playersForTeam={playersForTeam}
        playerStatsById={playerStatsById}
        controlsLoading={controlsLoading}
        hasControlsError={Boolean(controlsError)}
        competitionFlowDisabled={competitionFlowDisabled}
        playerFlowDisabled={playerFlowDisabled}
        onSelectMode={(nextMode) => {
          if (nextMode === "competition") {
            updateSelection({
              mode: "competition",
              playerId: undefined,
            });
            return;
          }

          updateSelection({
            mode: "player",
            competitionId: undefined,
            gameId: undefined,
          });
        }}
        onSelectTeam={(nextTeamId) => {
          updateSelection({
            teamId: nextTeamId,
            competitionId: undefined,
            gameId: undefined,
            playerId: undefined,
          });
        }}
        onSelectCompetition={(nextCompetitionId) => {
          updateSelection({
            competitionId: nextCompetitionId,
            gameId: undefined,
          });
        }}
        onSelectGame={(nextGameId) => {
          updateSelection({ gameId: nextGameId });
        }}
        onSelectPlayer={(nextPlayerId) => {
          updateSelection({ playerId: nextPlayerId });

          if (mode === "player" && isMobileViewport) {
            setIsConfigurationExpanded(false);
            setShouldScrollToPlayerStats(true);
          }
        }}
      />

      <Box>
        {controlsLoading && <LoadingState message={t("common:action.loading")} />}

        {!controlsLoading && controlsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t("common:messages.error")}: {controlsError.message}
          </Alert>
        )}

        {!controlsLoading && !controlsError && teamId !== undefined && isScopeLoading && (
          <LoadingState message={t("common:action.loading")} />
        )}

        {!controlsLoading && !controlsError && teamId !== undefined && !isScopeLoading && scopeError && (
          <Alert severity="error">
            {t("common:messages.error")}: {scopeError.message}
          </Alert>
        )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "team" && (
            <StatisticsSectionContainer
              pathItems={statisticsPathItems}
              canExport={canExport}
              isExporting={isExporting}
              onExport={handleExportCSV}
            >
              <>
                <Paper sx={{ mb: 3 }}>
                  <Box p={4} textAlign="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedTeam?.name || "-"}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="center" gap={4}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t("statistics:teamStats.gamesCount")}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {teamScopeOverview.gamesCount}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t("statistics:teamStats.winLossRatio")}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {teamScopeOverview.wins}/{teamScopeOverview.losses}
                        </Typography>
                        {teamScopeOverview.draws > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t("games:status.draw")}: {teamScopeOverview.draws}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                <CompetitionStatisticsTabs
                  teamStats={teamStats}
                  strategyStats={teamStrategyStats}
                  playerStats={teamPlayerStats}
                />
              </>
            </StatisticsSectionContainer>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "competition" && (
            <StatisticsSectionContainer
              pathItems={statisticsPathItems}
              canExport={canExport}
              isExporting={isExporting}
              onExport={handleExportCSV}
            >
              <>
                <Paper sx={{ mb: 3 }}>
                  <Box p={4} textAlign="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedCompetition?.name || "-"}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="center" gap={4}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t("statistics:teamStats.gamesCount")}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {competitionScopeOverview.gamesCount}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t("statistics:teamStats.winLossRatio")}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {competitionScopeOverview.wins}/{competitionScopeOverview.losses}
                        </Typography>
                        {competitionScopeOverview.draws > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t("games:status.draw")}: {competitionScopeOverview.draws}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                <CompetitionStatisticsTabs
                  teamStats={competitionTeamStats}
                  strategyStats={competitionStrategyStats}
                  playerStats={competitionPlayerStats}
                />
              </>
            </StatisticsSectionContainer>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "game" &&
          selectedGame && (
            <StatisticsSectionContainer
              pathItems={statisticsPathItems}
              canExport={canExport}
              isExporting={isExporting}
              onExport={handleExportCSV}
            >
              <>
                <Paper sx={{ mb: 3 }}>
                  <Box p={4} textAlign="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedCompetition?.name || "-"}
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {selectedGame.status === "ended"
                        ? t("games:detail.finalScore")
                        : t("games:detail.score")}
                    </Typography>
                    <Typography variant="h2" fontWeight="bold">
                      {selectedGame.our_score} - {selectedGame.opponent_score}
                    </Typography>

                    {selectedGame.start_datetime && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t("games:detail.gameDuration")}
                        </Typography>
                        <GameTimer
                          startDatetime={selectedGame.start_datetime}
                          endDatetime={selectedGame.end_datetime}
                        />
                      </Box>
                    )}
                  </Box>
                </Paper>

                <CompetitionStatisticsTabs
                  teamStats={gameTeamStats}
                  strategyStats={gameStrategyStats}
                  playerStats={gamePlayerStats}
                />
              </>
            </StatisticsSectionContainer>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          mode === "player" &&
          playerId === undefined && (
            <Alert severity="info">{t("statistics:workflow.choosePlayerPrompt")}</Alert>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "player" &&
          !selectedPlayer && (
            <Alert severity="info">{t("statistics:workflow.playerNotFound")}</Alert>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "player" &&
          selectedPlayer &&
          !selectedPlayerStats && (
            <Alert severity="info">{t("statistics:playerStats.noDataForScope")}</Alert>
          )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined &&
          !isScopeLoading &&
          !scopeError &&
          activeScope === "player" &&
          selectedPlayer &&
          selectedPlayerStats && (
            <StatisticsSectionContainer
              pathItems={statisticsPathItems}
              canExport={canExport}
              isExporting={isExporting}
              onExport={handleExportCSV}
            >
              <Box ref={playerStatisticsTopRef} sx={{ scrollMarginTop: { xs: 12, sm: 16 } }}>
                <PlayerScopeStatistics
                  playerName={selectedPlayer.name}
                  playerNumber={selectedPlayer.number}
                  teamName={selectedTeam?.name}
                  scopeLabel={t("statistics:playerScope.team")}
                  contextLabel={selectedTeam?.name}
                  stats={selectedPlayerStats}
                />
              </Box>
            </StatisticsSectionContainer>
          )}
      </Box>
    </Container>
  );
}
