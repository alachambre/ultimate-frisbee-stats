import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "../../../test/test-utils";
import PlayerStatistics from "../PlayerStatistics";
import type { PlayerGameStats } from "../../../types";

const baseStats: PlayerGameStats[] = [
  {
    player_id: 1,
    player_name: "Alex Martin",
    player_number: 12,
    points_played: 7,
    effective_time_seconds: 615,
    offense: {
      points_played: 4,
      points_won: 3,
      points_lost: 1,
      hold_rate: 0.75,
      points_won_no_turnover: 2,
      clean_hold_rate: 0.5,
    },
    defense: {
      points_played: 3,
      points_won: 2,
      points_lost: 1,
      break_rate: 2 / 3,
      points_with_turnover: 2,
      turnover_rate: 2 / 3,
      conversion_rate: 1,
      points_won_no_turnover: 1,
      clean_break_rate: 1 / 3,
      clean_conversion_rate: 0.5,
      points_lost_no_turnover: 0,
    },
  },
  {
    player_id: 2,
    player_name: "Sam Leroy",
    player_number: 8,
    points_played: 6,
    effective_time_seconds: 540,
    offense: {
      points_played: 2,
      points_won: 1,
      points_lost: 1,
      hold_rate: 0.5,
      points_won_no_turnover: 1,
      clean_hold_rate: 0.5,
    },
    defense: {
      points_played: 4,
      points_won: 1,
      points_lost: 3,
      break_rate: 0.25,
      points_with_turnover: 1,
      turnover_rate: 0.25,
      conversion_rate: 1,
      points_won_no_turnover: 0,
      clean_break_rate: 0,
      clean_conversion_rate: 0,
      points_lost_no_turnover: 2,
    },
  },
];

const originalMatchMedia = window.matchMedia;

function mockMobileMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("PlayerStatistics", () => {
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("renders the All tab and combined desktop columns", async () => {
    const user = userEvent.setup();

    render(<PlayerStatistics playerStats={baseStats} />);

    await user.click(screen.getByRole("tab", { name: "All" }));

    expect(
      screen.getByRole("button", { name: "Number of completed offensive points played" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Percentage of offensive points won (holds)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Number of completed defensive points played" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Percentage of defensive points where at least one turnover occurred" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Percentage of defensive points won (breaks)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Percentage of defensive points won without our turnovers" })
    ).toBeInTheDocument();
  });

  it("shows offense and defense stats together on mobile cards in the All tab", async () => {
    mockMobileMatchMedia();
    const user = userEvent.setup();

    render(<PlayerStatistics playerStats={baseStats} />);

    await user.click(screen.getByRole("tab", { name: "All" }));

    const alexCardRoot = screen.getByText("Alex Martin").closest(".MuiCard-root");
    expect(alexCardRoot).not.toBeNull();

    const alexCard = within(alexCardRoot as HTMLElement);
    expect(alexCard.getByText("O Points")).toBeInTheDocument();
    expect(alexCard.getByText("D Points")).toBeInTheDocument();
    expect(alexCard.getByText("Hold")).toBeInTheDocument();
    expect(alexCard.getByText("Turnover")).toBeInTheDocument();
    expect(alexCard.getByText("Break")).toBeInTheDocument();
    expect(alexCard.getByText("Clean Break")).toBeInTheDocument();
    expect(alexCard.getByText("4")).toBeInTheDocument();
    expect(alexCard.getByText("3")).toBeInTheDocument();
    expect(alexCard.getAllByText("2 (67%)")).toHaveLength(2);
  });
});
