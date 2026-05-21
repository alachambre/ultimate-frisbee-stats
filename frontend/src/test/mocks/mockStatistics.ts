import { HttpResponse } from "msw";
import type {
  Competition,
  Game,
  GamePointTimeline,
  Halftime,
  Player,
  PointWithPlayers,
  TeamEvolutionResponse,
  TurnoverWithPlayer,
} from "../../types";

export interface MockStatisticsData {
  competitions: Competition[];
  competitionPlayers: Map<number, number[]>;
  games: Game[];
  gamePlayers: Map<number, number[]>;
  players: Player[];
  points: PointWithPlayers[];
  halftimes: Halftime[];
  turnovers: TurnoverWithPlayer[];
}

export function buildEmptyPlayerStatsForPlayers(playersList: Player[]) {
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
      conversion_rate: 0.0,
      points_won_no_turnover: 0,
      clean_break_rate: 0.0,
      clean_conversion_rate: 0.0,
      points_lost_no_turnover: 0,
    },
  }));
}

export function parseRepeatedIds(requestUrl: string, key: string): number[] {
  const url = new URL(requestUrl);
  return url.searchParams
    .getAll(key)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function getTeamCompetitionIds(data: MockStatisticsData, teamId: number): number[] {
  return data.competitions
    .filter((competition) => competition.team_id === teamId)
    .map((competition) => competition.id);
}

function getScopedTeamGames(
  data: MockStatisticsData,
  teamId: number,
  competitionIds: number[],
  gameIds: number[]
): Game[] {
  const teamCompetitionIds = new Set(getTeamCompetitionIds(data, teamId));

  return data.games.filter((game) => {
    if (!teamCompetitionIds.has(game.competition_id)) {
      return false;
    }

    if (competitionIds.length > 0 && !competitionIds.includes(game.competition_id)) {
      return false;
    }

    if (gameIds.length > 0 && !gameIds.includes(game.id)) {
      return false;
    }

    return true;
  });
}

function getScopedRosterPlayers(
  data: MockStatisticsData,
  teamId: number,
  competitionIds: number[],
  gameIds: number[]
): Player[] {
  if (gameIds.length > 0) {
    const scopedGameIds = new Set(
      getScopedTeamGames(data, teamId, competitionIds, gameIds).map((game) => game.id)
    );
    const rosterIds = new Set<number>();
    for (const gameId of scopedGameIds) {
      for (const playerId of data.gamePlayers.get(gameId) ?? []) {
        rosterIds.add(playerId);
      }
    }
    return data.players.filter((player) => rosterIds.has(player.id));
  }

  if (competitionIds.length > 0) {
    const teamCompetitionIds = new Set(getTeamCompetitionIds(data, teamId));
    const scopedCompetitionIds = competitionIds.filter((competitionId) =>
      teamCompetitionIds.has(competitionId)
    );
    const rosterIds = new Set<number>();
    for (const competitionId of scopedCompetitionIds) {
      for (const playerId of data.competitionPlayers.get(competitionId) ?? []) {
        rosterIds.add(playerId);
      }
    }
    return data.players.filter((player) => rosterIds.has(player.id));
  }

  return data.players.filter((player) => player.team_id === teamId);
}

function filterCompletedPointsByRequiredPlayers(
  data: MockStatisticsData,
  scopedGames: Game[],
  requiredPlayerIds: number[]
): PointWithPlayers[] {
  const scopedGameIds = new Set(scopedGames.map((game) => game.id));

  return data.points.filter((point) => {
    if (point.status !== "completed" || !scopedGameIds.has(point.game_id)) {
      return false;
    }

    if (requiredPlayerIds.length === 0) {
      return true;
    }

    const pointPlayerIds = new Set(point.players.map((player) => player.id));
    return requiredPlayerIds.every((playerId) => pointPlayerIds.has(playerId));
  });
}

export function buildTeamPlayerStatsForScope(
  data: MockStatisticsData,
  teamId: number,
  competitionIds: number[],
  gameIds: number[],
  requiredPlayerIds: number[]
) {
  const scopedRosterPlayers = getScopedRosterPlayers(data, teamId, competitionIds, gameIds);
  const scopedPoints = filterCompletedPointsByRequiredPlayers(
    data,
    getScopedTeamGames(data, teamId, competitionIds, gameIds),
    requiredPlayerIds
  );
  const stats = buildEmptyPlayerStatsForPlayers(scopedRosterPlayers);
  const statsByPlayerId = new Map(stats.map((playerStat) => [playerStat.player_id, playerStat]));

  for (const point of scopedPoints) {
    for (const player of point.players) {
      const playerStat = statsByPlayerId.get(player.id);
      if (!playerStat) {
        continue;
      }

      playerStat.points_played += 1;

      const scopedUnit = point.starting_on_offense ? playerStat.offense : playerStat.defense;
      scopedUnit.points_played += 1;

      if (point.won) {
        scopedUnit.points_won += 1;
      } else {
        scopedUnit.points_lost += 1;
      }
    }
  }

  return stats;
}

export function buildEmptyTeamStats(
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
      conversion_rate: 0.0,
      points_won_no_turnover: 0,
      clean_break_rate: 0.0,
      clean_conversion_rate: 0.0,
      points_lost_no_turnover: 0,
      pull_stats: {
        total_pulls: 0,
        inbound_pulls: 0,
        out_of_bounds_pulls: 0,
        inbound_rate: 0.0,
      },
    },
    field_side_stats: {
      table_left: {
        offense: {
          points_started: 0,
          points_won: 0,
          hold_rate: 0.0,
        },
        defense: {
          points_started: 0,
          points_won: 0,
          break_rate: 0.0,
        },
      },
      table_right: {
        offense: {
          points_started: 0,
          points_won: 0,
          hold_rate: 0.0,
        },
        defense: {
          points_started: 0,
          points_won: 0,
          break_rate: 0.0,
        },
      },
    },
  };
}

