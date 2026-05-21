import { render, screen } from "../../../test/test-utils";
import type { GameWithScore } from "../../../types";
import NewGameCard from "../NewGameCard";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: 42,
    competition_id: 7,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status: "started",
    start_datetime: null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: 5,
    opponent_score: 4,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

describe("NewGameCard", () => {
  it("routes live games to the spectator view", () => {
    render(<NewGameCard game={buildGame()} />);

    expect(screen.getByRole("link", { name: /Blue Tigers/i })).toHaveAttribute(
      "href",
      "/live/42"
    );
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
  });

  it("routes completed games to the game detail route", () => {
    render(<NewGameCard game={buildGame({ status: "ended" })} />);

    expect(screen.getByRole("link", { name: /Blue Tigers/i })).toHaveAttribute(
      "href",
      "/games/42"
    );
    expect(screen.getByText("Review")).toBeInTheDocument();
  });
});
