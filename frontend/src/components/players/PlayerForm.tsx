import {
  TextField,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
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
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Gender
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
          sx={{
            "& .MuiToggleButton-root": {
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
              "&.Mui-selected": {
                fontWeight: "bold",
                color: "white",
                "&:hover": {
                  opacity: 0.9,
                },
              },
              "&.Mui-selected[value='M']": {
                backgroundColor: "primary.main",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
              "&.Mui-selected[value='W']": {
                backgroundColor: "secondary.main",
                "&:hover": {
                  backgroundColor: "secondary.dark",
                },
              },
            },
          }}
        >
          <ToggleButton value="M" aria-label="man">
            <MaleIcon sx={{ mr: 1, fontSize: 20 }} />
            Man
          </ToggleButton>
          <ToggleButton value="W" aria-label="woman">
            <FemaleIcon sx={{ mr: 1, fontSize: 20 }} />
            Woman
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TextField
        autoFocus={autoFocus}
        label="Player Name"
        type="text"
        fullWidth
        variant="outlined"
        value={playerName}
        onChange={(e) => onPlayerNameChange(e.target.value)}
        placeholder="Enter player name"
        inputProps={{ maxLength: 100 }}
        required
      />
      <TextField
        label="Jersey Number (Optional)"
        type="number"
        fullWidth
        variant="outlined"
        value={playerNumber}
        onChange={(e) => onPlayerNumberChange(e.target.value)}
        placeholder="0-99"
        inputProps={{ min: 0, max: 99 }}
      />
    </Box>
  );
}
