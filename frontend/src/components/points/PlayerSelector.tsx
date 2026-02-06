import { Box, FormHelperText } from "@mui/material";
import PlayerSelectionList from "../shared/PlayerSelectionList";
import type { Player } from "../../types";

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function PlayerSelector({
  players,
  selectedIds,
  onChange,
  required = false,
  error = false,
  helperText,
}: PlayerSelectorProps) {
  const selectedCount = selectedIds.length;
  const isValid = !required || selectedCount === 7;

  const handleToggle = (playerId: number) => {
    const newSelected = selectedIds.includes(playerId)
      ? selectedIds.filter((id) => id !== playerId)
      : [...selectedIds, playerId];
    onChange(newSelected);
  };

  return (
    <Box>
      <PlayerSelectionList
        players={players}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        renderSecondary={(player) =>
          player.number !== null && player.number !== undefined
            ? `#${player.number}`
            : "No number"
        }
      />

      {(error || helperText) && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {helperText || (required && !isValid && "Please select exactly 7 players")}
        </FormHelperText>
      )}
    </Box>
  );
}
