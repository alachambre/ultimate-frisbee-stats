import { render, screen } from "../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import PlayerCard from "./PlayerCard";
import type { Player } from "../../types";

const mockMalePlayer: Player = {
  id: 1,
  name: "John Doe",
  number: 42,
  gender: "M",
  team_id: 1,
  created_at: "2024-01-01T00:00:00Z",
};

const mockPlayerWithoutNumber: Player = {
  id: 3,
  name: "Alex Johnson",
  number: null,
  gender: "M",
  team_id: 1,
  created_at: "2024-01-01T00:00:00Z",
};

describe("PlayerCard", () => {
  it("displays player name", () => {
    render(<PlayerCard player={mockMalePlayer} onEdit={vi.fn()} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays player number when available", () => {
    render(<PlayerCard player={mockMalePlayer} onEdit={vi.fn()} />);

    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("does not display number when player has none", () => {
    render(<PlayerCard player={mockPlayerWithoutNumber} onEdit={vi.fn()} />);

    expect(screen.getByText("_")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<PlayerCard player={mockMalePlayer} onEdit={onEdit} />);

    const editButton = screen.getByRole("button", { name: /edit player/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("displays edit button with accessible label", () => {
    render(<PlayerCard player={mockMalePlayer} onEdit={vi.fn()} />);

    const editButton = screen.getByRole("button", { name: /edit player/i });
    expect(editButton).toBeInTheDocument();
  });

  it("calls onCardClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    render(<PlayerCard player={mockMalePlayer} onCardClick={onCardClick} />);

    const playerButton = screen.getByRole("button", { name: /open john doe/i });
    await user.click(playerButton);

    expect(onCardClick).toHaveBeenCalledTimes(1);
  });
});
