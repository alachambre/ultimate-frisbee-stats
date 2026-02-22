import { describe, expect, it } from "vitest";
import { render, screen } from "../../../test/test-utils";
import CircularStat from "../CircularStat";

describe("CircularStat", () => {
  it("shows a placeholder instead of 0% when denominator is zero", () => {
    render(
      <CircularStat
        label="Hold"
        percentage={0}
        count={0}
        total={0}
        color={(theme) => theme.colors.offense.main}
      />
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getByText("0/0")).toBeInTheDocument();
  });

  it("shows percentage normally when denominator is non-zero", () => {
    render(
      <CircularStat
        label="Hold"
        percentage={0.5}
        count={1}
        total={2}
        color={(theme) => theme.colors.offense.main}
      />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});
