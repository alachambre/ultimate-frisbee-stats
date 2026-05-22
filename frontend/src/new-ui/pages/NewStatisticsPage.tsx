import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import CompetitionStatisticsTabs, {
  type CompetitionStatisticsTab,
} from "../../components/statistics/CompetitionStatisticsTabs";
import StatisticsConfigurationPanel from "../../components/statistics/StatisticsConfigurationPanel";
import StatisticsSectionContainer from "../../components/statistics/StatisticsSectionContainer";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import type { GameWithScore } from "../../types";
import { useStatisticsPageData } from "../../pages/hooks/useStatisticsPageData";
import NewStatisticsOverview from "../statistics/NewStatisticsOverview";
import { useNewUiTeam } from "../team/useNewUiTeam";

function buildScopeOverview(games: GameWithScore[]) {
  const endedGames = games.filter((game) => game.status === "ended");
  const wins = endedGames.filter(
    (game) => game.our_score > game.opponent_score
  ).length;
  const losses = endedGames.filter(
    (game) => game.our_score < game.opponent_score
  ).length;
  const draws = endedGames.filter(
    (game) => game.our_score === game.opponent_score
  ).length;

  return {
    gamesCount: games.length,
    record: {
      draws,
      losses,
      wins,
    },
  };
}

export default function NewStatisticsPage() {
  const auth = useAuth();
  const { t } = useTranslation(["navigation", "statistics", "common"]);
  const {
    selectedTeam: appSelectedTeam,
    selectedTeamId: appSelectedTeamId,
    setSelectedTeamId: setAppSelectedTeamId,
    isLoadingTeams: isLoadingAppTeams,
    teamsError: appTeamsError,
  } = useNewUiTeam();
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(false);
  const [activeStatisticsTab, setActiveStatisticsTab] =
    useState<CompetitionStatisticsTab>("team");
  const [isPlayerFilterOpen, setIsPlayerFilterOpen] = useState(false);

  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const statisticsAccess = useMemo(
    () => ({
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
    }),
    [
      auth.capabilities.canExportStatistics,
      auth.capabilities.canFilterStatisticsByPlayers,
      auth.capabilities.canViewPlayerStatistics,
      auth.capabilities.canViewStrategyStatistics,
      auth.capabilities.canViewTeamStatistics,
      shouldProtectUi,
    ]
  );

  const {
    teamId,
    playerIds,
    updateSelection,
    isExporting,
    handleExportCSV,
    isRefreshingStatistics,
    handleRefreshStatistics,

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

  useEffect(() => {
    if (appSelectedTeamId === undefined || teamId === appSelectedTeamId) {
      return;
    }

    updateSelection(
      {
        competitionIds: [],
        gameIds: [],
        playerIds: [],
        teamId: appSelectedTeamId,
      },
      { replace: true }
    );
  }, [appSelectedTeamId, teamId, updateSelection]);

  const overview = useMemo(
    () => buildScopeOverview(selectedDatasetGames),
    [selectedDatasetGames]
  );

  const statisticsContextItems = [
    selectedTeam?.name ?? appSelectedTeam?.name,
    selectedCompetitions.length === 1
      ? selectedCompetitions[0].name
      : selectedCompetitions.length > 1
        ? t("statistics:workflow.competitionsCount", {
            count: selectedCompetitions.length,
          })
        : undefined,
    selectedGames.length === 1
      ? selectedGames[0].opponent_name
      : selectedGames.length > 1
        ? t("statistics:workflow.gamesCount", { count: selectedGames.length })
        : undefined,
    selectedPlayers.length === 1
      ? selectedPlayers[0].name
      : selectedPlayers.length > 1
        ? t("statistics:workflow.playersCount", {
            count: selectedPlayers.length,
          })
        : undefined,
  ].filter((value): value is string => Boolean(value));

  if (auth.isLoading || isLoadingAppTeams || isLoadingTeams) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (appTeamsError || teamsError || !teams) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  const displayTeamName = appSelectedTeam?.name ?? selectedTeam?.name;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography color="text.secondary" variant="overline">
            {displayTeamName
              ? t("navigation:newUiPages.statistics.selectedTeamEyebrow", {
                  teamName: displayTeamName,
                })
              : t("navigation:newUiPages.statistics.globalEyebrow")}
          </Typography>
          <Typography component="h1" gutterBottom variant="h4">
            {t("navigation:newUiPages.statistics.heading")}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {t("navigation:newUiPages.statistics.copy")}
          </Typography>
        </Box>

        <StatisticsConfigurationPanel
          availableGames={availableGames}
          canFilterStatisticsByPlayers={
            statisticsAccess.canFilterStatisticsByPlayers
          }
          competitionsForTeam={competitionsForTeam}
          controlsLoading={controlsLoading}
          hasControlsError={Boolean(controlsError)}
          isConfigurationExpanded={isConfigurationExpanded}
          isPlayerOptionsLoading={isPlayerOptionsLoading}
          density="compact"
          onClearPlayersSelection={() => updateSelection({ playerIds: [] })}
          onPlayerFilterOpenChange={setIsPlayerFilterOpen}
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
          onSelectTeam={(nextTeamId) => {
            setAppSelectedTeamId(nextTeamId);
            updateSelection({
              competitionIds: [],
              gameIds: [],
              playerIds: [],
              teamId: nextTeamId,
            });
          }}
          onToggleConfigurationExpanded={() =>
            setIsConfigurationExpanded((currentValue) => !currentValue)
          }
          playersForTeam={playersForTeam}
          selectedCompetitions={selectedCompetitions}
          selectedGames={selectedGames}
          selectedPlayerIds={playerIds}
          selectedPlayers={selectedPlayers}
          sortedTeams={sortedTeams}
          summaryItems={statisticsContextItems}
          teamId={teamId}
        />

        {controlsLoading && (
          <LoadingState message={t("common:action.loading")} />
        )}

        {!controlsLoading && controlsError && (
          <Alert severity="error">
            {t("common:messages.error")}: {controlsError.message}
          </Alert>
        )}

        {!controlsLoading && !controlsError && teamId === undefined && (
          <Alert severity="info">
            {t("statistics:workflow.selectTeamPrompt")}
          </Alert>
        )}

        {!controlsLoading && !controlsError && teamId !== undefined && (
          <StatisticsSectionContainer
            canExport={canExport}
            isExporting={isExporting}
            isRefreshing={isRefreshingStatistics}
            onExport={handleExportCSV}
            onRefresh={handleRefreshStatistics}
            pathItems={statisticsContextItems}
          >
            <Stack spacing={3}>
              <Box>
                <Typography component="h2" fontWeight={800} gutterBottom variant="h6">
                  {t("navigation:newUiPages.statistics.overview.title")}
                </Typography>
                <NewStatisticsOverview
                  gamesCount={overview.gamesCount}
                  record={overview.record}
                  teamStats={teamStats}
                />
              </Box>

              <CompetitionStatisticsTabs
                activeTab={activeStatisticsTab}
                canViewPlayerStatistics={
                  statisticsAccess.canViewPlayerStatistics
                }
                canViewStrategyStatistics={
                  statisticsAccess.canViewStrategyStatistics
                }
                canViewTeamStatistics={statisticsAccess.canViewTeamStatistics}
                isLoadingPlayerStats={isLoadingTeamPlayerStats}
                isLoadingStrategyStats={isLoadingTeamStrategyStats}
                isLoadingTeamEvolution={isLoadingTeamEvolution}
                isLoadingTeamStats={isLoadingTeamStats}
                onTabChange={setActiveStatisticsTab}
                playerStats={teamPlayerStats}
                playerStatsError={teamPlayerStatsError}
                strategyStats={teamStrategyStats}
                strategyStatsError={teamStrategyStatsError}
                teamEvolution={teamEvolution}
                teamEvolutionError={teamEvolutionError}
                teamStats={teamStats}
                teamStatsError={teamStatsError}
                teamStatsScope={shouldShowFieldSideStats ? "game" : "team"}
              />
            </Stack>
          </StatisticsSectionContainer>
        )}
      </Stack>
    </Container>
  );
}
