# New UI Shell Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the app-level Old/New UI mode switch, localStorage persistence, team-scoped new shell, and starter new UI routes while leaving the old UI fully available.

**Architecture:** Add a parallel new UI route tree selected by a `UiModeProvider`. The old route tree is moved unchanged into `OldUiRoutes`, while `NewUiRoutes` uses a new shell, selected-team provider, and basic workflow entry pages. The new shell is intentionally skeletal in this phase so later plans can replace starter pages with full All games, Record game, Live game, Statistics, Team setup, and Admin experiences.

**Tech Stack:** React 19, React Router 7, TanStack Query, Material UI 7, react-i18next, Vitest, React Testing Library, MSW.

---

## Scope Check

The approved design covers multiple independent subsystems. This plan intentionally implements only the foundation:

- Old/New app-level mode state
- new team-scoped shell
- selected-team persistence and auto-selection
- new route skeleton
- permission-aware navigation shell

Do not implement full All games, Record game, Live game, Statistics, Team setup, or backend view-model endpoints in this plan. Those need separate phase plans after this foundation is merged.

## File Structure

- Create `frontend/src/uiMode/UiModeProvider.tsx`: owns `old`/`new` UI mode state and localStorage persistence.
- Create `frontend/src/uiMode/useUiMode.ts`: re-exports the hook for stable imports.
- Create `frontend/src/uiMode/__tests__/UiModeProvider.test.tsx`: verifies localStorage read/write and toggle behavior.
- Create `frontend/src/routes/OldUiRoutes.tsx`: contains the current old route tree from `App.tsx`.
- Create `frontend/src/routes/AppRoutes.tsx`: selects old or new route tree based on `uiMode`.
- Modify `frontend/src/App.tsx`: wraps router with `UiModeProvider` and renders `AppRoutes`.
- Create `frontend/src/new-ui/team/NewUiTeamProvider.tsx`: loads accessible teams, auto-selects one team, and persists selected team id.
- Create `frontend/src/new-ui/team/useNewUiTeam.ts`: stable hook re-export.
- Create `frontend/src/new-ui/team/__tests__/NewUiTeamProvider.test.tsx`: verifies auto-select and localStorage restore.
- Create `frontend/src/new-ui/shell/NewUiModeToggle.tsx`: reusable Old/New toggle control.
- Create `frontend/src/new-ui/shell/NewTeamSelector.tsx`: selected-team display/selector.
- Create `frontend/src/new-ui/shell/NewAppShell.tsx`: new UI navigation shell.
- Create `frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx`: verifies navigation by role/permission and mobile menu presence.
- Create `frontend/src/new-ui/pages/NewAllGamesPage.tsx`: starter dashboard entry for the selected team.
- Create `frontend/src/new-ui/pages/NewRecordGamePage.tsx`: starter record entry.
- Create `frontend/src/new-ui/pages/NewLiveGamePage.tsx`: starter live spectator entry.
- Create `frontend/src/new-ui/pages/NewStatisticsPage.tsx`: starter coach overview entry.
- Create `frontend/src/new-ui/pages/NewTeamSetupPage.tsx`: starter setup entry.
- Create `frontend/src/new-ui/NewUiRoutes.tsx`: new route tree under `NewAppShell`.
- Modify `frontend/src/locales/en/navigation.json`: add new shell labels.
- Modify `frontend/src/locales/fr/navigation.json`: add French labels.

## Task 1: UI Mode Provider

**Files:**
- Create: `frontend/src/uiMode/UiModeProvider.tsx`
- Create: `frontend/src/uiMode/useUiMode.ts`
- Create: `frontend/src/uiMode/__tests__/UiModeProvider.test.tsx`

- [ ] **Step 1: Write failing tests for persisted UI mode**

Create `frontend/src/uiMode/__tests__/UiModeProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
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
```