export function buildEmptyStrategyStats(
  scope: { game_id: number } | { competition_id: number } | { team_id: number }
) {
  return {
    ...scope,
    offense_strategies: [],
    defense_strategies: [],
  };
}

export function buildCsvExportResponse(
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

function countTurnoversByPossession(
  startingOnOffense: boolean,
  pointTurnovers: TurnoverWithPlayer[]
) {
  let ourTurnovers = 0;
  let opponentTurnovers = 0;

  pointTurnovers.forEach((_turnover, index) => {
    const turnoverNumber = index + 1;
    if (startingOnOffense) {
      if (turnoverNumber % 2 === 1) {
        ourTurnovers += 1;
      } else {
        opponentTurnovers += 1;
      }
      return;
    }

    if (turnoverNumber % 2 === 1) {
      opponentTurnovers += 1;
    } else {
      ourTurnovers += 1;
    }
  });

  return { ourTurnovers, opponentTurnovers };
}

function getPointTimestamp(point: PointWithPlayers): number {
  const reference = point.end_datetime ?? point.start_datetime ?? point.created_at;
  const parsed = new Date(reference).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPointDurationSeconds(point: PointWithPlayers): number {
  if (typeof point.duration_seconds === "number") {
    return point.duration_seconds;
  }

  if (!point.start_datetime || !point.end_datetime) {
    return 0;
  }

  const startMs = new Date(point.start_datetime).getTime();
  const endMs = new Date(point.end_datetime).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

export function buildGamePointTimelineResponse(
  data: MockStatisticsData,
  gameId: number,
  requiredPlayerIds: number[]
): GamePointTimeline {
  const completedPoints = data.points
    .filter((point) => point.game_id === gameId && point.status === "completed")
    .slice()
    .sort((left, right) => left.point_number - right.point_number || getPointTimestamp(left) - getPointTimestamp(right));

  const visiblePoints = completedPoints.filter((point) => {
    if (requiredPlayerIds.length === 0) {
      return true;
    }

    const pointPlayerIds = new Set(point.players.map((player) => player.id));
    return requiredPlayerIds.every((playerId) => pointPlayerIds.has(playerId));
  });

  let ourScore = 0;
  let opponentScore = 0;
  const scoreAfterByPointId = new Map<number, { our: number; opponent: number }>();
  completedPoints.forEach((point) => {
    if (point.won) {
      ourScore += 1;
    } else {
      opponentScore += 1;
    }
    scoreAfterByPointId.set(point.id, { our: ourScore, opponent: opponentScore });
  });

  const halftime = data.halftimes.find((entry) => entry.game_id === gameId);
  const halftimeTimestamp = halftime ? new Date(halftime.halftime_timestamp).getTime() : null;
  const pointsBeforeHalftime =
    halftimeTimestamp == null
      ? []
      : completedPoints.filter((point) => getPointTimestamp(point) <= halftimeTimestamp);
  const halftimeAfterPointNumber =
    pointsBeforeHalftime.length > 0
      ? pointsBeforeHalftime[pointsBeforeHalftime.length - 1].point_number
      : null;

  return {
    game_id: gameId,
    halftime_after_point_number: halftimeAfterPointNumber,
    points: visiblePoints.map((point) => {
      const pointTurnovers = data.turnovers
        .filter((turnover) => turnover.point_id === point.id)
        .slice()
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
      const turnoverCounts = countTurnoversByPossession(point.starting_on_offense, pointTurnovers);
      const scoreAfter = scoreAfterByPointId.get(point.id) ?? { our: 0, opponent: 0 };

      return {
        point_id: point.id,
        point_number: point.point_number,
        starting_on_offense: point.starting_on_offense,
        won: point.won ?? false,
        field_side: point.field_side ?? null,
        duration_seconds: getPointDurationSeconds(point),
        our_turnovers: turnoverCounts.ourTurnovers,
        opponent_turnovers: turnoverCounts.opponentTurnovers,
        our_score_after: scoreAfter.our,
        opponent_score_after: scoreAfter.opponent,
      };
    }),
  };
}

const TEAM_EVOLUTION_METRICS: TeamEvolutionResponse["metrics"] = [
  {
    id: "total_our_turnovers",
    label: "Our turns",
    description: "Total possession turnovers committed by us across the game.",
    unit: "count",
    group: "turnovers",
    format: "integer",
    higher_is_better: false,
  },
  {
    id: "total_opponent_turnovers",
    label: "Opponent turns",
    description: "Total possession turnovers committed by the opponent across the game.",
    unit: "count",
    group: "turnovers",
    format: "integer",
    higher_is_better: true,
  },
  {
    id: "offense_our_turnovers",
    label: "O-line turns",
    description: "Possession turnovers committed by us on points started on offense.",
    unit: "count",
    group: "turnovers",
    format: "integer",
    higher_is_better: false,
  },
  {
    id: "defense_our_turnovers",
    label: "D-line turns",
    description: "Possession turnovers committed by us on points started on defense.",
    unit: "count",
    group: "turnovers",
    format: "integer",
    higher_is_better: false,
  },
  {
    id: "defense_opponent_turnovers",
    label: "Opponent turns vs D-line",
    description: "Possession turnovers committed by the opponent on points we started on defense.",
    unit: "count",
    group: "turnovers",
    format: "integer",
    higher_is_better: true,
  },
  {
    id: "points_won",
    label: "Points won",
    description: "Completed points won by us.",
    unit: "count",
    group: "results",
    format: "integer",
    higher_is_better: true,
  },
  {
    id: "points_lost",
    label: "Points lost",
    description: "Completed points won by the opponent.",
    unit: "count",
    group: "results",
    format: "integer",
    higher_is_better: false,
  },
  {
    id: "holds",
    label: "Holds",
    description: "Offensive points won by us.",
    unit: "count",
    group: "offense",
    format: "integer",
    higher_is_better: true,
  },
  {
    id: "breaks",
    label: "Breaks",
    description: "Defensive points won by us.",
    unit: "count",
    group: "defense",
    format: "integer",
    higher_is_better: true,
  },
  {
    id: "offense_hold_rate",
    label: "Hold rate",
    description: "Offensive points won, out of all offensive points played.",
    unit: "percentage",
    group: "offense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "offense_clean_hold_rate",
    label: "Clean hold rate",
    description: "Offensive points won without us committing a turnover, out of all offensive points played.",
    unit: "percentage",
    group: "offense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_turnover_rate",
    label: "D points with turns",
    description: "Defensive points where at least one possession turnover occurred, out of all defensive points played.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_break_rate",
    label: "Break rate",
    description: "Defensive points won, out of all defensive points played.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_clean_break_rate",
    label: "Clean break rate",
    description: "Defensive points won without us committing a turnover, out of all defensive points played.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_conversion_rate",
    label: "Conversion rate",
    description: "Defensive points won, out of defensive points where at least one possession turnover occurred.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_clean_conversion_rate",
    label: "Clean conversion rate",
    description: "Defensive points won without us committing a turnover, out of defensive points where at least one possession turnover occurred.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
  {
    id: "defense_pull_inbound_rate",
    label: "Pull inbound rate",
    description: "Tracked pulls that stayed inbound, out of all tracked pulls.",
    unit: "percentage",
    group: "defense",
    format: "percentage",
    higher_is_better: true,
  },
];

const TEAM_EVOLUTION_PRESETS: TeamEvolutionResponse["presets"] = [
  {
    id: "turnover_battle",
    label: "Turnover battle",
    metric_ids: ["total_our_turnovers", "total_opponent_turnovers"],
  },
];

function calculateRate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function normalizeNumberIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((left, right) => left - right);
}

function buildTeamEvolutionMetricsForPoints(data: MockStatisticsData, gamePoints: PointWithPlayers[]): Record<string, number> {
  let offenseStarted = 0;
  let offenseWon = 0;
  let offenseLost = 0;
  let offenseWonNoTurnover = 0;
  let offenseOurTurnovers = 0;
  let offenseOpponentTurnovers = 0;
  let defenseStarted = 0;
  let defenseWon = 0;
  let defenseLost = 0;
  let defensePointsWithTurnover = 0;
  let defenseWonNoTurnover = 0;
  let defenseOurTurnovers = 0;
  let defenseOpponentTurnovers = 0;
  let totalPulls = 0;
  let inboundPulls = 0;

  for (const point of gamePoints) {
    const pointTurnovers = data.turnovers
      .filter((turnover) => turnover.point_id === point.id)
      .slice()
      .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
    const turnoverCounts = countTurnoversByPossession(point.starting_on_offense, pointTurnovers);
    const totalTurnovers = turnoverCounts.ourTurnovers + turnoverCounts.opponentTurnovers;

    if (point.starting_on_offense) {
      offenseStarted += 1;
      offenseOurTurnovers += turnoverCounts.ourTurnovers;
      offenseOpponentTurnovers += turnoverCounts.opponentTurnovers;
      if (point.won) {
        offenseWon += 1;
        if (turnoverCounts.ourTurnovers === 0) {
          offenseWonNoTurnover += 1;
        }
      } else {
        offenseLost += 1;
      }
      continue;
    }

    defenseStarted += 1;
    defenseOurTurnovers += turnoverCounts.ourTurnovers;
    defenseOpponentTurnovers += turnoverCounts.opponentTurnovers;
    if (totalTurnovers > 0) {
      defensePointsWithTurnover += 1;
    }
    if (point.pull !== null && point.pull !== undefined) {
      totalPulls += 1;
      if (point.pull) {
        inboundPulls += 1;
      }
    }
    if (point.won) {
      defenseWon += 1;
      if (turnoverCounts.ourTurnovers === 0) {
        defenseWonNoTurnover += 1;
      }
    } else {
      defenseLost += 1;
    }
  }

  return {
    total_our_turnovers: offenseOurTurnovers + defenseOurTurnovers,
    total_opponent_turnovers: offenseOpponentTurnovers + defenseOpponentTurnovers,
    offense_our_turnovers: offenseOurTurnovers,
    defense_our_turnovers: defenseOurTurnovers,
    defense_opponent_turnovers: defenseOpponentTurnovers,
    points_won: offenseWon + defenseWon,
    points_lost: offenseLost + defenseLost,
    holds: offenseWon,
    breaks: defenseWon,
    offense_hold_rate: calculateRate(offenseWon, offenseStarted),
    offense_clean_hold_rate: calculateRate(offenseWonNoTurnover, offenseStarted),
    defense_turnover_rate: calculateRate(defensePointsWithTurnover, defenseStarted),
    defense_break_rate: calculateRate(defenseWon, defenseStarted),
    defense_clean_break_rate: calculateRate(defenseWonNoTurnover, defenseStarted),
    defense_conversion_rate: calculateRate(defenseWon, defensePointsWithTurnover),
    defense_clean_conversion_rate: calculateRate(defenseWonNoTurnover, defensePointsWithTurnover),
    defense_pull_inbound_rate: calculateRate(inboundPulls, totalPulls),
  };
}

export function buildTeamEvolutionResponse(
  data: MockStatisticsData,
  teamId: number,
  competitionIds: number[],
  gameIds: number[],
  requiredPlayerIds: number[]
): TeamEvolutionResponse {
  const normalizedCompetitionIds = normalizeNumberIds(competitionIds);
  const normalizedGameIds = normalizeNumberIds(gameIds);
  const normalizedPlayerIds = normalizeNumberIds(requiredPlayerIds);
  const scopedGames = getScopedTeamGames(data, teamId, normalizedCompetitionIds, normalizedGameIds)
    .slice()
    .sort((left, right) => {
      const leftDate = left.date ? new Date(left.date).getTime() : 0;
      const rightDate = right.date ? new Date(right.date).getTime() : 0;
      return leftDate - rightDate || left.id - right.id;
    });

  let omittedGamesCount = 0;
  const evolutionGames: TeamEvolutionResponse["games"] = [];
  for (const game of scopedGames) {
    const gamePoints = filterCompletedPointsByRequiredPlayers(data, [game], normalizedPlayerIds);
    if (gamePoints.length === 0) {
      omittedGamesCount += 1;
      continue;
    }

    const competition = data.competitions.find((entry) => entry.id === game.competition_id);
    const metrics = buildTeamEvolutionMetricsForPoints(data, gamePoints);
    evolutionGames.push({
      game_id: game.id,
      competition_id: game.competition_id,
      competition_name: competition?.name ?? "",
      opponent_name: game.opponent_name,
      date: game.date ?? game.created_at,
      our_score: metrics.points_won,
      opponent_score: metrics.points_lost,
      completed_points: gamePoints.length,
      metrics,
    });
  }

  return {
    team_id: teamId,
    filters: {
      competition_ids: normalizedCompetitionIds,
      game_ids: normalizedGameIds,
      player_ids: normalizedPlayerIds,
    },
    default_preset_id: "turnover_battle",
    omitted_games_count: omittedGamesCount,
    metrics: TEAM_EVOLUTION_METRICS,
    presets: TEAM_EVOLUTION_PRESETS,
    games: evolutionGames,
  };
}
