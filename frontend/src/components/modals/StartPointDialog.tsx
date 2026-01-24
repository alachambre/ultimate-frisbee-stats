import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startPoint, updatePoint } from "../../services/points";
import { getLines } from "../../services/lines";
import { getStrategies } from "../../services/strategies";
import PlayerSelector from "../points/PlayerSelector";
import type { Player, Line, Strategy } from "../../types";

interface StartPointDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  teamId: number;
  players: Player[];
  onSuccess?: () => void;
}

export default function StartPointDialog({
  open,
  onClose,
  gameId,
  teamId,
  players,
  onSuccess,
}: StartPointDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingOnOffense, setStartingOnOffense] = useState<boolean>(true);
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [strategyId, setStrategyId] = useState<number | "">("");
  const [comments, setComments] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch lines for the team
  const { data: lines } = useQuery({
    queryKey: ["lines", teamId],
    queryFn: () => getLines(teamId),
    enabled: open,
  });

  // Fetch strategies filtered by category
  const { data: strategies } = useQuery({
    queryKey: ["strategies", startingOnOffense ? "offense" : "defense"],
    queryFn: () => getStrategies(startingOnOffense ? "offense" : "defense"),
    enabled: open,
  });

  // Filter players based on selected line
  const filteredPlayers = useMemo(() => {
    if (typeof selectedLineId !== "number") {
      return players;
    }

    // Find the selected line and get its player IDs
    const selectedLine = lines?.find((line) => line.id === selectedLineId);
    if (!selectedLine || !selectedLine.players) {
      return players;
    }

    const linePlayerIds = selectedLine.players.map((p) => p.id);
    return players.filter((p) => linePlayerIds.includes(p.id));
  }, [players, selectedLineId, lines]);

  const startMutation = useMutation({
    mutationFn: async () => {
      // Create point (backend creates with status="ready")
      const point = await startPoint({
        game_id: gameId,
        starting_on_offense: startingOnOffense,
        player_ids: selectedPlayerIds,
        strategy_id: typeof strategyId === "number" ? strategyId : null,
        comments: comments || null,
      });

      // Immediately transition to "running" status
      const runningPoint = await updatePoint(point.id, { status: "running" });
      return runningPoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setStartingOnOffense(true);
    setSelectedLineId("");
    setStrategyId("");
    setComments("");
    startMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length === 7) {
      startMutation.mutate();
    }
  };

  const isValid = selectedPlayerIds.length === 7;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start Point</DialogTitle>
      <DialogContent>
        {startMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(startMutation.error as any)?.response?.data?.detail ||
              "Failed to start point. Please try again."}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Starting</FormLabel>
          <RadioGroup
            value={startingOnOffense ? "offense" : "defense"}
            onChange={(e) => {
              setStartingOnOffense(e.target.value === "offense");
              // Reset strategy when changing offense/defense
              setStrategyId("");
            }}
          >
            <FormControlLabel
              value="offense"
              control={<Radio />}
              label="On Offense (we have the disc)"
            />
            <FormControlLabel
              value="defense"
              control={<Radio />}
              label="On Defense (they have the disc)"
            />
          </RadioGroup>
        </FormControl>

        {/* Strategy selection */}
        {strategies && strategies.length > 0 && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="strategy-select-label">Strategy (Optional)</InputLabel>
            <Select
              labelId="strategy-select-label"
              id="strategy-select"
              value={strategyId}
              label="Strategy (Optional)"
              onChange={(e) => setStrategyId(e.target.value as number | "")}
            >
              <MenuItem value="">
                <em>No strategy</em>
              </MenuItem>
              {strategies.map((strategy: Strategy) => (
                <MenuItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Comments */}
        <TextField
          fullWidth
          label="Comments (Optional)"
          placeholder="Add notes about this point..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        {/* Line filter */}
        {lines && lines.length > 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="line-select-label">Filter by Line (Optional)</InputLabel>
            <Select
              labelId="line-select-label"
              id="line-select"
              value={selectedLineId}
              label="Filter by Line (Optional)"
              onChange={(e) => {
                setSelectedLineId(e.target.value as number | "");
                // Clear selected players when changing filter
                setSelectedPlayerIds([]);
              }}
            >
              <MenuItem value="">
                <em>All players - No filter</em>
              </MenuItem>
              {lines.map((line: Line) => (
                <MenuItem key={line.id} value={line.id}>
                  {line.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <PlayerSelector
          players={[...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name))}
          selectedIds={selectedPlayerIds}
          onChange={setSelectedPlayerIds}
          required
          error={!isValid && selectedPlayerIds.length > 0}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={startMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || startMutation.isPending}
        >
          {startMutation.isPending ? "Starting..." : "Start Point"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
