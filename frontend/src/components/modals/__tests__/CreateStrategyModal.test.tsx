import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import CreateStrategyModal from "../CreateStrategyModal";

describe("CreateStrategyModal", () => {
  it("displays all form fields", () => {
    render(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText("Create Strategy")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText(/strategy name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("disables create button when form is incomplete", () => {
    render(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    const createButton = screen.getByRole("button", { name: /^create$/i });
    expect(createButton).toBeDisabled();
  });

  it("enables create button when name and category are filled", async () => {
    const user = userEvent.setup();
    render(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Vertical Stack");

    // Select offense category
    const buttons = screen.getAllByRole("button");
    const offenseButton = buttons.find(btn => btn.getAttribute("value") === "offense");
    await user.click(offenseButton!);

    // Button should be enabled
    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("creates offensive strategy successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Vertical Stack");

    // Select offense category
    const buttons = screen.getAllByRole("button");
    const offenseButton = buttons.find(btn => btn.getAttribute("value") === "offense");
    await user.click(offenseButton!);

    // Fill in description
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Standard offensive formation");

    // Submit
    const createButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(createButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("creates defensive strategy successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Zone Defense");

    // Select defense category
    const buttons = screen.getAllByRole("button");
    const defenseButton = buttons.find(btn => btn.getAttribute("value") === "defense");
    await user.click(defenseButton!);

    // Fill in description (optional)
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Cup zone formation");

    // Submit
    const createButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(createButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
