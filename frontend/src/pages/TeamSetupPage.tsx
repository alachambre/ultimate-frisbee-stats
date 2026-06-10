import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ViewListIcon from "@mui/icons-material/ViewList";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import AddPlayerModal from "../components/modals/AddPlayerModal";
import AddPlayersToLineModal from "../components/modals/AddPlayersToLineModal";
import CreateLineModal from "../components/modals/CreateLineModal";
import CreateTeamModal from "../components/modals/CreateTeamModal";
import EditLineModal from "../components/modals/EditLineModal";
import EditPlayerModal from "../components/modals/EditPlayerModal";
import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import { deleteLine, getLines } from "../services/lines";
import { deletePlayer } from "../services/players";
import { deleteTeam, getTeam, updateTeam } from "../services/teams";
import type { Gender, LineWithPlayers, Player, TeamWithPlayers } from "../types";
import { queryKeys } from "../utils/queryKeys";
import { useSelectedTeam } from "../components/team/useSelectedTeam";

type SetupTab = "roster" | "lines";
type RosterFilter = "all" | Gender;

const EMPTY_LINES: LineWithPlayers[] = [];
const TEAM_DELETE_CASCADE_QUERY_ROOTS = new Set([
  "activePoint",
  "competition",
  "competition-games",
  "competition-players",
  "competitionPlayerStatistics",
  "competitionStrategyStatistics",
  "competitionTeamStatistics",
  "competitions",
  "game",
  "gameLiveState",
  "gamePointTimeline",
  "gameStrategyStatistics",
  "gameTeamStatistics",
  "gameTurnovers",
  "games",
  "halftime",
  "line",
  "lines",
  "liveStats",
  "teamEvolutionStatistics",
  "teamPlayerStatistics",
  "teamStrategyStatistics",
  "teamTeamStatistics",
]);

function getInitials(value: string): string {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "?";
}

function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((left, right) => left.name.localeCompare(right.name));
}

function getLineComposition(line: LineWithPlayers): { men: number; women: number } {
  return line.players.reduce(
    (composition, player) => {
      if (player.gender === "M") {
        composition.men += 1;
      } else {
        composition.women += 1;
      }
      return composition;
    },
    { men: 0, women: 0 }
  );
}

function getPlayerLineNames(
  playerId: number,
  lines: LineWithPlayers[],
  emptyLabel: string
): string {
  const names = lines
    .filter((line) => line.players.some((player) => player.id === playerId))
    .map((line) => line.name);

  return names.length > 0 ? names.join(", ") : emptyLabel;
}

function getPlayersPreview(players: Player[], emptyLabel: string): string {
  if (players.length === 0) {
    return emptyLabel;
  }

  const sortedNames = sortPlayers(players).map((player) => player.name);
  const preview = sortedNames.slice(0, 5).join(", ");
  return sortedNames.length > 5 ? `${preview}...` : preview;
}

interface AvatarMarkProps {
  label: string;
}

function AvatarMark({ label }: AvatarMarkProps) {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: theme.colors.newUi.primarySoft,
        borderRadius: "50%",
        color: theme.colors.newUi.primary,
        display: "inline-flex",
        flex: "0 0 auto",
        fontSize: 14,
        fontWeight: 900,
        height: 36,
        justifyContent: "center",
        width: 36,
      })}
    >
      {getInitials(label)}
    </Box>
  );
}

interface SummaryItemProps {
  label: string;
  value: number | string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: { xs: 1.75, sm: 2.25 },
      })}
    >
      <Typography color="text.secondary" fontWeight={600} variant="body2">
        {label}
      </Typography>
      <Typography component="strong" fontWeight={900} sx={{ mt: 0.75 }} variant="h5">
        {value}
      </Typography>
    </Paper>
  );
}

interface ConfirmDeleteDialogProps {
  errorMessage: string;
  isDeleting: boolean;
  isError: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}

