import type {
  Competition,
  Game,
  Halftime,
  Line,
  Player,
  PointWithPlayers,
  Stoppage,
  Strategy,
  Team,
  TurnoverWithPlayer,
} from "../../types";

interface MockDb {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
  competitionPlayers: Map<number, number[]>;
  lines: Line[];
  linePlayers: Map<number, number[]>;
  games: Game[];
  gamePlayers: Map<number, number[]>;
  strategies: Strategy[];
  points: PointWithPlayers[];
  halftimes: Halftime[];
  calls: Stoppage[];
  turnovers: TurnoverWithPlayer[];
  nextTeamId: number;
  nextPlayerId: number;
  nextCompetitionId: number;
  nextLineId: number;
  nextGameId: number;
  nextStrategyId: number;
  nextPointId: number;
  nextHalftimeId: number;
  nextCallId: number;
  nextTurnoverId: number;
}

function createEmptyMockDb(): MockDb {
  return {
    teams: [],
    players: [],
    competitions: [],
    competitionPlayers: new Map(),
    lines: [],
    linePlayers: new Map(),
    games: [],
    gamePlayers: new Map(),
    strategies: [],
    points: [],
    halftimes: [],
    calls: [],
    turnovers: [],
    nextTeamId: 1,
    nextPlayerId: 1,
    nextCompetitionId: 1,
    nextLineId: 1,
    nextGameId: 1,
    nextStrategyId: 1,
    nextPointId: 1,
    nextHalftimeId: 1,
    nextCallId: 1,
    nextTurnoverId: 1,
  };
}

export const mockDb: MockDb = createEmptyMockDb();

export function resetMockData() {
  Object.assign(mockDb, createEmptyMockDb());
}
