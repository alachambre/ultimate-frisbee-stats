import { useMemo } from "react";
import { Alert, Box, Stack, Tab, Tabs, Typography } from "@mui/material";
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
  summaryVariant?: "none" | "compact";
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

interface SummaryItem {
  label: string;
  value: number;
}

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

function CompactSummaryStrip({ items }: { items: SummaryItem[] }) {
  const { t } = useTranslation("statistics");

  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      aria-label={t("workflow.tabSummary")}
      sx={{
        mb: 2,
        overflowX: "auto",
        pb: 0.5,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          minWidth: "max-content",
        }}
      >
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{
              alignItems: "baseline",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              gap: 0.75,
              px: 1.25,
              py: 0.75,
            }}
          >
            <Typography component="span" fontWeight={800} variant="body2">
              {item.value}
            </Typography>
            <Typography component="span" color="text.secondary" variant="caption">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function CompetitionStatisticsTabs({
  activeTab,
  onTabChange,
  summaryVariant = "none",
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

  const summaryItems = useMemo<SummaryItem[]>(() => {
    if (summaryVariant !== "compact") {
      return [];
    }

    if (visibleActiveTab === "team" && teamStats) {
      return [
        {
          label: t("statistics:teamStats.totalPoints"),
          value: teamStats.total_completed_points,
        },
        {
          label: t("statistics:teamStats.offensePoints"),
          value: teamStats.offense.points_started,
        },
        {
          label: t("statistics:teamStats.defensePoints"),
          value: teamStats.defense.points_started,
        },
      ];
    }

    if (visibleActiveTab === "evolution" && teamEvolution) {
      return [
        {
          label: t("statistics:workflow.completedGames"),
          value: teamEvolution.games.length,
        },
        {
          label: t("statistics:workflow.omittedGames"),
          value: teamEvolution.omitted_games_count,
        },
      ];
    }

    if (visibleActiveTab === "strategies" && strategyStats) {
      return [
        {
          label: t("statistics:strategyStats.offenseStrategies"),
          value: strategyStats.offense_strategies.length,
        },
        {
          label: t("statistics:strategyStats.defenseStrategies"),
          value: strategyStats.defense_strategies.length,
        },
      ];
    }

    if (visibleActiveTab === "players" && playerStats) {
      return [
        {
          label: t("statistics:playerStats.playersCount"),
          value: playerStats.length,
        },
      ];
    }

    return [];
  }, [
    playerStats,
    strategyStats,
    summaryVariant,
    t,
    teamEvolution,
    teamStats,
    visibleActiveTab,
  ]);

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

      <CompactSummaryStrip items={summaryItems} />

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
