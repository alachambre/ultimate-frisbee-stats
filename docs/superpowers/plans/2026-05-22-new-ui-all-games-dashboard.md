# New UI All Games Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the new UI `/games` placeholder with a team-scoped All Games dashboard that separates live, upcoming, and completed games while keeping public spectator fallback and old UI compatibility intact.

**Architecture:** Keep this slice frontend-only. Use the existing public `GET /games` contract through `getAllGames()` and `queryKeys.games`, then filter by selected team through `GET /competitions?team_id=<id>` when a team is selected. Add new UI-specific dashboard components under `frontend/src/new-ui/games/`, and add a transitional new-shell route for `/games/:gameId` that reuses the existing `GameDetailPage` until the game overview screen is redesigned.

**Tech Stack:** React 19, React Router 7, TanStack Query, Material UI 7, react-i18next, Vitest, React Testing Library, MSW.

---

## Scope Check

This plan implements only the new UI All Games / dashboard slice:

- selected-team-aware game dashboard
- public fallback when no team can be loaded
- live / upcoming / recent sections
- lightweight dashboard metrics
- new UI card/list components
- route safety for `/games/:gameId`

Do not redesign the live spectator view, record-game workflow, statistics page, game detail page, team setup, or backend contracts in this plan. Those remain separate vertical slices.

## File Structure

- Create `frontend/src/new-ui/games/buildNewGamesDashboard.ts`: pure view-model builder for team filtering, buckets, sorting, and summary metrics.
- Create `frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts`: unit tests for filtering, buckets, and summary calculations.
- Create `frontend/src/new-ui/games/NewGamesSummaryStrip.tsx`: compact Material UI summary metrics.
- Create `frontend/src/new-ui/games/NewGameCard.tsx`: professional new UI game card, independent from the old gradient `GameCard`.
- Create `frontend/src/new-ui/games/NewGamesSection.tsx`: section wrapper for live, upcoming, and recent game cards.
- Create `frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx`: card rendering/link behavior tests.
- Modify `frontend/src/test/mocks/handlers.ts`: compute scores consistently for `GET /games`, matching the competition-games handler.
- Replace `frontend/src/new-ui/pages/NewAllGamesPage.tsx`: real dashboard composition.
- Create `frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx`: page behavior tests for team-scoped, public, empty, and error states.
- Modify `frontend/src/new-ui/NewUiRoutes.tsx`: add `/games/:gameId` route using existing `GameDetailPage`.
- Modify `frontend/src/routes/__tests__/AppRoutes.test.tsx`: verify new UI game cards can navigate to game detail without falling through the wildcard redirect.
- Modify `frontend/src/locales/en/navigation.json`: dashboard copy and labels.
- Modify `frontend/src/locales/fr/navigation.json`: matching French dashboard copy and labels.

## Task 1: Dashboard View Builder

**Files:**
- Create: `frontend/src/new-ui/games/buildNewGamesDashboard.ts`
- Create: `frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts`

- [ ] **Step 1: Write failing tests for bucketing and team filtering**

