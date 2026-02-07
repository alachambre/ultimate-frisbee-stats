import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import PlayerSelectionList from "../shared/PlayerSelectionList";
import type { Player } from "../../types";

interface AddPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentPlayerIds: number[];
  // Function to fetch roster candidates
  fetchPlayers: () => Promise<Player[]>;
  // Query key for roster candidates
  playersQueryKey: QueryKey;
  // Function to add players to roster
  addPlayers: (playerIds: number[]) => Promise<unknown>;
  // Function to remove players from roster
  removePlayers: (playerIds: number[]) => Promise<unknown>;
  // Query keys to invalidate after successful save
  invalidateQueries: QueryKey[];
  // Optional: custom loading/empty messages
  loadingMessage?: string;
  emptyMessage?: string;
}

export default function AddPlayersModal({
  isOpen,
  onClose,
  title,
  currentPlayerIds,
  fetchPlayers,
  playersQueryKey,
  addPlayers,
  removePlayers,
  invalidateQueries,
  loadingMessage,
  emptyMessage,
}: AddPlayersModalProps) {
  const { t } = useTranslation("common");
  const uniqueCurrentPlayerIds = useMemo(
    () => Array.from(new Set(currentPlayerIds)),
    [currentPlayerIds]
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(
    uniqueCurrentPlayerIds
  );
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: playersQueryKey,
    queryFn: fetchPlayers,
    enabled: isOpen,
  });

  const playersToAdd = selectedPlayerIds.filter(
    (playerId) => !uniqueCurrentPlayerIds.includes(playerId)
  );
  const playersToRemove = uniqueCurrentPlayerIds.filter(
    (playerId) => !selectedPlayerIds.includes(playerId)
  );
  const hasChanges = playersToAdd.length > 0 || playersToRemove.length > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (playersToAdd.length > 0) {
        await addPlayers(playersToAdd);
      }
      if (playersToRemove.length > 0) {
        await removePlayers(playersToRemove);
      }
    },
    onSuccess: () => {
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      handleClose();
    },
  });

  const handleToggle = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleClose = () => {
    setSelectedPlayerIds(uniqueCurrentPlayerIds);
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (hasChanges) {
      mutation.mutate();
    }
  };

  const handleSelectAll = () => {
    setSelectedPlayerIds((players || []).map((player) => player.id));
  };

  const handleClearAll = () => {
    setSelectedPlayerIds([]);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography>{loadingMessage || t("common:action.loading")}</Typography>
        ) : (players || []).length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">{emptyMessage || t("common:messages.noData")}</Typography>
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAll}
                disabled={(players || []).length === 0}
              >
                {t("common:action.select")} {t("common:allPlayers")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearAll}
                disabled={selectedPlayerIds.length === 0}
              >
                {t("common:labels.clearAll")}
              </Button>
            </Stack>
            <PlayerSelectionList
              players={players || []}
              selectedIds={selectedPlayerIds}
              onToggle={handleToggle}
              renderSecondary={(player) =>
                player.number !== null && player.number !== undefined
                  ? `#${player.number}`
                  : "No number"
              }
            />
          </>
        )}

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t("common:error.saving")}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            mutation.isPending ||
            !hasChanges ||
            (players || []).length === 0
          }
        >
          {mutation.isPending
            ? t("common:action.saving")
            : t("common:action.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
