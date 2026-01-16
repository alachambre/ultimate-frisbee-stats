import { http, HttpResponse } from "msw";
import type { Team, TeamCreate, TeamWithPlayers, Player, PlayerCreate, PlayerUpdate, Game, GameCreate, GameUpdate, GameWithScore, GameDetail } from "../../types";

const BASE_URL = "http://localhost:8000";

// In-memory data store for tests
let teams: Team[] = [];
let players: Player[] = [];
let games: Game[] = [];
let nextTeamId = 1;
let nextPlayerId = 1;
let nextGameId = 1;

// Helper to reset data between tests
export function resetMockData() {
  teams = [];
  players = [];
  games = [];
  nextTeamId = 1;
  nextPlayerId = 1;
  nextGameId = 1;
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
    const gameDetail: GameDetail = {
      ...game,
      our_score: 0,
      opponent_score: 0,
      team_name: team?.name || "Unknown",
      points: [],
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
    return new HttpResponse(null, { status: 204 });
  }),
];
