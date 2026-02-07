import { Alert, Box, Container, Paper, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";
import StatisticsConfigurationPanel from "../components/statistics/StatisticsConfigurationPanel";
import CompetitionStatisticsTabs from "../components/statistics/CompetitionStatisticsTabs";
import PlayerScopeStatistics from "../components/statistics/PlayerScopeStatistics";
import StatisticsSectionContainer from "../components/statistics/StatisticsSectionContainer";
import { useStatisticsPageData } from "./hooks/useStatisticsPageData";

export default function StatisticsPage() {
  const { t } = useTranslation(["statistics", "games", "common"]);
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

  if (isLoadingTeams) {
    return <LoadingState message={t("common:loading")} />;
  }

  if (teamsError || !teams) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}: {teamsError?.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={t("statistics:page.globalTitle")} />

      <StatisticsConfigurationPanel
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
        }}
      />

      {controlsLoading && <LoadingState message={t("common:loading")} />}

      {!controlsLoading && controlsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t("common:error")}: {controlsError.message}
        </Alert>
      )}

      {!controlsLoading && !controlsError && teamId !== undefined && isScopeLoading && (
        <LoadingState message={t("common:loading")} />
      )}

      {!controlsLoading && !controlsError && teamId !== undefined && !isScopeLoading && scopeError && (
        <Alert severity="error">
          {t("common:error")}: {scopeError.message}
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
            <CompetitionStatisticsTabs
              teamStats={teamStats}
              strategyStats={teamStrategyStats}
              playerStats={teamPlayerStats}
              onPlayerClick={(nextPlayerId) => {
                updateSelection({
                  mode: "player",
                  playerId: nextPlayerId,
                });
              }}
            />
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
            <CompetitionStatisticsTabs
              teamStats={competitionTeamStats}
              strategyStats={competitionStrategyStats}
              playerStats={competitionPlayerStats}
              onPlayerClick={(nextPlayerId) => {
                updateSelection({
                  mode: "player",
                  playerId: nextPlayerId,
                });
              }}
            />
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
                onPlayerClick={(nextPlayerId) => {
                  updateSelection({
                    mode: "player",
                    playerId: nextPlayerId,
                  });
                }}
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
            <PlayerScopeStatistics
              playerName={selectedPlayer.name}
              playerNumber={selectedPlayer.number}
              teamName={selectedTeam?.name}
              scopeLabel={t("statistics:playerScope.team")}
              contextLabel={selectedTeam?.name}
              stats={selectedPlayerStats}
            />
          </StatisticsSectionContainer>
        )}
    </Container>
  );
}
