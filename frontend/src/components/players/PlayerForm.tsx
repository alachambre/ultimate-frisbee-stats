import {
  TextField,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import type { Gender } from "../../types";

interface PlayerFormProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
  playerNumber: string;
  onPlayerNumberChange: (number: string) => void;
  autoFocus?: boolean;
}

export default function PlayerForm({
  playerName,
  onPlayerNameChange,
  gender,
  onGenderChange,
  playerNumber,
  onPlayerNumberChange,
  autoFocus = false,
}: PlayerFormProps) {
  const { t } = useTranslation(["players", "common"]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t("common:labels.gender")}
        </Typography>
        <ToggleButtonGroup
          value={gender}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) {
              onGenderChange(newValue as Gender);
            }
          }}
          fullWidth
          aria-label="player gender"
          sx={(theme) => ({
            "& .MuiToggleButton-root": {
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
              "&.Mui-selected": {
                fontWeight: "bold",
                color: theme.palette.common.white,
                "&:hover": {
                  opacity: 0.9,
                },
              },
              "&.Mui-selected[value='M']": {
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
              "&.Mui-selected[value='W']": {
                backgroundColor: theme.palette.secondary.main,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.dark,
                },
              },
            },
          })}
        >
          <ToggleButton value="M" aria-label="man">
            <MaleIcon sx={{ mr: 1, fontSize: 20 }} />
            {t("players:form.genderMale")}
          </ToggleButton>
          <ToggleButton value="W" aria-label="woman">
            <FemaleIcon sx={{ mr: 1, fontSize: 20 }} />
            {t("players:form.genderFemale")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TextField
        autoFocus={autoFocus}
        label={t("players:form.name")}
        type="text"
        fullWidth
        variant="outlined"
        value={playerName}
        onChange={(e) => onPlayerNameChange(e.target.value)}
        placeholder={t("players:form.namePlaceholder")}
        inputProps={{ maxLength: 100 }}
        required
      />
      <TextField
        label={`${t("players:form.jerseyNumber")} (${t("common:labels.optional")})`}
        type="number"
        fullWidth
        variant="outlined"
        value={playerNumber}
        onChange={(e) => onPlayerNumberChange(e.target.value)}
        placeholder={t("players:form.jerseyNumberPlaceholder")}
        inputProps={{ min: 0, max: 99 }}
      />
    </Box>
  );
}
