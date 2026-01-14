import { useState, FormEvent, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlayer, deletePlayer } from "../services";
import type { Player } from "../types";
import Modal from "./Modal";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  teamId: number;
}

export default function EditPlayerModal({
  isOpen,
  onClose,
  player,
  teamId,
}: EditPlayerModalProps) {
  const [playerName, setPlayerName] = useState(player.name);
  const [playerNumber, setPlayerNumber] = useState(
    player.number?.toString() || ""
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Update local state when player prop changes
  useEffect(() => {
    setPlayerName(player.name);
    setPlayerNumber(player.number?.toString() || "");
  }, [player]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; number?: number | null }) =>
      updatePlayer(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlayer(player.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      updateMutation.mutate({
        name: playerName.trim(),
        number: playerNumber ? Number(playerNumber) : null,
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleClose = () => {
    setPlayerName(player.name);
    setPlayerNumber(player.number?.toString() || "");
    setShowDeleteConfirm(false);
    updateMutation.reset();
    deleteMutation.reset();
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Delete Player?">
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove {player.name} from the team?
        </p>
        {deleteMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error deleting player. Please try again.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
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
            {deleteMutation.isPending ? "Deleting..." : "Delete Player"}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Player">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="player-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Player Name *
          </label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player name"
            maxLength={100}
            required
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="player-number"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Jersey Number (Optional)
          </label>
          <input
            id="player-number"
            type="number"
            value={playerNumber}
            onChange={(e) => setPlayerNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0-99"
            min="0"
            max="99"
          />
        </div>

        {updateMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error updating player. Please try again.
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
            disabled={updateMutation.isPending}
          >
            Delete Player
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={updateMutation.isPending || !playerName.trim()}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
