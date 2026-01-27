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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["points", "common"]);
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
      <DialogTitle>{t("points:dialog.selectStrategy.title")}</DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as any)?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {point.starting_on_offense
              ? t("points:tracker.offenseStrategies", "Offense Strategies")
              : t("points:tracker.defenseStrategies", "Defense Strategies")}
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="strategy-select-label">{t("points:tracker.strategy")}</InputLabel>
          <Select
            autoFocus
            labelId="strategy-select-label"
            value={strategyId}
            label={t("points:tracker.strategy")}
            onChange={(e) => setStrategyId(e.target.value as number | "")}
          >
            <MenuItem value="">
              <em>{t("points:tracker.noStrategy")}</em>
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
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? t("common:action.saving") : t("common:action.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
