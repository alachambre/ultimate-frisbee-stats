import type {
  CompetitionWithTeam,
  GameWithScore,
  Player,
  PlayerGameStats,
  TeamWithPlayers,
} from "../types";
import type { StatisticsSelection } from "./statisticsSelection";

interface StatisticsDatasetViewInput {
  teams?: TeamWithPlayers[];
  competitions?: CompetitionWithTeam[];
  allGames?: GameWithScore[];
  teamPlayerStats?: PlayerGameStats[];
  selection: StatisticsSelection;
}

export interface StatisticsDatasetView {
  sortedTeams: TeamWithPlayers[];
  selectedTeam?: TeamWithPlayers;
  competitionsForTeam: CompetitionWithTeam[];
  competitionIdsForTeam: Set<number>;
  teamGames: GameWithScore[];
  availableGames: GameWithScore[];
  selectedCompetitions: CompetitionWithTeam[];
  selectedCompetition?: CompetitionWithTeam;
  selectedGames: GameWithScore[];
  selectedGame?: GameWithScore;
  selectedDatasetGames: GameWithScore[];
  playerStatsById: Map<number, PlayerGameStats>;
  playersForTeam: Player[];
  selectedPlayers: Player[];
  selectedPlayer?: Player;
}

export function buildStatisticsDatasetView({
  teams,
  competitions,
  allGames,
  teamPlayerStats,
  selection,
}: StatisticsDatasetViewInput): StatisticsDatasetView {
  const sortedTeams = (teams ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const selectedTeam = teams?.find((team) => team.id === selection.teamId);

  const competitionsForTeam = (competitions ?? []).slice().sort((a, b) => {
    const startA = new Date(a.start_date).getTime();
    const startB = new Date(b.start_date).getTime();
    return startB - startA;
  });

  const competitionIdsForTeam = new Set(
    competitionsForTeam.map((competition) => competition.id)
  );

  const teamGames =
    !allGames || competitionIdsForTeam.size === 0
      ? []
      : allGames
          .filter((game) => competitionIdsForTeam.has(game.competition_id))
          .slice()
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

  const selectedCompetitionIdsSet = new Set(selection.competitionIds);
  const selectedGameIdsSet = new Set(selection.gameIds);
  const selectedPlayerIdsSet = new Set(selection.playerIds);

  const availableGames =
    selection.competitionIds.length === 0
      ? teamGames
      : teamGames.filter((game) => selectedCompetitionIdsSet.has(game.competition_id));

  const selectedCompetitions = competitionsForTeam.filter((competition) =>
    selectedCompetitionIdsSet.has(competition.id)
  );
  const selectedGames = teamGames.filter((game) => selectedGameIdsSet.has(game.id));

  const selectedGame = selectedGames.length === 1 ? selectedGames[0] : undefined;
  const selectedCompetition =
    selectedCompetitions.length === 1 ? selectedCompetitions[0] : undefined;

  const selectedDatasetGames =
    selectedGames.length > 0
      ? selectedGames
      : selection.competitionIds.length > 0
        ? teamGames.filter((game) => selectedCompetitionIdsSet.has(game.competition_id))
        : teamGames;

  const playerStatsById = new Map<number, PlayerGameStats>();
  for (const playerStat of teamPlayerStats ?? []) {
    playerStatsById.set(playerStat.player_id, playerStat);
  }

  const teamPlayersById = new Map((selectedTeam?.players ?? []).map((player) => [player.id, player]));
  const shouldScopePlayerOptions =
    selection.competitionIds.length > 0 ||
    selection.gameIds.length > 0 ||
    selection.playerIds.length > 0;

  const filteredPlayerIdsFromStats =
    shouldScopePlayerOptions && teamPlayerStats
      ? teamPlayerStats
          .filter((playerStat) => {
            if (selection.playerIds.length === 0) {
              return true;
            }

            return (
              playerStat.points_played > 0 ||
              selectedPlayerIdsSet.has(playerStat.player_id)
            );
          })
          .map((playerStat) => playerStat.player_id)
      : null;

  const sourcePlayers =
    filteredPlayerIdsFromStats === null
      ? selectedTeam?.players ?? []
      : filteredPlayerIdsFromStats
          .map((playerId) => teamPlayersById.get(playerId))
          .filter((player): player is Player => player !== undefined);

  const playersForTeam = sourcePlayers.slice().sort((a, b) => a.name.localeCompare(b.name));
  const selectedPlayers = playersForTeam.filter((player) =>
    selectedPlayerIdsSet.has(player.id)
  );
  const selectedPlayer = selectedPlayers.length === 1 ? selectedPlayers[0] : undefined;

  return {
    sortedTeams,
    selectedTeam,
    competitionsForTeam,
    competitionIdsForTeam,
    teamGames,
    availableGames,
    selectedCompetitions,
    selectedCompetition,
    selectedGames,
    selectedGame,
    selectedDatasetGames,
    playerStatsById,
    playersForTeam,
    selectedPlayers,
    selectedPlayer,
  };
}
