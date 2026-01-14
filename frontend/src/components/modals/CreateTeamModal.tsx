import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeam } from "../services";
import Modal from "./Modal";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      // Invalidate and refetch teams list
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setTeamName("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      mutation.mutate({ name: teamName.trim() });
    }
  };

  const handleClose = () => {
    setTeamName("");
    mutation.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Team">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Team Name
          </label>
          <input
            id="team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter team name"
            maxLength={100}
            required
            autoFocus
          />
        </div>

        {mutation.isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error creating team. Please try again.
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
            disabled={mutation.isPending || !teamName.trim()}
          >
            {mutation.isPending ? "Creating..." : "Create Team"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
