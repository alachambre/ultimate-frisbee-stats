import { describe, expect, it } from "vitest";
import {
  dateTimeLocalInputValueToUtcIso,
  toDateTimeLocalInputValue,
} from "../dateTimeLocal";

describe("dateTimeLocal helpers", () => {
  it("formats a UTC ISO value for a browser-local datetime input", () => {
    const localDate = new Date(2026, 3, 9, 10, 30);

    expect(toDateTimeLocalInputValue(localDate.toISOString())).toBe(
      "2026-04-09T10:30"
    );
  });

  it("converts a browser-local datetime input value to UTC ISO", () => {
    expect(dateTimeLocalInputValueToUtcIso("2026-04-09T10:30")).toBe(
      new Date(2026, 3, 9, 10, 30).toISOString()
    );
  });

  it("returns null for an empty datetime input value", () => {
    expect(dateTimeLocalInputValueToUtcIso("")).toBeNull();
  });

  it("returns null for an invalid datetime input value", () => {
    expect(dateTimeLocalInputValueToUtcIso("2026-02-31T10:30")).toBeNull();
  });
});
