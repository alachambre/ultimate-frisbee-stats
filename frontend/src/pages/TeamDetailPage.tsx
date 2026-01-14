import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeam, deleteTeam } from "../services";
import type { Player } from "../types";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import PlayersGrid from "../components/players/PlayersGrid";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import EditPlayerModal from "../components/modals/EditPlayerModal";

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const {
    data: team,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeam(Number(teamId)),
    enabled: !!teamId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(Number(teamId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      navigate("/teams");
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading team..." />;
  }

  if (error || !team) {
    return <ErrorState message="Error loading team. Please try again." />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <div className="px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teams"
          className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Back to Teams
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(team.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
          >
            Delete Team
          </button>
        </div>
      </div>

      {/* Players Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Players ({team.players.length})
            </h2>
            <button
              onClick={() => setIsAddPlayerModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Player
            </button>
          </div>
        </div>

        <div className="p-6">
          {team.players.length === 0 ? (
            <EmptyPlayersState
              onAddClick={() => setIsAddPlayerModalOpen(true)}
            />
          ) : (
            <PlayersGrid
              players={team.players}
              onEditPlayer={setEditingPlayer}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Team?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{team.name}"? This will also
                delete all players and games for this team. This action cannot
                be undone.
              </p>
              {deleteMutation.isError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    Error deleting team. Please try again.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Modals */}
      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        teamId={Number(teamId)}
      />

      {editingPlayer && (
        <EditPlayerModal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          teamId={Number(teamId)}
        />
      )}
    </div>
  );
}
