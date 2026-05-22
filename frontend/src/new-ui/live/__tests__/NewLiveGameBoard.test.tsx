import { render, screen } from "../../../test/test-utils";
import type { GameLiveState, GameWithScore, PointWithPlayers } from "../../../types";
import NewLiveGameBoard from "../NewLiveGameBoard";

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
    our_score: 5,
    opponent_score: 4,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

function buildPoint(
  overrides: Partial<PointWithPlayers> = {}
): PointWithPlayers {
  return {
    id: 20,
    game_id: 1,
    point_number: 12,
    starting_on_offense: true,
    field_side: null,
    pull: null,
    comments: null,
    won: null,
    status: "running",
    strategy_id: null,
    start_datetime: "2026-05-22T10:12:00Z",
    end_datetime: null,
    created_at: "2026-05-22T10:12:00Z",
    players: [],
    strategy: null,
    our_turnovers: 1,
    opponent_turnovers: 0,
    duration_seconds: null,
    ...overrides,
  };
}

function buildLiveState(
  overrides: Partial<GameLiveState> = {}
): GameLiveState {
  return {
    game_id: 1,
    status: "started",
    our_score: 7,
    opponent_score: 6,
    active_point: buildPoint(),
    active_point_turnovers: [
      {
        id: 1,
        point_id: 20,
        player_id: null,
        timestamp: "2026-05-22T10:13:00Z",
        comments: null,
        created_at: "2026-05-22T10:13:00Z",
        player: null,
      },
    ],
    active_point_stoppages: [
      {
        id: 1,
        point_id: 20,
        stoppage_type: "call",
        call_timestamp: "2026-05-22T10:14:00Z",
        resume_timestamp: null,
        comments: null,
        created_at: "2026-05-22T10:14:00Z",
      },
    ],
    ...overrides,
  };
}

describe("NewLiveGameBoard", () => {
  it("shows spectator-focused live game state", () => {
    render(<NewLiveGameBoard game={buildGame()} liveState={buildLiveState()} />);

    expect(
      screen.getByRole("heading", { name: "Blue Tigers" })
    ).toBeInTheDocument();
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getByText("7 - 6")).toBeInTheDocument();
    expect(screen.getByText("Point 12")).toBeInTheDocument();
    expect(screen.getByText("Starting on offense")).toBeInTheDocument();
    expect(screen.getByText("Turnovers")).toBeInTheDocument();
    expect(screen.getByText("Stoppages")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a between-points state when no point is active", () => {
    render(
      <NewLiveGameBoard
        game={buildGame()}
        liveState={buildLiveState({
          active_point: null,
          active_point_turnovers: [],
          active_point_stoppages: [],
        })}
      />
    );

    expect(screen.getByText("Waiting for the next point")).toBeInTheDocument();
  });
});
