import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

interface EmptyPlayersStateProps {
  onAddClick: () => void;
  emptyMessage?: string;
  buttonLabel?: string;
}

export default function EmptyPlayersState({
  onAddClick,
  emptyMessage,
  buttonLabel,
}: EmptyPlayersStateProps) {
  const { t } = useTranslation("players");
  const resolvedEmptyMessage = emptyMessage ?? t("empty.noPlayers");
  const resolvedButtonLabel = buttonLabel ?? t("empty.addFirst");

  return (
    <Box textAlign="center" py={4}>
      <Typography variant="body1" color="text.secondary" mb={2}>
        {resolvedEmptyMessage}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddClick}
      >
        {resolvedButtonLabel}
      </Button>
    </Box>
  );
}
