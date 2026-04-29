import { useMemo } from "react";
import { Alert, Box, Tab, Tabs, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  PlayerGameStats,
  StrategyStatsBase,
  TeamEvolutionResponse,
  TeamStatsBase,
} from "../../types";
import LoadingState from "../shared/LoadingState";
import PlayerStatistics from "./PlayerStatistics";
import StatisticsEvolutionTable from "./StatisticsEvolutionTable";
import StrategyStatistics from "./StrategyStatistics";
import TeamStatistics from "./TeamStatistics";

export type CompetitionStatisticsTab = "team" | "evolution" | "strategies" | "players";
type TeamStatsScope = "team" | "competition" | "game";

interface CompetitionStatisticsTabsProps {
  activeTab: CompetitionStatisticsTab;
  onTabChange: (tab: CompetitionStatisticsTab) => void;
  teamStats?: TeamStatsBase;
  isLoadingTeamStats?: boolean;
  teamStatsError?: Error | null;
  teamEvolution?: TeamEvolutionResponse;
  isLoadingTeamEvolution?: boolean;
  teamEvolutionError?: Error | null;
  strategyStats?: StrategyStatsBase;
  isLoadingStrategyStats?: boolean;
  strategyStatsError?: Error | null;
  playerStats?: PlayerGameStats[];
  isLoadingPlayerStats?: boolean;
  playerStatsError?: Error | null;
  teamStatsScope?: TeamStatsScope;
  canViewTeamStatistics?: boolean;
  canViewStrategyStatistics?: boolean;
  canViewPlayerStatistics?: boolean;
}

const TAB_ORDER: CompetitionStatisticsTab[] = ["team", "evolution", "strategies", "players"];

function hasTeamStatsData(teamStats?: TeamStatsBase): boolean {
  return Boolean(teamStats && teamStats.total_completed_points > 0);
}

function hasStrategyStatsData(strategyStats?: StrategyStatsBase): boolean {
  if (!strategyStats) {
    return false;
  }

  return (
    strategyStats.offense_strategies.length > 0 ||
    strategyStats.defense_strategies.length > 0
  );
}

export default function CompetitionStatisticsTabs({
  activeTab,
  onTabChange,
  teamStats,
  isLoadingTeamStats = false,
  teamStatsError = null,
  teamEvolution,
  isLoadingTeamEvolution = false,
  teamEvolutionError = null,
  strategyStats,
  isLoadingStrategyStats = false,
  strategyStatsError = null,
  playerStats,
  isLoadingPlayerStats = false,
  playerStatsError = null,
  teamStatsScope = "competition",
  canViewTeamStatistics = true,
  canViewStrategyStatistics = true,
  canViewPlayerStatistics = true,
}: CompetitionStatisticsTabsProps) {
  const { t } = useTranslation(["statistics", "common"]);

  const hasTeamData = hasTeamStatsData(teamStats);
  const hasStrategyData = hasStrategyStatsData(strategyStats);

  const tabEnabledState = useMemo<Record<CompetitionStatisticsTab, boolean>>(
    () => ({
      team: canViewTeamStatistics,
      evolution: canViewTeamStatistics,
      strategies: canViewStrategyStatistics,
      players: canViewPlayerStatistics,
    }),
    [
      canViewPlayerStatistics,
      canViewStrategyStatistics,
      canViewTeamStatistics,
    ]
  );

  const visibleActiveTab = tabEnabledState[activeTab]
    ? activeTab
    : (TAB_ORDER.find((tab) => tabEnabledState[tab]) ?? "team");

  const renderNoData = () => (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {t("common:messages.noData")}
      </Typography>
    </Box>
  );

  const renderError = (error: Error) => (
    <Alert severity="error" sx={{ mb: 2 }}>
      {t("common:messages.error")}: {error.message}
    </Alert>
  );

  return (
    <>
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={visibleActiveTab}
          onChange={(_, nextTab: CompetitionStatisticsTab) => onTabChange(nextTab)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label={t("statistics:workflow.statisticsTabsAriaLabel")}
        >
          {canViewTeamStatistics && (
            <Tab value="team" label={t("statistics:workflow.team")} />
          )}
          {canViewTeamStatistics && (
            <Tab value="evolution" label={t("statistics:workflow.evolution")} />
          )}
          {canViewStrategyStatistics && (
            <Tab value="strategies" label={t("statistics:workflow.strategies")} />
          )}
          {canViewPlayerStatistics && (
            <Tab value="players" label={t("statistics:workflow.players")} />
          )}
        </Tabs>
      </Box>

      {visibleActiveTab === "team" &&
        (isLoadingTeamStats ? (
          <LoadingState showColdStartHint={false} />
        ) : teamStatsError ? (
          renderError(teamStatsError)
        ) : hasTeamData && teamStats ? (
          <TeamStatistics
            teamStats={teamStats}
            showFieldSideStats={teamStatsScope === "game"}
          />
        ) : renderNoData())}

      {visibleActiveTab === "evolution" && (
        <StatisticsEvolutionTable
          evolution={teamEvolution}
          isLoading={isLoadingTeamEvolution}
          error={teamEvolutionError}
        />
      )}

      {visibleActiveTab === "strategies" &&
        (isLoadingStrategyStats ? (
          <LoadingState showColdStartHint={false} />
        ) : strategyStatsError ? (
          renderError(strategyStatsError)
        ) : hasStrategyData && strategyStats ? (
          <StrategyStatistics strategyStats={strategyStats} />
        ) : (
          renderNoData()
        ))}

      {visibleActiveTab === "players" && (
        isLoadingPlayerStats ? (
          <LoadingState showColdStartHint={false} />
        ) : playerStatsError ? (
          renderError(playerStatsError)
        ) : (
        <PlayerStatistics
          playerStats={playerStats ?? []}
        />
        )
      )}
    </>
  );
}
