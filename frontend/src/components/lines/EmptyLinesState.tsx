import { Box, Typography, Button } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";

interface EmptyLinesStateProps {
  onCreateLine: () => void;
}

export default function EmptyLinesState({ onCreateLine }: EmptyLinesStateProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
      }}
    >
      <GroupsIcon
        sx={{
          fontSize: 80,
          color: "text.secondary",
          opacity: 0.3,
          mb: 2,
        }}
      />
      <Typography variant="h5" color="text.secondary" gutterBottom>
        No Lines Yet
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Create lines to organize players into offensive, defensive, or custom groups
      </Typography>
      <Button variant="contained" onClick={onCreateLine}>
        Create First Line
      </Button>
    </Box>
  );
}
