import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { getLines, deleteLine } from "../services/lines";
import { getTeams } from "../services/teams";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import LinesGrid from "../components/lines/LinesGrid";
import EmptyLinesState from "../components/lines/EmptyLinesState";
import CreateLineModal from "../components/modals/CreateLineModal";
import EditLineModal from "../components/modals/EditLineModal";
import type { LineWithPlayers } from "../types";

export default function LinesPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<LineWithPlayers | null>(null);
  const [deletingLine, setDeletingLine] = useState<LineWithPlayers | null>(null);
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  const {
    data: lines,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lines", selectedTeamId],
    queryFn: () => getLines(selectedTeamId),
  });

  const deleteMutation = useMutation({
    mutationFn: (lineId: number) => deleteLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lines"] });
      setDeletingLine(null);
    },
  });

  const handleDelete = () => {
    if (deletingLine) {
      deleteMutation.mutate(deletingLine.id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading lines..." />;
  }

  if (error) {
    return <ErrorState message="Error loading lines. Please try again." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Lines"
        actionLabel="New Line"
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      <Box mb={3}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="team-filter-label">Filter by Team</InputLabel>
          <Select
            labelId="team-filter-label"
            value={selectedTeamId?.toString() || "all"}
            onChange={(e) =>
              setSelectedTeamId(
                e.target.value === "all" ? undefined : Number(e.target.value)
              )
            }
            label="Filter by Team"
          >
            <MenuItem value="all">All Teams</MenuItem>
            {teams?.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {lines && lines.length === 0 ? (
        <EmptyLinesState onCreateLine={() => setIsCreateModalOpen(true)} />
      ) : (
        <LinesGrid
          lines={lines || []}
          onEdit={setEditingLine}
          onDelete={setDeletingLine}
        />
      )}

      <CreateLineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        teamId={selectedTeamId}
      />

      <EditLineModal
        isOpen={!!editingLine}
        onClose={() => setEditingLine(null)}
        line={editingLine}
      />

      <Dialog
        open={!!deletingLine}
        onClose={() => setDeletingLine(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Line</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingLine?.name}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletingLine(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