- [ ] **Step 2: Run the failing UI mode tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- UiModeProvider.test.tsx
```

Expected: fail because `../UiModeProvider` does not exist.

- [ ] **Step 3: Implement the UI mode provider**

Create `frontend/src/uiMode/UiModeProvider.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiMode = "old" | "new";

const UI_MODE_STORAGE_KEY = "monkey-statistics-ui-mode";

interface UiModeContextValue {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  toggleUiMode: () => void;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

function readInitialUiMode(): UiMode {
  if (typeof window === "undefined") {
    return "old";
  }

  const storedMode = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
  return storedMode === "new" ? "new" : "old";
}

interface UiModeProviderProps {
  children: ReactNode;
}

export function UiModeProvider({ children }: UiModeProviderProps) {
  const [uiMode, setUiModeState] = useState<UiMode>(() => readInitialUiMode());

  const setUiMode = useCallback((mode: UiMode) => {
    setUiModeState(mode);
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
  }, []);

  const toggleUiMode = useCallback(() => {
    setUiModeState((currentMode) => {
      const nextMode: UiMode = currentMode === "old" ? "new" : "old";
      window.localStorage.setItem(UI_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      uiMode,
      setUiMode,
      toggleUiMode,
    }),
    [setUiMode, toggleUiMode, uiMode]
  );

  return <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>;
}

export function useUiMode() {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error("useUiMode must be used within UiModeProvider");
  }
  return context;
}
```

Create `frontend/src/uiMode/useUiMode.ts`:

```ts
export { useUiMode, type UiMode } from "./UiModeProvider";
```

- [ ] **Step 4: Run the UI mode tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- UiModeProvider.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/uiMode
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add app UI mode provider"
```

## Task 2: New UI Team Provider

**Files:**
- Create: `frontend/src/new-ui/team/NewUiTeamProvider.tsx`
- Create: `frontend/src/new-ui/team/useNewUiTeam.ts`
- Create: `frontend/src/new-ui/team/__tests__/NewUiTeamProvider.test.tsx`

- [ ] **Step 1: Write failing tests for team auto-selection and persistence**

Create `frontend/src/new-ui/team/__tests__/NewUiTeamProvider.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { NewUiTeamProvider, useNewUiTeam } from "../NewUiTeamProvider";
import { server } from "../../../test/setup";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProvider(children: React.ReactNode) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <NewUiTeamProvider canLoadTeams>{children}</NewUiTeamProvider>
    </QueryClientProvider>
  );
}

function Probe() {
  const { selectedTeam, teams, setSelectedTeamId, isLoadingTeams } = useNewUiTeam();

  return (
    <div>
      <p>{isLoadingTeams ? "Loading teams" : "Teams loaded"}</p>
      <p>Selected team: {selectedTeam?.name ?? "none"}</p>
      <p>Teams count: {teams.length}</p>
      <button type="button" onClick={() => setSelectedTeamId(2)}>
        Select second team
      </button>
    </div>
  );
}

describe("NewUiTeamProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("auto-selects the only available team", async () => {
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Selected team: Monkey Stats")).toBeInTheDocument();
    });
    expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("1");
  });

  it("restores a saved team when multiple teams are available", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Selected team: Banana Cutters")).toBeInTheDocument();
    });
  });

  it("persists manual team selection", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Teams count: 2")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Select second team" }));

    expect(screen.getByText("Selected team: Banana Cutters")).toBeInTheDocument();
    expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
  });
});
```

- [ ] **Step 2: Run the failing team provider tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewUiTeamProvider.test.tsx
```

Expected: fail because `../NewUiTeamProvider` does not exist.

- [ ] **Step 3: Implement the team provider**

Create `frontend/src/new-ui/team/NewUiTeamProvider.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../services/teams";
import type { TeamWithPlayers } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

const SELECTED_TEAM_STORAGE_KEY = "monkey-statistics-new-ui-team-id";

interface NewUiTeamContextValue {
  teams: TeamWithPlayers[];
  selectedTeam: TeamWithPlayers | null;
  selectedTeamId?: number;
  setSelectedTeamId: (teamId?: number) => void;
  isLoadingTeams: boolean;
  teamsError: Error | null;
  canLoadTeams: boolean;
}

const NewUiTeamContext = createContext<NewUiTeamContextValue | undefined>(undefined);

function readStoredTeamId(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedValue = window.localStorage.getItem(SELECTED_TEAM_STORAGE_KEY);
  if (!storedValue) {
    return undefined;
  }

  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

interface NewUiTeamProviderProps {
  children: ReactNode;
  canLoadTeams: boolean;
}

export function NewUiTeamProvider({ children, canLoadTeams }: NewUiTeamProviderProps) {
  const [selectedTeamId, setSelectedTeamIdState] = useState<number | undefined>(() =>
    readStoredTeamId()
  );

  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
    enabled: canLoadTeams,
  });

  useEffect(() => {
    if (!canLoadTeams || isLoadingTeams) {
      return;
    }

    if (teams.length === 1 && selectedTeamId !== teams[0].id) {
      setSelectedTeamIdState(teams[0].id);
      window.localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, String(teams[0].id));
      return;
    }

    if (
      selectedTeamId !== undefined &&
      teams.length > 0 &&
      !teams.some((team) => team.id === selectedTeamId)
    ) {
      setSelectedTeamIdState(undefined);
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
    }
  }, [canLoadTeams, isLoadingTeams, selectedTeamId, teams]);

