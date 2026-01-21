import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
  Box,
} from "@mui/material";
import { addPlayersToRoster, getTeamPlayers } from "../../services";

interface AddPlayersToRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: number;
  teamId: number;
  currentRosterIds: number[];
}

export default function AddPlayersToRosterModal({
  isOpen,
  onClose,
  competitionId,
  teamId,
  currentRosterIds,
}: AddPlayersToRosterModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: teamPlayers, isLoading } = useQuery({
    queryKey: ["team-players", teamId],
    queryFn: () => getTeamPlayers(teamId),
    enabled: isOpen && !!teamId,
  });

  const mutation = useMutation({
    mutationFn: () => addPlayersToRoster(competitionId, selectedPlayerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["competition", String(competitionId)],
      });
      handleClose();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerIds([]);
    }
  }, [isOpen]);

  const handleToggle = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleClose = () => {
    setSelectedPlayerIds([]);
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length > 0) {
      mutation.mutate();
    }
  };

  // Filter out players already in the roster
  const availablePlayers =
    teamPlayers?.filter((p) => !currentRosterIds.includes(p.id)) || [];

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Players to Roster</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography>Loading players...</Typography>
        ) : availablePlayers.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              All team players are already in the roster
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select players to add to the competition roster:
            </Typography>
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {availablePlayers.map((player) => (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    role={undefined}
                    onClick={() => handleToggle(player.id)}
                    dense
                  >
                    <Checkbox
                      edge="start"
                      checked={selectedPlayerIds.includes(player.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText
                      primary={player.name}
                      secondary={
                        player.number !== null && player.number !== undefined
                          ? `#${player.number}`
                          : "No number"
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error adding players to roster. Please try again.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            mutation.isPending ||
            selectedPlayerIds.length === 0 ||
            availablePlayers.length === 0
          }
        >
          {mutation.isPending
            ? "Adding..."
            : `Add ${selectedPlayerIds.length} Player${selectedPlayerIds.length !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
