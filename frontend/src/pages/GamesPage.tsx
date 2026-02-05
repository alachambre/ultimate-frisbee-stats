import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Container, Box, FormControl, InputLabel, Select, MenuItem, Stack } from "@mui/material";
import { getAllGames, getTeams, getCompetitions } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import GamesGrid from "../components/games/GamesGrid";
import EmptyGamesState from "../components/games/EmptyGamesState";
import CreateGameModal from "../components/modals/CreateGameModal";
import { queryKeys } from "../utils/queryKeys";

export default function GamesPage() {
  const { t } = useTranslation(["games", "common"]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "all">("all");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | "all">("all");

  const {
    data: games,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
  });

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => getTeams(),
  });

  const { data: competitions } = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: () => getCompetitions(),
  });

  // Filter competitions by selected team
  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    if (selectedTeamId === "all") return competitions;
    return competitions.filter((c) => c.team_id === selectedTeamId);
  }, [competitions, selectedTeamId]);

  // Filter games by team and competition
  const filteredGames = useMemo(() => {
    if (!games) return [];
    let result = games;

    // Filter by team (through competition)
    if (selectedTeamId !== "all") {
      const teamCompetitionIds = new Set(
        competitions?.filter((c) => c.team_id === selectedTeamId).map((c) => c.id) || []
      );
      result = result.filter((g) => teamCompetitionIds.has(g.competition_id));
    }

    // Filter by competition
    if (selectedCompetitionId !== "all") {
      result = result.filter((g) => g.competition_id === selectedCompetitionId);
    }

    return result;
  }, [games, competitions, selectedTeamId, selectedCompetitionId]);

  // Reset competition filter when team changes
  const handleTeamChange = (teamId: number | "all") => {
    setSelectedTeamId(teamId);
    setSelectedCompetitionId("all"); // Reset competition filter
  };

  if (isLoading) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <PageHeader
        title={t("games:page.title")}
        actionLabel={t("games:page.newGame")}
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      {/* Filters */}
      {(teams && teams.length > 0) || (competitions && competitions.length > 0) ? (
        <Box sx={{ mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Team Filter */}
            {teams && teams.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t("games:page.filterByTeam")}</InputLabel>
                <Select
                  value={selectedTeamId}
                  label={t("games:page.filterByTeam")}
                  onChange={(e) => handleTeamChange(e.target.value as number | "all")}
                >
                  <MenuItem value="all">{t("games:page.allTeams")}</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Competition Filter */}
            {competitions && competitions.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t("games:page.filterByCompetition")}</InputLabel>
                <Select
                  value={selectedCompetitionId}
                  label={t("games:page.filterByCompetition")}
                  onChange={(e) => setSelectedCompetitionId(e.target.value as number | "all")}
                  disabled={filteredCompetitions.length === 0}
                >
                  <MenuItem value="all">
                    {selectedTeamId === "all" ? t("games:page.allCompetitions") : t("games:page.allFromTeam")}
                  </MenuItem>
                  {filteredCompetitions.map((competition) => (
                    <MenuItem key={competition.id} value={competition.id}>
                      {competition.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </Box>
      ) : null}

      {games && games.length === 0 ? (
        <EmptyGamesState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : filteredGames.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Box sx={{ color: "text.secondary" }}>
            {t("common:messages.noData")}
          </Box>
        </Box>
      ) : (
        <GamesGrid games={filteredGames} />
      )}

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
}