  const setSelectedTeamId = useCallback((teamId?: number) => {
    setSelectedTeamIdState(teamId);
    if (teamId === undefined) {
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, String(teamId));
  }, []);

  const selectedTeam =
    selectedTeamId === undefined
      ? null
      : teams.find((team) => team.id === selectedTeamId) ?? null;

  const value = useMemo(
    () => ({
      teams,
      selectedTeam,
      selectedTeamId,
      setSelectedTeamId,
      isLoadingTeams,
      teamsError,
      canLoadTeams,
    }),
    [
      canLoadTeams,
      isLoadingTeams,
      selectedTeam,
      selectedTeamId,
      setSelectedTeamId,
      teams,
      teamsError,
    ]
  );

  return <NewUiTeamContext.Provider value={value}>{children}</NewUiTeamContext.Provider>;
}

export function useNewUiTeam() {
  const context = useContext(NewUiTeamContext);
  if (!context) {
    throw new Error("useNewUiTeam must be used within NewUiTeamProvider");
  }
  return context;
}
```

Create `frontend/src/new-ui/team/useNewUiTeam.ts`:

```ts
export { useNewUiTeam } from "./NewUiTeamProvider";
```

- [ ] **Step 4: Run the team provider tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewUiTeamProvider.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/new-ui/team
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add new UI team context"
```

## Task 3: New Shell Toggle And Navigation Components

**Files:**
- Create: `frontend/src/new-ui/shell/NewUiModeToggle.tsx`
- Create: `frontend/src/new-ui/shell/NewTeamSelector.tsx`
- Create: `frontend/src/new-ui/shell/NewAppShell.tsx`
- Create: `frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Write failing shell tests**

Create `frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx`:

```tsx
import { render, screen, waitFor } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../../test/setup";
import { UiModeProvider } from "../../../uiMode/UiModeProvider";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewAppShell from "../NewAppShell";

