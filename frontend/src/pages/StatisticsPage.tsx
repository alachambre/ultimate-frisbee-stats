import { useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimelineIcon from "@mui/icons-material/Timeline";
import TuneIcon from "@mui/icons-material/Tune";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { shouldEnforcePermissions, useAuth } from "../auth";
import StatisticsConfigurationPanel from "../components/statistics/StatisticsConfigurationPanel";
import StatisticsExportMenuButton from "../components/statistics/StatisticsExportMenuButton";
import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import { useStatisticsPageData } from "./hooks/useStatisticsPageData";
import type { GameWithScore } from "../types";
import { parseStatisticsId } from "../utils/statisticsSelection";
import type { CompetitionStatisticsTab } from "../components/statistics/CompetitionStatisticsTabs";
import NewStatisticsCurrentStats from "../components/statistics/NewStatisticsCurrentStats";
import NewStatisticsEvolutionSection from "../components/statistics/NewStatisticsEvolutionSection";
import NewStatisticsPlayersSection from "../components/statistics/NewStatisticsPlayersSection";
import { useSelectedTeam } from "../components/team/useSelectedTeam";

interface DatasetRecord {
  draws: number;
  losses: number;
  wins: number;
}

interface SectionLink {
  href: string;
  icon: ReactNode;
  label: string;
}

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

function SectionHeading({
  description,
  meta,
  title,
}: {
  description: string;
  meta?: ReactNode;
  title: string;
}) {
  return (
    <Stack
      alignItems={{ xs: "flex-start", md: "center" }}
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      spacing={1.5}
    >
      <Box>
        <Typography component="h2" fontWeight={900} variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
      </Box>
      {meta}
    </Stack>
  );
}

function SectionNavigation({
  ariaLabel,
  links,
}: {
  ariaLabel: string;
  links: SectionLink[];
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 0.75,
      })}
    >
      <Stack
        component="nav"
        direction="row"
        spacing={0.75}
        sx={{
          overflowX: "auto",
          pb: 0.25,
        }}
        aria-label={ariaLabel}
      >
        {links.map((link) => (
          <Button
            component="a"
            href={link.href}
            key={link.href}
            startIcon={link.icon}
            sx={(theme) => ({
              color: theme.palette.text.secondary,
              flexShrink: 0,
              fontWeight: 850,
              minHeight: 40,
              px: 1.5,
              "&:hover": {
                bgcolor: theme.colors.newUi.primarySoft,
                color: theme.colors.newUi.primary,
              },
            })}
          >
            {link.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}

function ResultsMeta({ record }: { record: DatasetRecord }) {
  const { t } = useTranslation(["statistics", "games"]);

  return (
    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
      <Chip
        label={t("statistics:newUi.currentStats.winsCount", {
          count: record.wins,
        })}
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.dark,
          fontWeight: 900,
        })}
      />
      <Chip
        label={t("statistics:newUi.currentStats.lossesCount", {
          count: record.losses,
        })}
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.error.main, 0.08),
          color: theme.palette.error.main,
          fontWeight: 900,
        })}
      />
      {record.draws > 0 && (
        <Chip
          label={t("statistics:newUi.currentStats.drawsCount", {
            count: record.draws,
          })}
          sx={{ fontWeight: 900 }}
        />
      )}
    </Stack>
  );
}

