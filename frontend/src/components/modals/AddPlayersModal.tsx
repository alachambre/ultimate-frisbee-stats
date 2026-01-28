import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "@mui/material";
import PlayerSelectionUI from "../shared/PlayerSelectionUI";
import type { Player } from "../../types";

interface AddPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentPlayerIds: number[];
  // Function to fetch available players
  fetchPlayers: () => Promise<Player[]>;
  // Function to add players (receives selected player IDs)
  addPlayers: (playerIds: number[]) => Promise<any>;
  // Query keys to invalidate after successful add
  invalidateQueries: string[][];
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
    queryKey: ["available-players", isOpen],
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

  // Filter out players already added
  const availablePlayers =
    players?.filter((p) => !currentPlayerIds.includes(p.id)) || [];

  const handleSelectAllMen = () => {
    const menIds = availablePlayers.filter((p) => p.gender === "M").map((p) => p.id);
    setSelectedPlayerIds((prev) => [...new Set([...prev, ...menIds])]);
  };

  const handleSelectAllWomen = () => {
    const womenIds = availablePlayers.filter((p) => p.gender === "W").map((p) => p.id);
    setSelectedPlayerIds((prev) => [...new Set([...prev, ...womenIds])]);
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
          <PlayerSelectionUI
            players={availablePlayers}
            selectedIds={selectedPlayerIds}
            onToggle={handleToggle}
            onSelectAllMen={handleSelectAllMen}
            onSelectAllWomen={handleSelectAllWomen}
            onClearAll={handleClearAll}
          />
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