function renderShell(role: "public" | "team_member" | "team_analyst" | "admin") {
  localStorage.setItem("monkey-statistics-ui-mode", "new");

  render(
    <UiModeProvider>
      <NewUiTeamProvider canLoadTeams={role !== "public"}>
        <Routes>
          <Route path="/" element={<NewAppShell />}>
            <Route index element={<div>New UI home</div>} />
          </Route>
        </Routes>
      </NewUiTeamProvider>
    </UiModeProvider>,
    {
      route: "/",
      auth: {
        role,
        isAuthenticated: role !== "public",
        hasAppAccess: role !== "public",
        isConfigured: true,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewAppShell", () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );
  });

  it("shows the new UI workflow navigation for team members", async () => {
    renderShell("team_member");

    expect(screen.getByRole("link", { name: /record game/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /live game/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all games/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^statistics$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /team setup/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^admin$/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Monkey Stats")).toBeInTheDocument();
    });
  });

  it("shows admin navigation for admins", () => {
    renderShell("admin");

    expect(screen.getByRole("link", { name: /^admin$/i })).toBeInTheDocument();
  });

  it("keeps public navigation limited to live and all games", () => {
    renderShell("public");

    expect(screen.getByRole("link", { name: /live game/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all games/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /record game/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /team setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^statistics$/i })).not.toBeInTheDocument();
  });

  it("lets users switch back to old UI mode", async () => {
    const user = userEvent.setup();
    renderShell("team_member");

    await user.click(screen.getByRole("button", { name: /switch to old ui/i }));

    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("old");
  });
});
```

- [ ] **Step 2: Run the failing shell tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewAppShell.test.tsx
```

Expected: fail because `NewAppShell` does not exist.

- [ ] **Step 3: Add navigation locale keys**

Modify `frontend/src/locales/en/navigation.json` so the `menu` and top-level object include these keys:

```json
{
  "menu": {
    "teams": "Teams",
    "strategies": "Strategies",
    "competitions": "Competitions",
    "statistics": "Statistics",
    "users": "Users",
    "home": "Home",
    "recordGame": "Record game",
    "liveGame": "Live game",
    "allGames": "All games",
    "teamSetup": "Team setup",
    "admin": "Admin"
  },
  "drawer": {
    "title": "Monkey Statistics"
  },
  "language": {
    "english": "English",
    "french": "Français",
    "select": "Select Language"
  },
  "uiMode": {
    "old": "Old",
    "new": "New",
    "switchToOld": "Switch to old UI",
    "switchToNew": "Switch to new UI"
  },
  "team": {
    "selectedTeam": "Selected team",
    "noTeam": "No team selected"
  }
}
```

Modify `frontend/src/locales/fr/navigation.json`:

```json
{
  "menu": {
    "teams": "Équipes",
    "strategies": "Stratégies",
    "competitions": "Compétitions",
    "statistics": "Statistiques",
    "users": "Utilisateurs",
    "home": "Accueil",
    "recordGame": "Saisir un match",
    "liveGame": "Match en direct",
    "allGames": "Tous les matchs",
    "teamSetup": "Configuration équipe",
    "admin": "Admin"
  },
  "drawer": {
    "title": "Monkey Statistics"
  },
  "language": {
    "english": "English",
    "french": "Français",
    "select": "Sélectionner la langue"
  },
  "uiMode": {
    "old": "Ancienne",
    "new": "Nouvelle",
    "switchToOld": "Basculer vers l'ancienne UI",
    "switchToNew": "Basculer vers la nouvelle UI"
  },
  "team": {
    "selectedTeam": "Équipe sélectionnée",
    "noTeam": "Aucune équipe sélectionnée"
  }
}
```

- [ ] **Step 4: Implement the mode toggle component**

Create `frontend/src/new-ui/shell/NewUiModeToggle.tsx`:

```tsx
import { Button, Tooltip } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useTranslation } from "react-i18next";
import { useUiMode } from "../../uiMode/useUiMode";

export function NewUiModeToggle() {
  const { t } = useTranslation(["navigation"]);
  const { uiMode, setUiMode } = useUiMode();
  const nextMode = uiMode === "new" ? "old" : "new";

  return (
    <Tooltip
      title={
        nextMode === "old"
          ? t("navigation:uiMode.switchToOld")
          : t("navigation:uiMode.switchToNew")
      }
    >
      <Button
        size="small"
        variant="outlined"
        startIcon={<SwapHorizIcon />}
        onClick={() => setUiMode(nextMode)}
        aria-label={
          nextMode === "old"
            ? t("navigation:uiMode.switchToOld")
            : t("navigation:uiMode.switchToNew")
        }
        sx={{ whiteSpace: "nowrap" }}
      >
        {uiMode === "new" ? t("navigation:uiMode.new") : t("navigation:uiMode.old")}
      </Button>
    </Tooltip>
  );
}
```

- [ ] **Step 5: Implement the team selector component**

Create `frontend/src/new-ui/shell/NewTeamSelector.tsx`:

```tsx
import { FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNewUiTeam } from "../team/useNewUiTeam";

export function NewTeamSelector() {
  const { t } = useTranslation(["navigation"]);
  const {
    teams,
    selectedTeamId,
    selectedTeam,
    setSelectedTeamId,
    canLoadTeams,
    isLoadingTeams,
  } = useNewUiTeam();

  if (!canLoadTeams) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("navigation:team.noTeam")}
      </Typography>
    );
  }

  if (teams.length <= 1) {
    return (
      <Typography
        variant="body2"
        sx={{
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 700,
        }}
      >
        {selectedTeam?.name ?? t("navigation:team.noTeam")}
      </Typography>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="new-ui-team-selector-label">
        {t("navigation:team.selectedTeam")}
      </InputLabel>
      <Select
        labelId="new-ui-team-selector-label"
        value={selectedTeamId ?? ""}
        label={t("navigation:team.selectedTeam")}
        disabled={isLoadingTeams}
        onChange={(event) => {
          const value = Number(event.target.value);
          setSelectedTeamId(Number.isFinite(value) ? value : undefined);
        }}
      >
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
```

- [ ] **Step 6: Implement the new app shell**

Create `frontend/src/new-ui/shell/NewAppShell.tsx`:

```tsx
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { shouldEnforcePermissions, useAuth } from "../../auth";
import { APP_MONKEY_EMOJI } from "../../constants/branding";
import { NewUiModeToggle } from "./NewUiModeToggle";
import { NewTeamSelector } from "./NewTeamSelector";

interface NewNavigationItem {
  label: string;
  path: string;
  visible: boolean;
}

export default function NewAppShell() {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation(["navigation", "common"]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canRecord = !shouldProtectUi || auth.capabilities.canEditData;
  const canViewStatistics = !shouldProtectUi || auth.capabilities.canViewStatistics;
  const canManageTeam = !shouldProtectUi || auth.capabilities.canEditData;
  const canAccessAdmin = auth.capabilities.canManageUsers;

  const navigationItems: NewNavigationItem[] = [
    {
      label: t("navigation:menu.recordGame"),
      path: "/record",
      visible: canRecord,
    },
    {
      label: t("navigation:menu.liveGame"),
      path: "/live",
      visible: true,
    },
    {
      label: t("navigation:menu.allGames"),
      path: "/games",
      visible: true,
    },
    {
      label: t("navigation:menu.statistics"),
      path: "/statistics",
      visible: canViewStatistics,
    },
    {
      label: t("navigation:menu.teamSetup"),
      path: "/team-setup",
      visible: canManageTeam,
    },
    {
      label: t("navigation:menu.admin"),
      path: "/admin/users",
      visible: canAccessAdmin,
    },
  ].filter((item) => item.visible);

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.96),
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            aria-label="open navigation"
            onClick={() => setIsDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {APP_MONKEY_EMOJI} {t("common:app.name")}
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 1 }}>
            {navigationItems.map((item) => {
              const isActive =
                item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  color={isActive ? "primary" : "inherit"}
                  variant={isActive ? "contained" : "text"}
                  sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <NewTeamSelector />
          </Box>
          <NewUiModeToggle />
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={isDrawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Typography variant="h6" fontWeight={800} mb={2}>
            {t("common:app.name")}
          </Typography>
          <Box mb={2}>
            <NewTeamSelector />
          </Box>
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton component={Link} to={item.path} onClick={closeDrawer}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box mt={2}>
            <NewUiModeToggle />
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 7: Run shell tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewAppShell.test.tsx
```

Expected: pass.

- [ ] **Step 8: Run locale parity tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- localeParity.test.ts
```

Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/new-ui/shell frontend/src/locales/en/navigation.json frontend/src/locales/fr/navigation.json
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add new UI shell navigation"
```

## Task 4: Route Trees And Starter Pages

**Files:**
- Create: `frontend/src/routes/OldUiRoutes.tsx`
- Create: `frontend/src/routes/AppRoutes.tsx`
- Create: `frontend/src/new-ui/NewUiRoutes.tsx`
- Create: `frontend/src/new-ui/pages/NewAllGamesPage.tsx`
- Create: `frontend/src/new-ui/pages/NewRecordGamePage.tsx`
- Create: `frontend/src/new-ui/pages/NewLiveGamePage.tsx`
- Create: `frontend/src/new-ui/pages/NewStatisticsPage.tsx`
- Create: `frontend/src/new-ui/pages/NewTeamSetupPage.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/routes/__tests__/AppRoutes.test.tsx`

- [ ] **Step 1: Write failing route selection tests**

Create `frontend/src/routes/__tests__/AppRoutes.test.tsx`:

```tsx
import { render, screen, waitFor } from "../../test/test-utils";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/setup";
import { UiModeProvider } from "../../uiMode/UiModeProvider";
import AppRoutes from "../AppRoutes";

function renderAppRoutes(uiMode: "old" | "new") {
  localStorage.setItem("monkey-statistics-ui-mode", uiMode);

  render(
    <UiModeProvider>
      <AppRoutes />
    </UiModeProvider>,
    {
      route: "/",
      auth: {
        role: "team_member",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );
  });

  it("renders the old UI route tree in old mode", () => {
    renderAppRoutes("old");

    expect(screen.getByRole("link", { name: /teams/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /record game/i })).not.toBeInTheDocument();
  });

  it("renders the new UI route tree in new mode", async () => {
    renderAppRoutes("new");

    expect(screen.getByRole("link", { name: /record game/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /all games/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Monkey Stats")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the failing route tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- AppRoutes.test.tsx
```

Expected: fail because `../AppRoutes` does not exist.

- [ ] **Step 3: Move old routes into `OldUiRoutes`**

Create `frontend/src/routes/OldUiRoutes.tsx`:

```tsx
import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingState from "../components/shared/LoadingState";
import { RequireMinimumRole } from "../auth";
import HomePage from "../pages/HomePage";

const TeamsPage = lazy(() => import("../pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("../pages/TeamDetailPage"));
const CompetitionsPage = lazy(() => import("../pages/CompetitionsPage"));
const CompetitionDetailPage = lazy(() => import("../pages/CompetitionDetailPage"));
const GameDetailPage = lazy(() => import("../pages/GameDetailPage"));
const LineDetailPage = lazy(() => import("../pages/LineDetailPage"));
const StrategiesPage = lazy(() => import("../pages/StrategiesPage"));
const StatisticsPage = lazy(() => import("../pages/StatisticsPage"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage"));

function renderLazyRoute(content: ReactNode) {
  return (
    <Suspense fallback={<LoadingState showColdStartHint={false} />}>
      {content}
    </Suspense>
  );
}

export default function OldUiRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="teams"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="team_member">
              <TeamsPage />
            </RequireMinimumRole>
          )}
        />
        <Route
          path="teams/:teamId"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="team_member">
              <TeamDetailPage />
            </RequireMinimumRole>
          )}
        />
        <Route path="competitions" element={renderLazyRoute(<CompetitionsPage />)} />
        <Route
          path="competitions/:competitionId"
          element={renderLazyRoute(<CompetitionDetailPage />)}
        />
        <Route
          path="lines/:lineId"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="team_member">
              <LineDetailPage />
            </RequireMinimumRole>
          )}
        />
        <Route
          path="strategies"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="team_member">
              <StrategiesPage />
            </RequireMinimumRole>
          )}
        />
        <Route path="games/:gameId" element={renderLazyRoute(<GameDetailPage />)} />
        <Route
          path="statistics"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="team_member">
              <StatisticsPage />
            </RequireMinimumRole>
          )}
        />
        <Route
          path="admin/users"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="admin" alwaysEnforce>
              <AdminUsersPage />
            </RequireMinimumRole>
          )}
        />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Create starter new pages**

Create `frontend/src/new-ui/pages/NewAllGamesPage.tsx`:

```tsx
import { Box, Container, Typography } from "@mui/material";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewAllGamesPage() {
  const { selectedTeam } = useNewUiTeam();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          {selectedTeam?.name ?? "Team"}
        </Typography>
        <Typography variant="h4" component="h1" fontWeight={800}>
          All games
        </Typography>
        <Typography color="text.secondary" mt={1}>
          Team dashboard, competitions, upcoming games, and recent results will live here.
        </Typography>
      </Box>
    </Container>
  );
}
```

Create `frontend/src/new-ui/pages/NewRecordGamePage.tsx`:

```tsx
import { Container, Typography } from "@mui/material";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewRecordGamePage() {
  const { selectedTeam } = useNewUiTeam();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="overline" color="text.secondary">
        {selectedTeam?.name ?? "Team"}
      </Typography>
      <Typography variant="h4" component="h1" fontWeight={800}>
        Record game
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Ready games, quick game creation, and field recording will live here.
      </Typography>
    </Container>
  );
}
```

Create `frontend/src/new-ui/pages/NewLiveGamePage.tsx`:

```tsx
import { Container, Typography } from "@mui/material";