Create `frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CompetitionWithTeam, GameWithScore } from "../../../types";
import { buildNewGamesDashboard } from "../buildNewGamesDashboard";

function game(
  overrides: Partial<GameWithScore> & Pick<GameWithScore, "id" | "competition_id" | "status">
): GameWithScore {
  return {
    id: overrides.id,
    competition_id: overrides.competition_id,
    opponent_name: overrides.opponent_name ?? `Opponent ${overrides.id}`,
    date: overrides.date ?? "2026-05-22T10:00:00Z",
    comments: null,
    status: overrides.status,
    start_datetime: null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: overrides.our_score ?? 0,
    opponent_score: overrides.opponent_score ?? 0,
    team_name: overrides.team_name ?? "Monkey Stats",
    competition_name: overrides.competition_name ?? "Spring Cup",
  };
}

function competition(overrides: Partial<CompetitionWithTeam> & Pick<CompetitionWithTeam, "id" | "team_id">): CompetitionWithTeam {
  return {
    id: overrides.id,
    team_id: overrides.team_id,
    team_name: overrides.team_name ?? "Monkey Stats",
    name: overrides.name ?? `Competition ${overrides.id}`,
    description: null,
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    status: "ongoing",
    created_at: "2026-05-01T00:00:00Z",
  };
}

describe("buildNewGamesDashboard", () => {
  it("filters games by selected team competitions", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({ id: 1, competition_id: 10, status: "started" }),
        game({ id: 2, competition_id: 20, status: "ended" }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [competition({ id: 10, team_id: 1 })],
    });

    expect(dashboard.allGames.map((item) => item.id)).toEqual([1]);
    expect(dashboard.summary.totalGames).toBe(1);
  });

  it("keeps all public games when no team is selected", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({ id: 1, competition_id: 10, status: "started" }),
        game({ id: 2, competition_id: 20, status: "ended" }),
      ],
      selectedTeamId: undefined,
      teamCompetitions: undefined,
    });

    expect(dashboard.allGames.map((item) => item.id)).toEqual([1, 2]);
    expect(dashboard.hasTeamScope).toBe(false);
  });

  it("splits live, upcoming, and recent games with stable sorting", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({ id: 1, competition_id: 10, status: "ended", date: "2026-05-20T10:00:00Z", our_score: 13, opponent_score: 8 }),
        game({ id: 2, competition_id: 10, status: "ready", date: "2026-05-25T10:00:00Z" }),
        game({ id: 3, competition_id: 10, status: "started", date: "2026-05-22T10:00:00Z", our_score: 4, opponent_score: 3 }),
        game({ id: 4, competition_id: 10, status: "ended", date: "2026-05-21T10:00:00Z", our_score: 8, opponent_score: 10 }),
        game({ id: 5, competition_id: 10, status: "ready", date: "2026-05-23T10:00:00Z" }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [competition({ id: 10, team_id: 1 })],
    });

    expect(dashboard.liveGames.map((item) => item.id)).toEqual([3]);
    expect(dashboard.upcomingGames.map((item) => item.id)).toEqual([5, 2]);
    expect(dashboard.recentGames.map((item) => item.id)).toEqual([4, 1]);
    expect(dashboard.summary.wins).toBe(1);
    expect(dashboard.summary.losses).toBe(1);
    expect(dashboard.summary.draws).toBe(0);
  });
});
```

- [ ] **Step 2: Run the failing builder tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewGamesDashboard.test.ts
```

Expected: fail because `../buildNewGamesDashboard` does not exist.

- [ ] **Step 3: Implement the builder**

Create `frontend/src/new-ui/games/buildNewGamesDashboard.ts`:

```ts
import type { CompetitionWithTeam, GameWithScore } from "../../types";

interface BuildNewGamesDashboardArgs {
  games: GameWithScore[];
  selectedTeamId?: number;
  teamCompetitions?: CompetitionWithTeam[];
}

