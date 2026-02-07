import { useMemo, useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PlayerGameStats, StrategyStatsBase, TeamStatsBase } from "../../types";
import PlayerStatistics from "./PlayerStatistics";
import StrategyStatistics from "./StrategyStatistics";
import TeamStatistics from "./TeamStatistics";

type CompetitionStatisticsTab = "team" | "strategies" | "players";

interface CompetitionStatisticsTabsProps {
  teamStats?: TeamStatsBase;
  strategyStats?: StrategyStatsBase;
  playerStats?: PlayerGameStats[];
}

const TAB_ORDER: CompetitionStatisticsTab[] = ["team", "strategies", "players"];

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
  strategyStats,
  playerStats,
}: CompetitionStatisticsTabsProps) {
  const { t } = useTranslation(["statistics", "common"]);
  const [requestedTab, setRequestedTab] = useState<CompetitionStatisticsTab>("team");

  const hasTeamData = hasTeamStatsData(teamStats);
  const hasStrategyData = hasStrategyStatsData(strategyStats);
  const hasPlayerData = Boolean(playerStats);

  const tabEnabledState = useMemo<Record<CompetitionStatisticsTab, boolean>>(
    () => ({
      team: hasTeamData,
      strategies: hasStrategyData,
      players: hasPlayerData,
    }),
    [hasPlayerData, hasStrategyData, hasTeamData]
  );

  const activeTab = tabEnabledState[requestedTab]
    ? requestedTab
    : (TAB_ORDER.find((tab) => tabEnabledState[tab]) ?? "players");

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
          <Tab value="team" label={t("statistics:workflow.team")} />
          <Tab value="strategies" label={t("statistics:workflow.strategies")} />
          <Tab value="players" label={t("statistics:workflow.players")} />
        </Tabs>
      </Box>

      {activeTab === "team" &&
        (hasTeamData && teamStats ? <TeamStatistics teamStats={teamStats} /> : renderNoData())}

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
