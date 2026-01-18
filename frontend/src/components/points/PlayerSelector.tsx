import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  FormHelperText,
} from "@mui/material";
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
  const handleToggle = (playerId: number) => {
    const newSelected = selectedIds.includes(playerId)
      ? selectedIds.filter((id) => id !== playerId)
      : [...selectedIds, playerId];
    onChange(newSelected);
  };

  const selectedCount = selectedIds.length;
  const isValid = !required || selectedCount === 7;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {selectedCount}/7 players selected
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {players.map((player) => (
          <FormControlLabel
            key={player.id}
            control={
              <Checkbox
                checked={selectedIds.includes(player.id)}
                onChange={() => handleToggle(player.id)}
              />
            }
            label={
              <Typography variant="body2">
                {player.name}
                {player.number !== null && player.number !== undefined && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    #{player.number}
                  </Typography>
                )}
              </Typography>
            }
          />
        ))}
      </Box>

      {(error || helperText) && (
        <FormHelperText error={error}>
          {helperText || (required && !isValid && "Please select exactly 7 players")}
        </FormHelperText>
      )}
    </Box>
  );
}
