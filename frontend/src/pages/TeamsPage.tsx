import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import TeamsGrid from "../components/teams/TeamsGrid";
import EmptyTeamsState from "../components/teams/EmptyTeamsState";
import CreateTeamModal from "../components/modals/CreateTeamModal";

export default function TeamsPage() {
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
    return <LoadingState message="Loading teams..." />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="px-4">
      <PageHeader
        title="Teams"
        actionLabel="Add Team"
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
    </div>
  );
}
