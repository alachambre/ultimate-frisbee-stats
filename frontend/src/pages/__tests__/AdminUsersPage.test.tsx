import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { render, screen, waitFor, within } from "../../test/test-utils";
import AdminUsersPage from "../AdminUsersPage";
import { createManagedUser, getUsers, updateManagedUser } from "../../services";

vi.mock("../../services", () => ({
  createManagedUser: vi.fn(),
  getUsers: vi.fn(),
  updateManagedUser: vi.fn(),
}));

const baseUsers = [
  {
    id: 1,
    auth_user_id: "auth-admin",
    email: "admin@example.com",
    role: "admin" as const,
    is_active: true,
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-02T10:00:00Z",
  },
  {
    id: 2,
    auth_user_id: "auth-member",
    email: "member@example.com",
    role: "team_member" as const,
    is_active: false,
    created_at: "2026-04-01T11:00:00Z",
    updated_at: "2026-04-02T11:00:00Z",
  },
];

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUsers).mockResolvedValue(baseUsers);
  });

  it("renders the managed users list for admins", async () => {
    render(<AdminUsersPage />, {
      auth: {
        role: "admin",
        enforcementMode: "enforced",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
        authUserId: "auth-admin",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByText(/admin-only area/i)).toBeInTheDocument();
    expect(screen.getByText(/current account/i)).toBeInTheDocument();
  });

  it("creates a new managed user", async () => {
    const user = userEvent.setup();
    const createdUser = {
      id: 3,
      auth_user_id: "auth-analyst",
      email: "analyst@example.com",
      role: "team_analyst" as const,
      is_active: true,
      created_at: "2026-04-03T10:00:00Z",
      updated_at: "2026-04-03T10:00:00Z",
    };
    vi.mocked(getUsers)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdUser]);
    vi.mocked(createManagedUser).mockResolvedValue(createdUser);

    render(<AdminUsersPage />, {
      auth: {
        role: "admin",
        enforcementMode: "enforced",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/no user accounts have been created yet/i)).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /new account/i })[0]);
    const dialog = await screen.findByRole("dialog");
    const passwordInput = dialog.querySelector('input[type="password"]');

    expect(passwordInput).not.toBeNull();

    await user.type(within(dialog).getByRole("textbox", { name: /email/i }), "analyst@example.com");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(within(dialog).getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /team analyst/i }));
    await user.click(within(dialog).getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(createManagedUser).toHaveBeenCalledWith({
        email: "analyst@example.com",
        password: "password123",
        role: "team_analyst",
        is_active: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("analyst@example.com")).toBeInTheDocument();
    });
  });

  it("updates an existing managed user", async () => {
    const user = userEvent.setup();
    vi.mocked(updateManagedUser).mockResolvedValue({
      ...baseUsers[1],
      role: "team_analyst",
      is_active: true,
      updated_at: "2026-04-04T10:00:00Z",
    });

    render(<AdminUsersPage />, {
      auth: {
        role: "admin",
        enforcementMode: "enforced",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("member@example.com")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /team analyst/i }));
    await user.click(within(dialog).getByRole("switch", { name: /account active/i }));
    await user.click(within(dialog).getByRole("button", { name: /save account/i }));

    await waitFor(() => {
      expect(updateManagedUser).toHaveBeenCalledWith(2, {
        role: "team_analyst",
        is_active: true,
      });
    });
  });
});
