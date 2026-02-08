import { http, HttpResponse } from "msw";
import type { Team, TeamCreate, TeamWithPlayers, Player, PlayerCreate, PlayerUpdate, Competition, CompetitionCreate, CompetitionUpdate, CompetitionWithPlayers, PlayerIdsRequest, Line, LineCreate, LineUpdate, LineWithPlayers, Game, GameCreate, GameUpdate, GameWithScore, GameDetail, PointWithPlayers, PointCreate, PointFinish, PointUpdate, Strategy, StrategyCreate, StrategyUpdate, Call, CallCreate, CallUpdate, TurnoverWithPlayer, TurnoverCreate, TurnoverUpdate } from "../../types";

const BASE_URL = "http://localhost:8000";

// In-memory data store for tests
let teams: Team[] = [];
let players: Player[] = [];
let competitions: Competition[] = [];
let competitionPlayers: Map<number, number[]> = new Map(); // competitionId -> playerIds[]
let lines: Line[] = [];
let linePlayers: Map<number, number[]> = new Map(); // lineId -> playerIds[]
let games: Game[] = [];
let gamePlayers: Map<number, number[]> = new Map(); // gameId -> playerIds[]
let strategies: Strategy[] = [];
let points: PointWithPlayers[] = [];
let calls: Call[] = [];
let turnovers: TurnoverWithPlayer[] = [];
let nextTeamId = 1;
let nextPlayerId = 1;
let nextCompetitionId = 1;
let nextLineId = 1;
let nextGameId = 1;
let nextStrategyId = 1;
let nextPointId = 1;
let nextCallId = 1;
let nextTurnoverId = 1;

// Helper to reset data between tests
export function resetMockData() {
  teams = [];
  players = [];
  competitions = [];
  competitionPlayers = new Map();
  lines = [];
  linePlayers = new Map();
  games = [];
  gamePlayers = new Map();
  strategies = [];
  points = [];
  calls = [];
  turnovers = [];
  nextTeamId = 1;
  nextPlayerId = 1;
  nextCompetitionId = 1;
  nextLineId = 1;
  nextGameId = 1;
  nextStrategyId = 1;
  nextPointId = 1;
  nextCallId = 1;
  nextTurnoverId = 1;
}

function buildEmptyPlayerStatsForPlayers(playersList: Player[]) {
  return playersList.map((player) => ({
    player_id: player.id,
    player_name: player.name,
    player_number: player.number,
    points_played: 0,
    effective_time_seconds: 0,
    offense: {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      hold_rate: 0.0,
      points_won_no_turnover: 0,
      clean_hold_rate: 0.0,
    },
    defense: {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      break_rate: 0.0,
      points_with_turnover: 0,
      turnover_rate: 0.0,
      points_won_no_turnover: 0,
      clean_break_rate: 0.0,
      points_lost_no_turnover: 0,
    },
  }));
}

function buildEmptyTeamStats(
  scope: { game_id: number } | { competition_id: number } | { team_id: number }
) {
  return {
    ...scope,
    total_completed_points: 0,
    offense: {
      points_started: 0,
      points_won: 0,
      points_lost: 0,
      hold_rate: 0.0,
      points_won_no_turnover: 0,
      clean_hold_rate: 0.0,
      broken_rate: 0.0,
    },
    defense: {
      points_started: 0,
      points_won: 0,
      points_lost: 0,
      break_rate: 0.0,
      points_with_turnover: 0,
      turnover_rate: 0.0,
      points_won_no_turnover: 0,
      clean_break_rate: 0.0,
      points_lost_no_turnover: 0,
      pull_stats: {
        total_pulls: 0,
        inbound_pulls: 0,
        out_of_bounds_pulls: 0,
        inbound_rate: 0.0,
      },
    },
  };
}

function buildEmptyStrategyStats(
  scope: { game_id: number } | { competition_id: number } | { team_id: number }
) {
  return {
    ...scope,
    offense_strategies: [],
    defense_strategies: [],
  };
}

function buildCsvExportResponse(
  scope: "game" | "competition" | "team",
  id: number
) {
  const content = `${scope.toUpperCase()} STATISTICS\nid,${id}\n`;
  return new HttpResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${scope}-${id}-statistics.csv"`,
    },
  });
}

