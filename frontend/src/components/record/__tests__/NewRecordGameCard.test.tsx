import { render, screen } from "../../../test/test-utils";
import type { GameWithScore } from "../../../types";
import NewRecordGameCard from "../NewRecordGameCard";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: 42,
    competition_id: 10,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status: "started",
    start_datetime: "2026-05-22T10:00:00Z",
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: 5,
    opponent_score: 4,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

describe("NewRecordGameCard", () => {
  it("routes started games to the record flow with a continue action", () => {
    render(<NewRecordGameCard game={buildGame()} />);

    expect(screen.getByRole("link", { name: /Blue Tigers/i })).toHaveAttribute(
      "href",
      "/record/42"
    );
    expect(screen.getByText("Continue recording")).toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
  });

  it("routes ready games to the record flow with a prepare action", () => {
    render(<NewRecordGameCard game={buildGame({ status: "ready" })} />);

    expect(screen.getByRole("link", { name: /Blue Tigers/i })).toHaveAttribute(
      "href",
      "/record/42"
    );
    expect(screen.getByText("Prepare game")).toBeInTheDocument();
  });
});
