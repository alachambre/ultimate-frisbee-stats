import { describe, expect, it } from "vitest";
import type { Player, PointStatus, PointWithPlayers } from "../../types";
import {
  countPlayersByGender,
  countSelectedPlayersByGender,
  getRequiredGenderRatioForPoint,
  hasValidPointPlayerComposition,
  hasValidPointSelection,
  isValidMixity,
  matchesRequiredGenderRatio,
} from "../playerComposition";

const BASE_PLAYER_FIELDS = {
  team_id: 1,
  created_at: "2024-01-01T00:00:00Z",
} as const;

const createPlayer = (id: number, gender: Player["gender"]): Player => ({
  id,
  name: `Player ${id}`,
  number: id,
  gender,
  ...BASE_PLAYER_FIELDS,
});

const fourMenThreeWomen = [
  createPlayer(1, "M"),
  createPlayer(2, "M"),
  createPlayer(3, "M"),
  createPlayer(4, "M"),
  createPlayer(5, "W"),
  createPlayer(6, "W"),
  createPlayer(7, "W"),
];

const threeMenFourWomen = [
  createPlayer(8, "M"),
  createPlayer(9, "M"),
  createPlayer(10, "M"),
  createPlayer(11, "W"),
  createPlayer(12, "W"),
  createPlayer(13, "W"),
  createPlayer(14, "W"),
];

const createPoint = (
  pointNumber: number,
  status: PointStatus,
  players: Player[]
): PointWithPlayers => ({
  id: pointNumber,
  game_id: 1,
  point_number: pointNumber,
  starting_on_offense: true,
  field_side: null,
  pull: null,
  comments: null,
  won: status === "completed" ? true : null,
  status,
  strategy_id: null,
  start_datetime: null,
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  players,
  strategy: null,
  duration_seconds: null,
});

describe("playerComposition utils", () => {
  it("counts players by gender", () => {
    const counts = countPlayersByGender(fourMenThreeWomen);
    expect(counts).toEqual({ men: 4, women: 3, total: 7 });
  });

  it("counts selected ids by gender", () => {
    const players = [createPlayer(1, "M"), createPlayer(2, "W"), createPlayer(3, "M")];
    const counts = countSelectedPlayersByGender([1, 2], players);
    expect(counts).toEqual({ men: 1, women: 1, total: 2 });
  });

  it("validates mixity and required ratio", () => {
    expect(isValidMixity({ men: 4, women: 3 })).toBe(true);
    expect(isValidMixity({ men: 2, women: 5 })).toBe(false);

    expect(
      matchesRequiredGenderRatio({ men: 4, women: 3 }, { men: 4, women: 3 })
    ).toBe(true);
    expect(
      matchesRequiredGenderRatio({ men: 4, women: 3 }, { men: 3, women: 4 })
    ).toBe(false);
  });

  it("validates point selection with and without required ratio", () => {
    expect(hasValidPointSelection(
      fourMenThreeWomen.map((player) => player.id),
      fourMenThreeWomen,
      null
    )).toBe(true);

    expect(hasValidPointSelection(
      fourMenThreeWomen.map((player) => player.id),
      fourMenThreeWomen,
      { men: 3, women: 4 }
    )).toBe(false);
  });

  it("derives ABBA required ratio from first completed point", () => {
    const points = [
      createPoint(1, "completed", fourMenThreeWomen),
      createPoint(2, "completed", threeMenFourWomen),
    ];

    expect(getRequiredGenderRatioForPoint(1, points)).toEqual({ men: 4, women: 3 });
    expect(getRequiredGenderRatioForPoint(2, points)).toEqual({ men: 3, women: 4 });
    expect(getRequiredGenderRatioForPoint(3, points)).toEqual({ men: 3, women: 4 });
    expect(getRequiredGenderRatioForPoint(4, points)).toEqual({ men: 4, women: 3 });
  });

  it("returns null required ratio when no completed points exist", () => {
    const points = [createPoint(1, "ready", fourMenThreeWomen)];
    expect(getRequiredGenderRatioForPoint(1, points)).toBeNull();
  });

  it("validates full point composition against ABBA ratio", () => {
    const gamePoints = [createPoint(1, "completed", fourMenThreeWomen)];

    const pointTwoValid = createPoint(2, "running", threeMenFourWomen);
    const pointTwoInvalid = createPoint(2, "running", fourMenThreeWomen);

    expect(hasValidPointPlayerComposition(pointTwoValid, gamePoints)).toBe(true);
    expect(hasValidPointPlayerComposition(pointTwoInvalid, gamePoints)).toBe(false);
    expect(hasValidPointPlayerComposition(null, gamePoints)).toBe(false);
  });
});
