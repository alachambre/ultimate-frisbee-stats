import { Link } from "react-router-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SettingsIcon from "@mui/icons-material/Settings";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import { useNewUiTeam } from "../team/useNewUiTeam";

interface SetupCardProps {
  actionLabel: string;
  description: string;
  href: string;
  icon: ReactNode;
  title: string;
}

function SetupCard({
  actionLabel,
  description,
  href,
  icon,
  title,
}: SetupCardProps) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
        p: 2.5,
      })}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack alignItems="center" direction="row" spacing={1.25}>
          {icon}
          <Typography component="h2" fontWeight={800} variant="h6">
            {title}
          </Typography>
        </Stack>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
        <Button
          component={Link}
          sx={{ alignSelf: "flex-start", mt: "auto" }}
          to={href}
          variant="outlined"
        >
          {actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function NewTeamSetupPage() {
  const { t } = useTranslation("navigation");
  const theme = useTheme();
  const {
    isLoadingTeams,
    selectedTeam,
    selectedTeamId,
    teams,
    teamsError,
  } = useNewUiTeam();

  if (isLoadingTeams) {
    return <LoadingState message={t("newUiPages.teamSetup.loading")} />;
  }

  if (teamsError) {
    return <ErrorState message={t("newUiPages.teamSetup.error")} />;
  }

  const hasSelectedTeam = selectedTeam && selectedTeamId !== undefined;
  const teamDetailHref = hasSelectedTeam ? `/teams/${selectedTeamId}` : "/teams";
  const playerCountLabel = hasSelectedTeam
    ? t(
        selectedTeam.players.length === 1
          ? "newUiPages.teamSetup.playerCount.one"
          : "newUiPages.teamSetup.playerCount.other",
        { count: selectedTeam.players.length }
      )
    : "";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography color="text.secondary" variant="overline">
            {hasSelectedTeam
              ? t("newUiPages.teamSetup.selectedTeamEyebrow", {
                  teamName: selectedTeam.name,
                })
              : t("newUiPages.teamSetup.noTeamEyebrow")}
          </Typography>
          <Typography component="h1" gutterBottom variant="h4">
            {t("newUiPages.teamSetup.heading")}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {t("newUiPages.teamSetup.copy")}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={(innerTheme) => ({
            border: `1px solid ${innerTheme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 2, sm: 3 },
          })}
        >
          {hasSelectedTeam ? (
            <Stack
              alignItems={{ xs: "flex-start", sm: "center" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography component="h2" fontWeight={900} variant="h5">
                  {selectedTeam.name}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {playerCountLabel}
                </Typography>
              </Box>
              <Button component={Link} to={teamDetailHref} variant="contained">
                {t("newUiPages.teamSetup.actions.openRosterLines")}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Typography component="h2" fontWeight={900} variant="h5">
                {t("newUiPages.teamSetup.noTeamTitle")}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {teams.length > 0
                  ? t("newUiPages.teamSetup.noTeamCopy")
                  : t("newUiPages.teamSetup.noTeamsCopy")}
              </Typography>
              <Button
                component={Link}
                sx={{ alignSelf: "flex-start" }}
                to="/teams"
                variant="contained"
              >
                {t("newUiPages.teamSetup.actions.openTeams")}
              </Button>
            </Stack>
          )}
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SetupCard
              actionLabel={t("newUiPages.teamSetup.actions.openRosterLines")}
              description={t("newUiPages.teamSetup.cards.rosterLines.copy")}
              href={teamDetailHref}
              icon={<GroupsIcon sx={{ color: theme.palette.primary.main }} />}
              title={t("newUiPages.teamSetup.cards.rosterLines.title")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SetupCard
              actionLabel={t("newUiPages.teamSetup.actions.openCompetitions")}
              description={t("newUiPages.teamSetup.cards.competitions.copy")}
              href="/competitions"
              icon={
                <CalendarMonthIcon sx={{ color: theme.colors.pull.main }} />
              }
              title={t("newUiPages.teamSetup.cards.competitions.title")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SetupCard
              actionLabel={t("newUiPages.teamSetup.actions.openStrategies")}
              description={t("newUiPages.teamSetup.cards.strategies.copy")}
              href="/strategies"
              icon={
                <LightbulbIcon sx={{ color: theme.colors.offense.main }} />
              }
              title={t("newUiPages.teamSetup.cards.strategies.title")}
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={(innerTheme) => ({
            border: `1px solid ${innerTheme.palette.divider}`,
            borderRadius: 1,
            p: 2,
          })}
        >
          <Stack alignItems="center" direction="row" spacing={1.25}>
            <SettingsIcon color="action" />
            <Typography color="text.secondary" variant="body2">
              {t("newUiPages.teamSetup.mobileNote")}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
