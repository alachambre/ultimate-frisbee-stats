import {
  mergeStatisticsSelection,
  parseStatisticsId,
  parseStatisticsSelection,
  serializeStatisticsSelection,
  type StatisticsSelection,
} from "../statisticsSelection";

describe("statisticsSelection", () => {
  it("parses optional numeric ids", () => {
    expect(parseStatisticsId("42")).toBe(42);
    expect(parseStatisticsId("invalid")).toBeUndefined();
    expect(parseStatisticsId(null)).toBeUndefined();
  });

  it("parses current URL params and normalizes repeated or invalid ids", () => {
    const params = new URLSearchParams({
      teamId: "7",
      competitionIds: "4,2,invalid,4",
      competitionId: "99",
      gameIds: "8,6,8",
      gameId: "99",
      playerIds: "3,1,invalid,3",
      playerId: "99",
    });

    expect(parseStatisticsSelection(params)).toEqual({
      teamId: 7,
      competitionIds: [2, 4],
      gameIds: [6, 8],
      playerIds: [1, 3],
    });
  });

  it("falls back to legacy single-value params when list params are absent", () => {
    const params = new URLSearchParams({
      competitionId: "12",
      gameId: "34",
      playerId: "56",
    });

    expect(parseStatisticsSelection(params)).toEqual({
      teamId: undefined,
      competitionIds: [12],
      gameIds: [34],
      playerIds: [56],
    });
  });

  it("serializes selection into canonical current URL params", () => {
    const params = serializeStatisticsSelection({
      teamId: 7,
      competitionIds: [2, 4],
      gameIds: [6, 8],
      playerIds: [3],
    });

    expect(params.get("teamId")).toBe("7");
    expect(params.get("competitionIds")).toBe("2,4");
    expect(params.get("gameIds")).toBe("6,8");
    expect(params.get("playerIds")).toBe("3");
    expect(params.get("playerId")).toBe("3");
    expect(params.has("competitionId")).toBe(false);
    expect(params.has("gameId")).toBe(false);
  });

  it("normalizes merged selections and clears scoped filters without a team", () => {
    const current: StatisticsSelection = {
      teamId: 7,
      competitionIds: [4],
      gameIds: [6],
      playerIds: [3],
    };

    expect(
      mergeStatisticsSelection(current, {
        competitionIds: [2, 4, 2],
        gameIds: [8, 6],
        playerIds: [1, 3, 1],
      })
    ).toEqual({
      teamId: 7,
      competitionIds: [2, 4],
      gameIds: [6, 8],
      playerIds: [1, 3],
    });

    expect(mergeStatisticsSelection(current, { teamId: undefined })).toEqual({
      teamId: undefined,
      competitionIds: [],
      gameIds: [],
      playerIds: [],
    });
  });
});
