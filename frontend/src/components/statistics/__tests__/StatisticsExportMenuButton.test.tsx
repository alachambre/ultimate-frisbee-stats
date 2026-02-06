import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import StatisticsExportMenuButton from "../StatisticsExportMenuButton";

describe("StatisticsExportMenuButton", () => {
  it("exports summary CSV when summary option is selected", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(<StatisticsExportMenuButton onExport={onExport} />);

    await user.click(screen.getByRole("button", { name: /export csv/i }));
    await user.click(screen.getByRole("menuitem", { name: /summary csv/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledWith("summary");
  });

  it("exports full CSV when full option is selected", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(<StatisticsExportMenuButton onExport={onExport} />);

    await user.click(screen.getByRole("button", { name: /export csv/i }));
    await user.click(screen.getByRole("menuitem", { name: /full csv/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledWith("full");
  });
});
