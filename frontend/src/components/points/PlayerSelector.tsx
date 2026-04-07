import { Box, FormHelperText } from "@mui/material";
import { useTranslation } from "react-i18next";
import PlayerSelectionList from "../shared/PlayerSelectionList";
import type { Player } from "../../types";

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  getHighlight?: (playerId: number) => "high" | "low" | null;
  highlightSecondary?: boolean;
}

export default function PlayerSelector({
  players,
  selectedIds,
  onChange,
  required = false,
  error = false,
  helperText,
  getHighlight,
  highlightSecondary = true,
}: PlayerSelectorProps) {
  const { t } = useTranslation(["points", "common"]);
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
        getHighlight={getHighlight}
        highlightSecondary={highlightSecondary}
        renderSecondary={(player) =>
          player.number !== null && player.number !== undefined
            ? `#${player.number}`
            : t("common:labels.noNumber")
        }
      />

      {(error || helperText) && (
        <FormHelperText error={error} sx={{ mt: 1 }}>
          {helperText || (required && !isValid && t("points:dialog.start.validation.exactly7"))}
        </FormHelperText>
      )}
    </Box>
  );
}
