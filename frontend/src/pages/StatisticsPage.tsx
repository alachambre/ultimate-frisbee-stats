import { lazy, Suspense, useState } from "react";
import { Alert, Box, Container, Divider, Paper, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";
import StatisticsConfigurationPanel from "../components/statistics/StatisticsConfigurationPanel";
import CompetitionStatisticsTabs, {
  type CompetitionStatisticsTab,
} from "../components/statistics/CompetitionStatisticsTabs";
import StatisticsSectionContainer from "../components/statistics/StatisticsSectionContainer";
import type { GameWithScore } from "../types";
import { useStatisticsPageData } from "./hooks/useStatisticsPageData";
import { shouldEnforcePermissions, useAuth } from "../auth";

const GameTrendsSection = lazy(() => import("../components/statistics/GameTrendsSection"));

function buildScopeOverview(games: GameWithScore[]) {
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
}

export default function StatisticsPage() {
  const auth = useAuth();
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(true);
  const [activeStatisticsTab, setActiveStatisticsTab] =
    useState<CompetitionStatisticsTab>("team");
  const [isPlayerFilterOpen, setIsPlayerFilterOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const statisticsAccess = {
    canViewTeamStatistics:
      !shouldProtectUi || auth.capabilities.canViewTeamStatistics,
    canViewStrategyStatistics:
      !shouldProtectUi || auth.capabilities.canViewStrategyStatistics,
    canViewPlayerStatistics:
      !shouldProtectUi || auth.capabilities.canViewPlayerStatistics,
    canFilterStatisticsByPlayers:
      !shouldProtectUi || auth.capabilities.canFilterStatisticsByPlayers,
    canExportStatistics:
      !shouldProtectUi || auth.capabilities.canExportStatistics,
  };
  const {
    teamId,
    playerIds,
    updateSelection,
    isExporting,
    handleExportCSV,

    teams,
    isLoadingTeams,
    teamsError,
    selectedTeam,
    sortedTeams,

    competitionsForTeam,
    selectedCompetitions,
    availableGames,
    selectedGames,
    selectedDatasetGames,
    playersForTeam,
    selectedPlayers,

    controlsLoading,
    isPlayerOptionsLoading,
    controlsError,
    canExport,
    shouldShowFieldSideStats,
    gamePointTimeline,
    isLoadingGamePointTimeline,
    gamePointTimelineError,

    teamStats,
    isLoadingTeamStats,
    teamStatsError,
    teamEvolution,
    isLoadingTeamEvolution,
    teamEvolutionError,
    teamPlayerStats,
    isLoadingTeamPlayerStats,
    teamPlayerStatsError,
    teamStrategyStats,
    isLoadingTeamStrategyStats,
    teamStrategyStatsError,
  } = useStatisticsPageData(statisticsAccess, {
    activeTab: activeStatisticsTab,
    isPlayerFilterOpen,
  });

  const datasetOverview = buildScopeOverview(selectedDatasetGames);
  const selectedSingleGame = selectedGames.length === 1 ? selectedGames[0] : undefined;
  const selectedSingleCompetition =
    selectedCompetitions.length === 1 ? selectedCompetitions[0] : undefined;

  const statisticsContextItems = [
    selectedTeam?.name,
    selectedCompetitions.length === 1
      ? selectedCompetitions[0].name
      : selectedCompetitions.length > 1
        ? t("statistics:workflow.competitionsCount", { count: selectedCompetitions.length })
        : undefined,
    selectedGames.length === 1
      ? selectedGames[0].opponent_name
      : selectedGames.length > 1
        ? t("statistics:workflow.gamesCount", { count: selectedGames.length })
        : undefined,
    selectedPlayers.length === 1
      ? selectedPlayers[0].name
      : selectedPlayers.length > 1
        ? t("statistics:workflow.playersCount", { count: selectedPlayers.length })
        : undefined,
  ].filter((value): value is string => Boolean(value));

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
        teamId={teamId}
        selectedPlayerIds={playerIds}
        sortedTeams={sortedTeams}
        competitionsForTeam={competitionsForTeam}
        selectedCompetitions={selectedCompetitions}
        availableGames={availableGames}
        selectedGames={selectedGames}
        playersForTeam={playersForTeam}
        selectedPlayers={selectedPlayers}
        canFilterStatisticsByPlayers={statisticsAccess.canFilterStatisticsByPlayers}
        controlsLoading={controlsLoading}
        isPlayerOptionsLoading={isPlayerOptionsLoading}
        hasControlsError={Boolean(controlsError)}
        onSelectTeam={(nextTeamId) => {
          updateSelection({
            teamId: nextTeamId,
            competitionIds: [],
            gameIds: [],
            playerIds: [],
          });
        }}
        onSelectCompetitionIds={(nextCompetitionIds) => {
          updateSelection({
            competitionIds: nextCompetitionIds,
          });
        }}
        onSelectGameIds={(nextGameIds) => {
          updateSelection({ gameIds: nextGameIds });
        }}
        onSelectPlayerIds={(nextPlayerIds) => {
          updateSelection({ playerIds: nextPlayerIds });
        }}
        onClearPlayersSelection={() => updateSelection({ playerIds: [] })}
        onPlayerFilterOpenChange={setIsPlayerFilterOpen}
      />

      <Box>
        {controlsLoading && <LoadingState message={t("common:action.loading")} />}

        {!controlsLoading && controlsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t("common:messages.error")}: {controlsError.message}
          </Alert>
        )}

        {!controlsLoading && !controlsError && teamId === undefined && (
          <Alert severity="info">{t("statistics:workflow.selectTeamPrompt")}</Alert>
        )}

        {!controlsLoading &&
          !controlsError &&
          teamId !== undefined && (
            <StatisticsSectionContainer
              pathItems={statisticsContextItems}
              canExport={canExport}
              isExporting={isExporting}
              onExport={handleExportCSV}
            >
              <>
                <Paper sx={{ mb: 3 }}>
                  {selectedSingleGame ? (
                    <>
                      <Box p={4} textAlign="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                          <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="body2" color="text.secondary">
                            {selectedSingleGame.competition_name}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {selectedSingleGame.status === "ended"
                            ? t("games:detail.finalScore")
                            : t("games:detail.score")}
                        </Typography>
                        <Typography variant="h2" fontWeight="bold">
                          {selectedSingleGame.our_score} - {selectedSingleGame.opponent_score}
                        </Typography>

                        {selectedSingleGame.start_datetime && (
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {t("games:detail.gameDuration")}
                            </Typography>
                            <GameTimer
                              startDatetime={selectedSingleGame.start_datetime}
                              endDatetime={selectedSingleGame.end_datetime}
                            />
                          </Box>
                        )}
                      </Box>

                      <Divider />
                      <Suspense fallback={<LoadingState showColdStartHint={false} />}>
                        <GameTrendsSection
                          timeline={gamePointTimeline}
                          isLoading={isLoadingGamePointTimeline}
                          error={gamePointTimelineError}
                          embedded
                          teamName={selectedSingleGame.team_name}
                          opponentName={selectedSingleGame.opponent_name}
                        />
                      </Suspense>
                    </>
                  ) : (
                    <Box p={4} textAlign="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                        <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedSingleCompetition?.name ?? selectedTeam?.name ?? "-"}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="center" gap={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {t("statistics:teamStats.gamesCount")}
                          </Typography>
                          <Typography variant="h3" fontWeight="bold">
                            {datasetOverview.gamesCount}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {t("statistics:teamStats.winLossRatio")}
                          </Typography>
                          <Typography variant="h3" fontWeight="bold">
                            {datasetOverview.wins}/{datasetOverview.losses}
                          </Typography>
                          {datasetOverview.draws > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {t("games:status.draw")}: {datasetOverview.draws}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>

                <CompetitionStatisticsTabs
                  activeTab={activeStatisticsTab}
                  onTabChange={setActiveStatisticsTab}
                  teamStats={teamStats}
                  isLoadingTeamStats={isLoadingTeamStats}
                  teamStatsError={teamStatsError}
                  teamEvolution={teamEvolution}
                  isLoadingTeamEvolution={isLoadingTeamEvolution}
                  teamEvolutionError={teamEvolutionError}
                  strategyStats={teamStrategyStats}
                  isLoadingStrategyStats={isLoadingTeamStrategyStats}
                  strategyStatsError={teamStrategyStatsError}
                  playerStats={teamPlayerStats}
                  isLoadingPlayerStats={isLoadingTeamPlayerStats}
                  playerStatsError={teamPlayerStatsError}
                  teamStatsScope={shouldShowFieldSideStats ? "game" : "team"}
                  canViewTeamStatistics={statisticsAccess.canViewTeamStatistics}
                  canViewStrategyStatistics={statisticsAccess.canViewStrategyStatistics}
                  canViewPlayerStatistics={statisticsAccess.canViewPlayerStatistics}
                />
              </>
            </StatisticsSectionContainer>
          )}
      </Box>
    </Container>
  );
}
