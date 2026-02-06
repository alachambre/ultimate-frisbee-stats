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
import { getCompetition } from "../services";
import {
  getCompetitionPlayerStatistics,
  getCompetitionTeamStatistics,
  getCompetitionStrategyStatistics,
} from "../services/statistics";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import TeamStatistics from "../components/statistics/TeamStatistics";
import StrategyStatistics from "../components/statistics/StrategyStatistics";
import PlayerStatistics from "../components/statistics/PlayerStatistics";
import { queryKeys } from "../utils/queryKeys";

export default function CompetitionStatisticsPage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "common"]);
  const competitionIdNumber = Number(competitionId);
  const competitionIdValid = Number.isFinite(competitionIdNumber);

  const {
    data: competition,
    isLoading: isLoadingCompetition,
    error: competitionError,
  } = useQuery({
    queryKey: queryKeys.competition(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetition(competitionIdNumber),
    enabled: competitionIdValid,
  });

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionTeamStatistics(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetitionTeamStatistics(competitionIdNumber),
    enabled: competitionIdValid,
  });

  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionPlayerStatistics(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetitionPlayerStatistics(competitionIdNumber),
    enabled: competitionIdValid,
  });

  const {
    data: strategyStats,
    isLoading: isLoadingStrategyStats,
    error: strategyStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionStrategyStatistics(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetitionStrategyStatistics(competitionIdNumber),
    enabled: competitionIdValid,
  });

  if (isLoadingCompetition || isLoadingTeamStats || isLoadingPlayerStats || isLoadingStrategyStats) {
    return <LoadingState message={t("common:loading")} />;
  }

  if (competitionError || teamStatsError || playerStatsError || strategyStatsError || !competition) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}:{" "}
          {competitionError?.message ||
            teamStatsError?.message ||
            playerStatsError?.message ||
            strategyStatsError?.message}
        </Alert>
      </Container>
    );
  }

  const handleBack = () => {
    navigate(`/competitions/${competitionId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={`${competition.name} - ${t("statistics:page.competitionTitle")}`} />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t("statistics:page.backToCompetition")}
        </Button>
      </Box>

      {teamStats && <TeamStatistics teamStats={teamStats} />}
      {strategyStats && <StrategyStatistics strategyStats={strategyStats} />}
      {playerStats && <PlayerStatistics playerStats={playerStats} />}
    </Container>
  );
}
