import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Alert,
  Button,
  Box,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { getTeam } from "../services";
import {
  downloadTeamStatisticsCSV,
  getTeamPlayerStatistics,
  getTeamTeamStatistics,
  getTeamStrategyStatistics,
  type StatisticsExportDetailMode,
} from "../services/statistics";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import TeamStatistics from "../components/statistics/TeamStatistics";
import StrategyStatistics from "../components/statistics/StrategyStatistics";
import PlayerStatistics from "../components/statistics/PlayerStatistics";
import StatisticsExportMenuButton from "../components/statistics/StatisticsExportMenuButton";
import { queryKeys } from "../utils/queryKeys";

export default function TeamStatisticsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "common"]);
  const [isExporting, setIsExporting] = useState(false);
  const teamIdNumber = Number(teamId);
  const teamIdValid = Number.isFinite(teamIdNumber);

  const {
    data: team,
    isLoading: isLoadingTeam,
    error: teamError,
  } = useQuery({
    queryKey: queryKeys.team(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getTeam(teamIdNumber),
    enabled: teamIdValid,
  });

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.teamTeamStatistics(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getTeamTeamStatistics(teamIdNumber),
    enabled: teamIdValid,
  });

  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError,
  } = useQuery({
    queryKey: queryKeys.teamPlayerStatistics(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getTeamPlayerStatistics(teamIdNumber),
    enabled: teamIdValid,
  });

  const {
    data: strategyStats,
    isLoading: isLoadingStrategyStats,
    error: strategyStatsError,
  } = useQuery({
    queryKey: queryKeys.teamStrategyStatistics(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getTeamStrategyStatistics(teamIdNumber),
    enabled: teamIdValid,
  });

  if (isLoadingTeam || isLoadingTeamStats || isLoadingPlayerStats || isLoadingStrategyStats) {
    return <LoadingState message={t("common:loading")} />;
  }

  if (teamError || teamStatsError || playerStatsError || strategyStatsError || !team) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}:{" "}
          {teamError?.message ||
            teamStatsError?.message ||
            playerStatsError?.message ||
            strategyStatsError?.message}
        </Alert>
      </Container>
    );
  }

  const handleBack = () => {
    navigate(`/teams/${teamId}`);
  };

  const handleExportCSV = async (detailMode: StatisticsExportDetailMode) => {
    if (!team || !teamIdValid) return;

    setIsExporting(true);
    try {
      await downloadTeamStatisticsCSV(teamIdNumber, detailMode);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={`${team.name} - ${t("statistics:page.teamTitle")}`} />

      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t("statistics:page.backToTeam")}
        </Button>
        <Box sx={{ ml: "auto" }}>
          <StatisticsExportMenuButton
            disabled={!team}
            isExporting={isExporting}
            onExport={handleExportCSV}
          />
        </Box>
      </Box>

      {teamStats && <TeamStatistics teamStats={teamStats} />}
      {strategyStats && <StrategyStatistics strategyStats={strategyStats} />}
      {playerStats && <PlayerStatistics playerStats={playerStats} />}
    </Container>
  );
}
