import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getTeams } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import TeamsGrid from "../components/teams/TeamsGrid";
import EmptyTeamsState from "../components/teams/EmptyTeamsState";
import CreateTeamModal from "../components/modals/CreateTeamModal";

export default function TeamsPage() {
  const { t } = useTranslation(['teams', 'common']);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: teams,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  if (isLoading) {
    return <LoadingState message={t('common:action.loading')} />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <PageHeader
        title={t('teams:page.title')}
        actionLabel={t('teams:page.addTeam')}
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      {teams && teams.length === 0 ? (
        <EmptyTeamsState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <TeamsGrid teams={teams || []} />
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
}
