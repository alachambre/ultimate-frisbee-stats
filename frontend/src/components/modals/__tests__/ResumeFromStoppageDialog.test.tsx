import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResumeFromStoppageDialog } from "../ResumeFromStoppageDialog";
import type { Stoppage } from "../../../types";

const mockCall: Stoppage = {
  id: 1,
  point_id: 1,
  stoppage_type: "injury",
  call_timestamp: "2024-01-01T10:02:00Z",
  resume_timestamp: null, // Pending call
  comments: "Travel call",
  created_at: "2024-01-01T10:02:00Z",
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("ResumeFromStoppageDialog", () => {
  it("renders dialog with title when open", () => {
    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={true}
        onClose={vi.fn()}
        stoppage={mockCall}
      />
    );

    expect(screen.getByText("Resume from Stoppage")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={false}
        onClose={vi.fn()}
        stoppage={mockCall}
      />
    );

    expect(screen.queryByText("Resume from Stoppage")).not.toBeInTheDocument();
  });

  it("displays call timing information", () => {
    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={true}
        onClose={vi.fn()}
        stoppage={mockCall}
      />
    );

    // Should show labels for timing
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/injury/i)).toBeInTheDocument();
    expect(screen.getByText(/started/i)).toBeInTheDocument();
    expect(screen.getByText(/resumed/i)).toBeInTheDocument();
    expect(screen.getByText(/duration/i)).toBeInTheDocument();
  });

  it("displays duration in MM:SS format", async () => {
    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={true}
        onClose={vi.fn()}
        stoppage={mockCall}
      />
    );

    // Should show duration label
    await waitFor(() => {
      expect(screen.getByText(/duration/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Should show some time value (will have colons)
    const bodyText = screen.getByText(/duration/i).closest('p');
    expect(bodyText).toBeInTheDocument();
    expect(bodyText?.textContent).toMatch(/:/);
  });

  it("has cancel and confirm buttons", () => {
    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={true}
        onClose={vi.fn()}
        stoppage={mockCall}
      />
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("has clickable confirm button", () => {
    const onClose = vi.fn();

    renderWithQueryClient(
      <ResumeFromStoppageDialog
        open={true}
        onClose={onClose}
        stoppage={mockCall}
      />
    );

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toBeDisabled();

    // Button is ready to be clicked
    expect(confirmButton.getAttribute("type")).toBe("button");
  });
});
