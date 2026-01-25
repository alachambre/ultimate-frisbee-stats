import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import { getStrategies } from "../../services/strategies";
import type { PointWithPlayers, StrategyCategory } from "../../types";

interface SelectStrategyDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  gameId: number;
  onSuccess?: () => void;
}

export default function SelectStrategyDialog({
  open,
  onClose,
  point,
  gameId,
  onSuccess,
}: SelectStrategyDialogProps) {
  const [strategyId, setStrategyId] = useState<number | "">(point.strategy?.id || "");
  const queryClient = useQueryClient();

  // Determine category based on point's starting position
  const category: StrategyCategory = point.starting_on_offense ? "offense" : "defense";

  // Fetch strategies filtered by category
  const { data: strategies } = useQuery({
    queryKey: ["strategies", category],
    queryFn: () => getStrategies(category),
    enabled: open,
  });

  // Initialize strategy when dialog opens or point changes
  useEffect(() => {
    if (open) {
      setStrategyId(point.strategy?.id || "");
    }
  }, [open, point.strategy?.id]);

  const updateMutation = useMutation({
    mutationFn: () => {
      return updatePoint(point.id, {
        strategy_id: typeof strategyId === "number" ? strategyId : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setStrategyId(point.strategy?.id || "");
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Strategy</DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as any)?.response?.data?.detail ||
              "Failed to update strategy. Please try again."}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {point.starting_on_offense ? "Offense Strategies" : "Defense Strategies"}
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="strategy-select-label">Strategy</InputLabel>
          <Select
            autoFocus
            labelId="strategy-select-label"
            value={strategyId}
            label="Strategy"
            onChange={(e) => setStrategyId(e.target.value as number | "")}
          >
            <MenuItem value="">
              <em>No strategy</em>
            </MenuItem>
            {strategies?.map((strategy) => (
              <MenuItem key={strategy.id} value={strategy.id}>
                {strategy.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