export default function NewLiveGamePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={800}>
        Live game
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Public spectator boards for currently running games will live here.
      </Typography>
    </Container>
  );
}
```

Create `frontend/src/new-ui/pages/NewStatisticsPage.tsx`:

```tsx
import { Container, Typography } from "@mui/material";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewStatisticsPage() {
  const { selectedTeam } = useNewUiTeam();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="text.secondary">
        {selectedTeam?.name ?? "Team"}
      </Typography>
      <Typography variant="h4" component="h1" fontWeight={800}>
        Statistics
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Coach overview, presets, and advanced filters will live here.
      </Typography>
    </Container>
  );
}
```

Create `frontend/src/new-ui/pages/NewTeamSetupPage.tsx`:

```tsx
import { Container, Typography } from "@mui/material";
import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewTeamSetupPage() {
  const { selectedTeam } = useNewUiTeam();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="overline" color="text.secondary">
        {selectedTeam?.name ?? "Team"}
      </Typography>
      <Typography variant="h4" component="h1" fontWeight={800}>
        Team setup
      </Typography>
      <Typography color="text.secondary" mt={1}>
        Roster, lines, strategies, and team configuration will live here.
      </Typography>
    </Container>
  );
}
```

- [ ] **Step 5: Create the new route tree**

Create `frontend/src/new-ui/NewUiRoutes.tsx`:

```tsx
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { shouldEnforcePermissions, useAuth, RequireMinimumRole } from "../auth";
import LoadingState from "../components/shared/LoadingState";
import AdminUsersPage from "../pages/AdminUsersPage";
import NewAppShell from "./shell/NewAppShell";
import { NewUiTeamProvider } from "./team/NewUiTeamProvider";

