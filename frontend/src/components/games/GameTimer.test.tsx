import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GameTimer from "./GameTimer";

describe("GameTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("displays elapsed time in MM:SS format for ongoing game", () => {
    // 2 minutes ago
    const startTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    render(<GameTimer startDatetime={startTime} />);

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("displays elapsed time in HH:MM:SS format for times over 1 hour", () => {
    // 1 hour, 30 minutes, 45 seconds ago
    const startTime = new Date(
      Date.now() - (1 * 60 * 60 + 30 * 60 + 45) * 1000
    ).toISOString();

    render(<GameTimer startDatetime={startTime} />);

    expect(screen.getByText("1:30:45")).toBeInTheDocument();
  });

  it("pads minutes and seconds with leading zeros", () => {
    // 5 seconds ago
    const startTime = new Date(Date.now() - 5 * 1000).toISOString();

    render(<GameTimer startDatetime={startTime} />);

    expect(screen.getByText("0:05")).toBeInTheDocument();
  });

  it("displays frozen time when game has ended", () => {
    // Game started 10 minutes ago
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // Game ended 5 minutes ago (so total duration is 5 minutes)
    const endTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    render(<GameTimer startDatetime={startTime} endDatetime={endTime} />);

    // Should show 5 minutes (the duration between start and end)
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("does not update when game has ended", () => {
    // Game started 10 minutes ago, ended 5 minutes ago
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const endTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { rerender } = render(
      <GameTimer startDatetime={startTime} endDatetime={endTime} />
    );

    expect(screen.getByText("5:00")).toBeInTheDocument();

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    rerender(<GameTimer startDatetime={startTime} endDatetime={endTime} />);

    // Should still show 5:00 (frozen)
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });
});
