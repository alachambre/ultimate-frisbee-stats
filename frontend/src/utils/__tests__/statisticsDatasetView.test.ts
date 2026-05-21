import type {
  CompetitionWithTeam,
  GameWithScore,
  Player,
  PlayerGameStats,
  TeamWithPlayers,
} from "../../types";
import { buildStatisticsDatasetView } from "../statisticsDatasetView";

const player = (id: number, name: string): Player => ({
  id,
  name,
  number: null,
  gender: "M",
  team_id: 1,
  created_at: "2026-01-01T00:00:00Z",
});

const team = (id: number, name: string, players: Player[] = []): TeamWithPlayers => ({
  id,
  name,
  players,
  created_at: "2026-01-01T00:00:00Z",
});

const competition = (
  id: number,
  name: string,
  startDate: string
): CompetitionWithTeam => ({
  id,
  name,
  description: null,
  start_date: startDate,
  end_date: startDate,
  team_id: 1,
  team_name: "Team",
  status: "ongoing",
  created_at: "2026-01-01T00:00:00Z",
});

const game = (
  id: number,
  competitionId: number,
  opponentName: string,
  date: string | null
): GameWithScore => ({
  id,
  competition_id: competitionId,
  opponent_name: opponentName,
  date,
  comments: null,
  status: "ended",
  start_datetime: null,
  end_datetime: null,
  created_at: "2026-01-01T00:00:00Z",
  our_score: 0,
  opponent_score: 0,
  team_name: "Team",
  competition_name: "Competition",
});

const playerStat = (playerId: number, pointsPlayed: number): PlayerGameStats =>
  ({
    player_id: playerId,
    points_played: pointsPlayed,
  }) as PlayerGameStats;

describe("statisticsDatasetView", () => {
  it("sorts teams, competitions, and team games for the selected team", () => {
    const view = buildStatisticsDatasetView({
      teams: [team(2, "Zebra"), team(1, "Alpha")],
      competitions: [
        competition(10, "Older", "2026-01-01"),
        competition(11, "Newer", "2026-03-01"),
      ],
      allGames: [
        game(100, 10, "Older Game", "2026-01-02T10:00:00Z"),
        game(101, 11, "Newer Game", "2026-03-02T10:00:00Z"),
        game(102, 99, "Other Team Game", "2026-04-02T10:00:00Z"),
      ],
      selection: {
        teamId: 1,
        competitionIds: [],
        gameIds: [],
        playerIds: [],
      },
    });

    expect(view.sortedTeams.map((item) => item.name)).toEqual(["Alpha", "Zebra"]);
    expect(view.competitionsForTeam.map((item) => item.name)).toEqual(["Newer", "Older"]);
    expect(view.teamGames.map((item) => item.opponent_name)).toEqual([
      "Newer Game",
      "Older Game",
    ]);
  });

  it("derives available games and selected dataset games from selected competitions and games", () => {
    const selectedCompetitionGame = game(
      100,
      10,
      "Selected Competition Game",
      "2026-01-02T10:00:00Z"
    );
    const explicitlySelectedGame = game(
      101,
      11,
      "Explicit Game",
      "2026-03-02T10:00:00Z"
    );

    const view = buildStatisticsDatasetView({
      competitions: [
        competition(10, "Selected Competition", "2026-01-01"),
        competition(11, "Other Competition", "2026-03-01"),
      ],
      allGames: [selectedCompetitionGame, explicitlySelectedGame],
      selection: {
        teamId: 1,
        competitionIds: [10],
        gameIds: [101],
        playerIds: [],
      },
    });

    expect(view.availableGames.map((item) => item.id)).toEqual([100]);
    expect(view.selectedCompetitions.map((item) => item.id)).toEqual([10]);
    expect(view.selectedGames.map((item) => item.id)).toEqual([101]);
    expect(view.selectedDatasetGames.map((item) => item.id)).toEqual([101]);
    expect(view.selectedGame?.id).toBe(101);
    expect(view.selectedCompetition?.id).toBe(10);
  });

  it("uses selected competition games as the dataset when no game is explicitly selected", () => {
    const view = buildStatisticsDatasetView({
      competitions: [
        competition(10, "Selected Competition", "2026-01-01"),
        competition(11, "Other Competition", "2026-03-01"),
      ],
      allGames: [
        game(100, 10, "Selected Competition Game", "2026-01-02T10:00:00Z"),
        game(101, 11, "Other Game", "2026-03-02T10:00:00Z"),
      ],
      selection: {
        teamId: 1,
        competitionIds: [10],
        gameIds: [],
        playerIds: [],
      },
    });

    expect(view.selectedDatasetGames.map((item) => item.id)).toEqual([100]);
  });

  it("scopes player options from stats and keeps selected zero-point players", () => {
    const alpha = player(1, "Alpha");
    const beta = player(2, "Beta");
    const charlie = player(3, "Charlie");

    const view = buildStatisticsDatasetView({
      teams: [team(1, "Team", [charlie, alpha, beta])],
      teamPlayerStats: [playerStat(1, 0), playerStat(2, 4), playerStat(3, 0)],
      selection: {
        teamId: 1,
        competitionIds: [10],
        gameIds: [],
        playerIds: [1],
      },
    });

    expect(view.playersForTeam.map((item) => item.name)).toEqual(["Alpha", "Beta"]);
    expect(view.selectedPlayers.map((item) => item.id)).toEqual([1]);
    expect(view.selectedPlayer?.id).toBe(1);
    expect(view.playerStatsById.get(2)?.points_played).toBe(4);
  });
});
