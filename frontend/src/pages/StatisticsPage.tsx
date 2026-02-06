import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import { getCompetitionGames, getCompetitions, getTeams } from "../services";
import {
  downloadCompetitionStatisticsCSV,
  downloadGameStatisticsCSV,
  downloadTeamStatisticsCSV,
  getCompetitionPlayerStatistics,
  getCompetitionStrategyStatistics,
  getCompetitionTeamStatistics,
  getGameStrategyStatistics,
  getGameTeamStatistics,
  getLiveGameStatistics,
  getTeamPlayerStatistics,
  getTeamStrategyStatistics,
  getTeamTeamStatistics,
  type StatisticsExportDetailMode,
} from "../services/statistics";
import type {
  CompetitionWithTeam,
  GameWithScore,
  Player,
  TeamWithPlayers,
} from "../types";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";
import PlayerScopeStatistics from "../components/statistics/PlayerScopeStatistics";
import PlayerStatistics from "../components/statistics/PlayerStatistics";
import StatisticsExportMenuButton from "../components/statistics/StatisticsExportMenuButton";
import StrategyStatistics from "../components/statistics/StrategyStatistics";
import TeamStatistics from "../components/statistics/TeamStatistics";
import { queryKeys } from "../utils/queryKeys";

type StatisticsMode = "competition" | "player";
type StatisticsScope = "team" | "competition" | "game" | "player";

interface StatisticsSelection {
  teamId?: number;
  mode: StatisticsMode;
  competitionId?: number;
  gameId?: number;
  playerId?: number;
}

function parseOptionalId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSelectValue(value: string): number | undefined {
  if (!value) return undefined;
  return parseOptionalId(value) ?? undefined;
}

