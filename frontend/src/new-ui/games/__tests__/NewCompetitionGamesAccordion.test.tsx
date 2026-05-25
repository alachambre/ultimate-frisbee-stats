import { render, screen } from "../../../test/test-utils";
import type { GameWithScore } from "../../../types";
import type { NewGamesCompetitionGroup } from "../buildNewGamesDashboard";
import NewCompetitionGamesAccordion from "../NewCompetitionGamesAccordion";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: overrides.id ?? 1,
    competition_id: 10,
    opponent_name: overrides.opponent_name ?? "Blue Tigers",
    date: overrides.date ?? "2026-05-22T10:00:00Z",
    comments: null,
    status: overrides.status ?? "ready",
    start_datetime: null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: overrides.our_score ?? 0,
    opponent_score: overrides.opponent_score ?? 0,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
  };
}

function renderAccordion(groupOverrides: Partial<NewGamesCompetitionGroup> = {}) {
  const games =
    groupOverrides.games ?? [
      buildGame({ id: 1, opponent_name: "Blue Tigers" }),
      buildGame({ id: 2, opponent_name: "Red Hawks" }),
      buildGame({ id: 3, opponent_name: "Green Foxes" }),
    ];
  const group: NewGamesCompetitionGroup = {
    competitionId: 10,
    competitionName: "Spring Cup",
    competition: null,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    nextRelevantDate: "2026-05-22T10:00:00Z",
    mostRecentDate: null,
    isInitiallyExpanded: true,
    games,
    summary: {
      live: 0,
      upcoming: games.length,
      completed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    },
    ...groupOverrides,
  };

  render(
    <NewCompetitionGamesAccordion
      formatDate={(value) => value ?? "No date"}
      group={group}
      labels={{
        completed: "Completed",
        editCompetition: "Edit competition",
        editCompetitionAria: "Edit Spring Cup competition",
        emptyCompetition: "No games in this competition yet.",
        live: "Live",
        manageRoster: "Manage roster",
        manageRosterAria: "Manage Spring Cup roster",
        results: "Results",
        upcoming: "Upcoming",
      }}
    />
  );
}

describe("NewCompetitionGamesAccordion", () => {
  it("renders light separators between flat game rows", () => {
    renderAccordion();

    expect(screen.getAllByTestId("competition-game-row-divider")).toHaveLength(
      2
    );
  });
});
