import { Box, Typography, Button } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import { useTranslation } from "react-i18next";

interface EmptyLinesStateProps {
  onCreateLine: () => void;
}

export default function EmptyLinesState({ onCreateLine }: EmptyLinesStateProps) {
  const { t } = useTranslation("lines");

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
        {t("empty.noLines")}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("empty.description")}
      </Typography>
      <Button variant="contained" onClick={onCreateLine}>
        {t("empty.createFirst")}
      </Button>
    </Box>
  );
}
