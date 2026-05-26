import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import AddPlayersToRosterModal from "../../components/modals/AddPlayersToRosterModal";
import CreateCompetitionModal from "../../components/modals/CreateCompetitionModal";
import CreateGameModal from "../../components/modals/CreateGameModal";
import EditCompetitionModal from "../../components/modals/EditCompetitionModal";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import PermissionNotice from "../../components/shared/PermissionNotice";
import {
  getCompetitionPlayers,
  getCompetitions,
} from "../../services/competitions";
import { getAllGames } from "../../services/games";
import type { CompetitionWithTeam } from "../../types";
import { formatDate, formatDateTime } from "../../utils/dateFormatting";
import { queryKeys } from "../../utils/queryKeys";
import {
  buildNewGamesDashboard,
  isCompetitionOpenForNewGames,
} from "../games/buildNewGamesDashboard";
import NewCompetitionGamesAccordion from "../games/NewCompetitionGamesAccordion";
import NewGamesSummaryStrip from "../games/NewGamesSummaryStrip";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewAllGamesPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "games", "common"]);
  const [opponentSearch, setOpponentSearch] = useState("");
  const [isCreateCompetitionOpen, setIsCreateCompetitionOpen] = useState(false);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] =
    useState<CompetitionWithTeam | null>(null);
  const [rosterCompetition, setRosterCompetition] =
    useState<CompetitionWithTeam | null>(null);
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

  const rosterCompetitionId = rosterCompetition?.id ?? 0;
  const {
    data: rosterPlayers = [],
    isLoading: isLoadingRosterPlayers,
    error: rosterPlayersError,
  } = useQuery({
    queryKey: queryKeys.competitionPlayers(rosterCompetitionId),
    queryFn: () => getCompetitionPlayers(rosterCompetitionId),
    enabled: canEditData && rosterCompetition !== null,
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
  const formatCompetitionDate = (value: string | null) => {
    if (!value) {
      return t("games:detail.dateNotSet");
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? formatDate(value, i18n.resolvedLanguage)
      : formatDateTime(value, i18n.resolvedLanguage);
  };
  const closeRosterDialog = () => setRosterCompetition(null);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 5 } }}>
      <Stack spacing={3}>
        <Box
          sx={(theme) => ({
            alignItems: { xs: "stretch", md: "flex-start" },
            borderBottom: {
              xs: `1px solid ${theme.palette.divider}`,
              md: "none",
            },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1.5, md: 2 },
            justifyContent: "space-between",
            pb: { xs: 2, md: 0 },
          })}
        >
          <Stack spacing={0.75} sx={{ maxWidth: 720 }}>
            <Typography
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.2 }}
              variant="overline"
            >
              {selectedTeam && effectiveSelectedTeamId !== undefined
                ? t("newUiPages.allGames.selectedTeamEyebrow", {
                    teamName: selectedTeam.name,
                  })
                : t("newUiPages.allGames.globalEyebrow")}
            </Typography>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent={{ xs: "space-between", sm: "flex-start" }}
              spacing={1}
            >
              <Typography
                component="h1"
                fontWeight={800}
                sx={{ lineHeight: 1.1 }}
                variant="h4"
              >
                {t("newUiPages.allGames.heading")}
              </Typography>
              {selectedTeam && effectiveSelectedTeamId !== undefined && (
                <Chip
                  label={selectedTeam.name}
                  size="small"
                  sx={{ flexShrink: 0 }}
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
              variant="body1"
            >
              {isPublicFallback
                ? t("newUiPages.allGames.publicNotice")
                : t("newUiPages.allGames.copy")}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignSelf: { md: "flex-start" },
              width: { xs: "100%", md: "auto" },
              "& .MuiButton-root": {
                flex: { sm: 1, md: "initial" },
                minWidth: { xs: 0, md: 168 },
                px: { xs: 1, sm: 2 },
                whiteSpace: "nowrap",
              },
            }}
          >
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
                canManageCompetition={canEditData}
                formatDate={formatCompetitionDate}
                group={group}
                key={group.competitionId}
                labels={{
                  editCompetition: t(
                    "newUiPages.allGames.actions.editCompetition"
                  ),
                  editCompetitionAria: t(
                    "newUiPages.allGames.actions.editCompetitionAria",
                    { competitionName: group.competitionName }
                  ),
                  emptyCompetition: t(
                    "newUiPages.allGames.empty.competition"
                  ),
                  live: t("newUiPages.allGames.summary.live"),
                  manageRoster: t("newUiPages.allGames.actions.manageRoster"),
                  manageRosterAria: t(
                    "newUiPages.allGames.actions.manageRosterAria",
                    { competitionName: group.competitionName }
                  ),
                  upcoming: t("newUiPages.allGames.summary.upcoming"),
                  completed: t("newUiPages.allGames.summary.completed"),
                  results: t("newUiPages.allGames.summary.results"),
                }}
                onEditCompetition={(editableGroup) =>
                  setEditingCompetition(editableGroup.competition)
                }
                onManageRoster={(editableGroup) => {
                  if (editableGroup.competition) {
                    setRosterCompetition(editableGroup.competition);
                  }
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      {canEditData && (
        <>
          <CreateGameModal
            competitionFilter={isCompetitionOpenForNewGames}
            isOpen={isCreateGameOpen}
            onClose={() => setIsCreateGameOpen(false)}
            teamId={effectiveSelectedTeamId}
          />
          <CreateCompetitionModal
            isOpen={isCreateCompetitionOpen}
            onClose={() => setIsCreateCompetitionOpen(false)}
          />
          {editingCompetition && (
            <EditCompetitionModal
              key={editingCompetition.id}
              competition={editingCompetition}
              isOpen={editingCompetition !== null}
              onClose={() => setEditingCompetition(null)}
            />
          )}
          {rosterCompetition && isLoadingRosterPlayers && (
            <Dialog open onClose={closeRosterDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                {t("newUiPages.allGames.actions.manageRoster")}
              </DialogTitle>
              <DialogContent>
                <Typography color="text.secondary">
                  {t("common:action.loading")}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeRosterDialog}>
                  {t("common:action.cancel")}
                </Button>
              </DialogActions>
            </Dialog>
          )}
          {rosterCompetition && rosterPlayersError && (
            <Dialog open onClose={closeRosterDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                {t("newUiPages.allGames.actions.manageRoster")}
              </DialogTitle>
              <DialogContent>
                <Alert severity="error">{t("common:error.loading")}</Alert>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeRosterDialog}>
                  {t("common:action.close")}
                </Button>
              </DialogActions>
            </Dialog>
          )}
          {rosterCompetition &&
            !isLoadingRosterPlayers &&
            !rosterPlayersError && (
              <AddPlayersToRosterModal
                key={rosterCompetition.id}
                competitionId={rosterCompetition.id}
                currentRosterIds={rosterPlayers.map((player) => player.id)}
                isOpen
                onClose={closeRosterDialog}
                teamId={rosterCompetition.team_id}
              />
            )}
        </>
      )}
    </Container>
  );
}
