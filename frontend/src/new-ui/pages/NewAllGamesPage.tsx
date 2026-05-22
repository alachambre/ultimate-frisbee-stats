import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import CreateCompetitionModal from "../../components/modals/CreateCompetitionModal";
import CreateGameModal from "../../components/modals/CreateGameModal";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import PermissionNotice from "../../components/shared/PermissionNotice";
import { getCompetitions } from "../../services/competitions";
import { getAllGames } from "../../services/games";
import { formatDateTime } from "../../utils/dateFormatting";
import { queryKeys } from "../../utils/queryKeys";
import { buildNewGamesDashboard } from "../games/buildNewGamesDashboard";
import NewCompetitionGamesAccordion from "../games/NewCompetitionGamesAccordion";
import NewGamesSummaryStrip from "../games/NewGamesSummaryStrip";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewAllGamesPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "games"]);
  const [opponentSearch, setOpponentSearch] = useState("");
  const [isCreateCompetitionOpen, setIsCreateCompetitionOpen] = useState(false);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
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
        opponentSearch,
      }),
    [effectiveSelectedTeamId, games, opponentSearch, teamCompetitions]
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
  const emptyMessage = opponentSearch.trim()
    ? t("newUiPages.allGames.empty.filtered")
    : effectiveSelectedTeamId === undefined
      ? t("newUiPages.allGames.empty.public")
      : t("newUiPages.allGames.empty.team");
  const formatCompetitionDate = (value: string | null) =>
    value
      ? formatDateTime(value, i18n.resolvedLanguage)
      : t("games:detail.dateNotSet");

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
              <>
                <Button
                  onClick={() => setIsCreateGameOpen(true)}
                  startIcon={<AddIcon />}
                  type="button"
                  variant="contained"
                >
                  {t("newUiPages.allGames.actions.newGame")}
                </Button>
                <Button
                  onClick={() => setIsCreateCompetitionOpen(true)}
                  startIcon={<AddIcon />}
                  type="button"
                  variant="outlined"
                >
                  {t("newUiPages.allGames.actions.newCompetition")}
                </Button>
              </>
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
            results: t("newUiPages.allGames.summary.results"),
          }}
        />

        <TextField
          fullWidth
          label={t("newUiPages.allGames.filters.opponent")}
          onChange={(event) => setOpponentSearch(event.target.value)}
          value={opponentSearch}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        {dashboard.competitionGroups.length === 0 ? (
          <Box
            sx={(theme) => ({
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              color: "text.secondary",
              p: { xs: 3, md: 5 },
              textAlign: "center",
            })}
          >
            <Typography variant="body1">{emptyMessage}</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {dashboard.competitionGroups.map((group) => (
              <NewCompetitionGamesAccordion
                formatDate={formatCompetitionDate}
                group={group}
                key={group.competitionId}
                labels={{
                  live: t("newUiPages.allGames.summary.live"),
                  upcoming: t("newUiPages.allGames.summary.upcoming"),
                  completed: t("newUiPages.allGames.summary.completed"),
                  results: t("newUiPages.allGames.summary.results"),
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {canEditData && (
        <>
          <CreateGameModal
            isOpen={isCreateGameOpen}
            onClose={() => setIsCreateGameOpen(false)}
          />
          <CreateCompetitionModal
            isOpen={isCreateCompetitionOpen}
            onClose={() => setIsCreateCompetitionOpen(false)}
          />
        </>
      )}
    </Container>
  );
}
