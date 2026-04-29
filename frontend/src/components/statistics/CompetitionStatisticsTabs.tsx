import { useMemo, useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  PlayerGameStats,
  StrategyStatsBase,
  TeamEvolutionResponse,
  TeamStatsBase,
} from "../../types";
import PlayerStatistics from "./PlayerStatistics";
import StatisticsEvolutionTable from "./StatisticsEvolutionTable";
import StrategyStatistics from "./StrategyStatistics";
import TeamStatistics from "./TeamStatistics";

type CompetitionStatisticsTab = "team" | "evolution" | "strategies" | "players";
type TeamStatsScope = "team" | "competition" | "game";

interface CompetitionStatisticsTabsProps {
  teamStats?: TeamStatsBase;
  teamEvolution?: TeamEvolutionResponse;
  isLoadingTeamEvolution?: boolean;
  teamEvolutionError?: Error | null;
  strategyStats?: StrategyStatsBase;
  playerStats?: PlayerGameStats[];
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
  teamStats,
  teamEvolution,
  isLoadingTeamEvolution = false,
  teamEvolutionError = null,
  strategyStats,
  playerStats,
  teamStatsScope = "competition",
  canViewTeamStatistics = true,
  canViewStrategyStatistics = true,
  canViewPlayerStatistics = true,
}: CompetitionStatisticsTabsProps) {
  const { t } = useTranslation(["statistics", "common"]);
  const [requestedTab, setRequestedTab] = useState<CompetitionStatisticsTab>("team");

  const hasTeamData = hasTeamStatsData(teamStats);
  const hasEvolutionSurface = Boolean(
    teamEvolution || isLoadingTeamEvolution || teamEvolutionError
  );
  const hasStrategyData = hasStrategyStatsData(strategyStats);
  const hasPlayerData = Boolean(playerStats);

  const tabEnabledState = useMemo<Record<CompetitionStatisticsTab, boolean>>(
    () => ({
      team: canViewTeamStatistics && hasTeamData,
      evolution: canViewTeamStatistics && hasEvolutionSurface,
      strategies: canViewStrategyStatistics && hasStrategyData,
      players: canViewPlayerStatistics && hasPlayerData,
    }),
    [
      canViewPlayerStatistics,
      canViewStrategyStatistics,
      canViewTeamStatistics,
      hasEvolutionSurface,
      hasPlayerData,
      hasStrategyData,
      hasTeamData,
    ]
  );

  const activeTab = tabEnabledState[requestedTab]
    ? requestedTab
    : (TAB_ORDER.find((tab) => tabEnabledState[tab]) ?? "team");

  const renderNoData = () => (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {t("common:messages.noData")}
      </Typography>
    </Box>
  );

  return (
    <>
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, nextTab: CompetitionStatisticsTab) => setRequestedTab(nextTab)}
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

      {activeTab === "team" &&
        (hasTeamData && teamStats ? (
          <TeamStatistics
            teamStats={teamStats}
            showFieldSideStats={teamStatsScope === "game"}
          />
        ) : renderNoData())}

      {activeTab === "evolution" && (
        <StatisticsEvolutionTable
          evolution={teamEvolution}
          isLoading={isLoadingTeamEvolution}
          error={teamEvolutionError}
        />
      )}

      {activeTab === "strategies" &&
        (hasStrategyData && strategyStats ? (
          <StrategyStatistics strategyStats={strategyStats} />
        ) : (
          renderNoData()
        ))}

      {activeTab === "players" && (
        <PlayerStatistics
          playerStats={playerStats ?? []}
        />
      )}
    </>
  );
}
