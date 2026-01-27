import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import StrategyForm from "../StrategyForm";

describe("StrategyForm", () => {
  it("displays all form fields", () => {
    render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category=""
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
      />
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(screen.getByLabelText(/strategy name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("shows correct category selected", () => {
    const { rerender } = render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category="offense"
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    const offenseButton = buttons.find(btn => btn.getAttribute("value") === "offense");
    const defenseButton = buttons.find(btn => btn.getAttribute("value") === "defense");

    expect(offenseButton).toHaveAttribute("aria-pressed", "true");
    expect(defenseButton).toHaveAttribute("aria-pressed", "false");

    rerender(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category="defense"
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
      />
    );

    const buttonsAfter = screen.getAllByRole("button");
    const offenseButtonAfter = buttonsAfter.find(btn => btn.getAttribute("value") === "offense");
    const defenseButtonAfter = buttonsAfter.find(btn => btn.getAttribute("value") === "defense");

    expect(offenseButtonAfter).toHaveAttribute("aria-pressed", "false");
    expect(defenseButtonAfter).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onCategoryChange when category is toggled", async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();

    render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category="offense"
        onCategoryChange={onCategoryChange}
        description=""
        onDescriptionChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    const defenseButton = buttons.find(btn => btn.getAttribute("value") === "defense");
    await user.click(defenseButton!);

    expect(onCategoryChange).toHaveBeenCalledWith("defense");
  });

  it("calls onStrategyNameChange when name is typed", async () => {
    const user = userEvent.setup();
    const onStrategyNameChange = vi.fn();

    render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={onStrategyNameChange}
        category="offense"
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Test");

    expect(onStrategyNameChange).toHaveBeenCalledTimes(4); // Called for each letter
  });

  it("calls onDescriptionChange when description is typed", async () => {
    const user = userEvent.setup();
    const onDescriptionChange = vi.fn();

    render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category="offense"
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={onDescriptionChange}
      />
    );

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Test description");

    expect(onDescriptionChange).toHaveBeenCalled();
  });

  it("autofocuses name field when autoFocus is true", () => {
    render(
      <StrategyForm
        strategyName=""
        onStrategyNameChange={vi.fn()}
        category="offense"
        onCategoryChange={vi.fn()}
        description=""
        onDescriptionChange={vi.fn()}
        autoFocus={true}
      />
    );

    const nameInput = screen.getByLabelText(/strategy name/i);
    expect(nameInput).toHaveFocus();
  });

  it("displays current values in form fields", () => {
    render(
      <StrategyForm
        strategyName="Vertical Stack"
        onStrategyNameChange={vi.fn()}
        category="offense"
        onCategoryChange={vi.fn()}
        description="Standard offensive formation"
        onDescriptionChange={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/strategy name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

    expect(nameInput.value).toBe("Vertical Stack");
    expect(descriptionInput.value).toBe("Standard offensive formation");
  });
});
