import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@mui/material";
import { getAllGames } from "../services";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import GamesGrid from "../components/games/GamesGrid";
import EmptyGamesState from "../components/games/EmptyGamesState";
import CreateGameModal from "../components/modals/CreateGameModal";

export default function GamesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: games,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games"],
    queryFn: getAllGames,
  });

  if (isLoading) {
    return <LoadingState message="Loading games..." />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Games"
        actionLabel="New Game"
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      {games && games.length === 0 ? (
        <EmptyGamesState onCreateClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <GamesGrid games={games || []} />
      )}

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
}
