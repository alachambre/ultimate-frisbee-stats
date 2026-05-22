import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BarChartIcon from "@mui/icons-material/BarChart";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import PermissionNotice from "../../components/shared/PermissionNotice";
import { getCompetitions } from "../../services/competitions";
import { getAllGames } from "../../services/games";
import { queryKeys } from "../../utils/queryKeys";
import { buildNewGamesDashboard } from "../games/buildNewGamesDashboard";
import NewGamesSection from "../games/NewGamesSection";
import NewGamesSummaryStrip from "../games/NewGamesSummaryStrip";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewAllGamesPage() {
  const auth = useAuth();
  const { t } = useTranslation("navigation");
  const {
    selectedTeam,
    selectedTeamId,
    isLoadingTeams,
    teamsError,
    canLoadTeams,
  } = useNewUiTeam();
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
  const canViewStatistics =
    !shouldProtectUi || auth.capabilities.canViewStatistics;
  const effectiveSelectedTeamId = teamsError ? undefined : selectedTeamId;

  const {
    data: games = [],
    isLoading: isLoadingGames,
    error: gamesError,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
  });

  const {
    data: teamCompetitions,
    isLoading: isLoadingTeamCompetitions,
    error: teamCompetitionsError,
  } = useQuery({
    queryKey:
      effectiveSelectedTeamId === undefined
        ? queryKeys.competitions
        : queryKeys.competitionsByTeam(effectiveSelectedTeamId),
    queryFn: () => getCompetitions(effectiveSelectedTeamId),
    enabled: effectiveSelectedTeamId !== undefined,
  });

  const dashboard = useMemo(
    () =>
      buildNewGamesDashboard({
        games,
        selectedTeamId: effectiveSelectedTeamId,
        teamCompetitions,
      }),
    [effectiveSelectedTeamId, games, teamCompetitions]
  );

  const isLoading =
    auth.isLoading ||
    isLoadingTeams ||
    isLoadingGames ||
    (effectiveSelectedTeamId !== undefined && isLoadingTeamCompetitions);
  const error = gamesError || teamCompetitionsError;

  if (isLoading) {
    return <LoadingState message={t("newUiPages.allGames.loading")} />;
  }

  if (error) {
    return <ErrorState message={t("newUiPages.allGames.error")} />;
  }

  const isPublicFallback =
    !canLoadTeams || Boolean(teamsError) || effectiveSelectedTeamId === undefined;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box
          sx={{
            alignItems: { xs: "stretch", md: "flex-start" },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Typography color="text.secondary" variant="overline">
              {selectedTeam && effectiveSelectedTeamId !== undefined
                ? t("newUiPages.allGames.selectedTeamEyebrow", {
                    teamName: selectedTeam.name,
                  })
                : t("newUiPages.allGames.globalEyebrow")}
            </Typography>
            <Typography component="h1" gutterBottom variant="h4">
              {t("newUiPages.allGames.heading")}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {isPublicFallback
                ? t("newUiPages.allGames.publicNotice")
                : t("newUiPages.allGames.copy")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {canEditData && (
              <Button
                component={Link}
                startIcon={<PlayArrowIcon />}
                to="/record"
                variant="contained"
              >
                {t("newUiPages.allGames.actions.record")}
              </Button>
            )}
            <Button
              component={Link}
              startIcon={<RadioButtonCheckedIcon />}
              to="/live"
              variant="outlined"
            >
              {t("newUiPages.allGames.actions.live")}
            </Button>
            {canViewStatistics && effectiveSelectedTeamId !== undefined && (
              <Button
                component={Link}
                startIcon={<BarChartIcon />}
                to={`/statistics?teamId=${effectiveSelectedTeamId}`}
                variant="outlined"
              >
                {t("newUiPages.allGames.actions.statistics")}
              </Button>
            )}
          </Stack>
        </Box>

        {isPublicFallback && (
          <PermissionNotice
            title={t("newUiPages.allGames.publicCopy")}
            description={t("newUiPages.allGames.publicNotice")}
          />
        )}

        <NewGamesSummaryStrip
          summary={dashboard.summary}
          labels={{
            live: t("newUiPages.allGames.summary.live"),
            upcoming: t("newUiPages.allGames.summary.upcoming"),
            completed: t("newUiPages.allGames.summary.completed"),
            record: t("newUiPages.allGames.summary.record"),
          }}
        />

        {dashboard.allGames.length === 0 ? (
          <Box
            sx={(theme) => ({
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              color: "text.secondary",
              p: { xs: 3, md: 5 },
              textAlign: "center",
            })}
          >
            <Typography variant="body1">
              {effectiveSelectedTeamId === undefined
                ? t("newUiPages.allGames.empty.public")
                : t("newUiPages.allGames.empty.team")}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={4}>
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.liveGames}
              title={t("newUiPages.allGames.sections.live")}
            />
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.upcomingGames}
              title={t("newUiPages.allGames.sections.upcoming")}
            />
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.recentGames}
              title={t("newUiPages.allGames.sections.recent")}
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
