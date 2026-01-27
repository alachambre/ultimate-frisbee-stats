import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import PlayerForm from "../PlayerForm";

describe("PlayerForm", () => {
  it("displays all form fields", () => {
    render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="M"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
      />
    );

    expect(screen.getByText("Gender")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(screen.getByLabelText(/player name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jersey number/i)).toBeInTheDocument();
  });

  it("shows correct gender selected", () => {
    const { rerender } = render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="M"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    const manButton = buttons.find(btn => btn.getAttribute("value") === "M");
    const womanButton = buttons.find(btn => btn.getAttribute("value") === "W");

    expect(manButton).toHaveAttribute("aria-pressed", "true");
    expect(womanButton).toHaveAttribute("aria-pressed", "false");

    rerender(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="W"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
      />
    );

    const buttonsAfter = screen.getAllByRole("button");
    const manButtonAfter = buttonsAfter.find(btn => btn.getAttribute("value") === "M");
    const womanButtonAfter = buttonsAfter.find(btn => btn.getAttribute("value") === "W");

    expect(manButtonAfter).toHaveAttribute("aria-pressed", "false");
    expect(womanButtonAfter).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onGenderChange when gender is toggled", async () => {
    const user = userEvent.setup();
    const onGenderChange = vi.fn();

    render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="M"
        onGenderChange={onGenderChange}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
      />
    );

    const womanButton = screen.getByRole("button", { name: /woman/i });
    await user.click(womanButton);

    expect(onGenderChange).toHaveBeenCalledWith("W");
  });

  it("calls onPlayerNameChange when name is typed", async () => {
    const user = userEvent.setup();
    const onPlayerNameChange = vi.fn();

    render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={onPlayerNameChange}
        gender="M"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    await user.type(nameInput, "John");

    expect(onPlayerNameChange).toHaveBeenCalledTimes(4); // Called for each letter
  });

  it("calls onPlayerNumberChange when number is typed", async () => {
    const user = userEvent.setup();
    const onPlayerNumberChange = vi.fn();

    render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="M"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={onPlayerNumberChange}
      />
    );

    const numberInput = screen.getByLabelText(/jersey number/i);
    await user.type(numberInput, "42");

    expect(onPlayerNumberChange).toHaveBeenCalledTimes(2);
  });

  it("autofocuses name field when autoFocus is true", () => {
    render(
      <PlayerForm
        playerName=""
        onPlayerNameChange={vi.fn()}
        gender="M"
        onGenderChange={vi.fn()}
        playerNumber=""
        onPlayerNumberChange={vi.fn()}
        autoFocus={true}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    expect(nameInput).toHaveFocus();
  });

  it("displays current values in form fields", () => {
    render(
      <PlayerForm
        playerName="Alice"
        onPlayerNameChange={vi.fn()}
        gender="W"
        onGenderChange={vi.fn()}
        playerNumber="99"
        onPlayerNumberChange={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i) as HTMLInputElement;
    const numberInput = screen.getByLabelText(/jersey number/i) as HTMLInputElement;

    expect(nameInput.value).toBe("Alice");
    expect(numberInput.value).toBe("99");
  });
});