function ConfirmDeleteDialog({
  errorMessage,
  isDeleting,
  isError,
  message,
  onClose,
  onConfirm,
  open,
  title,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation("common");

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
        {isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onClose}>
          {t("action.cancel")}
        </Button>
        <Button
          color="error"
          disabled={isDeleting}
          onClick={onConfirm}
          variant="contained"
        >
          {isDeleting ? t("action.loading") : t("action.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TeamSetupPage() {
  const { t } = useTranslation(["navigation", "common"]);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SetupTab>("roster");
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>("all");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isRenameTeamOpen, setIsRenameTeamOpen] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [isDeleteTeamOpen, setIsDeleteTeamOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [isCreateLineOpen, setIsCreateLineOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<LineWithPlayers | null>(null);
  const [managingLine, setManagingLine] = useState<LineWithPlayers | null>(null);
  const [deletingLine, setDeletingLine] = useState<LineWithPlayers | null>(null);
  const {
    isLoadingTeams,
    selectedTeam: selectedTeamOption,
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsError,
  } = useSelectedTeam();

  const hasSelectedTeam = selectedTeamId !== undefined;
  const {
    data: selectedTeamDetail,
    isLoading: isLoadingSelectedTeam,
    error: selectedTeamError,
  } = useQuery({
    queryKey: queryKeys.team(selectedTeamId ?? 0),
    queryFn: () => getTeam(selectedTeamId ?? 0),
    enabled: hasSelectedTeam,
  });

  const {
    data: linesData,
    isLoading: isLoadingLines,
    error: linesError,
  } = useQuery({
    queryKey: queryKeys.teamLines(selectedTeamId ?? 0),
    queryFn: () => getLines(selectedTeamId),
    enabled: hasSelectedTeam,
  });

  const selectedTeam = selectedTeamDetail ?? selectedTeamOption;
  const lines = linesData ?? EMPTY_LINES;
  const selectedTeamName = selectedTeam?.name ?? "";
  const trimmedTeamNameDraft = teamNameDraft.trim();
  const menCount =
    selectedTeam?.players.filter((player) => player.gender === "M").length ?? 0;
  const womenCount =
    selectedTeam?.players.filter((player) => player.gender === "W").length ?? 0;

  const filteredPlayers = useMemo(() => {
    const players = selectedTeam?.players ?? [];
    return sortPlayers(
      rosterFilter === "all"
        ? players
        : players.filter((player) => player.gender === rosterFilter)
    );
  }, [rosterFilter, selectedTeam?.players]);

  const sortedLines = useMemo(
    () => [...lines].sort((left, right) => left.name.localeCompare(right.name)),
    [lines]
  );

  const getRosterLineLabel = (playerId: number) => {
    if (isLoadingLines) {
      return t("navigation:newUiPages.teamSetup.lines.loading");
    }

    if (linesError) {
      return t("navigation:newUiPages.teamSetup.lines.lineDataUnavailable");
    }

    return getPlayerLineNames(
      playerId,
      lines,
      t("navigation:newUiPages.teamSetup.roster.noLines")
    );
  };

  const invalidateSelectedTeamWorkspace = async () => {
    if (selectedTeamId === undefined) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.teams }),
      queryClient.invalidateQueries({ queryKey: queryKeys.team(selectedTeamId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teamLines(selectedTeamId) }),
    ]);
  };

  const renameTeamMutation = useMutation({
    mutationFn: ({ name, teamId }: { name: string; teamId: number }) =>
      updateTeam(teamId, { name }),
    onSuccess: async (team) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicTeams }),
        queryClient.invalidateQueries({ queryKey: queryKeys.team(team.id) }),
      ]);
      setIsRenameTeamOpen(false);
      setTeamNameDraft("");
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => deleteTeam(teamId),
    onSuccess: async (_data, deletedTeamId) => {
      const nextTeam = teams.find((team) => team.id !== deletedTeamId);
      const removeDeletedTeam = (currentTeams?: TeamWithPlayers[]) =>
        currentTeams?.filter((team) => team.id !== deletedTeamId);

      queryClient.setQueryData(queryKeys.teams, removeDeletedTeam);
      queryClient.setQueryData(queryKeys.publicTeams, removeDeletedTeam);
      queryClient.removeQueries({ queryKey: queryKeys.team(deletedTeamId) });
      queryClient.removeQueries({ queryKey: queryKeys.teamLines(deletedTeamId) });
      queryClient.removeQueries({
        predicate: ({ queryKey }) => {
          const [root, identifier] = queryKey;
          if (root === "team" && identifier === deletedTeamId) {
            return true;
          }

          return (
            typeof root === "string" && TEAM_DELETE_CASCADE_QUERY_ROOTS.has(root)
          );
        },
      });
      setSelectedTeamId(nextTeam?.id);
      setActiveTab("roster");
      setRosterFilter("all");
      setIsDeleteTeamOpen(false);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicTeams }),
        nextTeam
          ? queryClient.invalidateQueries({ queryKey: queryKeys.team(nextTeam.id) })
          : Promise.resolve(),
      ]);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (playerId: number) => deletePlayer(playerId),
    onSuccess: async () => {
      await invalidateSelectedTeamWorkspace();
      setDeletingPlayer(null);
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: number) => deleteLine(lineId),
    onSuccess: async (_data, lineId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lines }),
        queryClient.invalidateQueries({ queryKey: queryKeys.line(lineId) }),
        invalidateSelectedTeamWorkspace(),
      ]);
      setDeletingLine(null);
    },
  });

  const handleTabChange = (_event: SyntheticEvent, value: SetupTab) => {
    setActiveTab(value);
  };

  const handleRosterFilterChange = (
    _event: MouseEvent<HTMLElement>,
    value: RosterFilter | null
  ) => {
    if (value) {
      setRosterFilter(value);
    }
  };

  const handleTeamSelectionChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextTeamId = Number(event.target.value);
    setSelectedTeamId(Number.isFinite(nextTeamId) ? nextTeamId : undefined);
    setActiveTab("roster");
    setRosterFilter("all");
  };

  const openRenameTeamDialog = () => {
    renameTeamMutation.reset();
    setTeamNameDraft(selectedTeamName);
    setIsRenameTeamOpen(true);
  };

  const closeRenameTeamDialog = () => {
    if (renameTeamMutation.isPending) {
      return;
    }

    renameTeamMutation.reset();
    setIsRenameTeamOpen(false);
  };

  const handleRenameTeamSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      selectedTeamId === undefined ||
      trimmedTeamNameDraft.length === 0 ||
      trimmedTeamNameDraft === selectedTeamName.trim()
    ) {
      return;
    }

    renameTeamMutation.mutate({
      teamId: selectedTeamId,
      name: trimmedTeamNameDraft,
    });
  };

  const openDeleteTeamDialog = () => {
    deleteTeamMutation.reset();
    setIsDeleteTeamOpen(true);
  };

  const closeDeleteTeamDialog = () => {
    if (deleteTeamMutation.isPending) {
      return;
    }

    deleteTeamMutation.reset();
    setIsDeleteTeamOpen(false);
  };

  const handleTeamCreated = (team: { id: number }) => {
    setSelectedTeamId(team.id);
    setActiveTab("roster");
    setRosterFilter("all");
  };

  const closeCreateLineModal = async () => {
    setIsCreateLineOpen(false);
    await invalidateSelectedTeamWorkspace();
  };

  const closeEditLineModal = async () => {
    setEditingLine(null);
    await invalidateSelectedTeamWorkspace();
  };

  const closeManageLineModal = async () => {
    setManagingLine(null);
    await invalidateSelectedTeamWorkspace();
  };

  if (isLoadingTeams || (hasSelectedTeam && isLoadingSelectedTeam)) {
    return <LoadingState message={t("navigation:newUiPages.teamSetup.loading")} />;
  }

  if (teamsError || selectedTeamError) {
    return <ErrorState message={t("navigation:newUiPages.teamSetup.error")} />;
  }

  const canChangeSelectedTeam = teams.length > 1;
  const showNoTeamState = !selectedTeam || selectedTeamId === undefined;
  const playerCount = selectedTeam?.players.length ?? 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 5 } }}>
      <Stack spacing={3}>
        <Stack spacing={0.75} sx={{ maxWidth: 760 }}>
          <Typography color="text.secondary" variant="overline">
            {selectedTeam
              ? t("navigation:newUiPages.teamSetup.selectedTeamEyebrow", {
                  teamName: selectedTeam.name,
                })
              : t("navigation:newUiPages.teamSetup.noTeamEyebrow")}
          </Typography>
          <Typography component="h1" fontWeight={900} sx={{ lineHeight: 1.1 }} variant="h4">
            {t("navigation:newUiPages.teamSetup.heading")}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {t("navigation:newUiPages.teamSetup.copy")}
          </Typography>
        </Stack>

        <Paper
          aria-label={t("navigation:newUiPages.teamSetup.teamCard.label")}
          elevation={0}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 2, md: 2.5 },
          })}
        >
          {showNoTeamState ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5}>
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    alignItems: "center",
                    bgcolor: theme.colors.newUi.primary,
                    borderRadius: "50%",
                    color: theme.palette.common.white,
                    display: "flex",
                    flexShrink: 0,
                    fontWeight: 900,
                    height: 48,
                    justifyContent: "center",
                    width: 48,
                  })}
                >
                  ?
                </Box>
                <Box>
                  <Typography component="h2" fontWeight={900} variant="h5">
                    {t("navigation:newUiPages.teamSetup.noTeamTitle")}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {teams.length > 0
                      ? t("navigation:newUiPages.teamSetup.noTeamCopy")
                      : t("navigation:newUiPages.teamSetup.noTeamsCopy")}
                  </Typography>
                </Box>
              </Stack>

              {teams.length > 0 && (
                <TextField
                  fullWidth
                  label={t("navigation:newUiPages.teamSetup.teamCard.selectLabel")}
                  onChange={handleTeamSelectionChange}
                  select
                  size="small"
                  value=""
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  onClick={() => setIsCreateTeamOpen(true)}
                  startIcon={<AddIcon />}
                  sx={(theme) => ({
                    bgcolor: theme.colors.newUi.primary,
                    color: theme.palette.common.white,
                    "&:hover": {
                      bgcolor: theme.colors.newUi.primary,
                    },
                  })}
                  variant="contained"
                >
                  {t("navigation:newUiPages.teamSetup.actions.newTeam")}
                </Button>
                <Button component={Link} to="/teams" variant="outlined">
                  {t("navigation:newUiPages.teamSetup.actions.openTeams")}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "stretch", md: "center" } }}
            >
              <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    alignItems: "center",
                    bgcolor: theme.colors.newUi.primary,
                    borderRadius: "50%",
                    color: theme.palette.common.white,
                    display: "flex",
                    flexShrink: 0,
                    fontWeight: 900,
                    height: 48,
                    justifyContent: "center",
                    width: 48,
                  })}
                >
                  {getInitials(selectedTeamName)}
                </Box>
                <Box sx={{ minWidth: 0, width: "100%" }}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={0.5}
                    sx={{ minWidth: 0 }}
                  >
                    <Typography color="text.secondary" sx={{ flex: 1 }} variant="body2">
                      {t("navigation:newUiPages.teamSetup.teamCard.selectedLabel")}
                    </Typography>
                    <Tooltip
                      title={t("navigation:newUiPages.teamSetup.actions.renameTeam")}
                    >
                      <IconButton
                        aria-label={t(
                          "navigation:newUiPages.teamSetup.actions.renameTeam"
                        )}
                        onClick={openRenameTeamDialog}
                        size="small"
                        sx={(theme) => ({
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: alpha(theme.colors.newUi.primary, 0.08),
                            color: theme.colors.newUi.primary,
                          },
                        })}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={t("navigation:newUiPages.teamSetup.actions.deleteTeam")}
                    >
                      <IconButton
                        aria-label={t(
                          "navigation:newUiPages.teamSetup.actions.deleteTeam"
                        )}
                        onClick={openDeleteTeamDialog}
                        size="small"
                        sx={(theme) => ({
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main,
                          },
                        })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography
                    component="h2"
                    fontWeight={900}
                    noWrap
                    sx={{ lineHeight: 1.2 }}
                    variant="h5"
                  >
                    {selectedTeamName}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {t("navigation:newUiPages.teamSetup.teamCard.scopeCopy")}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1} sx={{ minWidth: { md: 280 } }}>
                {canChangeSelectedTeam ? (
                  <TextField
                    fullWidth
                    label={t("navigation:newUiPages.teamSetup.teamCard.selectLabel")}
                    onChange={handleTeamSelectionChange}
                    select
                    size="small"
                    value={selectedTeamId}
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Chip
                    icon={<SwapHorizIcon />}
                    label={t("navigation:newUiPages.teamSetup.teamCard.onlyTeam")}
                    sx={(theme) => ({
                      alignSelf: "flex-start",
                      bgcolor: alpha(theme.colors.newUi.primary, 0.08),
                      color: theme.colors.newUi.primary,
                    })}
                  />
                )}
                <Button
                  onClick={() => setIsCreateTeamOpen(true)}
                  startIcon={<AddIcon />}
                  sx={(theme) => ({
                    bgcolor: theme.colors.newUi.primary,
                    color: theme.palette.common.white,
                    "&:hover": {
                      bgcolor: theme.colors.newUi.primary,
                    },
                  })}
                  variant="contained"
                >
                  {t("navigation:newUiPages.teamSetup.actions.newTeam")}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>

        {!showNoTeamState && selectedTeam && (
          <>
            <Box
              aria-label={t("navigation:newUiPages.teamSetup.summary.label")}
              sx={{
                display: "grid",
                gap: { xs: 1.25, sm: 1.75 },
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              <SummaryItem
                label={t("navigation:newUiPages.teamSetup.summary.players")}
                value={playerCount}
              />
              <SummaryItem
                label={t("navigation:newUiPages.teamSetup.summary.men")}
                value={menCount}
              />
              <SummaryItem
                label={t("navigation:newUiPages.teamSetup.summary.women")}
                value={womenCount}
              />
              <SummaryItem
                label={t("navigation:newUiPages.teamSetup.summary.lines")}
                value={isLoadingLines || linesError ? "-" : lines.length}
              />
            </Box>

            <Paper
              elevation={0}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                overflow: "hidden",
              })}
            >
              <Tabs
                aria-label={t("navigation:newUiPages.teamSetup.tabs.label")}
                onChange={handleTabChange}
                sx={(theme) => ({
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  px: 1,
                  "& .MuiTab-root": {
                    fontWeight: 800,
                    minHeight: 48,
                    textTransform: "none",
                  },
                  "& .Mui-selected": {
                    color: theme.colors.newUi.primary,
                  },
                  "& .MuiTabs-indicator": {
                    bgcolor: theme.colors.newUi.primary,
                  },
                })}
                value={activeTab}
              >
                <Tab
                  icon={<GroupsIcon />}
                  iconPosition="start"
                  label={t("navigation:newUiPages.teamSetup.tabs.roster")}
                  value="roster"
                />
                <Tab
                  icon={<ViewListIcon />}
                  iconPosition="start"
                  label={t("navigation:newUiPages.teamSetup.tabs.lines")}
                  value="lines"
                />
              </Tabs>

              {activeTab === "roster" && (
                <Box role="tabpanel" sx={{ p: { xs: 2, md: 2.75 } }}>
                  <Stack spacing={2.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: "stretch", sm: "flex-start" },
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography component="h2" fontWeight={900} variant="h5">
                          {t("navigation:newUiPages.teamSetup.roster.title")}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {t("navigation:newUiPages.teamSetup.roster.copy")}
                        </Typography>
                      </Box>
                      <Button
                        onClick={() => setIsAddPlayerOpen(true)}
                        startIcon={<PeopleAltIcon />}
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primary,
                          color: theme.palette.common.white,
                          flexShrink: 0,
                          "&:hover": {
                            bgcolor: theme.colors.newUi.primary,
                          },
                        })}
                        variant="contained"
                      >
                        {t("navigation:newUiPages.teamSetup.actions.addPlayer")}
                      </Button>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography color="text.secondary" fontWeight={800} variant="body2">
                        {t("navigation:newUiPages.teamSetup.roster.filterLabel")}
                      </Typography>
                      <ToggleButtonGroup
                        aria-label={t(
                          "navigation:newUiPages.teamSetup.roster.filterAria"
                        )}
                        exclusive
                        onChange={handleRosterFilterChange}
                        size="small"
                        value={rosterFilter}
                      >
                        <ToggleButton value="all">
                          {t("navigation:newUiPages.teamSetup.roster.filters.all")}
                        </ToggleButton>
                        <ToggleButton value="M">
                          {t("navigation:newUiPages.teamSetup.roster.filters.men")}
                        </ToggleButton>
                        <ToggleButton value="W">
                          {t("navigation:newUiPages.teamSetup.roster.filters.women")}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>

                    {filteredPlayers.length === 0 ? (
                      <Box
                        sx={(theme) => ({
                          border: `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1,
                          color: "text.secondary",
                          p: { xs: 3, md: 5 },
                          textAlign: "center",
                        })}
                      >
                        <Typography>
                          {t("navigation:newUiPages.teamSetup.roster.empty")}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                          <Table aria-label={t("navigation:newUiPages.teamSetup.roster.tableLabel")}>
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.roster.columns.player")}
                                </TableCell>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.roster.columns.gender")}
                                </TableCell>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.roster.columns.lines")}
                                </TableCell>
                                <TableCell align="right">
                                  {t("navigation:newUiPages.teamSetup.roster.columns.actions")}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredPlayers.map((player) => {
                                const playerLines = getRosterLineLabel(player.id);
                                return (
                                  <TableRow key={player.id}>
                                    <TableCell>
                                      <Stack alignItems="center" direction="row" spacing={1.25}>
                                        <AvatarMark label={player.name} />
                                        <Box>
                                          <Typography fontWeight={800}>
                                            {player.name}
                                          </Typography>
                                          {player.number !== null &&
                                            player.number !== undefined && (
                                              <Typography
                                                color="text.secondary"
                                                variant="caption"
                                              >
                                                {t(
                                                  "navigation:newUiPages.teamSetup.roster.number",
                                                  { number: player.number }
                                                )}
                                              </Typography>
                                            )}
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell>
                                      {t(
                                        `navigation:newUiPages.teamSetup.gender.${
                                          player.gender === "M" ? "men" : "women"
                                        }`
                                      )}
                                    </TableCell>
                                    <TableCell>{playerLines}</TableCell>
                                    <TableCell align="right">
                                      <Tooltip
                                        title={t(
                                          "navigation:newUiPages.teamSetup.actions.editPlayer"
                                        )}
                                      >
                                        <IconButton
                                          aria-label={t(
                                            "navigation:newUiPages.teamSetup.actions.editPlayerAria",
                                            { playerName: player.name }
                                          )}
                                          onClick={() => setEditingPlayer(player)}
                                          size="small"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip
                                        title={t(
                                          "navigation:newUiPages.teamSetup.actions.deletePlayer"
                                        )}
                                      >
                                        <IconButton
                                          aria-label={t(
                                            "navigation:newUiPages.teamSetup.actions.deletePlayerAria",
                                            { playerName: player.name }
                                          )}
                                          color="error"
                                          onClick={() => setDeletingPlayer(player)}
                                          size="small"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
                          {filteredPlayers.map((player) => {
                            const playerLines = getRosterLineLabel(player.id);
                            return (
                              <Paper
                                elevation={0}
                                key={player.id}
                                sx={(theme) => ({
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  position: "relative",
                                })}
                              >
                                <Button
                                  aria-label={t(
                                    "navigation:newUiPages.teamSetup.actions.editPlayerAria",
                                    { playerName: player.name }
                                  )}
                                  onClick={() => setEditingPlayer(player)}
                                  sx={{
                                    alignItems: "flex-start",
                                    color: "text.primary",
                                    justifyContent: "flex-start",
                                    minHeight: 78,
                                    p: "14px 58px 14px 14px",
                                    textAlign: "left",
                                    textTransform: "none",
                                    width: "100%",
                                  }}
                                >
                                  <Stack alignItems="center" direction="row" spacing={1.25}>
                                    <AvatarMark label={player.name} />
                                    <Box>
                                      <Typography fontWeight={900}>
                                        {player.name}
                                      </Typography>
                                      <Typography color="text.secondary" variant="body2">
                                        {t(
                                          `navigation:newUiPages.teamSetup.gender.${
                                            player.gender === "M" ? "men" : "women"
                                          }`
                                        )}{" "}
                                        · {playerLines}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Button>
                                <Tooltip
                                  title={t(
                                    "navigation:newUiPages.teamSetup.actions.deletePlayer"
                                  )}
                                >
                                  <IconButton
                                    aria-label={t(
                                      "navigation:newUiPages.teamSetup.actions.deletePlayerAria",
                                      { playerName: player.name }
                                    )}
                                    color="error"
                                    onClick={() => setDeletingPlayer(player)}
                                    size="small"
                                    sx={(theme) => ({
                                      position: "absolute",
                                      right: 10,
                                      top: 10,
                                      "&:hover": {
                                        bgcolor: alpha(theme.palette.error.main, 0.08),
                                      },
                                    })}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Box>
              )}

              {activeTab === "lines" && (
                <Box role="tabpanel" sx={{ p: { xs: 2, md: 2.75 } }}>
                  <Stack spacing={2.25}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: "stretch", sm: "flex-start" },
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography component="h2" fontWeight={900} variant="h5">
                          {t("navigation:newUiPages.teamSetup.lines.title")}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {t("navigation:newUiPages.teamSetup.lines.copy")}
                        </Typography>
                      </Box>
                      <Button
                        onClick={() => setIsCreateLineOpen(true)}
                        startIcon={<AddIcon />}
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primary,
                          color: theme.palette.common.white,
                          flexShrink: 0,
                          "&:hover": {
                            bgcolor: theme.colors.newUi.primary,
                          },
                        })}
                        variant="contained"
                      >
                        {t("navigation:newUiPages.teamSetup.actions.newLine")}
                      </Button>
                    </Stack>

                    {isLoadingLines ? (
                      <Typography color="text.secondary">
                        {t("navigation:newUiPages.teamSetup.lines.loading")}
                      </Typography>
                    ) : linesError ? (
                      <Alert severity="error">
                        {t("navigation:newUiPages.teamSetup.lines.error")}
                      </Alert>
                    ) : sortedLines.length === 0 ? (
                      <Box
                        sx={(theme) => ({
                          border: `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1,
                          color: "text.secondary",
                          p: { xs: 3, md: 5 },
                          textAlign: "center",
                        })}
                      >
                        <Typography>
                          {t("navigation:newUiPages.teamSetup.lines.empty")}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                          <Table aria-label={t("navigation:newUiPages.teamSetup.lines.tableLabel")}>
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.lines.columns.line")}
                                </TableCell>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.lines.columns.composition")}
                                </TableCell>
                                <TableCell>
                                  {t("navigation:newUiPages.teamSetup.lines.columns.players")}
                                </TableCell>
                                <TableCell align="right">
                                  {t("navigation:newUiPages.teamSetup.lines.columns.actions")}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {sortedLines.map((line) => {
                                const composition = getLineComposition(line);
                                return (
                                  <TableRow key={line.id}>
                                    <TableCell>
                                      <Stack alignItems="center" direction="row" spacing={1.25}>
                                        <AvatarMark label={line.name} />
                                        <Box>
                                          <Typography fontWeight={800}>
                                            {line.name}
                                          </Typography>
                                          {line.description && (
                                            <Typography
                                              color="text.secondary"
                                              variant="caption"
                                            >
                                              {line.description}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={t(
                                          "navigation:newUiPages.teamSetup.lines.composition",
                                          composition
                                        )}
                                        size="small"
                                        sx={(theme) => ({
                                          bgcolor: theme.colors.newUi.primarySoft,
                                          borderColor: theme.colors.newUi.primaryBorder,
                                          color: theme.colors.newUi.primary,
                                          fontWeight: 800,
                                        })}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {getPlayersPreview(
                                        line.players,
                                        t("navigation:newUiPages.teamSetup.lines.noPlayers")
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip
                                        title={t(
                                          "navigation:newUiPages.teamSetup.actions.editLine"
                                        )}
                                      >
                                        <IconButton
                                          aria-label={t(
                                            "navigation:newUiPages.teamSetup.actions.editLineAria",
                                            { lineName: line.name }
                                          )}
                                          onClick={() => setEditingLine(line)}
                                          size="small"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip
                                        title={t(
                                          "navigation:newUiPages.teamSetup.actions.manageLineRoster"
                                        )}
                                      >
                                        <IconButton
                                          aria-label={t(
                                            "navigation:newUiPages.teamSetup.actions.manageLineRosterAria",
                                            { lineName: line.name }
                                          )}
                                          onClick={() => setManagingLine(line)}
                                          size="small"
                                        >
                                          <GroupsIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip
                                        title={t(
                                          "navigation:newUiPages.teamSetup.actions.deleteLine"
                                        )}
                                      >
                                        <IconButton
                                          aria-label={t(
                                            "navigation:newUiPages.teamSetup.actions.deleteLineAria",
                                            { lineName: line.name }
                                          )}
                                          color="error"
                                          onClick={() => setDeletingLine(line)}
                                          size="small"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
                          {sortedLines.map((line) => {
                            const composition = getLineComposition(line);
                            return (
                              <Paper
                                elevation={0}
                                key={line.id}
                                sx={(theme) => ({
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  position: "relative",
                                })}
                              >
                                <Button
                                  aria-label={t(
                                    "navigation:newUiPages.teamSetup.actions.editLineAria",
                                    { lineName: line.name }
                                  )}
                                  onClick={() => setEditingLine(line)}
                                  sx={{
                                    alignItems: "flex-start",
                                    color: "text.primary",
                                    justifyContent: "flex-start",
                                    minHeight: 90,
                                    p: "14px 96px 14px 14px",
                                    textAlign: "left",
                                    textTransform: "none",
                                    width: "100%",
                                  }}
                                >
                                  <Stack spacing={1}>
                                    <Stack alignItems="center" direction="row" spacing={1.25}>
                                      <AvatarMark label={line.name} />
                                      <Box>
                                        <Typography fontWeight={900}>
                                          {line.name}
                                        </Typography>
                                        <Typography color="text.secondary" variant="body2">
                                          {t(
                                            "navigation:newUiPages.teamSetup.lines.composition",
                                            composition
                                          )}
                                          {line.description ? ` · ${line.description}` : ""}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    <Typography color="text.secondary" variant="body2">
                                      {getPlayersPreview(
                                        line.players,
                                        t("navigation:newUiPages.teamSetup.lines.noPlayers")
                                      )}
                                    </Typography>
                                  </Stack>
                                </Button>
                                <Tooltip
                                  title={t(
                                    "navigation:newUiPages.teamSetup.actions.manageLineRoster"
                                  )}
                                >
                                  <IconButton
                                    aria-label={t(
                                      "navigation:newUiPages.teamSetup.actions.manageLineRosterAria",
                                      { lineName: line.name }
                                    )}
                                    onClick={() => setManagingLine(line)}
                                    size="small"
                                    sx={{ position: "absolute", right: 48, top: 10 }}
                                  >
                                    <GroupsIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip
                                  title={t(
                                    "navigation:newUiPages.teamSetup.actions.deleteLine"
                                  )}
                                >
                                  <IconButton
                                    aria-label={t(
                                      "navigation:newUiPages.teamSetup.actions.deleteLineAria",
                                      { lineName: line.name }
                                    )}
                                    color="error"
                                    onClick={() => setDeletingLine(line)}
                                    size="small"
                                    sx={(theme) => ({
                                      position: "absolute",
                                      right: 10,
                                      top: 10,
                                      "&:hover": {
                                        bgcolor: alpha(theme.palette.error.main, 0.08),
                                      },
                                    })}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Stack>

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onCreated={handleTeamCreated}
      />

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={closeRenameTeamDialog}
        open={isRenameTeamOpen}
      >
        <Box component="form" onSubmit={handleRenameTeamSubmit}>
          <DialogTitle>
            {t("navigation:newUiPages.teamSetup.renameTeam.title")}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              inputProps={{ maxLength: 100 }}
              label={t("navigation:newUiPages.teamSetup.renameTeam.nameLabel")}
              margin="dense"
              onChange={(event) => setTeamNameDraft(event.target.value)}
              required
              value={teamNameDraft}
            />
            {renameTeamMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {t("navigation:newUiPages.teamSetup.renameTeam.error")}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              disabled={renameTeamMutation.isPending}
              onClick={closeRenameTeamDialog}
            >
              {t("common:action.cancel")}
            </Button>
            <Button
              disabled={
                renameTeamMutation.isPending ||
                trimmedTeamNameDraft.length === 0 ||
                trimmedTeamNameDraft === selectedTeamName.trim()
              }
              type="submit"
              variant="contained"
            >
              {renameTeamMutation.isPending
                ? t("common:action.saving")
                : t("common:action.save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {selectedTeamId !== undefined && (
        <>
          <AddPlayerModal
            isOpen={isAddPlayerOpen}
            onClose={() => {
              setIsAddPlayerOpen(false);
              void invalidateSelectedTeamWorkspace();
            }}
            teamId={selectedTeamId}
          />

          {editingPlayer && (
            <EditPlayerModal
              key={`edit-player-${editingPlayer.id}`}
              isOpen={editingPlayer !== null}
              onClose={() => {
                setEditingPlayer(null);
              }}
              onPlayerChanged={() => {
                void invalidateSelectedTeamWorkspace();
              }}
              player={editingPlayer}
              teamId={selectedTeamId}
            />
          )}

          <CreateLineModal
            key={`create-line-${selectedTeamId}`}
            isOpen={isCreateLineOpen}
            onClose={() => {
              void closeCreateLineModal();
            }}
            teamId={selectedTeamId}
          />

          {editingLine && (
            <EditLineModal
              key={`edit-line-${editingLine.id}`}
              isOpen={editingLine !== null}
              line={editingLine}
              onClose={() => {
                void closeEditLineModal();
              }}
            />
          )}

          {managingLine && (
            <AddPlayersToLineModal
              currentPlayerIds={managingLine.players.map((player) => player.id)}
              isOpen={managingLine !== null}
              lineId={managingLine.id}
              onClose={() => {
                void closeManageLineModal();
              }}
              teamId={selectedTeamId}
            />
          )}
        </>
      )}

      <ConfirmDeleteDialog
        errorMessage={t("navigation:newUiPages.teamSetup.deleteTeam.error")}
        isDeleting={deleteTeamMutation.isPending}
        isError={deleteTeamMutation.isError}
        message={t("navigation:newUiPages.teamSetup.deleteTeam.confirm", {
          teamName: selectedTeamName,
        })}
        onClose={closeDeleteTeamDialog}
        onConfirm={() => {
          if (selectedTeamId !== undefined) {
            deleteTeamMutation.mutate(selectedTeamId);
          }
        }}
        open={isDeleteTeamOpen}
        title={t("navigation:newUiPages.teamSetup.deleteTeam.title")}
      />

      <ConfirmDeleteDialog
        errorMessage={t("navigation:newUiPages.teamSetup.roster.deleteError")}
        isDeleting={deletePlayerMutation.isPending}
        isError={deletePlayerMutation.isError}
        message={t("navigation:newUiPages.teamSetup.roster.deleteConfirm", {
          playerName: deletingPlayer?.name ?? "",
        })}
        onClose={() => setDeletingPlayer(null)}
        onConfirm={() => {
          if (deletingPlayer) {
            deletePlayerMutation.mutate(deletingPlayer.id);
          }
        }}
        open={deletingPlayer !== null}
        title={t("navigation:newUiPages.teamSetup.roster.deleteTitle")}
      />

      <ConfirmDeleteDialog
        errorMessage={t("navigation:newUiPages.teamSetup.lines.deleteError")}
        isDeleting={deleteLineMutation.isPending}
        isError={deleteLineMutation.isError}
        message={t("navigation:newUiPages.teamSetup.lines.deleteConfirm", {
          lineName: deletingLine?.name ?? "",
        })}
        onClose={() => setDeletingLine(null)}
        onConfirm={() => {
          if (deletingLine) {
            deleteLineMutation.mutate(deletingLine.id);
          }
        }}
        open={deletingLine !== null}
        title={t("navigation:newUiPages.teamSetup.lines.deleteTitle")}
      />
    </Container>
  );
}
