import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewTeamSetupPage() {
  const { t } = useTranslation("navigation");
  const { selectedTeam } = useNewUiTeam();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {selectedTeam && (
        <Typography color="text.secondary" variant="overline">
          {selectedTeam.name}
        </Typography>
      )}
      <Box sx={{ maxWidth: 720 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("newUiPages.teamSetup.heading")}
        </Typography>
        <Typography color="text.secondary" variant="body1">
          {t("newUiPages.teamSetup.copy")}
        </Typography>
      </Box>
    </Container>
  );
}
