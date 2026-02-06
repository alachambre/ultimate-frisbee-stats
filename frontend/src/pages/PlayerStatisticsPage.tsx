import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Alert,
  Button,
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { getCompetition, getGame, getPlayer, getTeam } from "../services";
import {
  getCompetitionPlayerStatistics,
  getLiveGameStatistics,
  getTeamPlayerStatistics,
} from "../services/statistics";
import type { PlayerGameStats } from "../types";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import PlayerStatsCard from "../components/statistics/PlayerStatsCard";
import { queryKeys } from "../utils/queryKeys";

type StatsScope = "team" | "competition" | "game";

function parseOptionalId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlayerStatisticsPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "common"]);

  const playerIdNumber = Number(playerId);
  const playerIdValid = Number.isFinite(playerIdNumber);

  const scopeParam = searchParams.get("scope");
  const requestedScope: StatsScope =
    scopeParam === "competition" || scopeParam === "game" ? scopeParam : "team";

  const queryTeamId = parseOptionalId(searchParams.get("teamId"));
  const queryCompetitionId = parseOptionalId(searchParams.get("competitionId"));
  const queryGameId = parseOptionalId(searchParams.get("gameId"));

  const {
    data: player,
    isLoading: isLoadingPlayer,
    error: playerError,
  } = useQuery({
    queryKey: queryKeys.player(playerIdValid ? playerIdNumber : 0),
    queryFn: () => getPlayer(playerIdNumber),
    enabled: playerIdValid,
  });

  const {
    data: game,
    isLoading: isLoadingGame,
    error: gameError,
  } = useQuery({
    queryKey: queryKeys.game(queryGameId ?? 0),
    queryFn: () => getGame(queryGameId as number),
    enabled: queryGameId !== undefined,
  });

  const competitionId = queryCompetitionId ?? game?.competition_id;

  const {
    data: competition,
    isLoading: isLoadingCompetition,
    error: competitionError,
  } = useQuery({
    queryKey: queryKeys.competition(competitionId ?? 0),
    queryFn: () => getCompetition(competitionId as number),
    enabled: competitionId !== undefined,
  });

  const teamId = queryTeamId ?? competition?.team_id ?? player?.team_id;

  const {
    data: team,
    isLoading: isLoadingTeam,
    error: teamError,
  } = useQuery({
    queryKey: queryKeys.team(teamId ?? 0),
    queryFn: () => getTeam(teamId as number),
    enabled: teamId !== undefined,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.teamPlayerStatistics(teamId ?? 0),
    queryFn: () => getTeamPlayerStatistics(teamId as number),
    enabled: teamId !== undefined,
  });

  const {
    data: competitionPlayerStats,
    isLoading: isLoadingCompetitionPlayerStats,
    error: competitionPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionPlayerStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionPlayerStatistics(competitionId as number),
    enabled: competitionId !== undefined,
  });

  const {
    data: gamePlayerStats,
    isLoading: isLoadingGamePlayerStats,
    error: gamePlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.liveStats(queryGameId ?? 0),
    queryFn: () => getLiveGameStatistics(queryGameId as number),
    enabled: queryGameId !== undefined,
  });

  const availableScopes = useMemo(() => {
    const scopes: StatsScope[] = [];

    if (teamId !== undefined) scopes.push("team");
    if (competitionId !== undefined) scopes.push("competition");
    if (queryGameId !== undefined) scopes.push("game");

    return scopes;
  }, [competitionId, queryGameId, teamId]);

  const effectiveScope: StatsScope = availableScopes.includes(requestedScope)
    ? requestedScope
    : availableScopes[0] ?? "team";

  const scopePlayerStats: PlayerGameStats[] | undefined =
    effectiveScope === "game"
      ? gamePlayerStats
      : effectiveScope === "competition"
        ? competitionPlayerStats
        : teamPlayerStats;

  const selectedPlayerStats = scopePlayerStats?.find(
    (stat) => stat.player_id === playerIdNumber
  );

  const isLoadingScopeStats =
    (effectiveScope === "team" && teamId !== undefined && isLoadingTeamPlayerStats) ||
    (effectiveScope === "competition" &&
      competitionId !== undefined &&
      isLoadingCompetitionPlayerStats) ||
    (effectiveScope === "game" && queryGameId !== undefined && isLoadingGamePlayerStats);

  const isLoadingContext =
    (queryGameId !== undefined && isLoadingGame) ||
    (competitionId !== undefined && isLoadingCompetition) ||
    (teamId !== undefined && isLoadingTeam);

  if (isLoadingPlayer || isLoadingContext || isLoadingScopeStats) {
    return <LoadingState message={t("common:loading")} />;
  }

  const scopeError =
    effectiveScope === "game"
      ? gamePlayerStatsError
      : effectiveScope === "competition"
        ? competitionPlayerStatsError
        : teamPlayerStatsError;

  if (playerError || gameError || competitionError || teamError || scopeError || !player) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}: {(playerError || gameError || competitionError || teamError || scopeError)?.message}
        </Alert>
      </Container>
    );
  }

  const scopeLabels: Record<StatsScope, string> = {
    team: t("statistics:playerScope.team"),
    competition: t("statistics:playerScope.competition"),
    game: t("statistics:playerScope.game"),
  };

  const handleScopeChange = (scope: StatsScope) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("scope", scope);

    if (teamId !== undefined) {
      nextSearchParams.set("teamId", String(teamId));
    }

    if (competitionId !== undefined) {
      nextSearchParams.set("competitionId", String(competitionId));
    }

    if (queryGameId !== undefined) {
      nextSearchParams.set("gameId", String(queryGameId));
    }

    setSearchParams(nextSearchParams);
  };

  const backPath =
    effectiveScope === "game" && queryGameId !== undefined
      ? `/statistics/games/${queryGameId}`
      : effectiveScope === "competition" && competitionId !== undefined
        ? `/statistics/competitions/${competitionId}`
        : teamId !== undefined
          ? `/statistics/teams/${teamId}`
          : "/teams";

  const backLabel =
    effectiveScope === "game"
      ? t("statistics:page.backToGameStats")
      : effectiveScope === "competition"
        ? t("statistics:page.backToCompetitionStats")
        : t("statistics:page.backToTeamStats");

  const playerNumberLabel = player.number != null ? `#${player.number}` : "—";
  const displayedScopeName =
    effectiveScope === "game"
      ? game?.opponent_name
      : effectiveScope === "competition"
        ? competition?.name
        : team?.name;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader title={`${player.name} - ${t("statistics:page.playerTitle")}`} />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backPath)}>
          {backLabel}
        </Button>
        <Box sx={{ ml: { md: "auto" }, minWidth: { xs: "100%", md: 220 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="player-scope-select-label">
              {t("statistics:playerScope.label")}
            </InputLabel>
            <Select
              labelId="player-scope-select-label"
              label={t("statistics:playerScope.label")}
              value={effectiveScope}
              onChange={(event) => handleScopeChange(event.target.value as StatsScope)}
            >
              {availableScopes.map((scope) => (
                <MenuItem key={scope} value={scope}>
                  {scopeLabels[scope]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6">{player.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {team?.name}
            </Typography>
          </Box>
          <Chip label={playerNumberLabel} />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("statistics:playerScope.scope")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {scopeLabels[effectiveScope]}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("statistics:playerScope.context")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {displayedScopeName || "-"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("statistics:playerStats.pointsPlayed")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedPlayerStats?.points_played ?? 0}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t("statistics:playerStats.playingTime")}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatTime(selectedPlayerStats?.effective_time_seconds ?? 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {!selectedPlayerStats ? (
        <Alert severity="info">{t("statistics:playerStats.noDataForScope")}</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PlayerStatsCard stats={selectedPlayerStats} view="offense" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PlayerStatsCard stats={selectedPlayerStats} view="defense" />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
