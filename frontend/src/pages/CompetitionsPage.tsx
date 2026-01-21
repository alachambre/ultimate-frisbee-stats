import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@mui/material";
import { getCompetitions } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import CompetitionsGrid from "../components/competitions/CompetitionsGrid";
import EmptyCompetitionsState from "../components/competitions/EmptyCompetitionsState";
import CreateCompetitionModal from "../components/modals/CreateCompetitionModal";

export default function CompetitionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: competitions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
  });

  if (isLoading) {
    return <LoadingState message="Loading competitions..." />;
  }

  if (error) {
    return <ErrorState message="Error loading competitions. Please try again." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Competitions"
        actionLabel="New Competition"
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      {competitions && competitions.length === 0 ? (
        <EmptyCompetitionsState
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <CompetitionsGrid competitions={competitions || []} />
      )}

      <CreateCompetitionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
}
