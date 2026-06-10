import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { createStrategy } from "../../services/strategies";
import { render, screen, waitFor, within } from "../../test/test-utils";
import { resetMockData } from "../../test/mocks/handlers";
import StrategiesPage from "../StrategiesPage";

async function seedStrategies() {
  await createStrategy({
    category: "offense",
    description: "Standard offensive formation",
    name: "Vertical Stack",
  });
  await createStrategy({
    category: "defense",
    description: "Cup zone formation",
    name: "Zone Defense",
  });
  await createStrategy({
    category: "offense",
    description: null,
    name: "Horizontal Stack",
  });
}

describe("StrategiesPage", () => {
  beforeEach(() => {
    resetMockData();
  });

  it("renders the app-level strategy library summary", async () => {
    await seedStrategies();

    render(<StrategiesPage />);

    expect(
      await screen.findByRole("heading", { name: "Strategies" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Shared across teams")
    ).toBeInTheDocument();

    const summary = screen.getByLabelText("Strategy summary");
    expect(within(summary).getByText("3 strategies")).toBeInTheDocument();
    expect(within(summary).getByText("2 offense")).toBeInTheDocument();
    expect(within(summary).getByText("1 defense")).toBeInTheDocument();
    expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    expect(screen.getByText("Zone Defense")).toBeInTheDocument();
  });

  it("filters strategies by category and search text", async () => {
    const user = userEvent.setup();
    await seedStrategies();

    render(<StrategiesPage />);

    expect(await screen.findByText("Vertical Stack")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Defense$/i }));

    expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    expect(screen.getByText("Zone Defense")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^All$/i }));
    await user.type(
      screen.getByRole("textbox", { name: "Search strategy" }),
      "horizontal"
    );

    expect(screen.getByText("Horizontal Stack")).toBeInTheDocument();
    expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    expect(screen.queryByText("Zone Defense")).not.toBeInTheDocument();
  });

  it("opens create and edit strategy dialogs", async () => {
    const user = userEvent.setup();
    await seedStrategies();

    render(<StrategiesPage />);

    await user.click(
      await screen.findByRole("button", { name: /^New Strategy$/i })
    );

    expect(
      screen.getByRole("dialog", { name: "Create Strategy" })
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("dialog", { name: "Create Strategy" })).getByRole(
        "button",
        { name: "Cancel" }
      )
    );
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Create Strategy" })
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Edit Vertical Stack/i }));

    expect(
      screen.getByRole("dialog", { name: "Edit Strategy" })
    ).toBeInTheDocument();
  });

  it("deletes a strategy after confirmation", async () => {
    const user = userEvent.setup();
    await seedStrategies();

    render(<StrategiesPage />);

    expect(await screen.findByText("Vertical Stack")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Delete Vertical Stack/i })
    );
    expect(
      screen.getByText("Are you sure you want to delete Vertical Stack?")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    });
  });

  it("shows an empty state when no strategies exist", async () => {
    render(<StrategiesPage />);

    expect(
      await screen.findByRole("heading", { name: "No strategies yet" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /^New Strategy$/i })
    ).not.toHaveLength(0);
  });
});
