import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

export default function NewLiveGamePage() {
  const { t } = useTranslation("navigation");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("newUiPages.liveGame.heading")}
        </Typography>
        <Typography color="text.secondary" variant="body1">
          {t("newUiPages.liveGame.copy")}
        </Typography>
      </Box>
    </Container>
  );
}
