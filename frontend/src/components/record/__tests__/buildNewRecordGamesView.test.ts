import type { Competition, GameWithScore } from "../../../types";
import { buildNewRecordGamesView } from "../buildNewRecordGamesView";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: 1,
    competition_id: 10,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status: "started",
    start_datetime: "2026-05-22T10:00:00Z",
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: 3,
    opponent_score: 2,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

function buildCompetition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: 10,
    team_id: 1,
    name: "Spring Cup",
    description: null,
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    status: "ongoing",
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildNewRecordGamesView", () => {
  it("splits started and ready games for the selected team", () => {
    const view = buildNewRecordGamesView({
      games: [
        buildGame({ id: 1, competition_id: 10, status: "started" }),
        buildGame({ id: 2, competition_id: 10, status: "ready" }),
        buildGame({ id: 3, competition_id: 10, status: "ended" }),
        buildGame({ id: 4, competition_id: 99, status: "started" }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [buildCompetition({ id: 10, team_id: 1 })],
    });

    expect(view.startedGames.map((game) => game.id)).toEqual([1]);
    expect(view.readyGames.map((game) => game.id)).toEqual([2]);
    expect(view.allRecordableGames.map((game) => game.id)).toEqual([1, 2]);
  });

  it("keeps public/all-team games when no team is selected", () => {
    const view = buildNewRecordGamesView({
      games: [
        buildGame({ id: 1, status: "started" }),
        buildGame({ id: 2, status: "ready" }),
        buildGame({ id: 3, status: "ended" }),
      ],
    });

    expect(view.allRecordableGames.map((game) => game.id)).toEqual([1, 2]);
  });
});
