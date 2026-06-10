import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import { getCompetitions } from "../services/competitions";
import { getAllGames } from "../services/games";
import { queryKeys } from "../utils/queryKeys";
import { buildNewRecordGamesView } from "../components/record/buildNewRecordGamesView";
import NewRecordGamesSection from "../components/record/NewRecordGamesSection";
import { useSelectedTeam } from "../components/team/useSelectedTeam";

export default function RecordGamePage() {
  const { t } = useTranslation("navigation");
  const { selectedTeam, selectedTeamId, isLoadingTeams, teamsError } =
    useSelectedTeam();
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

  const recordView = useMemo(
    () =>
      buildNewRecordGamesView({
        games,
        selectedTeamId: effectiveSelectedTeamId,
        teamCompetitions,
      }),
    [effectiveSelectedTeamId, games, teamCompetitions]
  );

  const isLoading =
    isLoadingTeams ||
    isLoadingGames ||
    (effectiveSelectedTeamId !== undefined && isLoadingTeamCompetitions);
  const error = teamsError || gamesError || teamCompetitionsError;

  if (isLoading) {
    return <LoadingState message={t("newUiPages.recordGame.loading")} />;
  }

  if (error) {
    return <ErrorState message={t("newUiPages.recordGame.error")} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography color="text.secondary" variant="overline">
            {selectedTeam && effectiveSelectedTeamId !== undefined
              ? t("newUiPages.recordGame.selectedTeamEyebrow", {
                  teamName: selectedTeam.name,
                })
              : t("newUiPages.recordGame.globalEyebrow")}
          </Typography>
          <Typography component="h1" gutterBottom variant="h4">
            {t("newUiPages.recordGame.heading")}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {t("newUiPages.recordGame.copy")}
          </Typography>
        </Box>

        {recordView.allRecordableGames.length === 0 ? (
          <Paper
            elevation={0}
            sx={(theme) => ({
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              color: "text.secondary",
              p: { xs: 3, md: 5 },
              textAlign: "center",
            })}
          >
            <Typography variant="body1">
              {t("newUiPages.recordGame.empty.page")}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={4}>
            <NewRecordGamesSection
              emptyLabel={t("newUiPages.recordGame.empty.section")}
              games={recordView.startedGames}
              title={t("newUiPages.recordGame.sections.started")}
            />
            <NewRecordGamesSection
              emptyLabel={t("newUiPages.recordGame.empty.section")}
              games={recordView.readyGames}
              title={t("newUiPages.recordGame.sections.ready")}
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