export interface NewGamesDashboardSummary {
  totalGames: number;
  liveGames: number;
  upcomingGames: number;
  completedGames: number;
  competitions: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface NewGamesDashboardView {
  allGames: GameWithScore[];
  liveGames: GameWithScore[];
  upcomingGames: GameWithScore[];
  recentGames: GameWithScore[];
  summary: NewGamesDashboardSummary;
  hasTeamScope: boolean;
}

function getGameTime(game: GameWithScore): number {
  return game.date ? new Date(game.date).getTime() : Number.POSITIVE_INFINITY;
}

function sortUpcomingGames(a: GameWithScore, b: GameWithScore) {
  return getGameTime(a) - getGameTime(b);
}

function sortRecentGames(a: GameWithScore, b: GameWithScore) {
  return getGameTime(b) - getGameTime(a);
}

function buildScopedGames(
  games: GameWithScore[],
  selectedTeamId?: number,
  teamCompetitions?: CompetitionWithTeam[]
) {
  if (selectedTeamId === undefined) {
    return games;
  }

  const competitionIds = new Set(
    (teamCompetitions ?? []).map((competition) => competition.id)
  );

  return games.filter((game) => competitionIds.has(game.competition_id));
}

export function buildNewGamesDashboard({
  games,
  selectedTeamId,
  teamCompetitions,
}: BuildNewGamesDashboardArgs): NewGamesDashboardView {
  const scopedGames = buildScopedGames(games, selectedTeamId, teamCompetitions);
  const liveGames = scopedGames
    .filter((game) => game.status === "started")
    .sort(sortUpcomingGames);
  const upcomingGames = scopedGames
    .filter((game) => game.status !== "started" && game.status !== "ended")
    .sort(sortUpcomingGames);
  const recentGames = scopedGames
    .filter((game) => game.status === "ended")
    .sort(sortRecentGames);

  const wins = recentGames.filter(
    (game) => game.our_score > game.opponent_score
  ).length;
  const losses = recentGames.filter(
    (game) => game.our_score < game.opponent_score
  ).length;
  const draws = recentGames.length - wins - losses;

  return {
    allGames: [...liveGames, ...upcomingGames, ...recentGames],
    liveGames,
    upcomingGames,
    recentGames,
    hasTeamScope: selectedTeamId !== undefined,
    summary: {
      totalGames: scopedGames.length,
      liveGames: liveGames.length,
      upcomingGames: upcomingGames.length,
      completedGames: recentGames.length,
      competitions:
        selectedTeamId === undefined
          ? new Set(scopedGames.map((game) => game.competition_id)).size
          : teamCompetitions?.length ?? 0,
      wins,
      losses,
      draws,
    },
  };
}
```

- [ ] **Step 4: Run the builder tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewGamesDashboard.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/new-ui/games/buildNewGamesDashboard.ts frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts
git commit -m "Add new UI games dashboard builder"
```

## Task 2: New UI Game Cards And Sections

**Files:**
- Create: `frontend/src/new-ui/games/NewGamesSummaryStrip.tsx`
- Create: `frontend/src/new-ui/games/NewGameCard.tsx`
- Create: `frontend/src/new-ui/games/NewGamesSection.tsx`
- Create: `frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx`

- [ ] **Step 1: Write failing tests for the new game card**

Create `frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx`:

```tsx
import { render, screen } from "../../../test/test-utils";
import type { GameWithScore } from "../../../types";
import NewGameCard from "../NewGameCard";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: 42,
    competition_id: 7,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status: "started",
    start_datetime: null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: 5,
    opponent_score: 4,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

describe("NewGameCard", () => {
  it("shows game identity, score, status, and navigation", () => {
    render(<NewGameCard game={buildGame()} />);

    expect(screen.getByRole("link", { name: /Blue Tigers/i })).toHaveAttribute(
      "href",
      "/games/42"
    );
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
  });

  it("uses a review label for completed games", () => {
    render(<NewGameCard game={buildGame({ status: "ended" })} />);

    expect(screen.getByText("Review")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing card tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewGameCard.test.tsx
```

Expected: fail because `../NewGameCard` does not exist.

- [ ] **Step 3: Implement summary strip, card, and section components**

Create `frontend/src/new-ui/games/NewGamesSummaryStrip.tsx`:

```tsx
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { NewGamesDashboardSummary } from "./buildNewGamesDashboard";

interface NewGamesSummaryStripProps {
  summary: NewGamesDashboardSummary;
  labels: {
    live: string;
    upcoming: string;
    completed: string;
    record: string;
  };
}

export default function NewGamesSummaryStrip({
  summary,
  labels,
}: NewGamesSummaryStripProps) {
  const items = [
    { label: labels.live, value: summary.liveGames },
    { label: labels.upcoming, value: summary.upcomingGames },
    { label: labels.completed, value: summary.completedGames },
    { label: labels.record, value: `${summary.wins}-${summary.losses}-${summary.draws}` },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {items.map((item) => (
        <Paper
          elevation={0}
          key={item.label}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 1.5, sm: 2 },
          })}
        >
          <Typography color="text.secondary" variant="body2">
            {item.label}
          </Typography>
          <Typography component="p" fontWeight={800} variant="h5">
            {item.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
```

Create `frontend/src/new-ui/games/NewGameCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";

import StatusChip from "../../components/shared/StatusChip";
import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewGameCardProps {
  game: GameWithScore;
}

export default function NewGameCard({ game }: NewGameCardProps) {
  const { t, i18n } = useTranslation(["games", "navigation"]);
  const actionLabel =
    game.status === "started"
      ? t("navigation:newUiPages.allGames.actions.openLive")
      : game.status === "ended"
        ? t("navigation:newUiPages.allGames.actions.review")
        : t("navigation:newUiPages.allGames.actions.prepare");

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
      })}
    >
      <ButtonBase
        component={Link}
        to={`/games/${game.id}`}
        sx={{
          alignItems: "stretch",
          display: "flex",
          height: "100%",
          textAlign: "left",
          width: "100%",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            width: "100%",
          }}
        >
          <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
            <StatusChip
              kind="game"
              status={game.status}
              ourScore={game.our_score}
              opponentScore={game.opponent_score}
              size="small"
            />
            <Chip label={actionLabel} size="small" variant="outlined" />
          </Stack>

          <Box>
            <Typography component="h3" fontWeight={800} variant="h6">
              {game.opponent_name}
            </Typography>
            <Stack alignItems="center" direction="row" spacing={0.75}>
              <EmojiEventsIcon color="action" sx={{ fontSize: 16 }} />
              <Typography color="text.secondary" variant="body2">
                {game.competition_name}
              </Typography>
            </Stack>
          </Box>

          <Typography component="p" fontWeight={800} variant="h4">
            {game.our_score} - {game.opponent_score}
          </Typography>

          <Stack alignItems="center" direction="row" spacing={0.75} sx={{ mt: "auto" }}>
            <CalendarTodayIcon color="action" sx={{ fontSize: 16 }} />
            <Typography color="text.secondary" variant="body2">
              {game.date
                ? formatDateTime(game.date, i18n.resolvedLanguage)
                : t("games:detail.dateNotSet")}
            </Typography>
          </Stack>
        </CardContent>
      </ButtonBase>
    </Card>
  );
}
```

Create `frontend/src/new-ui/games/NewGamesSection.tsx`:

```tsx
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import type { GameWithScore } from "../../types";
import NewGameCard from "./NewGameCard";

interface NewGamesSectionProps {
  title: string;
  emptyLabel: string;
  games: GameWithScore[];
}

export default function NewGamesSection({
  title,
  emptyLabel,
  games,
}: NewGamesSectionProps) {
  return (
    <Box component="section">
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, mb: 2 }}>
        <Typography component="h2" fontWeight={800} variant="h6">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {games.length}
        </Typography>
      </Box>

      {games.length === 0 ? (
        <Box
          sx={(theme) => ({
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            color: "text.secondary",
            p: 3,
          })}
        >
          <Typography variant="body2">{emptyLabel}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {games.map((game) => (
            <Grid key={game.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <NewGameCard game={game} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Run the card tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewGameCard.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/new-ui/games/NewGamesSummaryStrip.tsx frontend/src/new-ui/games/NewGameCard.tsx frontend/src/new-ui/games/NewGamesSection.tsx frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx
git commit -m "Add new UI game dashboard cards"
```

## Task 3: All Games Page Composition

**Files:**
- Modify: `frontend/src/test/mocks/handlers.ts`
- Replace: `frontend/src/new-ui/pages/NewAllGamesPage.tsx`
- Create: `frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Write failing page tests**

Create `frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx`:

```tsx
import { render, screen, waitFor } from "../../../test/test-utils";
import { HttpResponse, http } from "msw";
import { describe, expect, it, beforeEach } from "vitest";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewAllGamesPage from "../NewAllGamesPage";
import { server } from "../../../test/setup";

const BASE_URL = "http://localhost:8000";

function renderPage({
  role = "team_member",
  canLoadTeams = true,
}: {
  role?: "public" | "team_member";
  canLoadTeams?: boolean;
} = {}) {
  return render(
    <NewUiTeamProvider canLoadTeams={canLoadTeams}>
      <NewAllGamesPage />
    </NewUiTeamProvider>,
    {
      auth: {
        role,
        isAuthenticated: role !== "public",
        hasAppAccess: role !== "public",
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewAllGamesPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a selected-team dashboard with scoped games", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([
          { id: 1, name: "Monkey Stats", created_at: "2026-01-01T00:00:00Z", players: [] },
        ])
      ),
      http.get(`${BASE_URL}/competitions`, ({ request }) => {
        const teamId = new URL(request.url).searchParams.get("team_id");
        if (teamId === "1") {
          return HttpResponse.json([
            {
              id: 10,
              team_id: 1,
              team_name: "Monkey Stats",
              name: "Spring Cup",
              description: null,
              start_date: "2026-05-01",
              end_date: "2026-05-31",
              status: "ongoing",
              created_at: "2026-05-01T00:00:00Z",
            },
          ]);
        }
        return HttpResponse.json([]);
      }),
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          {
            id: 1,
            competition_id: 10,
            opponent_name: "Blue Tigers",
            date: "2026-05-22T10:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 5,
            opponent_score: 4,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
          {
            id: 2,
            competition_id: 99,
            opponent_name: "Other Team Game",
            date: "2026-05-22T11:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 0,
            opponent_score: 0,
            team_name: "Other Team",
            competition_name: "Other Cup",
          },
        ])
      )
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "All games" })).toBeInTheDocument();
    });
    expect(screen.getByText("Monkey Stats")).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.queryByText("Other Team Game")).not.toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
  });

  it("shows public fallback games when teams cannot be loaded", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          {
            id: 1,
            competition_id: 10,
            opponent_name: "Public Opponent",
            date: "2026-05-22T10:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 3,
            opponent_score: 2,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
        ])
      )
    );

    renderPage({ role: "public", canLoadTeams: false });

    expect(await screen.findByText("Public Opponent")).toBeInTheDocument();
    expect(screen.getByText("Public spectator view")).toBeInTheDocument();
  });

  it("shows an empty state when the selected team has no games", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([
          { id: 1, name: "Monkey Stats", created_at: "2026-01-01T00:00:00Z", players: [] },
        ])
      ),
      http.get(`${BASE_URL}/competitions`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage();

    expect(await screen.findByText("No games for this team yet.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing page tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewAllGamesPage.test.tsx
```

Expected: fail because the page is still a placeholder and the new dashboard strings do not exist.

- [ ] **Step 3: Fix MSW score behavior for `GET /games`**

In `frontend/src/test/mocks/handlers.ts`, add a small helper near `getMockStatisticsData()`:

```ts
function buildGameWithScore(game: Game): GameWithScore {
  const competition = competitions.find((c) => c.id === game.competition_id);
  const team = teams.find((t) => t.id === competition?.team_id);
  const gamePoints = points.filter((point) => point.game_id === game.id);
  let ourScore = 0;
  let opponentScore = 0;

  gamePoints.forEach((point) => {
    if (point.status === "completed" && point.won !== null) {
      if (point.won) {
        ourScore += 1;
      } else {
        opponentScore += 1;
      }
    }
  });

  return {
    ...game,
    our_score: ourScore,
    opponent_score: opponentScore,
    team_name: team?.name || "Unknown",
    competition_name: competition?.name || "Unknown",
  };
}
```

Then replace the duplicated score-building body in both `GET /competitions/:competitionId/games` and `GET /games` with:

```ts
const gamesWithScores: GameWithScore[] = competitionGames.map(buildGameWithScore);
```

and:

```ts
const gamesWithScores: GameWithScore[] = games.map(buildGameWithScore);
```

- [ ] **Step 4: Add dashboard locale strings**

Modify `frontend/src/locales/en/navigation.json` under `newUiPages.allGames`:

```json
{
  "heading": "All games",
  "copy": "Follow the current team, jump into live games, and review recent results.",
  "publicCopy": "Public spectator view",
  "publicNotice": "You are seeing public game information. Sign in with team access to use the team dashboard.",
  "selectedTeamEyebrow": "{{teamName}} dashboard",
  "globalEyebrow": "Public games",
  "actions": {
    "record": "Record game",
    "live": "Live games",
    "statistics": "Statistics",
    "openLive": "Open live",
    "prepare": "Prepare",
    "review": "Review"
  },
  "summary": {
    "live": "Live",
    "upcoming": "Upcoming",
    "completed": "Completed",
    "record": "Record"
  },
  "sections": {
    "live": "Live now",
    "upcoming": "Upcoming games",
    "recent": "Recent results"
  },
  "empty": {
    "team": "No games for this team yet.",
    "public": "No public games are available yet.",
    "section": "Nothing to show here right now."
  },
  "loading": "Loading games...",
  "error": "Unable to load games."
}
```

Modify `frontend/src/locales/fr/navigation.json` with the same keys:

```json
{
  "heading": "Tous les matchs",
  "copy": "Suivez l'équipe courante, ouvrez les matchs en direct et retrouvez les derniers résultats.",
  "publicCopy": "Vue publique spectateur",
  "publicNotice": "Vous voyez les informations publiques des matchs. Connectez-vous avec un accès équipe pour utiliser le tableau de bord.",
  "selectedTeamEyebrow": "Tableau de bord {{teamName}}",
  "globalEyebrow": "Matchs publics",
  "actions": {
    "record": "Saisir un match",
    "live": "Matchs en direct",
    "statistics": "Statistiques",
    "openLive": "Ouvrir le direct",
    "prepare": "Préparer",
    "review": "Revoir"
  },
  "summary": {
    "live": "En direct",
    "upcoming": "À venir",
    "completed": "Terminés",
    "record": "Bilan"
  },
  "sections": {
    "live": "En direct",
    "upcoming": "Prochains matchs",
    "recent": "Derniers résultats"
  },
  "empty": {
    "team": "Aucun match pour cette équipe.",
    "public": "Aucun match public disponible pour le moment.",
    "section": "Rien à afficher pour le moment."
  },
  "loading": "Chargement des matchs...",
  "error": "Impossible de charger les matchs."
}
```

- [ ] **Step 5: Replace `NewAllGamesPage`**

Replace `frontend/src/new-ui/pages/NewAllGamesPage.tsx` with:

```tsx
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BarChartIcon from "@mui/icons-material/BarChart";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import PermissionNotice from "../../components/shared/PermissionNotice";
import { getCompetitions } from "../../services/competitions";
import { getAllGames } from "../../services/games";
import NewGamesSection from "../games/NewGamesSection";
import NewGamesSummaryStrip from "../games/NewGamesSummaryStrip";
import { buildNewGamesDashboard } from "../games/buildNewGamesDashboard";
import { useNewUiTeam } from "../team/useNewUiTeam";
import { queryKeys } from "../../utils/queryKeys";

export default function NewAllGamesPage() {
  const auth = useAuth();
  const { t } = useTranslation("navigation");
  const { selectedTeam, selectedTeamId, isLoadingTeams, teamsError, canLoadTeams } =
    useNewUiTeam();
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
  const canViewStatistics =
    !shouldProtectUi || auth.capabilities.canViewStatistics;

  const {
    data: games = [],
    isLoading: isLoadingGames,
    error: gamesError,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
  });

  const {
    data: teamCompetitions,
    isLoading: isLoadingTeamCompetitions,
    error: teamCompetitionsError,
  } = useQuery({
    queryKey:
      selectedTeamId === undefined
        ? queryKeys.competitions
        : queryKeys.competitionsByTeam(selectedTeamId),
    queryFn: () => getCompetitions(selectedTeamId),
    enabled: selectedTeamId !== undefined,
  });

  const dashboard = useMemo(
    () =>
      buildNewGamesDashboard({
        games,
        selectedTeamId,
        teamCompetitions,
      }),
    [games, selectedTeamId, teamCompetitions]
  );

  const isLoading =
    auth.isLoading ||
    isLoadingTeams ||
    isLoadingGames ||
    (selectedTeamId !== undefined && isLoadingTeamCompetitions);
  const error = gamesError || teamsError || teamCompetitionsError;

  if (isLoading) {
    return <LoadingState message={t("newUiPages.allGames.loading")} />;
  }

  if (error) {
    return <ErrorState message={t("newUiPages.allGames.error")} />;
  }

  const isPublicFallback = !canLoadTeams || selectedTeamId === undefined;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box
          sx={{
            alignItems: { xs: "stretch", md: "flex-start" },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Typography color="text.secondary" variant="overline">
              {selectedTeam
                ? t("newUiPages.allGames.selectedTeamEyebrow", {
                    teamName: selectedTeam.name,
                  })
                : t("newUiPages.allGames.globalEyebrow")}
            </Typography>
            <Typography component="h1" gutterBottom variant="h4">
              {t("newUiPages.allGames.heading")}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {isPublicFallback
                ? t("newUiPages.allGames.publicNotice")
                : t("newUiPages.allGames.copy")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {canEditData && (
              <Button
                component={Link}
                startIcon={<PlayArrowIcon />}
                to="/record"
                variant="contained"
              >
                {t("newUiPages.allGames.actions.record")}
              </Button>
            )}
            <Button
              component={Link}
              startIcon={<RadioButtonCheckedIcon />}
              to="/live"
              variant="outlined"
            >
              {t("newUiPages.allGames.actions.live")}
            </Button>
            {canViewStatistics && selectedTeamId !== undefined && (
              <Button
                component={Link}
                startIcon={<BarChartIcon />}
                to={`/statistics?teamId=${selectedTeamId}`}
                variant="outlined"
              >
                {t("newUiPages.allGames.actions.statistics")}
              </Button>
            )}
          </Stack>
        </Box>

        {isPublicFallback && (
          <PermissionNotice
            title={t("newUiPages.allGames.publicCopy")}
            description={t("newUiPages.allGames.publicNotice")}
          />
        )}

        <NewGamesSummaryStrip
          summary={dashboard.summary}
          labels={{
            live: t("newUiPages.allGames.summary.live"),
            upcoming: t("newUiPages.allGames.summary.upcoming"),
            completed: t("newUiPages.allGames.summary.completed"),
            record: t("newUiPages.allGames.summary.record"),
          }}
        />

        {dashboard.allGames.length === 0 ? (
          <Box
            sx={(theme) => ({
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              color: "text.secondary",
              p: { xs: 3, md: 5 },
              textAlign: "center",
            })}
          >
            <Typography variant="body1">
              {selectedTeamId === undefined
                ? t("newUiPages.allGames.empty.public")
                : t("newUiPages.allGames.empty.team")}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={4}>
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.liveGames}
              title={t("newUiPages.allGames.sections.live")}
            />
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.upcomingGames}
              title={t("newUiPages.allGames.sections.upcoming")}
            />
            <NewGamesSection
              emptyLabel={t("newUiPages.allGames.empty.section")}
              games={dashboard.recentGames}
              title={t("newUiPages.allGames.sections.recent")}
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 6: Run page tests and locale parity**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewAllGamesPage.test.tsx localeParity.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/test/mocks/handlers.ts frontend/src/new-ui/pages/NewAllGamesPage.tsx frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx frontend/src/locales/en/navigation.json frontend/src/locales/fr/navigation.json
git commit -m "Build new UI all games dashboard"
```

## Task 4: New UI Game Detail Route Safety

**Files:**
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/routes/__tests__/AppRoutes.test.tsx`

- [ ] **Step 1: Write failing route coverage**

In `frontend/src/routes/__tests__/AppRoutes.test.tsx`, add a test that renders new UI at `/games/1` and verifies the route does not redirect to `/games`:

```tsx
it("keeps new UI game detail links routable", async () => {
  localStorage.setItem("monkey-statistics-ui-mode", "new");

  render(<AppRoutes />, {
    route: "/games/1",
    auth: {
      role: "public",
      isAuthenticated: false,
      hasAppAccess: false,
      enforcementMode: "enforced",
    },
  });

  expect(await screen.findByText(/Score|Game Info/i)).toBeInTheDocument();
  expect(window.location.pathname).toBe("/games/1");
});
```

- [ ] **Step 2: Run the failing route test**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- AppRoutes.test.tsx
```

Expected: fail or redirect because `NewUiRoutes` has no `games/:gameId` route.

- [ ] **Step 3: Add the transitional route**

Modify `frontend/src/new-ui/NewUiRoutes.tsx`:

```tsx
const GameDetailPage = lazy(() => import("../pages/GameDetailPage"));
```

Then add this route after the `/games` route:

```tsx
<Route
  path="games/:gameId"
  element={renderLazyRoute(<GameDetailPage />)}
/>
```

This intentionally reuses the current game detail page inside the new shell. A dedicated new game overview should be planned separately.

- [ ] **Step 4: Run route tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- AppRoutes.test.tsx NewGameCard.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/new-ui/NewUiRoutes.tsx frontend/src/routes/__tests__/AppRoutes.test.tsx
git commit -m "Keep new UI game detail links routable"
```

## Task 5: Verification And Visual QA

**Files:**
- No source edits expected unless verification finds a bug.

- [ ] **Step 1: Run targeted frontend tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewGamesDashboard.test.ts NewGameCard.test.tsx NewAllGamesPage.test.tsx AppRoutes.test.tsx localeParity.test.ts
```

Expected: pass.

- [ ] **Step 2: Run full frontend tests**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test
```

Expected: pass.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

Expected: pass. The existing Vite Node-version warning is acceptable in this local environment if the build exits 0.

- [ ] **Step 4: Browser QA**

Run the dev server:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run dev -- --host 127.0.0.1 --port 5173
```

Use the in-app browser to verify:

- old UI can switch to new UI
- `/games` renders the new dashboard
- desktop layout has no overlapping controls
- mobile drawer still opens
- game cards navigate to `/games/:gameId`
- new UI toggle remains visible and can switch back to old UI

- [ ] **Step 5: Commit only if verification fixes were needed**

If visual QA or tests required fixes:

```bash
git add <fixed-files>
git commit -m "Stabilize new UI games dashboard"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers the next dashboard-first All Games slice, keeps public/member separation, preserves old UI, uses Material UI, and keeps live/record/statistics as entry points without implementing those larger flows prematurely.
- Placeholder scan: No task uses undefined backend contracts. The only transitional reuse is explicitly scoped: `GameDetailPage` inside the new shell for routability.
- Type consistency: The plan uses existing `GameWithScore`, `CompetitionWithTeam`, `queryKeys.games`, `queryKeys.competitionsByTeam`, `getAllGames`, and `getCompetitions`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-22-new-ui-all-games-dashboard.md`.

Recommended execution: subagent-driven task-by-task implementation, with a review and commit after each completed task.
