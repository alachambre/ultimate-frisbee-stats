import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PointTimer from "./PointTimer";

describe("PointTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("displays elapsed time in MM:SS format", () => {
    // 2 minutes ago
    const startTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    render(<PointTimer startDatetime={startTime} />);

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("displays elapsed time in HH:MM:SS format for times over 1 hour", () => {
    // 1 hour, 30 minutes, 45 seconds ago
    const startTime = new Date(
      Date.now() - (1 * 60 * 60 + 30 * 60 + 45) * 1000
    ).toISOString();

    render(<PointTimer startDatetime={startTime} />);

    expect(screen.getByText("1:30:45")).toBeInTheDocument();
  });

  it("pads minutes and seconds with leading zeros", () => {
    // 5 seconds ago
    const startTime = new Date(Date.now() - 5 * 1000).toISOString();

    render(<PointTimer startDatetime={startTime} />);

    expect(screen.getByText("0:05")).toBeInTheDocument();
  });
});