function buildSearchParams(selection: StatisticsSelection): URLSearchParams {
  const params = new URLSearchParams();

  if (selection.teamId !== undefined) {
    params.set("teamId", String(selection.teamId));
  }

  params.set("mode", selection.mode);

  if (selection.mode === "competition") {
    if (selection.competitionId !== undefined) {
      params.set("competitionId", String(selection.competitionId));
    }
    if (selection.gameId !== undefined) {
      params.set("gameId", String(selection.gameId));
    }
  }

  if (selection.mode === "player" && selection.playerId !== undefined) {
    params.set("playerId", String(selection.playerId));
  }

  return params;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderBreadcrumbItem(
  label: string,
  isLast: boolean,
  onClick?: () => void
) {
  if (isLast || !onClick) {
    return (
      <Typography key={label} color="text.primary" fontWeight="medium">
        {label}
      </Typography>
    );
  }

  return (
    <Button key={label} variant="text" sx={{ p: 0, minWidth: "auto" }} onClick={onClick}>
      {label}
    </Button>
  );
}

export default function StatisticsPage() {
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const rawMode = searchParams.get("mode");
  const rawPlayerId = parseOptionalId(searchParams.get("playerId"));

  const selection: StatisticsSelection = {
    teamId: parseOptionalId(searchParams.get("teamId")),
    mode: rawMode === "player" || (rawMode == null && rawPlayerId !== undefined)
      ? "player"
      : "competition",
    competitionId: parseOptionalId(searchParams.get("competitionId")),
    gameId: parseOptionalId(searchParams.get("gameId")),
    playerId: rawPlayerId,
  };

  const mode: StatisticsMode = selection.mode;
  const teamId = selection.teamId;
  const competitionId = mode === "competition" ? selection.competitionId : undefined;
  const gameId = mode === "competition" ? selection.gameId : undefined;
  const playerId = mode === "player" ? selection.playerId : undefined;

  const updateSelection = (updates: Partial<StatisticsSelection>) => {
    const merged: StatisticsSelection = {
      teamId,
      mode,
      competitionId,
      gameId,
      playerId,
      ...updates,
    };

    if (merged.mode === "competition") {
      merged.playerId = undefined;
    }

    if (merged.mode === "player") {
      merged.competitionId = undefined;
      merged.gameId = undefined;
    }

    if (merged.teamId === undefined) {
      merged.competitionId = undefined;
      merged.gameId = undefined;
      merged.playerId = undefined;
    }

    setSearchParams(buildSearchParams(merged));
  };

  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
  });

  const {
    data: competitions,
    isLoading: isLoadingCompetitions,
    error: competitionsError,
  } = useQuery({
    queryKey: ["competitions", "team", teamId ?? 0],
    queryFn: () => getCompetitions(teamId as number),
    enabled: teamId !== undefined,
  });

  const {
    data: games,
    isLoading: isLoadingGames,
    error: gamesError,
  } = useQuery({
    queryKey: queryKeys.competitionGames(competitionId ?? 0),
    queryFn: () => getCompetitionGames(competitionId as number),
    enabled: mode === "competition" && competitionId !== undefined,
  });

  const activeScope: StatisticsScope | undefined = useMemo(() => {
    if (teamId === undefined) return undefined;

    if (mode === "player" && playerId !== undefined) return "player";
    if (mode === "competition" && gameId !== undefined) return "game";
    if (mode === "competition" && competitionId !== undefined) return "competition";
    return "team";
  }, [competitionId, gameId, mode, playerId, teamId]);

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.teamTeamStatistics(teamId ?? 0),
    queryFn: () => getTeamTeamStatistics(teamId as number),
    enabled: activeScope === "team" && teamId !== undefined,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.teamPlayerStatistics(teamId ?? 0),
    queryFn: () => getTeamPlayerStatistics(teamId as number),
    enabled:
      teamId !== undefined &&
      (activeScope === "team" || activeScope === "player"),
  });

  const {
    data: teamStrategyStats,
    isLoading: isLoadingTeamStrategyStats,
    error: teamStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.teamStrategyStatistics(teamId ?? 0),
    queryFn: () => getTeamStrategyStatistics(teamId as number),
    enabled: activeScope === "team" && teamId !== undefined,
  });

  const {
    data: competitionTeamStats,
    isLoading: isLoadingCompetitionTeamStats,
    error: competitionTeamStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionTeamStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionTeamStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: competitionPlayerStats,
    isLoading: isLoadingCompetitionPlayerStats,
    error: competitionPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionPlayerStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionPlayerStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: competitionStrategyStats,
    isLoading: isLoadingCompetitionStrategyStats,
    error: competitionStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionStrategyStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionStrategyStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: gameTeamStats,
    isLoading: isLoadingGameTeamStats,
    error: gameTeamStatsError,
  } = useQuery({
    queryKey: queryKeys.gameTeamStatistics(gameId ?? 0),
    queryFn: () => getGameTeamStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
  });

  const {
    data: gamePlayerStats,
    isLoading: isLoadingGamePlayerStats,
    error: gamePlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.liveStats(gameId ?? 0),
    queryFn: () => getLiveGameStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
  });

  const {
    data: gameStrategyStats,
    isLoading: isLoadingGameStrategyStats,
    error: gameStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.gameStrategyStatistics(gameId ?? 0),
    queryFn: () => getGameStrategyStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
  });

  const selectedTeam = teams?.find((team) => team.id === teamId);
  const selectedCompetition = competitions?.find(
    (competition) => competition.id === competitionId
  );
  const selectedGame = games?.find((game) => game.id === gameId);
  const selectedPlayer = selectedTeam?.players.find((player) => player.id === playerId);

  const selectedPlayerStats = teamPlayerStats?.find(
    (stats) => stats.player_id === playerId
  );

  const competitionsForTeam = (competitions ?? []).slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const gamesForCompetition = (games ?? []).slice().sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const playersForTeam = (selectedTeam?.players ?? []).slice().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (isLoadingTeams) {
    return <LoadingState message={t("common:loading")} />;
  }

  if (teamsError || !teams) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}: {teamsError?.message}
        </Alert>
      </Container>
    );
  }

  const controlsError = competitionsError || gamesError;
  const controlsLoading =
    (teamId !== undefined && isLoadingCompetitions) ||
    (competitionId !== undefined && isLoadingGames);

  const isScopeLoading =
    (activeScope === "team" &&
      (isLoadingTeamStats || isLoadingTeamPlayerStats || isLoadingTeamStrategyStats)) ||
    (activeScope === "competition" &&
      (isLoadingCompetitionTeamStats ||
        isLoadingCompetitionPlayerStats ||
        isLoadingCompetitionStrategyStats)) ||
    (activeScope === "game" &&
      (isLoadingGameTeamStats || isLoadingGamePlayerStats || isLoadingGameStrategyStats)) ||
    (activeScope === "player" && isLoadingTeamPlayerStats);

  const scopeError =
    (activeScope === "team" &&
      (teamStatsError || teamPlayerStatsError || teamStrategyStatsError)) ||
    (activeScope === "competition" &&
      (competitionTeamStatsError ||
        competitionPlayerStatsError ||
        competitionStrategyStatsError)) ||
    (activeScope === "game" &&
      (gameTeamStatsError || gamePlayerStatsError || gameStrategyStatsError)) ||
    (activeScope === "player" && teamPlayerStatsError);

  const canExport =
    activeScope === "team" || activeScope === "competition" || activeScope === "game";

  const handleExportCSV = async (detailMode: StatisticsExportDetailMode) => {
    if (!canExport) {
      return;
    }

    setIsExporting(true);
    try {
      if (activeScope === "team" && teamId !== undefined) {
        await downloadTeamStatisticsCSV(teamId, detailMode);
      } else if (activeScope === "competition" && competitionId !== undefined) {
        await downloadCompetitionStatisticsCSV(competitionId, detailMode);
      } else if (activeScope === "game" && gameId !== undefined) {
        await downloadGameStatisticsCSV(gameId, detailMode);
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const modeLabel =
    mode === "competition"
      ? t("statistics:workflow.modeCompetition")
      : t("statistics:workflow.modePlayer");

  const breadcrumbs: Array<{
    key: string;
    label: string;
    onClick?: () => void;
  }> = [];

  if (selectedTeam) {
    breadcrumbs.push({
      key: "team",
      label: selectedTeam.name,
      onClick:
        activeScope && activeScope !== "team"
          ? () =>
              updateSelection({
                competitionId: undefined,
                gameId: undefined,
                playerId: undefined,
              })
          : undefined,
    });
  }

  if (mode === "competition" && selectedCompetition) {
    breadcrumbs.push({
      key: "competition",
      label: selectedCompetition.name,
      onClick:
        activeScope === "game"
          ? () =>
              updateSelection({
                gameId: undefined,
              })
          : undefined,
    });
  }

  if (mode === "competition" && selectedGame) {
    breadcrumbs.push({
      key: "game",
      label: `${selectedGame.team_name} vs ${selectedGame.opponent_name}`,
    });
  }

  if (mode === "player" && selectedPlayer) {
    breadcrumbs.push({
      key: "player",
      label: selectedPlayer.name,
    });
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={t("statistics:page.globalTitle")} />

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t("statistics:workflow.description")}
        </Typography>
        <Box sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}>
          <StatisticsExportMenuButton
            disabled={!canExport}
            isExporting={isExporting}
            onExport={handleExportCSV}
          />
        </Box>
      </Box>

      {breadcrumbs.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {t("statistics:workflow.path")}
          </Typography>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="statistics path">
            {breadcrumbs.map((item, index) =>
              renderBreadcrumbItem(
                item.label,
                index === breadcrumbs.length - 1,
                item.onClick
              )
            )}
          </Breadcrumbs>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="statistics-team-select-label">
                {t("statistics:workflow.team")}
              </InputLabel>
              <Select
                labelId="statistics-team-select-label"
                label={t("statistics:workflow.team")}
                value={teamId?.toString() ?? ""}
                onChange={(event) => {
                  const nextTeamId = parseSelectValue(event.target.value as string);
                  updateSelection({
                    teamId: nextTeamId,
                    competitionId: undefined,
                    gameId: undefined,
                    playerId: undefined,
                  });
                }}
              >
                <MenuItem value="">{t("statistics:workflow.selectTeam")}</MenuItem>
                {teams
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team: TeamWithPlayers) => (
                    <MenuItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              {t("statistics:workflow.mode")}
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, nextMode: StatisticsMode | null) => {
                if (!nextMode) return;

                updateSelection({
                  mode: nextMode,
                  competitionId: nextMode === "competition" ? competitionId : undefined,
                  gameId: nextMode === "competition" ? gameId : undefined,
                  playerId: nextMode === "player" ? playerId : undefined,
                });
              }}
              size="small"
              disabled={teamId === undefined}
            >
              <ToggleButton value="competition">
                {t("statistics:workflow.modeCompetition")}
              </ToggleButton>
              <ToggleButton value="player">
                {t("statistics:workflow.modePlayer")}
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {modeLabel}
            </Typography>
          </Grid>

          {mode === "competition" && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small" disabled={teamId === undefined}>
                  <InputLabel id="statistics-competition-select-label">
                    {t("statistics:workflow.competition")}
                  </InputLabel>
                  <Select
                    labelId="statistics-competition-select-label"
                    label={t("statistics:workflow.competition")}
                    value={competitionId?.toString() ?? ""}
                    onChange={(event) => {
                      const nextCompetitionId = parseSelectValue(event.target.value as string);
                      updateSelection({
                        competitionId: nextCompetitionId,
                        gameId: undefined,
                      });
                    }}
                  >
                    <MenuItem value="">
                      {t("statistics:workflow.selectCompetition")}
                    </MenuItem>
                    {competitionsForTeam.map((competition: CompetitionWithTeam) => (
                      <MenuItem key={competition.id} value={String(competition.id)}>
                        {competition.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  size="small"
                  disabled={teamId === undefined || competitionId === undefined}
                >
                  <InputLabel id="statistics-game-select-label">
                    {t("statistics:workflow.game")}
                  </InputLabel>
                  <Select
                    labelId="statistics-game-select-label"
                    label={t("statistics:workflow.game")}
                    value={gameId?.toString() ?? ""}
                    onChange={(event) => {
                      const nextGameId = parseSelectValue(event.target.value as string);
                      updateSelection({ gameId: nextGameId });
                    }}
                  >
                    <MenuItem value="">{t("statistics:workflow.selectGame")}</MenuItem>
                    {gamesForCompetition.map((game: GameWithScore) => (
                      <MenuItem key={game.id} value={String(game.id)}>
                        {game.team_name} vs {game.opponent_name} ({formatDate(game.date)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {mode === "player" && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small" disabled={teamId === undefined}>
                <InputLabel id="statistics-player-select-label">
                  {t("statistics:workflow.player")}
                </InputLabel>
                <Select
                  labelId="statistics-player-select-label"
                  label={t("statistics:workflow.player")}
                  value={playerId?.toString() ?? ""}
                  onChange={(event) => {
                    const nextPlayerId = parseSelectValue(event.target.value as string);
                    updateSelection({ playerId: nextPlayerId });
                  }}
                >
                  <MenuItem value="">{t("statistics:workflow.selectPlayer")}</MenuItem>
                  {playersForTeam.map((player: Player) => (
                    <MenuItem key={player.id} value={String(player.id)}>
                      {player.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {controlsLoading && <LoadingState message={t("common:loading")} />}

      {!controlsLoading && controlsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t("common:error")}: {controlsError.message}
        </Alert>
      )}

      {!controlsLoading && !controlsError && teamId === undefined && (
        <Alert severity="info">{t("statistics:workflow.selectTeamPrompt")}</Alert>
      )}

      {!controlsLoading && !controlsError && teamId !== undefined && isScopeLoading && (
        <LoadingState message={t("common:loading")} />
      )}

      {!controlsLoading && !controlsError && teamId !== undefined && !isScopeLoading && scopeError && (
        <Alert severity="error">
          {t("common:error")}: {scopeError.message}
        </Alert>
      )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "team" && (
          <>
            {teamStats && <TeamStatistics teamStats={teamStats} />}
            {teamStrategyStats && <StrategyStatistics strategyStats={teamStrategyStats} />}
            {teamPlayerStats && (
              <PlayerStatistics
                playerStats={teamPlayerStats}
                onPlayerClick={(nextPlayerId) => {
                  updateSelection({
                    mode: "player",
                    playerId: nextPlayerId,
                  });
                }}
              />
            )}
          </>
        )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "competition" && (
          <>
            {competitionTeamStats && <TeamStatistics teamStats={competitionTeamStats} />}
            {competitionStrategyStats && (
              <StrategyStatistics strategyStats={competitionStrategyStats} />
            )}
            {competitionPlayerStats && (
              <PlayerStatistics
                playerStats={competitionPlayerStats}
                onPlayerClick={(nextPlayerId) => {
                  updateSelection({
                    mode: "player",
                    playerId: nextPlayerId,
                  });
                }}
              />
            )}
          </>
        )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "game" &&
        selectedGame && (
          <>
            <Paper sx={{ mb: 3 }}>
              <Box p={4} textAlign="center">
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                  <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedCompetition?.name || "-"}
                  </Typography>
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {selectedGame.status === "ended"
                    ? t("games:detail.finalScore")
                    : t("games:detail.score")}
                </Typography>
                <Typography variant="h2" fontWeight="bold">
                  {selectedGame.our_score} - {selectedGame.opponent_score}
                </Typography>

                {selectedGame.start_datetime && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t("games:detail.gameDuration")}
                    </Typography>
                    <GameTimer
                      startDatetime={selectedGame.start_datetime}
                      endDatetime={selectedGame.end_datetime}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
            {gameTeamStats && <TeamStatistics teamStats={gameTeamStats} />}
            {gameStrategyStats && <StrategyStatistics strategyStats={gameStrategyStats} />}
            {gamePlayerStats && (
              <PlayerStatistics
                playerStats={gamePlayerStats}
                onPlayerClick={(nextPlayerId) => {
                  updateSelection({
                    mode: "player",
                    playerId: nextPlayerId,
                  });
                }}
              />
            )}
          </>
        )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "player" &&
        !selectedPlayer && (
          <Alert severity="info">{t("statistics:workflow.playerNotFound")}</Alert>
        )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "player" &&
        selectedPlayer &&
        !selectedPlayerStats && (
          <Alert severity="info">{t("statistics:playerStats.noDataForScope")}</Alert>
        )}

      {!controlsLoading &&
        !controlsError &&
        teamId !== undefined &&
        !isScopeLoading &&
        !scopeError &&
        activeScope === "player" &&
        selectedPlayer &&
        selectedPlayerStats && (
          <PlayerScopeStatistics
            playerName={selectedPlayer.name}
            playerNumber={selectedPlayer.number}
            teamName={selectedTeam?.name}
            scopeLabel={t("statistics:playerScope.team")}
            contextLabel={selectedTeam?.name}
            stats={selectedPlayerStats}
          />
        )}
    </Container>
  );
}
