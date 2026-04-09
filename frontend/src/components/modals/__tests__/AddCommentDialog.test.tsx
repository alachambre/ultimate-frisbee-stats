import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen } from "../../../test/test-utils";
import AddCommentDialog from "../AddCommentDialog";
import type { PointWithPlayers, Player } from "../../../types";

const mockPlayers: Player[] = [
  {
    id: 1,
    name: "Alice",
    number: 10,
    gender: "W",
    team_id: 1,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Bob",
    number: 20,
    gender: "M",
    team_id: 1,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const pointWithComment: PointWithPlayers = {
  id: 12,
  game_id: 5,
  point_number: 3,
  starting_on_offense: true,
  won: null,
  status: "running",
  start_datetime: "2024-01-15T10:05:00Z",
  end_datetime: null,
  created_at: "2024-01-15T10:05:00Z",
  comments: "Existing sideline note",
  players: mockPlayers,
};

describe("AddCommentDialog", () => {
  it("restores the saved point comment when closed without saving", async () => {
    const user = userEvent.setup();

    render(
      <AddCommentDialog
        open
        onClose={vi.fn()}
        point={pointWithComment}
        gameId={pointWithComment.game_id}
      />
    );

    const commentField = screen.getByPlaceholderText(/enter your comment/i);
    expect(commentField).toHaveValue("Existing sideline note");

    await user.clear(commentField);
    await user.type(commentField, "Temporary draft");
    expect(commentField).toHaveValue("Temporary draft");

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(commentField).toHaveValue("Existing sideline note");
  });

  it("reinitializes when the same point receives a new saved comment", () => {
    const updatedPoint: PointWithPlayers = {
      ...pointWithComment,
      comments: "Updated saved note",
    };

    const { rerender } = render(
      <AddCommentDialog
        key={`comment-${pointWithComment.id}-${pointWithComment.comments ?? "empty"}`}
        open
        onClose={vi.fn()}
        point={pointWithComment}
        gameId={pointWithComment.game_id}
      />
    );

    expect(screen.getByPlaceholderText(/enter your comment/i)).toHaveValue("Existing sideline note");

    rerender(
      <AddCommentDialog
        key={`comment-${updatedPoint.id}-${updatedPoint.comments ?? "empty"}`}
        open
        onClose={vi.fn()}
        point={updatedPoint}
        gameId={updatedPoint.game_id}
      />
    );

    expect(screen.getByPlaceholderText(/enter your comment/i)).toHaveValue("Updated saved note");
  });
});
