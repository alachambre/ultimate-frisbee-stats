import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import EventIcon from "@mui/icons-material/Event";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import type {
  CompetitionWithTeam,
  GameWithScore,
  Player,
  PlayerGameStats,
  TeamWithPlayers,
} from "../../types";
import StatisticsSelectionCard from "./StatisticsSelectionCard";
import { formatDate } from "../../utils/dateFormatting";

type StatisticsMode = "competition" | "player";
type PlayerGenderTab = "men" | "women";

interface StatisticsConfigurationPanelProps {
  mode: StatisticsMode;
  teamId?: number;
  competitionId?: number;
  gameId?: number;
  playerId?: number;
  sortedTeams: TeamWithPlayers[];
  competitionsForTeam: CompetitionWithTeam[];
  gamesForCompetition: GameWithScore[];
  playersForTeam: Player[];
  playerStatsById: Map<number, PlayerGameStats>;
  controlsLoading: boolean;
  hasControlsError: boolean;
  competitionFlowDisabled: boolean;
  playerFlowDisabled: boolean;
  onSelectMode: (mode: StatisticsMode) => void;
  onSelectTeam: (teamId: number) => void;
  onSelectCompetition: (competitionId: number) => void;
  onSelectGame: (gameId: number) => void;
  onSelectPlayer: (playerId: number) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function StatisticsConfigurationPanel({
  mode,
  teamId,
  competitionId,
  gameId,
  playerId,
  sortedTeams,
  competitionsForTeam,
  gamesForCompetition,
  playersForTeam,
  playerStatsById,
  controlsLoading,
  hasControlsError,
  competitionFlowDisabled,
  playerFlowDisabled,
  onSelectMode,
  onSelectTeam,
  onSelectCompetition,
  onSelectGame,
  onSelectPlayer,
}: StatisticsConfigurationPanelProps) {
  const { t, i18n } = useTranslation(["statistics", "games", "common"]);
  const [isConfigurationExpanded, setIsConfigurationExpanded] = useState(true);
  const [playerGenderTab, setPlayerGenderTab] = useState<PlayerGenderTab>("men");

  const menPlayersForTeam = useMemo(
    () => playersForTeam.filter((player) => player.gender === "M"),
    [playersForTeam]
  );
  const womenPlayersForTeam = useMemo(
    () => playersForTeam.filter((player) => player.gender === "W"),
    [playersForTeam]
  );

  const activePlayerGenderTab = useMemo<PlayerGenderTab>(() => {
    if (mode !== "player" || teamId === undefined) {
      return playerGenderTab;
    }

    if (playerGenderTab === "men" && menPlayersForTeam.length === 0 && womenPlayersForTeam.length > 0) {
      return "women";
    }

    if (playerGenderTab === "women" && womenPlayersForTeam.length === 0 && menPlayersForTeam.length > 0) {
      return "men";
    }

    return playerGenderTab;
  }, [
    mode,
    teamId,
    playerGenderTab,
    menPlayersForTeam.length,
    womenPlayersForTeam.length,
  ]);

  return (
    <Paper
      sx={{
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        p: 2,
        mb: 3,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={1} mb={1.25}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <TuneIcon
            sx={{
              fontSize: 16,
              color: (theme) => theme.colors.women.main,
            }}
          />
          <Typography variant="subtitle2" fontWeight="bold">
            {t("statistics:workflow.configurationSection")}
          </Typography>
        </Stack>
        <Button
          size="small"
          onClick={() => setIsConfigurationExpanded((prev) => !prev)}
          endIcon={isConfigurationExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {isConfigurationExpanded ? t("common:action.hide") : t("common:action.show")}
        </Button>
      </Box>

      <Collapse in={isConfigurationExpanded} timeout="auto">
        <Box
          sx={{
            position: "sticky",
            top: { xs: 8, sm: 16 },
            zIndex: 10,
            p: 2,
            borderRadius: 1.5,
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.96),
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "block", mb: 0.75 }}>
              1. {t("statistics:workflow.mode")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<BarChartIcon fontSize="small" />}
                label={t("statistics:workflow.modeCompetitionShort")}
                color={mode === "competition" ? "primary" : "default"}
                variant={mode === "competition" ? "filled" : "outlined"}
                onClick={() => {
                  if (competitionFlowDisabled) return;
                  onSelectMode("competition");
                }}
                clickable={!competitionFlowDisabled}
                disabled={competitionFlowDisabled}
              />
              <Chip
                icon={<PersonIcon fontSize="small" />}
                label={t("statistics:workflow.modePlayerShort")}
                color={mode === "player" ? "primary" : "default"}
                variant={mode === "player" ? "filled" : "outlined"}
                onClick={() => {
                  if (playerFlowDisabled) return;
                  onSelectMode("player");
                }}
                clickable={!playerFlowDisabled}
                disabled={playerFlowDisabled}
              />
            </Stack>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: "block", mb: 0.75 }}>
              2. {t("statistics:workflow.team")}
            </Typography>
            {sortedTeams.length === 0 ? (
              <Alert severity="info">{t("common:messages.noData")}</Alert>
            ) : (
              <Grid container spacing={1.5}>
                {sortedTeams.map((team: TeamWithPlayers) => (
                  <Grid key={team.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <StatisticsSelectionCard
                      title={team.name}
                      subtitle={`${team.players.length} ${t("common:players")}`}
                      selected={team.id === teamId}
                      onClick={() => onSelectTeam(team.id)}
                      badge={team.id === teamId ? t("common:status.active") : undefined}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {!controlsLoading && !hasControlsError && teamId === undefined && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t("statistics:workflow.selectTeamPrompt")}
            </Alert>
          )}

          {teamId !== undefined && mode === "competition" && !controlsLoading && !hasControlsError && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                3. {t("statistics:workflow.competition")}
              </Typography>

              {competitionsForTeam.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t("statistics:workflow.noCompetitions")}
                </Alert>
              ) : (
                <Grid container spacing={1.5}>
                  {competitionsForTeam.map((competition: CompetitionWithTeam) => (
                    <Grid key={competition.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                        <StatisticsSelectionCard
                          title={competition.name}
                          subtitle={`${formatDate(competition.start_date, i18n.resolvedLanguage)} - ${formatDate(
                            competition.end_date,
                            i18n.resolvedLanguage
                          )}`}
                          selected={competition.id === competitionId}
                          onClick={() => onSelectCompetition(competition.id)}
                        badge={competition.id === competitionsForTeam[0]?.id ? t("statistics:workflow.latest") : undefined}
                        icon={<EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {competitionId !== undefined && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                    4. {t("statistics:workflow.game")}
                  </Typography>

                  {gamesForCompetition.length === 0 ? (
                    <Alert severity="info">{t("statistics:workflow.noGames")}</Alert>
                  ) : (
                    <Grid container spacing={1.5}>
                      {gamesForCompetition.map((game: GameWithScore) => (
                        <Grid key={game.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                          <StatisticsSelectionCard
                            title={`${game.team_name} vs ${game.opponent_name}`}
                            subtitle={formatDate(game.date, i18n.resolvedLanguage)}
                            details={`${game.our_score} - ${game.opponent_score}`}
                            selected={game.id === gameId}
                            onClick={() => onSelectGame(game.id)}
                            badge={
                              game.status !== "ended"
                                ? t("games:status.started")
                                : game.our_score > game.opponent_score
                                  ? t("games:status.won")
                                  : game.our_score < game.opponent_score
                                    ? t("games:status.lost")
                                    : t("games:status.draw")
                            }
                            badgeColor={
                              game.status !== "ended"
                                ? "primary"
                                : game.our_score > game.opponent_score
                                  ? "success"
                                  : game.our_score < game.opponent_score
                                    ? "error"
                                    : "default"
                            }
                            icon={<SportsScoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
            </Box>
          )}

          {teamId !== undefined && mode === "player" && !controlsLoading && !hasControlsError && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                3. {t("statistics:workflow.player")}
              </Typography>

              {playersForTeam.length === 0 ? (
                <Alert severity="info">{t("statistics:workflow.noPlayers")}</Alert>
              ) : (
                <>
                  <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                    <Tabs
                      value={activePlayerGenderTab}
                      onChange={(_, nextTab: PlayerGenderTab) => setPlayerGenderTab(nextTab)}
                      variant="fullWidth"
                      TabIndicatorProps={{
                        sx: {
                          height: 3,
                          backgroundColor:
                            activePlayerGenderTab === "men"
                              ? (theme) => theme.colors.men.main
                              : (theme) => theme.colors.women.main,
                        },
                      }}
                    >
                      <Tab
                        value="men"
                        icon={<MaleIcon />}
                        iconPosition="start"
                        label={`${t("common:labels.men")} (${menPlayersForTeam.length})`}
                        sx={{
                          color: (theme) => theme.colors.men.main,
                          fontWeight: "medium",
                          "&.Mui-selected": {
                            color: (theme) => theme.colors.men.main,
                            fontWeight: "bold",
                            backgroundColor: (theme) => alpha(theme.colors.men.main, 0.08),
                          },
                        }}
                      />
                      <Tab
                        value="women"
                        icon={<FemaleIcon />}
                        iconPosition="start"
                        label={`${t("common:labels.women")} (${womenPlayersForTeam.length})`}
                        sx={{
                          color: (theme) => theme.colors.women.main,
                          fontWeight: "medium",
                          "&.Mui-selected": {
                            color: (theme) => theme.colors.women.main,
                            fontWeight: "bold",
                            backgroundColor: (theme) => alpha(theme.colors.women.main, 0.08),
                          },
                        }}
                      />
                    </Tabs>
                  </Box>

                  {(activePlayerGenderTab === "men" ? menPlayersForTeam : womenPlayersForTeam).length === 0 ? (
                    <Alert severity="info">{t("common:messages.noData")}</Alert>
                  ) : (
                    <Grid container spacing={1.5}>
                      {(activePlayerGenderTab === "men" ? menPlayersForTeam : womenPlayersForTeam).map(
                        (player: Player) => {
                          const playerStats = playerStatsById.get(player.id);
                          return (
                            <Grid key={player.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                              <StatisticsSelectionCard
                                title={player.name}
                                subtitle={
                                  playerStats
                                    ? `${playerStats.points_played} ${t("statistics:playerStats.pointsPlayed")}`
                                    : t("statistics:playerStats.noDataForScope")
                                }
                                details={
                                  playerStats
                                    ? `${t("statistics:playerStats.playingTime")}: ${formatDuration(playerStats.effective_time_seconds)}`
                                    : undefined
                                }
                                selected={player.id === playerId}
                                onClick={() => onSelectPlayer(player.id)}
                                badge={player.number != null ? `#${player.number}` : "-"}
                                icon={
                                  player.gender === "M" ? (
                                    <MaleIcon
                                      sx={{ fontSize: 16, color: (theme) => theme.colors.men.main }}
                                    />
                                  ) : (
                                    <FemaleIcon
                                      sx={{ fontSize: 16, color: (theme) => theme.colors.women.main }}
                                    />
                                  )
                                }
                              />
                            </Grid>
                          );
                        }
                      )}
                    </Grid>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