const NewAllGamesPage = lazy(() => import("./pages/NewAllGamesPage"));
const NewRecordGamePage = lazy(() => import("./pages/NewRecordGamePage"));
const NewLiveGamePage = lazy(() => import("./pages/NewLiveGamePage"));
const NewStatisticsPage = lazy(() => import("./pages/NewStatisticsPage"));
const NewTeamSetupPage = lazy(() => import("./pages/NewTeamSetupPage"));

function renderNewRoute(content: React.ReactNode) {
  return (
    <Suspense fallback={<LoadingState showColdStartHint={false} />}>
      {content}
    </Suspense>
  );
}

export default function NewUiRoutes() {
  const auth = useAuth();
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canLoadTeams =
    !shouldProtectUi ||
    auth.capabilities.canEditData ||
    auth.capabilities.canViewStatistics ||
    auth.capabilities.canManageUsers;

  return (
    <NewUiTeamProvider canLoadTeams={canLoadTeams}>
      <Routes>
        <Route path="/" element={<NewAppShell />}>
          <Route index element={<Navigate to="/games" replace />} />
          <Route path="games" element={renderNewRoute(<NewAllGamesPage />)} />
          <Route path="live" element={renderNewRoute(<NewLiveGamePage />)} />
          <Route
            path="record"
            element={renderNewRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewRecordGamePage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="statistics"
            element={renderNewRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewStatisticsPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="team-setup"
            element={renderNewRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewTeamSetupPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="admin/users"
            element={renderNewRoute(
              <RequireMinimumRole minimumRole="admin" alwaysEnforce>
                <AdminUsersPage />
              </RequireMinimumRole>
            )}
          />
          <Route path="*" element={<Navigate to="/games" replace />} />
        </Route>
      </Routes>
    </NewUiTeamProvider>
  );
}
```

- [ ] **Step 6: Add app route selector**

Create `frontend/src/routes/AppRoutes.tsx`:

```tsx
import NewUiRoutes from "../new-ui/NewUiRoutes";
import { useUiMode } from "../uiMode/useUiMode";
import OldUiRoutes from "./OldUiRoutes";

export default function AppRoutes() {
  const { uiMode } = useUiMode();

  return uiMode === "new" ? <NewUiRoutes /> : <OldUiRoutes />;
}
```

- [ ] **Step 7: Update `App.tsx` to use route selector**

Modify `frontend/src/App.tsx` so the complete file is:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { I18nextProvider } from "react-i18next";
import { Analytics } from "@vercel/analytics/react";
import i18n from "./locales";
import { AuthProvider } from "./auth";
import { appTheme } from "./theme";
import { UiModeProvider } from "./uiMode/UiModeProvider";
import AppRoutes from "./routes/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UiModeProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </UiModeProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Analytics />
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
```

- [ ] **Step 8: Run route selection tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- AppRoutes.test.tsx
```

Expected: pass.

- [ ] **Step 9: Run existing layout tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- Layout.test.tsx
```

Expected: pass, proving old layout behavior remains intact.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/App.tsx frontend/src/routes frontend/src/new-ui/NewUiRoutes.tsx frontend/src/new-ui/pages
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Route app between old and new UI shells"
```

## Task 5: Foundation Verification

**Files:**
- Verify frontend suite and build.
- No new files expected unless tests expose a small fix.

- [ ] **Step 1: Run targeted foundation tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- UiModeProvider.test.tsx NewUiTeamProvider.test.tsx NewAppShell.test.tsx AppRoutes.test.tsx Layout.test.tsx localeParity.test.ts
```

Expected: all selected test files pass.

- [ ] **Step 2: Run full frontend tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test
```

Expected: full frontend suite passes. Existing known warnings may appear for tests that intentionally exercise error states.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

Expected: build passes. Vite may warn that Node `20.15.0` is below its recommended `20.19+`; that warning is acceptable if the build completes.

- [ ] **Step 4: Commit verification fixes if needed**

If verification required fixes, stage only those files and commit:

```bash
git add frontend/src
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Stabilize new UI shell foundation"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage for this phase:

- App-level Old/New toggle: Task 1 and Task 3.
- localStorage persistence: Task 1.
- New team-scoped shell: Task 2, Task 3, Task 4.
- Team auto-selection: Task 2.
- Old UI remains available: Task 4 route split and Task 5 layout verification.
- Permission-aware navigation: Task 3.
- Starter routes for future flows: Task 4.

Out of scope for this phase and covered by later phase plans:

- full All games dashboard
- Record game field workflow
- Live game spectator board
- Statistics coach overview
- Team setup redesign
- Admin restyling
- backend view-model endpoints
