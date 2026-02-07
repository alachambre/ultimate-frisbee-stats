import { render, screen } from "../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import PlayerSelector from "./PlayerSelector";
import type { Player } from "../../types";

const mockPlayers: Player[] = [
  { id: 1, name: "Player 1", number: 10, gender: "M", team_id: 1, created_at: "2024-01-01" },
  { id: 2, name: "Player 2", number: 20, gender: "M", team_id: 1, created_at: "2024-01-01" },
  { id: 3, name: "Player 3", number: null, gender: "M", team_id: 1, created_at: "2024-01-01" },
];

describe("PlayerSelector", () => {
  it("renders all players with cards", () => {
    const onChange = vi.fn();
    render(
      <PlayerSelector players={mockPlayers} selectedIds={[]} onChange={onChange} />
    );

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });

  it("shows checked state for selected players", () => {
    const onChange = vi.fn();
    render(
      <PlayerSelector players={mockPlayers} selectedIds={[1, 3]} onChange={onChange} />
    );

    expect(screen.getByRole("button", { name: "Player 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Player 2" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Player 3" })).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange when player is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PlayerSelector players={mockPlayers} selectedIds={[]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "Player 1" }));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("calls onChange when player is deselected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PlayerSelector players={mockPlayers} selectedIds={[1, 2]} onChange={onChange} />
    );

    await user.click(screen.getByRole("button", { name: "Player 1" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("shows validation message when required and not 7 players", () => {
    const onChange = vi.fn();
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedIds={[1, 2]}
        onChange={onChange}
        required={true}
        error={true}
      />
    );

    expect(screen.getByText("You must select exactly 7 players")).toBeInTheDocument();
  });

  it("displays custom helper text", () => {
    const onChange = vi.fn();
    render(
      <PlayerSelector
        players={mockPlayers}
        selectedIds={[]}
        onChange={onChange}
        helperText="Custom helper text"
      />
    );

    expect(screen.getByText("Custom helper text")).toBeInTheDocument();
  });
});