export const handlers = [
  // GET /teams - List all teams
  http.get(`${BASE_URL}/teams`, () => {
    // Include players for each team
    const teamsWithPlayers: TeamWithPlayers[] = teams.map(team => ({
      ...team,
      players: players.filter(p => p.team_id === team.id),
    }));
    return HttpResponse.json(teamsWithPlayers);
  }),

  // POST /teams - Create a team
  http.post(`${BASE_URL}/teams`, async ({ request }) => {
    const body = (await request.json()) as TeamCreate;
    const newTeam: Team = {
      id: nextTeamId++,
      name: body.name,
      created_at: new Date().toISOString(),
    };
    teams.push(newTeam);
    return HttpResponse.json(newTeam, { status: 201 });
  }),

  // GET /teams/:id - Get team by ID with players
  http.get(`${BASE_URL}/teams/:id`, ({ params }) => {
    const teamId = Number(params.id);
    const team = teams.find((t) => t.id === teamId);
    if (!team) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }
    // Include players for this team
    const teamPlayers = players.filter((p) => p.team_id === teamId);
    const teamWithPlayers: TeamWithPlayers = {
      ...team,
      players: teamPlayers,
    };
    return HttpResponse.json(teamWithPlayers);
  }),

  // GET /teams/:id/players - Get players for a team
  http.get(`${BASE_URL}/teams/:id/players`, ({ params }) => {
    const teamId = Number(params.id);
    const teamPlayers = players.filter((p) => p.team_id === teamId);
    return HttpResponse.json(teamPlayers);
  }),

  // POST /teams/:id/players - Add player to team
  http.post(`${BASE_URL}/teams/:id/players`, async ({ params, request }) => {
    const teamId = Number(params.id);
    const body = (await request.json()) as PlayerCreate;
    const newPlayer: Player = {
      id: nextPlayerId++,
      team_id: teamId,
      name: body.name,
      gender: body.gender,
      number: body.number,
      created_at: new Date().toISOString(),
    };
    players.push(newPlayer);
    return HttpResponse.json(newPlayer, { status: 201 });
  }),

  // DELETE /teams/:id - Delete team
  http.delete(`${BASE_URL}/teams/:id`, ({ params }) => {
    const teamId = Number(params.id);
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }
    teams.splice(index, 1);
    // Also delete associated players and competitions
    players = players.filter((p) => p.team_id !== teamId);
    competitions = competitions.filter((c) => c.team_id !== teamId);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /competitions - Create a competition
  http.post(`${BASE_URL}/competitions`, async ({ request }) => {
    const body = (await request.json()) as CompetitionCreate;
    const newCompetition: Competition = {
      id: nextCompetitionId++,
      team_id: body.team_id,
      name: body.name,
      description: body.description ?? null,
      start_date: body.start_date,
      end_date: body.end_date,
      status: "ongoing",
      created_at: new Date().toISOString(),
    };
    competitions.push(newCompetition);

    // Set initial roster if provided
    if (body.player_ids && body.player_ids.length > 0) {
      competitionPlayers.set(newCompetition.id, body.player_ids);
    } else {
      competitionPlayers.set(newCompetition.id, []);
    }

    return HttpResponse.json(newCompetition, { status: 201 });
  }),

  // GET /competitions - List competitions
  http.get(`${BASE_URL}/competitions`, ({ request }) => {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("team_id");

    let filteredCompetitions = competitions;
    if (teamId) {
      filteredCompetitions = competitions.filter(
        (c) => c.team_id === Number(teamId)
      );
    }

    // Add team_name to each competition
    const competitionsWithTeam = filteredCompetitions.map(comp => {
      const team = teams.find(t => t.id === comp.team_id);
      return {
        ...comp,
        team_name: team?.name || "Unknown Team"
      };
    });

    return HttpResponse.json(competitionsWithTeam);
  }),

  // GET /competitions/:id - Get competition with players
  http.get(`${BASE_URL}/competitions/:id`, ({ params }) => {
    const competitionId = Number(params.id);
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return HttpResponse.json(
        { detail: "Competition not found" },
        { status: 404 }
      );
    }

    // Get players in roster
    const rosterPlayerIds = competitionPlayers.get(competitionId) || [];
    const rosterPlayers = players.filter((p) => rosterPlayerIds.includes(p.id));

    const competitionWithPlayers: CompetitionWithPlayers = {
      ...competition,
      players: rosterPlayers,
    };
    return HttpResponse.json(competitionWithPlayers);
  }),

  // PUT /competitions/:id - Update competition
  http.put(`${BASE_URL}/competitions/:id`, async ({ request, params }) => {
    const competitionId = Number(params.id);
    const body = (await request.json()) as CompetitionUpdate;
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return HttpResponse.json(
        { detail: "Competition not found" },
        { status: 404 }
      );
    }

    if (body.name !== undefined) competition.name = body.name;
    if (body.description !== undefined) competition.description = body.description;
    if (body.start_date !== undefined) competition.start_date = body.start_date;
    if (body.end_date !== undefined) competition.end_date = body.end_date;
    if (body.status !== undefined) competition.status = body.status;

    return HttpResponse.json(competition);
  }),

  // DELETE /competitions/:id - Delete competition
  http.delete(`${BASE_URL}/competitions/:id`, ({ params }) => {
    const competitionId = Number(params.id);
    const index = competitions.findIndex((c) => c.id === competitionId);
    if (index === -1) {
      return HttpResponse.json(
        { detail: "Competition not found" },
        { status: 404 }
      );
    }
    competitions.splice(index, 1);
    competitionPlayers.delete(competitionId);
    // Also delete associated games
    games = games.filter((g) => g.competition_id !== competitionId);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /competitions/:id/players - Get competition roster
  http.get(`${BASE_URL}/competitions/:competitionId/players`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return HttpResponse.json(
        { detail: "Competition not found" },
        { status: 404 }
      );
    }

    const rosterPlayerIds = competitionPlayers.get(competitionId) || [];
    const rosterPlayers = players.filter((p) => rosterPlayerIds.includes(p.id));
    return HttpResponse.json(rosterPlayers);
  }),

  // POST /competitions/:id/players - Add players to roster
  http.post(
    `${BASE_URL}/competitions/:competitionId/players`,
    async ({ request, params }) => {
      const competitionId = Number(params.competitionId);
      const body = (await request.json()) as PlayerIdsRequest;
      const competition = competitions.find((c) => c.id === competitionId);
      if (!competition) {
        return HttpResponse.json(
          { detail: "Competition not found" },
          { status: 404 }
        );
      }

      const currentRoster = competitionPlayers.get(competitionId) || [];
      const newRoster = [...new Set([...currentRoster, ...body.player_ids])];
      competitionPlayers.set(competitionId, newRoster);

      const rosterPlayers = players.filter((p) => newRoster.includes(p.id));
      const competitionWithPlayers: CompetitionWithPlayers = {
        ...competition,
        players: rosterPlayers,
      };
      return HttpResponse.json(competitionWithPlayers);
    }
  ),

  // DELETE /competitions/:id/players - Remove players from roster
  http.delete(
    `${BASE_URL}/competitions/:competitionId/players`,
    async ({ request, params }) => {
      const competitionId = Number(params.competitionId);
      const body = (await request.json()) as PlayerIdsRequest;
      const competition = competitions.find((c) => c.id === competitionId);
      if (!competition) {
        return HttpResponse.json(
          { detail: "Competition not found" },
          { status: 404 }
        );
      }

      const currentRoster = competitionPlayers.get(competitionId) || [];
      const newRoster = currentRoster.filter(
        (id) => !body.player_ids.includes(id)
      );
      competitionPlayers.set(competitionId, newRoster);

      const rosterPlayers = players.filter((p) => newRoster.includes(p.id));
      const competitionWithPlayers: CompetitionWithPlayers = {
        ...competition,
        players: rosterPlayers,
      };
      return HttpResponse.json(competitionWithPlayers);
    }
  ),

  // GET /competitions/:id/games - Get competition games
  http.get(`${BASE_URL}/competitions/:competitionId/games`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return HttpResponse.json(
        { detail: "Competition not found" },
        { status: 404 }
      );
    }

    const team = teams.find((t) => t.id === competition.team_id);
    const competitionGames = games.filter(
      (g) => g.competition_id === competitionId
    );

    const gamesWithScores: GameWithScore[] = competitionGames.map((game) => {
      const gamePoints = points.filter((p) => p.game_id === game.id);
      let ourScore = 0;
      let opponentScore = 0;
      gamePoints.forEach((point) => {
        if (point.status === "completed" && point.won !== null) {
          if (point.won) {
            ourScore++;
          } else {
            opponentScore++;
          }
        }
      });

      return {
        ...game,
        our_score: ourScore,
        opponent_score: opponentScore,
        team_name: team?.name || "Unknown",
        competition_name: competition.name,
      };
    });

    return HttpResponse.json(gamesWithScores);
  }),

  // POST /players - Create a player
  http.post(`${BASE_URL}/players`, async ({ request }) => {
    const body = (await request.json()) as PlayerCreate;
    const newPlayer: Player = {
      id: nextPlayerId++,
      name: body.name,
      number: body.number ?? null,
      gender: body.gender,
      team_id: body.team_id,
      created_at: new Date().toISOString(),
    };
    players.push(newPlayer);
    return HttpResponse.json(newPlayer, { status: 201 });
  }),

  // GET /players/:id - Get player by ID
  http.get(`${BASE_URL}/players/:id`, ({ params }) => {
    const playerId = Number(params.id);
    const player = players.find((p) => p.id === playerId);

    if (!player) {
      return HttpResponse.json({ detail: "Player not found" }, { status: 404 });
    }

    return HttpResponse.json(player);
  }),

  // PUT /players/:id - Update player
  http.put(`${BASE_URL}/players/:id`, async ({ request, params }) => {
    const playerId = Number(params.id);
    const body = (await request.json()) as PlayerUpdate;
    const player = players.find((p) => p.id === playerId);
    if (!player) {
      return HttpResponse.json({ detail: "Player not found" }, { status: 404 });
    }
    if (body.name !== undefined) player.name = body.name;
    if (body.number !== undefined) player.number = body.number ?? null;
    if (body.gender !== undefined) player.gender = body.gender;
    return HttpResponse.json(player);
  }),

  // DELETE /players/:id - Delete player
  http.delete(`${BASE_URL}/players/:id`, ({ params }) => {
    const playerId = Number(params.id);
    const index = players.findIndex((p) => p.id === playerId);
    if (index === -1) {
      return HttpResponse.json({ detail: "Player not found" }, { status: 404 });
    }
    players.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /games - List all games with scores
  http.get(`${BASE_URL}/games`, () => {
    const gamesWithScores: GameWithScore[] = games.map((game) => {
      const competition = competitions.find((c) => c.id === game.competition_id);
      const team = teams.find((t) => t.id === competition?.team_id);
      return {
        ...game,
        our_score: 0,
        opponent_score: 0,
        team_name: team?.name || "Unknown",
        competition_name: competition?.name || "Unknown",
      };
    });
    return HttpResponse.json(gamesWithScores);
  }),

  // POST /games - Create a game
  http.post(`${BASE_URL}/games`, async ({ request }) => {
    const body = (await request.json()) as GameCreate;
    const gameId = nextGameId++;
    const newGame: Game = {
      id: gameId,
      competition_id: body.competition_id,
      opponent_name: body.opponent_name,
      date: body.date || null,
      comments: body.comments || null,
      status: "ready",
      start_datetime: null,
      end_datetime: null,
      created_at: new Date().toISOString(),
    };
    games.push(newGame);

    // If no players specified, use all competition roster players
    const playerIds = body.player_ids && body.player_ids.length > 0
      ? body.player_ids
      : (competitionPlayers.get(body.competition_id) || []);
    gamePlayers.set(gameId, playerIds);

    return HttpResponse.json(newGame, { status: 201 });
  }),

  // GET /games/:id - Get game detail with scores and points
  http.get(`${BASE_URL}/games/:id`, ({ params }) => {
    const gameId = Number(params.id);
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }
    const competition = competitions.find((c) => c.id === game.competition_id);
    const team = teams.find((t) => t.id === competition?.team_id);
    const gamePoints = points.filter((p) => p.game_id === gameId);

    // Calculate scores from completed points
    let ourScore = 0;
    let opponentScore = 0;
    gamePoints.forEach((point) => {
      if (point.status === "completed" && point.won !== null) {
        if (point.won) {
          ourScore++;
        } else {
          opponentScore++;
        }
      }
    });

    // Get game players
    const gamePlayerIds = gamePlayers.get(gameId) || [];
    const gamePlayers_list = players.filter((p) => gamePlayerIds.includes(p.id));

    const gameDetail: GameDetail = {
      ...game,
      our_score: ourScore,
      opponent_score: opponentScore,
      team_name: team?.name || "Unknown",
      competition_name: competition?.name || "Unknown",
      points: gamePoints,
      players: gamePlayers_list,
    };
    return HttpResponse.json(gameDetail);
  }),

  // PUT /games/:id - Update game
  http.put(`${BASE_URL}/games/:id`, async ({ request, params }) => {
    const gameId = Number(params.id);
    const body = (await request.json()) as GameUpdate;
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }
    if (body.opponent_name !== undefined) {
      game.opponent_name = body.opponent_name;
    }
    if (body.comments !== undefined) {
      game.comments = body.comments;
    }
    if (body.status !== undefined) {
      const oldStatus = game.status;
      const newStatus = body.status;

      // Set timestamps based on status transitions
      if (newStatus === "started" && oldStatus === "ready") {
        game.start_datetime = new Date().toISOString();
      } else if (newStatus === "ended" && oldStatus === "started") {
        game.end_datetime = new Date().toISOString();
      }

      game.status = newStatus;
    }
    return HttpResponse.json(game);
  }),

  // POST /games/:id/finish - Finish game
  http.post(`${BASE_URL}/games/:id/finish`, ({ params }) => {
    const gameId = Number(params.id);
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }
    if (game.status === "started") {
      game.end_datetime = new Date().toISOString();
    }
    game.status = "ended";
    return HttpResponse.json(game);
  }),

  // DELETE /games/:id - Delete game
  http.delete(`${BASE_URL}/games/:id`, ({ params }) => {
    const gameId = Number(params.id);
    const index = games.findIndex((g) => g.id === gameId);
    if (index === -1) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }
    games.splice(index, 1);
    // Also delete associated points
    points = points.filter((p) => p.game_id !== gameId);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /games/:id/players - Add players to game
  http.post(`${BASE_URL}/games/:id/players`, async ({ params, request }) => {
    const gameId = Number(params.id);
    const body = (await request.json()) as { player_ids: number[] };
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }

    // Get current game players
    const currentPlayerIds = gamePlayers.get(gameId) || [];

    // Add new players (avoiding duplicates)
    const newPlayerIds = [...new Set([...currentPlayerIds, ...body.player_ids])];
    gamePlayers.set(gameId, newPlayerIds);

    return HttpResponse.json(game);
  }),

  // DELETE /games/:id/players - Remove players from game
  http.delete(`${BASE_URL}/games/:id/players`, async ({ params, request }) => {
    const gameId = Number(params.id);
    const body = (await request.json()) as { player_ids: number[] };
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }

    // Get current game players
    const currentPlayerIds = gamePlayers.get(gameId) || [];

    // Remove specified players
    const newPlayerIds = currentPlayerIds.filter(id => !body.player_ids.includes(id));
    gamePlayers.set(gameId, newPlayerIds);

    return HttpResponse.json(game);
  }),

  // POST /points - Create a point (starts with ready status)
  http.post(`${BASE_URL}/points`, async ({ request }) => {
    const body = (await request.json()) as PointCreate;

    // Check for existing running point (Phase 6: only one running point allowed)
    const existingRunningPoint = points.find(
      (p) => p.game_id === body.game_id && p.status === "running"
    );
    if (existingRunningPoint) {
      return HttpResponse.json(
        { detail: `Game ${body.game_id} already has a running point` },
        { status: 400 }
      );
    }

    // Get point number
    const gamePoints = points.filter((p) => p.game_id === body.game_id);
    const pointNumber = gamePoints.length + 1;

    // Get player objects (player_ids is now optional)
    const pointPlayers = body.player_ids
      ? players.filter((p) => body.player_ids!.includes(p.id))
      : [];
    // Allow any number of players during creation (validation happens at completion)

    // Get strategy if provided
    let strategy: Strategy | null = null;
    if (body.strategy_id) {
      strategy = strategies.find((s) => s.id === body.strategy_id) || null;
    }

    const newPoint: PointWithPlayers = {
      id: nextPointId++,
      game_id: body.game_id,
      point_number: pointNumber,
      starting_on_offense: body.starting_on_offense,
      field_side: body.field_side || null,
      pull: body.pull || null,
      comments: body.comments || null,
      strategy_id: body.strategy_id || null,
      won: null,
      status: "ready",  // Phase 6: Create as ready, frontend transitions to running
      start_datetime: body.start_datetime || new Date().toISOString(),
      end_datetime: null,
      created_at: new Date().toISOString(),
      players: pointPlayers,
      strategy: strategy,
    };
    points.push(newPoint);
    return HttpResponse.json(newPoint, { status: 201 });
  }),

  // POST /points/:id/finish - Finish a running or scored point
  http.post(`${BASE_URL}/points/:id/finish`, async ({ request, params }) => {
    const pointId = Number(params.id);
    const body = (await request.json()) as PointFinish;
    const point = points.find((p) => p.id === pointId);

    if (!point) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    // Phase 6: Can only finish running or scored points
    if (point.status !== "running" && point.status !== "scored") {
      return HttpResponse.json(
        { detail: `Point ${pointId} cannot be finished (status: ${point.status})` },
        { status: 400 }
      );
    }

    point.won = body.won;
    point.end_datetime = body.end_datetime || new Date().toISOString();
    point.status = "completed";

    // Calculate duration
    if (point.start_datetime && point.end_datetime) {
      const start = new Date(point.start_datetime).getTime();
      const end = new Date(point.end_datetime).getTime();
      point.duration_seconds = Math.floor((end - start) / 1000);
    }

    return HttpResponse.json(point);
  }),

  // GET /points/games/:gameId/active - Get active point (ready or running) for a game
  http.get(`${BASE_URL}/points/games/:gameId/active`, ({ params }) => {
    const gameId = Number(params.gameId);
    const activePoint = points.find(
      (p) => p.game_id === gameId && (p.status === "ready" || p.status === "running")
    );

    if (!activePoint) {
      return HttpResponse.json(
        { detail: "No active point found for this game" },
        { status: 404 }
      );
    }

    return HttpResponse.json(activePoint);
  }),

  // GET /points/games/:gameId/running - Get running point for a game (deprecated, use /active)
  http.get(`${BASE_URL}/points/games/:gameId/running`, ({ params }) => {
    const gameId = Number(params.gameId);
    const runningPoint = points.find(
      (p) => p.game_id === gameId && p.status === "running"
    );

    if (!runningPoint) {
      return HttpResponse.json(
        { detail: "No running point found for this game" },
        { status: 404 }
      );
    }

    return HttpResponse.json(runningPoint);
  }),

  // PUT /points/:id - Update point
  http.put(`${BASE_URL}/points/:id`, async ({ request, params }) => {
    const pointId = Number(params.id);
    const body = (await request.json()) as PointUpdate;
    const point = points.find((p) => p.id === pointId);

    if (!point) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    if (body.starting_on_offense !== undefined) {
      point.starting_on_offense = body.starting_on_offense;
    }
    if (body.won !== undefined) {
      point.won = body.won;
    }
    if (body.field_side !== undefined) {
      point.field_side = body.field_side;
    }
    if (body.pull !== undefined) {
      point.pull = body.pull;
    }
    if (body.strategy_id !== undefined) {
      point.strategy_id = body.strategy_id;
      // Update strategy object
      if (body.strategy_id) {
        point.strategy = strategies.find((s) => s.id === body.strategy_id) || null;
      } else {
        point.strategy = null;
      }
    }
    if (body.comments !== undefined) {
      point.comments = body.comments;
    }
    if (body.status !== undefined) {
      point.status = body.status;
    }
    if (body.start_datetime !== undefined) {
      point.start_datetime = body.start_datetime;
    }
    if (body.end_datetime !== undefined) {
      point.end_datetime = body.end_datetime;
    }
    if (body.player_ids !== undefined) {
      const pointPlayers = players.filter((p) => body.player_ids!.includes(p.id));
      if (pointPlayers.length !== 7) {
        return HttpResponse.json(
          { detail: "Expected 7 players" },
          { status: 400 }
        );
      }
      point.players = pointPlayers;
    }

    // Recalculate duration if both timestamps present
    if (point.start_datetime && point.end_datetime) {
      const start = new Date(point.start_datetime).getTime();
      const end = new Date(point.end_datetime).getTime();
      point.duration_seconds = Math.floor((end - start) / 1000);
    }

    return HttpResponse.json(point);
  }),

  // DELETE /points/:id/cancel - Cancel (delete) a ready or running point
  http.delete(`${BASE_URL}/points/:id/cancel`, ({ params }) => {
    const pointId = Number(params.id);
    const point = points.find((p) => p.id === pointId);

    if (!point) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    // Phase 6: Can only cancel ready or running points
    if (point.status !== "ready" && point.status !== "running") {
      return HttpResponse.json(
        { detail: `Can only cancel ready or running points. Point ${pointId} has status: ${point.status}` },
        { status: 400 }
      );
    }

    points = points.filter((p) => p.id !== pointId);
    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /points/:id - Delete point
  http.delete(`${BASE_URL}/points/:id`, ({ params }) => {
    const pointId = Number(params.id);
    const index = points.findIndex((p) => p.id === pointId);

    if (index === -1) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    points.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // LINE ENDPOINTS
  // ============================================

  // POST /lines - Create line
  http.post(`${BASE_URL}/lines`, async ({ request }) => {
    const body = (await request.json()) as LineCreate;
    const newLine: Line = {
      id: nextLineId++,
      team_id: body.team_id,
      name: body.name,
      description: body.description || null,
      created_at: new Date().toISOString(),
    };
    lines.push(newLine);

    // Add initial players if provided
    if (body.player_ids && body.player_ids.length > 0) {
      linePlayers.set(newLine.id, body.player_ids);
    }

    return HttpResponse.json(newLine, { status: 201 });
  }),

  // GET /lines - List lines (optionally filtered by team)
  http.get(`${BASE_URL}/lines`, ({ request }) => {
    const url = new URL(request.url);
    const teamIdParam = url.searchParams.get("team_id");

    let filteredLines = lines;
    if (teamIdParam) {
      const teamId = Number(teamIdParam);
      filteredLines = lines.filter((line) => line.team_id === teamId);
    }

    // Return LineWithPlayers
    const linesWithPlayers: LineWithPlayers[] = filteredLines.map((line) => {
      const playerIds = linePlayers.get(line.id) || [];
      const linePlayersList = playerIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined);

      return {
        ...line,
        players: linePlayersList,
      };
    });

    return HttpResponse.json(linesWithPlayers);
  }),

  // GET /lines/:id - Get line with players
  http.get(`${BASE_URL}/lines/:id`, ({ params }) => {
    const lineId = Number(params.id);
    const line = lines.find((l) => l.id === lineId);

    if (!line) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    const playerIds = linePlayers.get(lineId) || [];
    const linePlayersList = playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    const lineWithPlayers: LineWithPlayers = {
      ...line,
      players: linePlayersList,
    };

    return HttpResponse.json(lineWithPlayers);
  }),

  // PUT /lines/:id - Update line
  http.put(`${BASE_URL}/lines/:id`, async ({ params, request }) => {
    const lineId = Number(params.id);
    const line = lines.find((l) => l.id === lineId);

    if (!line) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    const body = (await request.json()) as LineUpdate;
    if (body.name !== undefined) line.name = body.name;
    if (body.description !== undefined) line.description = body.description;

    return HttpResponse.json(line);
  }),

  // DELETE /lines/:id - Delete line
  http.delete(`${BASE_URL}/lines/:id`, ({ params }) => {
    const lineId = Number(params.id);
    const index = lines.findIndex((l) => l.id === lineId);

    if (index === -1) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    lines.splice(index, 1);
    linePlayers.delete(lineId);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /lines/:id/players - Get line players
  http.get(`${BASE_URL}/lines/:id/players`, ({ params }) => {
    const lineId = Number(params.id);
    const line = lines.find((l) => l.id === lineId);

    if (!line) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    const playerIds = linePlayers.get(lineId) || [];
    const linePlayersList = playerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    return HttpResponse.json(linePlayersList);
  }),

  // POST /lines/:id/players - Add players to line
  http.post(`${BASE_URL}/lines/:id/players`, async ({ params, request }) => {
    const lineId = Number(params.id);
    const line = lines.find((l) => l.id === lineId);

    if (!line) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    const body = (await request.json()) as PlayerIdsRequest;
    const currentPlayerIds = linePlayers.get(lineId) || [];
    const newPlayerIds = [...new Set([...currentPlayerIds, ...body.player_ids])];
    linePlayers.set(lineId, newPlayerIds);

    // Return LineWithPlayers
    const linePlayersList = newPlayerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    const lineWithPlayers: LineWithPlayers = {
      ...line,
      players: linePlayersList,
    };

    return HttpResponse.json(lineWithPlayers);
  }),

  // DELETE /lines/:id/players - Remove players from line
  http.delete(`${BASE_URL}/lines/:id/players`, async ({ params, request }) => {
    const lineId = Number(params.id);
    const line = lines.find((l) => l.id === lineId);

    if (!line) {
      return HttpResponse.json({ detail: "Line not found" }, { status: 404 });
    }

    const body = (await request.json()) as PlayerIdsRequest;
    const currentPlayerIds = linePlayers.get(lineId) || [];
    const updatedPlayerIds = currentPlayerIds.filter((id) => !body.player_ids.includes(id));
    linePlayers.set(lineId, updatedPlayerIds);

    // Return LineWithPlayers
    const linePlayersList = updatedPlayerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    const lineWithPlayers: LineWithPlayers = {
      ...line,
      players: linePlayersList,
    };

    return HttpResponse.json(lineWithPlayers);
  }),

  // ========================================
  // Strategy Endpoints
  // ========================================

  // POST /strategies - Create a strategy
  http.post(`${BASE_URL}/strategies`, async ({ request }) => {
    const body = (await request.json()) as StrategyCreate;
    const newStrategy: Strategy = {
      id: nextStrategyId++,
      name: body.name,
      description: body.description || null,
      category: body.category,
      created_at: new Date().toISOString(),
    };
    strategies.push(newStrategy);
    return HttpResponse.json(newStrategy, { status: 201 });
  }),

  // GET /strategies - List all strategies with optional category filter
  http.get(`${BASE_URL}/strategies`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let filteredStrategies = strategies;
    if (category) {
      filteredStrategies = strategies.filter((s) => s.category === category);
    }

    return HttpResponse.json(filteredStrategies);
  }),

  // GET /strategies/:id - Get strategy by ID
  http.get(`${BASE_URL}/strategies/:id`, ({ params }) => {
    const strategyId = Number(params.id);
    const strategy = strategies.find((s) => s.id === strategyId);
    if (!strategy) {
      return HttpResponse.json({ detail: "Strategy not found" }, { status: 404 });
    }
    return HttpResponse.json(strategy);
  }),

  // PUT /strategies/:id - Update strategy
  http.put(`${BASE_URL}/strategies/:id`, async ({ request, params }) => {
    const strategyId = Number(params.id);
    const body = (await request.json()) as StrategyUpdate;
    const strategy = strategies.find((s) => s.id === strategyId);

    if (!strategy) {
      return HttpResponse.json({ detail: "Strategy not found" }, { status: 404 });
    }

    // Update fields
    if (body.name !== undefined) strategy.name = body.name;
    if (body.description !== undefined) strategy.description = body.description;
    if (body.category !== undefined) strategy.category = body.category;

    return HttpResponse.json(strategy);
  }),

  // DELETE /strategies/:id - Delete strategy
  http.delete(`${BASE_URL}/strategies/:id`, ({ params }) => {
    const strategyId = Number(params.id);
    const index = strategies.findIndex((s) => s.id === strategyId);

    if (index === -1) {
      return HttpResponse.json({ detail: "Strategy not found" }, { status: 404 });
    }

    strategies.splice(index, 1);

    // Set strategy_id to null on points that reference this strategy
    points.forEach((p) => {
      if (p.strategy_id === strategyId) {
        p.strategy_id = null;
        p.strategy = null;
      }
    });

    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // Stoppage Endpoints
  // ============================================

  // GET /stoppages/:callId - Get a single stoppage
  http.get(`${BASE_URL}/stoppages/:callId`, ({ params }) => {
    const callId = Number(params.callId);
    const call = calls.find((c) => c.id === callId);

    if (!call) {
      return HttpResponse.json({ detail: "Stoppage not found" }, { status: 404 });
    }

    return HttpResponse.json(call);
  }),

  // GET /stoppages/points/:pointId/stoppages - Get all stoppages for a point
  http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, ({ params }) => {
    const pointId = Number(params.pointId);
    const pointCalls = calls.filter((c) => c.point_id === pointId);
    return HttpResponse.json(pointCalls);
  }),

  // POST /stoppages - Create a new stoppage
  http.post(`${BASE_URL}/stoppages`, async ({ request }) => {
    const newCall = (await request.json()) as CallCreate;
    const call: Call = {
      id: nextCallId++,
      ...newCall,
      stoppage_type: newCall.stoppage_type ?? "call",
      resume_timestamp: newCall.resume_timestamp ?? null,
      comments: newCall.comments ?? null,
      created_at: new Date().toISOString(),
    };
    calls.push(call);
    return HttpResponse.json(call, { status: 201 });
  }),

  // PUT /stoppages/:callId - Update a stoppage
  http.put(`${BASE_URL}/stoppages/:callId`, async ({ params, request }) => {
    const callId = Number(params.callId);
    const updates = (await request.json()) as CallUpdate;
    const callIndex = calls.findIndex((c) => c.id === callId);

    if (callIndex === -1) {
      return HttpResponse.json({ detail: "Stoppage not found" }, { status: 404 });
    }

    calls[callIndex] = {
      ...calls[callIndex],
      ...updates,
    };

    return HttpResponse.json(calls[callIndex]);
  }),

  // DELETE /stoppages/:callId - Delete a stoppage
  http.delete(`${BASE_URL}/stoppages/:callId`, ({ params }) => {
    const callId = Number(params.callId);
    const callIndex = calls.findIndex((c) => c.id === callId);

    if (callIndex === -1) {
      return HttpResponse.json({ detail: "Stoppage not found" }, { status: 404 });
    }

    calls.splice(callIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // Turnover Endpoints
  // ============================================

  // GET /turnovers/:turnoverId - Get a single turnover
  http.get(`${BASE_URL}/turnovers/:turnoverId`, ({ params }) => {
    const turnoverId = Number(params.turnoverId);
    const turnover = turnovers.find((t) => t.id === turnoverId);

    if (!turnover) {
      return HttpResponse.json({ detail: "Turnover not found" }, { status: 404 });
    }

    return HttpResponse.json(turnover);
  }),

  // GET /turnovers/points/:pointId/turnovers - Get all turnovers for a point
  http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, ({ params }) => {
    const pointId = Number(params.pointId);
    const pointTurnovers = turnovers.filter((t) => t.point_id === pointId);
    return HttpResponse.json(pointTurnovers);
  }),

  // GET /turnovers/players/:playerId/turnovers - Get all turnovers for a player
  http.get(`${BASE_URL}/turnovers/players/:playerId/turnovers`, ({ params }) => {
    const playerId = Number(params.playerId);
    // Return turnovers without the player field (API doesn't include it for this endpoint)
    const playerTurnovers = turnovers
      .filter((t) => t.player_id === playerId)
      .map((t) => ({
        id: t.id,
        point_id: t.point_id,
        player_id: t.player_id,
        timestamp: t.timestamp,
        comments: t.comments,
        created_at: t.created_at,
      }));
    return HttpResponse.json(playerTurnovers);
  }),

  // POST /turnovers - Create a new turnover
  http.post(`${BASE_URL}/turnovers`, async ({ request }) => {
    const newTurnover = (await request.json()) as TurnoverCreate;
    const player = newTurnover.player_id ? players.find((p) => p.id === newTurnover.player_id) : null;

    const turnover: TurnoverWithPlayer = {
      id: nextTurnoverId++,
      ...newTurnover,
      player_id: newTurnover.player_id ?? null,
      comments: newTurnover.comments ?? null,
      created_at: new Date().toISOString(),
      player: player ?? null,
    };
    turnovers.push(turnover);
    return HttpResponse.json(turnover, { status: 201 });
  }),

  // PUT /turnovers/:turnoverId - Update a turnover
  http.put(`${BASE_URL}/turnovers/:turnoverId`, async ({ params, request }) => {
    const turnoverId = Number(params.turnoverId);
    const updates = (await request.json()) as TurnoverUpdate;
    const turnoverIndex = turnovers.findIndex((t) => t.id === turnoverId);

    if (turnoverIndex === -1) {
      return HttpResponse.json({ detail: "Turnover not found" }, { status: 404 });
    }

    const player = updates.player_id ? players.find((p) => p.id === updates.player_id) : null;

    turnovers[turnoverIndex] = {
      ...turnovers[turnoverIndex],
      ...updates,
      player: player ?? null,
    };

    return HttpResponse.json(turnovers[turnoverIndex]);
  }),

  // DELETE /turnovers/:turnoverId - Delete a turnover
  http.delete(`${BASE_URL}/turnovers/:turnoverId`, ({ params }) => {
    const turnoverId = Number(params.turnoverId);
    const turnoverIndex = turnovers.findIndex((t) => t.id === turnoverId);

    if (turnoverIndex === -1) {
      return HttpResponse.json({ detail: "Turnover not found" }, { status: 404 });
    }

    turnovers.splice(turnoverIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // Statistics Endpoints
  // ============================================

  // GET /statistics/games/:gameId/live - Get live player statistics
  http.get(`${BASE_URL}/statistics/games/:gameId/live`, ({ params }) => {
    const gameId = Number(params.gameId);
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }

    const gamePlayerIds = gamePlayers.get(gameId) || [];
    const gamePlayers_list = players.filter((p) => gamePlayerIds.includes(p.id));
    return HttpResponse.json(buildEmptyPlayerStatsForPlayers(gamePlayers_list));
  }),

  // GET /statistics/games/:gameId/team - Get team statistics
  http.get(`${BASE_URL}/statistics/games/:gameId/team`, ({ params }) => {
    const gameId = Number(params.gameId);
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyTeamStats({ game_id: gameId }));
  }),

  // GET /statistics/games/:gameId/strategies - Get strategy statistics
  http.get(`${BASE_URL}/statistics/games/:gameId/strategies`, ({ params }) => {
    const gameId = Number(params.gameId);
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyStrategyStats({ game_id: gameId }));
  }),

  // GET /statistics/competitions/:competitionId/players - Get competition player statistics
  http.get(`${BASE_URL}/statistics/competitions/:competitionId/players`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);

    if (!competition) {
      return HttpResponse.json({ detail: "Competition not found" }, { status: 404 });
    }

    const rosterPlayerIds = competitionPlayers.get(competitionId) || [];
    const rosterPlayers = players.filter((player) => rosterPlayerIds.includes(player.id));
    return HttpResponse.json(buildEmptyPlayerStatsForPlayers(rosterPlayers));
  }),

  // GET /statistics/teams/:teamId/players - Get team player statistics
  http.get(`${BASE_URL}/statistics/teams/:teamId/players`, ({ params }) => {
    const teamId = Number(params.teamId);
    const team = teams.find((t) => t.id === teamId);

    if (!team) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }

    const teamPlayers = players.filter((player) => player.team_id === teamId);
    return HttpResponse.json(buildEmptyPlayerStatsForPlayers(teamPlayers));
  }),

  // GET /statistics/competitions/:competitionId/team - Get competition team statistics
  http.get(`${BASE_URL}/statistics/competitions/:competitionId/team`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);

    if (!competition) {
      return HttpResponse.json({ detail: "Competition not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyTeamStats({ competition_id: competitionId }));
  }),

  // GET /statistics/teams/:teamId/team - Get team statistics
  http.get(`${BASE_URL}/statistics/teams/:teamId/team`, ({ params }) => {
    const teamId = Number(params.teamId);
    const team = teams.find((t) => t.id === teamId);

    if (!team) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyTeamStats({ team_id: teamId }));
  }),

  // GET /statistics/competitions/:competitionId/strategies - Get competition strategy statistics
  http.get(`${BASE_URL}/statistics/competitions/:competitionId/strategies`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);

    if (!competition) {
      return HttpResponse.json({ detail: "Competition not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyStrategyStats({ competition_id: competitionId }));
  }),

  // GET /statistics/teams/:teamId/strategies - Get team strategy statistics
  http.get(`${BASE_URL}/statistics/teams/:teamId/strategies`, ({ params }) => {
    const teamId = Number(params.teamId);
    const team = teams.find((t) => t.id === teamId);

    if (!team) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }

    return HttpResponse.json(buildEmptyStrategyStats({ team_id: teamId }));
  }),

  // ============================================
  // Export Endpoints
  // ============================================

  // GET /exports/games/:gameId/csv - Download game statistics CSV
  http.get(`${BASE_URL}/exports/games/:gameId/csv`, ({ params }) => {
    const gameId = Number(params.gameId);
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      return HttpResponse.json({ detail: "Game not found" }, { status: 404 });
    }
    return buildCsvExportResponse("game", gameId);
  }),

  // GET /exports/competitions/:competitionId/csv - Download competition statistics CSV
  http.get(`${BASE_URL}/exports/competitions/:competitionId/csv`, ({ params }) => {
    const competitionId = Number(params.competitionId);
    const competition = competitions.find((c) => c.id === competitionId);
    if (!competition) {
      return HttpResponse.json({ detail: "Competition not found" }, { status: 404 });
    }
    return buildCsvExportResponse("competition", competitionId);
  }),

  // GET /exports/teams/:teamId/csv - Download team statistics CSV
  http.get(`${BASE_URL}/exports/teams/:teamId/csv`, ({ params }) => {
    const teamId = Number(params.teamId);
    const team = teams.find((t) => t.id === teamId);
    if (!team) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }
    return buildCsvExportResponse("team", teamId);
  }),
];
