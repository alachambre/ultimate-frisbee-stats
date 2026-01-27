import {
  TextField,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import type { StrategyCategory } from "../../types";

interface StrategyFormProps {
  strategyName: string;
  onStrategyNameChange: (name: string) => void;
  category: StrategyCategory | "";
  onCategoryChange: (category: StrategyCategory) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  autoFocus?: boolean;
}

export default function StrategyForm({
  strategyName,
  onStrategyNameChange,
  category,
  onCategoryChange,
  description,
  onDescriptionChange,
  autoFocus = false,
}: StrategyFormProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Category
        </Typography>
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) {
              onCategoryChange(newValue as StrategyCategory);
            }
          }}
          fullWidth
          aria-label="strategy category"
          sx={{
            "& .MuiToggleButton-root": {
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
              "&.Mui-selected": {
                fontWeight: "bold",
                color: "white",
                backgroundColor: "primary.main",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  opacity: 0.9,
                },
              },
            },
          }}
        >
          <ToggleButton value="offense" aria-label="offense">
            <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
            Offense
          </ToggleButton>
          <ToggleButton value="defense" aria-label="defense">
            <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
            Defense
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TextField
        autoFocus={autoFocus}
        label="Strategy Name"
        type="text"
        fullWidth
        variant="outlined"
        value={strategyName}
        onChange={(e) => onStrategyNameChange(e.target.value)}
        placeholder="e.g., Vertical Stack, Zone Defense"
        required
      />
      <TextField
        label="Description (Optional)"
        type="text"
        fullWidth
        variant="outlined"
        multiline
        rows={3}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe the strategy..."
      />
    </Box>
  );
}
