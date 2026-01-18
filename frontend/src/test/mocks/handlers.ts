import { http, HttpResponse } from "msw";
import type { Team, TeamCreate, TeamWithPlayers, Player, PlayerCreate, PlayerUpdate, Game, GameCreate, GameUpdate, GameWithScore, GameDetail, PointWithPlayers, PointCreate, PointFinish, PointUpdate } from "../../types";

const BASE_URL = "http://localhost:8000";

// In-memory data store for tests
let teams: Team[] = [];
let players: Player[] = [];
let games: Game[] = [];
let points: PointWithPlayers[] = [];
let nextTeamId = 1;
let nextPlayerId = 1;
let nextGameId = 1;
let nextPointId = 1;

// Helper to reset data between tests
export function resetMockData() {
  teams = [];
  players = [];
  games = [];
  points = [];
  nextTeamId = 1;
  nextPlayerId = 1;
  nextGameId = 1;
  nextPointId = 1;
}

export const handlers = [
  // GET /teams - List all teams
  http.get(`${BASE_URL}/teams`, () => {
    return HttpResponse.json(teams);
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

  // DELETE /teams/:id - Delete team
  http.delete(`${BASE_URL}/teams/:id`, ({ params }) => {
    const teamId = Number(params.id);
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) {
      return HttpResponse.json({ detail: "Team not found" }, { status: 404 });
    }
    teams.splice(index, 1);
    // Also delete associated players
    players = players.filter((p) => p.team_id !== teamId);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /players - Create a player
  http.post(`${BASE_URL}/players`, async ({ request }) => {
    const body = (await request.json()) as PlayerCreate;
    const newPlayer: Player = {
      id: nextPlayerId++,
      name: body.name,
      number: body.number ?? null,
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
    player.name = body.name;
    player.number = body.number ?? null;
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
      const team = teams.find((t) => t.id === game.team_id);
      return {
        ...game,
        our_score: 0,
        opponent_score: 0,
        team_name: team?.name || "Unknown",
      };
    });
    return HttpResponse.json(gamesWithScores);
  }),

  // POST /games - Create a game
  http.post(`${BASE_URL}/games`, async ({ request }) => {
    const body = (await request.json()) as GameCreate;
    const newGame: Game = {
      id: nextGameId++,
      team_id: body.team_id,
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
    const team = teams.find((t) => t.id === game.team_id);
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
