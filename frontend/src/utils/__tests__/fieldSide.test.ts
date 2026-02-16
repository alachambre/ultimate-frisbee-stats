import { describe, expect, it } from "vitest";
import { inferNextFieldSide } from "../fieldSide";

describe("fieldSide inference", () => {
  it("returns null when point side is missing", () => {
    expect(
      inferNextFieldSide({
        field_side: null,
        starting_on_offense: true,
        won: true,
      })
    ).toBeNull();
  });

  it("switches side after an offensive hold", () => {
    expect(
      inferNextFieldSide({
        field_side: "table_left",
        starting_on_offense: true,
        won: true,
      })
    ).toBe("table_right");
  });

  it("switches side after an offensive loss", () => {
    expect(
      inferNextFieldSide({
        field_side: "table_left",
        starting_on_offense: true,
        won: false,
      })
    ).toBe("table_right");
  });

  it("switches side after a defensive break", () => {
    expect(
      inferNextFieldSide({
        field_side: "table_left",
        starting_on_offense: false,
        won: true,
      })
    ).toBe("table_right");
  });

  it("switches side after a defensive loss", () => {
    expect(
      inferNextFieldSide({
        field_side: "table_left",
        starting_on_offense: false,
        won: false,
      })
    ).toBe("table_right");
  });
});
