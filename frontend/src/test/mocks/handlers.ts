import { http, HttpResponse } from "msw";
import type { Team, TeamCreate, TeamWithPlayers, Player, PlayerCreate, PlayerUpdate, Competition, CompetitionCreate, CompetitionUpdate, CompetitionWithPlayers, PlayerIdsRequest, Game, GameCreate, GameUpdate, GameWithScore, GameDetail, PointWithPlayers, PointCreate, PointFinish, PointUpdate } from "../../types";

const BASE_URL = "http://localhost:8000";

// In-memory data store for tests
let teams: Team[] = [];
let players: Player[] = [];
let competitions: Competition[] = [];
let competitionPlayers: Map<number, number[]> = new Map(); // competitionId -> playerIds[]
let games: Game[] = [];
let points: PointWithPlayers[] = [];
let nextTeamId = 1;
let nextPlayerId = 1;
let nextCompetitionId = 1;
let nextGameId = 1;
let nextPointId = 1;

// Helper to reset data between tests
export function resetMockData() {
  teams = [];
  players = [];
  competitions = [];
  competitionPlayers = new Map();
  games = [];
  points = [];
  nextTeamId = 1;
  nextPlayerId = 1;
  nextCompetitionId = 1;
  nextGameId = 1;
  nextPointId = 1;
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
    const newGame: Game = {
      id: nextGameId++,
      competition_id: body.competition_id,
      opponent_name: body.opponent_name,
      date: body.date || null,
      status: "in_progress",
      created_at: new Date().toISOString(),
    };
    games.push(newGame);
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

    const gameDetail: GameDetail = {
      ...game,
      our_score: ourScore,
      opponent_score: opponentScore,
      team_name: team?.name || "Unknown",
      competition_name: competition?.name || "Unknown",
      points: gamePoints,
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
    if (body.status !== undefined) {
      game.status = body.status;
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
    game.status = "finished";
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

  // POST /points - Start a point (create active point)
  http.post(`${BASE_URL}/points`, async ({ request }) => {
    const body = (await request.json()) as PointCreate;

    // Check for existing active point
    const existingActivePoint = points.find(
      (p) => p.game_id === body.game_id && p.status === "active"
    );
    if (existingActivePoint) {
      return HttpResponse.json(
        { detail: `Game ${body.game_id} already has an active point` },
        { status: 400 }
      );
    }

    // Get point number
    const gamePoints = points.filter((p) => p.game_id === body.game_id);
    const pointNumber = gamePoints.length + 1;

    // Get player objects
    const pointPlayers = players.filter((p) => body.player_ids.includes(p.id));
    if (pointPlayers.length !== 7) {
      return HttpResponse.json(
        { detail: "Expected 7 players" },
        { status: 400 }
      );
    }

    const newPoint: PointWithPlayers = {
      id: nextPointId++,
      game_id: body.game_id,
      point_number: pointNumber,
      starting_on_offense: body.starting_on_offense,
      won: null,
      status: "active",
      start_datetime: body.start_datetime || new Date().toISOString(),
      end_datetime: null,
      created_at: new Date().toISOString(),
      players: pointPlayers,
    };
    points.push(newPoint);
    return HttpResponse.json(newPoint, { status: 201 });
  }),

  // POST /points/:id/finish - Finish an active point
  http.post(`${BASE_URL}/points/:id/finish`, async ({ request, params }) => {
    const pointId = Number(params.id);
    const body = (await request.json()) as PointFinish;
    const point = points.find((p) => p.id === pointId);

    if (!point) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    if (point.status !== "active") {
      return HttpResponse.json(
        { detail: `Point ${pointId} is not active` },
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

  // GET /points/games/:gameId/active - Get active point for a game
  http.get(`${BASE_URL}/points/games/:gameId/active`, ({ params }) => {
    const gameId = Number(params.gameId);
    const activePoint = points.find(
      (p) => p.game_id === gameId && p.status === "active"
    );

    if (!activePoint) {
      return HttpResponse.json(
        { detail: "No active point found for this game" },
        { status: 404 }
      );
    }

    return HttpResponse.json(activePoint);
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

  // DELETE /points/:id/cancel - Cancel (delete) an active point
  http.delete(`${BASE_URL}/points/:id/cancel`, ({ params }) => {
    const pointId = Number(params.id);
    const point = points.find((p) => p.id === pointId);

    if (!point) {
      return HttpResponse.json({ detail: "Point not found" }, { status: 404 });
    }

    if (point.status !== "active") {
      return HttpResponse.json(
        { detail: "Can only cancel active points" },
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
];