export default function StatisticsPage() {
  const auth = useAuth();
  const { t } = useTranslation(["statistics", "common"]);
  const {
    selectedTeam: appSelectedTeam,
    selectedTeamId: appSelectedTeamId,
    teams: appTeams,
    setSelectedTeamId: setAppSelectedTeamId,
    isLoadingTeams: isLoadingAppTeams,
    teamsError: appTeamsError,
  } = useSelectedTeam();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(true);
  const [isPlayerFilterOpen, setIsPlayerFilterOpen] = useState(false);
  const legacyTeamId = useMemo(
    () => parseStatisticsId(searchParams.get("teamId")),
    [searchParams]
  );

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
  const enabledTabs = useMemo<CompetitionStatisticsTab[]>(() => {
    const tabs: CompetitionStatisticsTab[] = [];

    if (statisticsAccess.canViewTeamStatistics) {
      tabs.push("team", "evolution");
    }
    if (statisticsAccess.canViewStrategyStatistics) {
      tabs.push("strategies");
    }
    if (statisticsAccess.canViewPlayerStatistics) {
      tabs.push("players");
    }

    return tabs;
  }, [
    statisticsAccess.canViewPlayerStatistics,
    statisticsAccess.canViewStrategyStatistics,
    statisticsAccess.canViewTeamStatistics,
  ]);

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
    activeTab: "team",
    controlledTeamId: appSelectedTeamId,
    controlledTeams: appTeams,
    enabledTabs,
    isTeamSelectionControlled: true,
    isPlayerFilterOpen,
  });

  useEffect(() => {
    if (legacyTeamId === undefined || isLoadingAppTeams) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("teamId");

    if (appTeams.some((team) => team.id === legacyTeamId)) {
      if (appSelectedTeamId !== legacyTeamId) {
        setAppSelectedTeamId(legacyTeamId);
      }
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [
    appSelectedTeamId,
    appTeams,
    isLoadingAppTeams,
    legacyTeamId,
    searchParams,
    setAppSelectedTeamId,
    setSearchParams,
  ]);

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
  const displayTeamName = selectedTeam?.name ?? appSelectedTeam?.name;
  const sectionLinks: SectionLink[] = [
    {
      href: "#configuration",
      icon: <TuneIcon fontSize="small" />,
      label: t("statistics:workflow.configurationSection"),
    },
    {
      href: "#current-stats",
      icon: <DashboardIcon fontSize="small" />,
      label: t("statistics:newUi.sections.currentStats"),
    },
    {
      href: "#evolution",
      icon: <TimelineIcon fontSize="small" />,
      label: t("statistics:workflow.evolution"),
    },
    ...(statisticsAccess.canViewPlayerStatistics
      ? [
          {
            href: "#players",
            icon: <GroupsIcon fontSize="small" />,
            label: t("statistics:workflow.players"),
          },
        ]
      : []),
  ];

  if (auth.isLoading || isLoadingAppTeams || isLoadingTeams) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (appTeamsError || teamsError || !teams) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3.5}>
        <Stack
          alignItems={{ xs: "flex-start", md: "flex-end" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ maxWidth: 760 }}>
            <Typography color="text.secondary" variant="overline">
              {displayTeamName
                ? t("statistics:newUi.page.selectedTeamEyebrow", {
                    teamName: displayTeamName,
                  })
                : t("statistics:newUi.page.globalEyebrow")}
            </Typography>
            <Typography component="h1" gutterBottom variant="h4">
              {t("statistics:newUi.page.heading")}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {t("statistics:newUi.page.copy")}
            </Typography>
          </Box>

          <Stack
            alignItems={{ xs: "stretch", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <Button
              disabled={isRefreshingStatistics || teamId === undefined}
              onClick={handleRefreshStatistics}
              startIcon={
                isRefreshingStatistics ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <RefreshIcon />
                )
              }
              variant="outlined"
            >
              {isRefreshingStatistics
                ? t("statistics:workflow.refreshingStatistics")
                : t("statistics:workflow.refreshStatistics")}
            </Button>
            {canExport && (
              <StatisticsExportMenuButton
                isExporting={isExporting}
                onExport={handleExportCSV}
              />
            )}
          </Stack>
        </Stack>

        <SectionNavigation
          ariaLabel={t("statistics:workflow.statisticsTabsAriaLabel")}
          links={sectionLinks}
        />

        <Box component="section" id="configuration">
          <StatisticsConfigurationPanel
            availableGames={availableGames}
            canFilterStatisticsByPlayers={
              statisticsAccess.canFilterStatisticsByPlayers
            }
            competitionsForTeam={competitionsForTeam}
            controlsLoading={controlsLoading}
            density="compact"
            hasControlsError={Boolean(controlsError)}
            isConfigurationExpanded={isConfigurationExpanded}
            isPlayerOptionsLoading={isPlayerOptionsLoading}
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
            onToggleConfigurationExpanded={() =>
              setIsConfigurationExpanded((currentValue) => !currentValue)
            }
            playersForTeam={playersForTeam}
            selectedCompetitions={selectedCompetitions}
            selectedGames={selectedGames}
            selectedPlayerIds={playerIds}
            selectedPlayers={selectedPlayers}
            showTeamSelector={false}
            summaryItems={statisticsContextItems}
            teamId={teamId}
          />
        </Box>

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
          <>
            <Box component="section" id="current-stats">
              <Stack spacing={2}>
                <SectionHeading
                  description={t("statistics:newUi.currentStats.description")}
                  meta={
                    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                      <Chip
                        label={t("statistics:newUi.currentStats.completedPoints", {
                          count: teamStats?.total_completed_points ?? 0,
                        })}
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primarySoft,
                          color: theme.colors.newUi.primary,
                          fontWeight: 900,
                        })}
                      />
                      <ResultsMeta record={overview.record} />
                    </Stack>
                  }
                  title={t("statistics:newUi.sections.currentStats")}
                />

                {teamStatsError ? (
                  <Alert severity="error">
                    {t("common:messages.error")}: {teamStatsError.message}
                  </Alert>
                ) : (
                  <NewStatisticsCurrentStats
                    gamesCount={overview.gamesCount}
                    isLoadingStrategyStats={isLoadingTeamStrategyStats}
                    isLoadingTeamStats={isLoadingTeamStats}
                    record={overview.record}
                    showFieldSideStats={selectedGames.length === 1}
                    strategyStats={teamStrategyStats}
                    teamStats={teamStats}
                  />
                )}

                {teamStrategyStatsError && (
                  <Alert severity="warning">
                    {t("statistics:newUi.currentStats.strategyError")}:{" "}
                    {teamStrategyStatsError.message}
                  </Alert>
                )}
              </Stack>
            </Box>

            <Box component="section" id="evolution">
              <Stack spacing={2}>
                <SectionHeading
                  description={t("statistics:newUi.evolution.description")}
                  meta={
                    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                      <Chip
                        label={t("statistics:newUi.evolution.completedGames", {
                          count: teamEvolution?.games.length ?? 0,
                        })}
                        sx={{ fontWeight: 900 }}
                      />
                      {(teamEvolution?.omitted_games_count ?? 0) > 0 && (
                        <Chip
                          label={t("statistics:evolution.omittedGames", {
                            count: teamEvolution?.omitted_games_count ?? 0,
                          })}
                          sx={(theme) => ({
                            bgcolor: alpha(theme.colors.performance.low, 0.1),
                            color: theme.colors.performance.low,
                            fontWeight: 900,
                          })}
                        />
                      )}
                    </Stack>
                  }
                  title={t("statistics:workflow.evolution")}
                />
                <NewStatisticsEvolutionSection
                  error={teamEvolutionError}
                  evolution={teamEvolution}
                  isLoading={isLoadingTeamEvolution}
                />
              </Stack>
            </Box>

            {statisticsAccess.canViewPlayerStatistics && (
              <Box component="section" id="players">
                <Stack spacing={2}>
                  <SectionHeading
                    description={t("statistics:newUi.players.description")}
                    meta={
                      <Chip
                        label={t("statistics:workflow.playersCount", {
                          count: teamPlayerStats?.length ?? 0,
                        })}
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primarySoft,
                          color: theme.colors.newUi.primary,
                          fontWeight: 900,
                        })}
                      />
                    }
                    title={t("statistics:workflow.players")}
                  />
                  <NewStatisticsPlayersSection
                    error={teamPlayerStatsError}
                    isLoading={isLoadingTeamPlayerStats}
                    players={teamPlayerStats}
                  />
                </Stack>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
