import { useState } from "react";
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
import { queryKeys } from "../../utils/queryKeys";

interface AddPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentPlayerIds: number[];
  // Function to fetch available players
  fetchPlayers: () => Promise<Player[]>;
  // Function to add players (receives selected player IDs)
  addPlayers: (playerIds: number[]) => Promise<unknown>;
  // Query keys to invalidate after successful add
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
  addPlayers,
  invalidateQueries,
  loadingMessage,
  emptyMessage,
}: AddPlayersModalProps) {
  const { t } = useTranslation("common");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: queryKeys.availablePlayers(isOpen),
    queryFn: fetchPlayers,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: () => addPlayers(selectedPlayerIds),
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
    setSelectedPlayerIds([]);
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length > 0) {
      mutation.mutate();
    }
  };

  // Filter out players already added
  const availablePlayers =
    players?.filter((p) => !currentPlayerIds.includes(p.id)) || [];

  const handleSelectAll = () => {
    setSelectedPlayerIds(availablePlayers.map((player) => player.id));
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
        ) : availablePlayers.length === 0 ? (
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
                disabled={availablePlayers.length === 0}
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
              players={availablePlayers}
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
            {t("common:error.addingPlayers")}
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
            selectedPlayerIds.length === 0 ||
            availablePlayers.length === 0
          }
        >
          {mutation.isPending
            ? t("common:action.adding")
            : t("common:action.addPlayers", { count: selectedPlayerIds.length })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
