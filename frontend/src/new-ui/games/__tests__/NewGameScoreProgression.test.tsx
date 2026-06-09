import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test/test-utils";
import type { GamePointTimeline } from "../../../types";
import NewGameScoreProgression from "../NewGameScoreProgression";

function getChartDatasets() {
  const rawDatasets =
    screen.getByTestId("chartjs-line").getAttribute("data-chart-datasets") ??
    "[]";

  return JSON.parse(rawDatasets) as Array<{
    dataCount: number;
    label: string;
    pointBackgroundColor: unknown;
    pointBorderColor: unknown;
    pointBorderWidth: unknown;
    pointRadius: unknown;
    pointStyle: unknown;
  }>;
}

const timelineWithSpecialPoint: GamePointTimeline = {
  game_id: 1,
  halftime_after_point_number: null,
  key_moments: [
    {
      id: "universe_point-3",
      type: "universe_point",
      primary_point_id: 3,
      point_ids: [3],
      importance: 100,
      reasons: ["game_clinch", "tight_score"],
    },
  ],
  points: [
    {
      point_id: 1,
      point_number: 1,
      starting_on_offense: true,
      won: true,
      field_side: null,
      duration_seconds: 40,
      our_turnovers: 0,
      opponent_turnovers: 0,
      our_score_after: 1,
      opponent_score_after: 0,
      markers: [],
    },
    {
      point_id: 2,
      point_number: 2,
      starting_on_offense: false,
      won: false,
      field_side: null,
      duration_seconds: 60,
      our_turnovers: 0,
      opponent_turnovers: 0,
      our_score_after: 1,
      opponent_score_after: 1,
      markers: [],
    },
    {
      point_id: 3,
      point_number: 3,
      starting_on_offense: true,
      won: true,
      field_side: null,
      duration_seconds: 70,
      our_turnovers: 1,
      opponent_turnovers: 0,
      our_score_after: 2,
      opponent_score_after: 1,
      markers: [],
    },
  ],
};

describe("NewGameScoreProgression", () => {
  it("draws Galaxy/Universe markers from key moments even when point markers are missing", () => {
    render(
      <NewGameScoreProgression
        opponentName="Opponent"
        teamName="Monkey"
        timeline={timelineWithSpecialPoint}
      />,
    );

    expect(screen.getByText("Galaxy/Universe point")).toBeInTheDocument();

    const specialDataset = getChartDatasets().find(
      (dataset) => dataset.label === "Galaxy/Universe point",
    );
    expect(specialDataset).toMatchObject({
      dataCount: 1,
      pointRadius: 6,
      pointStyle: "circle",
    });
  });

  it("draws selected points as an outline so the special marker remains visible", () => {
    render(
      <NewGameScoreProgression
        opponentName="Opponent"
        selectedPointId={3}
        teamName="Monkey"
        timeline={timelineWithSpecialPoint}
      />,
    );

    const selectedDataset = getChartDatasets().find(
      (dataset) => dataset.label === "Selected point",
    );
    const selectedDatasetIndex = getChartDatasets().findIndex(
      (dataset) => dataset.label === "Selected point",
    );
    const specialDatasetIndex = getChartDatasets().findIndex(
      (dataset) => dataset.label === "Galaxy/Universe point",
    );

    expect(selectedDataset).toMatchObject({
      dataCount: 1,
      pointBackgroundColor: "transparent",
      pointBorderWidth: 3,
      pointRadius: 10,
    });
    expect(selectedDatasetIndex).toBeLessThan(specialDatasetIndex);
  });
});
