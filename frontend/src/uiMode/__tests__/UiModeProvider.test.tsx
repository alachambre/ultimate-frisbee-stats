import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { UiModeProvider, useUiMode } from "../UiModeProvider";

function Probe() {
  const { uiMode, setUiMode, toggleUiMode } = useUiMode();

  return (
    <div>
      <p>Current mode: {uiMode}</p>
      <button type="button" onClick={() => setUiMode("new")}>
        Use new
      </button>
      <button type="button" onClick={() => setUiMode("old")}>
        Use old
      </button>
      <button type="button" onClick={toggleUiMode}>
        Toggle
      </button>
    </div>
  );
}

describe("UiModeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to old mode when localStorage is empty", () => {
    render(
      <UiModeProvider>
        <Probe />
      </UiModeProvider>
    );

    expect(screen.getByText("Current mode: old")).toBeInTheDocument();
  });

  it("loads the saved mode from localStorage", () => {
    localStorage.setItem("monkey-statistics-ui-mode", "new");

    render(
      <UiModeProvider>
        <Probe />
      </UiModeProvider>
    );

    expect(screen.getByText("Current mode: new")).toBeInTheDocument();
  });

  it("saves mode changes to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <UiModeProvider>
        <Probe />
      </UiModeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Use new" }));

    expect(screen.getByText("Current mode: new")).toBeInTheDocument();
    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("new");
  });

  it("toggles between old and new modes", async () => {
    const user = userEvent.setup();
    render(
      <UiModeProvider>
        <Probe />
      </UiModeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("Current mode: new")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("Current mode: old")).toBeInTheDocument();
  });
});
