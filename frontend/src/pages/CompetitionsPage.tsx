import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Container, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { getCompetitions, getTeams } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import CompetitionsGrid from "../components/competitions/CompetitionsGrid";
import EmptyCompetitionsState from "../components/competitions/EmptyCompetitionsState";
import CreateCompetitionModal from "../components/modals/CreateCompetitionModal";
import { shouldEnforcePermissions, useAuth } from "../auth";
import { queryKeys } from "../utils/queryKeys";

export default function CompetitionsPage() {
  const auth = useAuth();
  const { t } = useTranslation(["competitions", "common"]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "all">("all");
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;

  const {
    data: competitions,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: () => getCompetitions(),
  });

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => getTeams(),
    enabled: canEditData && !auth.isLoading,
  });

  // Filter and sort competitions by selected team (newest first)
  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    const filtered = selectedTeamId === "all"
      ? competitions
      : competitions.filter((c) => c.team_id === selectedTeamId);

    // Sort by start_date descending (newest first, oldest last)
    return filtered.sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }, [competitions, selectedTeamId]);

  if (isLoading) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (error) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <PageHeader
        title={t("competitions:page.title")}
        actionLabel={canEditData ? t("competitions:page.newCompetition") : undefined}
        onActionClick={canEditData ? () => setIsCreateModalOpen(true) : undefined}
      />

      {/* Team Filter */}
      {teams && teams.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t("competitions:page.filterByTeam")}</InputLabel>
            <Select
              value={selectedTeamId}
              label={t("competitions:page.filterByTeam")}
              onChange={(e) => setSelectedTeamId(e.target.value as number | "all")}
            >
              <MenuItem value="all">{t("competitions:page.allTeams")}</MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {competitions && competitions.length === 0 ? (
        <EmptyCompetitionsState
          onCreateClick={canEditData ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : filteredCompetitions.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Box sx={{ color: "text.secondary" }}>
            {t("common:messages.noData")}
          </Box>
        </Box>
      ) : (
        <CompetitionsGrid competitions={filteredCompetitions} />
      )}

      {canEditData && (
        <CreateCompetitionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </Container>
  );
}
