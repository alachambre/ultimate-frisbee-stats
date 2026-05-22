import type { GameWithScore } from "../../../types";
import { buildNewLiveGamesView } from "../buildNewLiveGamesView";

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
    our_score: 0,
    opponent_score: 0,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

describe("buildNewLiveGamesView", () => {
  it("keeps started games only and sorts them by scheduled date", () => {
    const view = buildNewLiveGamesView({
      games: [
        buildGame({ id: 1, date: "2026-05-22T12:00:00Z" }),
        buildGame({ id: 2, date: "2026-05-22T09:00:00Z" }),
        buildGame({ id: 3, status: "ready" }),
        buildGame({ id: 4, status: "ended" }),
      ],
    });

    expect(view.liveGames.map((game) => game.id)).toEqual([2, 1]);
    expect(view.selectedGame?.id).toBe(2);
  });

  it("selects the requested game when it is currently live", () => {
    const view = buildNewLiveGamesView({
      games: [buildGame({ id: 1 }), buildGame({ id: 2 })],
      selectedGameId: 2,
    });

    expect(view.selectedGame?.id).toBe(2);
  });

  it("does not select another game when the requested game is not live", () => {
    const view = buildNewLiveGamesView({
      games: [
        buildGame({ id: 1, status: "started" }),
        buildGame({ id: 2, status: "ended" }),
      ],
      selectedGameId: 2,
    });

    expect(view.liveGames.map((game) => game.id)).toEqual([1]);
    expect(view.selectedGame).toBeNull();
  });
});
