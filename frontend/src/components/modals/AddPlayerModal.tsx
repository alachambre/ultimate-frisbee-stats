import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayer } from "../services";
import Modal from "./Modal";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  teamId,
}: AddPlayerModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      // Invalidate team detail query to refresh player list
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      setPlayerName("");
      setPlayerNumber("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      mutation.mutate({
        team_id: teamId,
        name: playerName.trim(),
        number: playerNumber ? Number(playerNumber) : undefined,
      });
    }
  };

  const handleClose = () => {
    setPlayerName("");
    setPlayerNumber("");
    mutation.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Player">
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

        {mutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error adding player. Please try again.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={mutation.isPending || !playerName.trim()}
          >
            {mutation.isPending ? "Adding..." : "Add Player"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
