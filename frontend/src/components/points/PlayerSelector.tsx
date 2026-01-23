import { Box, FormHelperText } from "@mui/material";
import PlayerSelectionUI from "../shared/PlayerSelectionUI";
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

  const handleSelectAllMen = () => {
    const menIds = players.filter((p) => p.gender === "M").map((p) => p.id);
    const womenIds = selectedIds.filter((id) =>
      players.some((p) => p.id === id && p.gender === "W")
    );
    onChange([...new Set([...womenIds, ...menIds])]);
  };

  const handleSelectAllWomen = () => {
    const womenIds = players.filter((p) => p.gender === "W").map((p) => p.id);
    const menIds = selectedIds.filter((id) =>
      players.some((p) => p.id === id && p.gender === "M")
    );
    onChange([...new Set([...menIds, ...womenIds])]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <Box>
      <PlayerSelectionUI
        players={players}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onSelectAllMen={handleSelectAllMen}
        onSelectAllWomen={handleSelectAllWomen}
        onClearAll={handleClearAll}
      />

      {(error || helperText) && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {helperText || (required && !isValid && "Please select exactly 7 players")}
        </FormHelperText>
      )}
    </Box>
  );
}
