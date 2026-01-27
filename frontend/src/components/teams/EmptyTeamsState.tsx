import { Box, Typography, Button, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";

interface EmptyTeamsStateProps {
  onCreateClick: () => void;
}

export default function EmptyTeamsState({
  onCreateClick,
}: EmptyTeamsStateProps) {
  const { t } = useTranslation(["teams", "common"]);

  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 10,
        px: 4,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "primary.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 3,
        }}
      >
        <GroupIcon sx={{ fontSize: 32, color: "primary.main" }} />
      </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {t("teams:page.empty.title")}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
        {t("teams:page.empty.description")}
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        {t("common:action.create")}
      </Button>
    </Paper>
  );
}
