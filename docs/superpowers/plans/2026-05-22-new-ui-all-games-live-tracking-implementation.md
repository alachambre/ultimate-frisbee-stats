# New UI All Games And Live Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved New UI shell alignment, competition-grouped All Games page, and live game tracking states while keeping Old UI behavior and backend contracts intact.

**Architecture:** Keep the work inside the existing New UI route tree under `frontend/src/new-ui/`. Build small view-model helpers for grouping/sorting games, use Material UI components for the approved layouts, and route ready/live `Go` actions to one shared tracker component that adapts controls based on permissions.

**Tech Stack:** React, TypeScript, Material UI v7, TanStack Query, React Router, react-i18next, Vitest, MSW, React Testing Library.

---

## Source Specs

- `docs/superpowers/specs/2026-05-21-new-ui-redesign-design.md`
- `docs/superpowers/specs/2026-05-22-all-games-match-hub-design.md`
- `docs/superpowers/specs/2026-05-22-live-game-tracking-design.md`

## Current Code Map

- `frontend/src/new-ui/NewUiRoutes.tsx`: New UI route tree.
- `frontend/src/new-ui/shell/NewAppShell.tsx`: New UI shell, navigation, drawer, team selector, mode toggle.
- `frontend/src/theme.ts` and `frontend/src/mui-theme.d.ts`: semantic theme tokens.
- `frontend/src/new-ui/pages/NewAllGamesPage.tsx`: current All Games page.
- `frontend/src/new-ui/games/buildNewGamesDashboard.ts`: current game dashboard reducer.
- `frontend/src/new-ui/games/NewGameCard.tsx`: current card-style game item.
- `frontend/src/new-ui/games/NewGamesSection.tsx`: current live/upcoming/recent sections.
- `frontend/src/new-ui/games/NewGamesSummaryStrip.tsx`: current summary strip.
- `frontend/src/new-ui/pages/NewRecordGameDetailPage.tsx`: current New UI recording detail page using `LivePointTracker`.
- `frontend/src/new-ui/pages/NewLiveGamePage.tsx`: current spectator live page.
- `frontend/src/components/points/LivePointTracker.tsx`: shared old/new tracker composition shell.
- `frontend/src/components/points/liveTracker/*`: current live tracker internals and hooks.
- `frontend/src/locales/en/navigation.json` and `frontend/src/locales/fr/navigation.json`: New UI copy.
- `frontend/src/new-ui/**/__tests__/*`: focused New UI test coverage.

## Constraints

- Do not break Old UI routes or Old UI component defaults.
- Do not add a Supabase migration.
- Do not add backend endpoints unless a later implementation task proves the frontend joins are too fragile.
- Do not redesign game history in this pass.
- Keep public/spectator behavior permission-safe.
- Use theme tokens, not hardcoded component colors.
- Update EN and FR locale files together.

---

## Task 1: Align The New UI Shell And Theme

**Files:**
- Modify: `frontend/src/theme.ts`
- Modify: `frontend/src/mui-theme.d.ts`
- Modify: `frontend/src/new-ui/shell/NewAppShell.tsx`
- Modify: `frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Add a failing shell navigation test**

Update `frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx` so `team_member` navigation expects only the approved top-level New UI entries: `All games`, `Statistics`, and `Team setup`. Keep `Admin` for admins. Public users should see `All games` only.

Use assertions like:

```tsx
expect(screen.getByRole("link", { name: /^All games$/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /^Statistics$/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /^Team setup$/i })).toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Record game$/i })).not.toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Live game$/i })).not.toBeInTheDocument();
```

For public navigation:

```tsx
expect(screen.getByRole("link", { name: /^All games$/i })).toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Record game$/i })).not.toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Live game$/i })).not.toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Statistics$/i })).not.toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^Team setup$/i })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the shell test and confirm it fails**

Run:

```bash
cd frontend && npm test -- NewAppShell.test.tsx
```

Expected before implementation: failure because `Record game` and `Live game` still appear.

- [ ] **Step 3: Add New UI theme tokens**

Extend `frontend/src/mui-theme.d.ts`:

```ts
newUi: {
  primary: string;
  primarySoft: string;
  primaryBorder: string;
};
```

Add the same `newUi` shape under both `Theme.colors` and `ThemeOptions.colors`.

Update `frontend/src/theme.ts`:

```ts
colors: {
  offense: {
    main: "#1e3a8a",
    light: "#3b82f6",
    dark: "#1e40af",
  },
  defense: {
    main: "#1e3a8a",
    light: "#3b82f6",
    dark: "#1e40af",
  },
  men: {
    main: "#1e3a8a",
  },
  women: {
    main: "#38bdf8",
  },
  pull: {
    main: "#2d7a3e",
  },
  performance: {
    veryLow: "#d92d20",
    low: "#f79009",
    medium: "#fdb022",
    high: "#84cc16",
    veryHigh: "#16a34a",
  },
  newUi: {
    primary: "#2F6690",
    primarySoft: "#EAF3F8",
    primaryBorder: "#B9D5E5",
  },
}
```

Keep `palette.primary.main` unchanged unless a later visual pass intentionally changes the whole app. This keeps Old UI stable.

- [ ] **Step 4: Update New UI shell navigation**

In `frontend/src/new-ui/shell/NewAppShell.tsx`, build navigation as:

```ts
return [
  { label: t("navigation:menu.allGames"), path: "/games" },
  ...(canViewStatistics
    ? [{ label: t("navigation:menu.statistics"), path: "/statistics" }]
    : []),
  ...(canEditData
    ? [{ label: t("navigation:menu.teamSetup"), path: "/team-setup" }]
    : []),
  ...(auth.capabilities.canManageUsers
    ? [{ label: t("navigation:menu.admin"), path: "/admin/users" }]
    : []),
];
```

Keep the burger drawer, team selector, auth action, and Old/New UI toggle.

- [ ] **Step 5: Remove unused New UI nav labels only if unused**

Do not delete `navigation:menu.recordGame` or `navigation:menu.liveGame` yet if routes/tests still reference them. Keep locale changes limited to All Games labels in later tasks.

- [ ] **Step 6: Run the shell test**

Run:

```bash
cd frontend && npm test -- NewAppShell.test.tsx
```

Expected: pass.

- [ ] **Step 7: Commit shell alignment**

```bash
git add frontend/src/theme.ts frontend/src/mui-theme.d.ts frontend/src/new-ui/shell/NewAppShell.tsx frontend/src/new-ui/shell/__tests__/NewAppShell.test.tsx
git commit -m "Align new UI shell navigation"
```

---

## Task 2: Build The Competition-Grouped All Games View Model

**Files:**
- Modify: `frontend/src/new-ui/games/buildNewGamesDashboard.ts`
- Modify: `frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts`

- [ ] **Step 1: Add failing reducer tests for grouped competitions**

Add tests covering:

1. games are grouped by competition
2. active/upcoming competitions sort before completed-only competitions
3. games inside active competitions sort live, then ready/upcoming, then completed
4. completed-only competitions sort by most recent game
5. summary uses `results`, not `record`
6. opponent search filters games and removes empty competition groups

Expected view-model shape:

```ts
expect(dashboard.competitionGroups).toEqual([
  expect.objectContaining({
    competitionId: 10,
    competitionName: "Spring Cup",
    isInitiallyExpanded: true,
    games: [expect.objectContaining({ id: 3 })],
    summary: expect.objectContaining({
      live: 1,
      upcoming: 1,
      completed: 1,
      wins: 1,
      losses: 0,
      draws: 0,
    }),
  }),
]);
```

- [ ] **Step 2: Run reducer tests and confirm they fail**

Run:

```bash
cd frontend && npm test -- buildNewGamesDashboard.test.ts
```

Expected before implementation: fail because `competitionGroups` and opponent search do not exist.

- [ ] **Step 3: Extend reducer types**

In `buildNewGamesDashboard.ts`, add:

```ts
export interface NewGamesCompetitionGroupSummary {
  live: number;
  upcoming: number;
  completed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface NewGamesCompetitionGroup {
  competitionId: number;
  competitionName: string;
  startDate: string | null;
  endDate: string | null;
  nextRelevantDate: string | null;
  mostRecentDate: string | null;
  isInitiallyExpanded: boolean;
  games: GameWithScore[];
  summary: NewGamesCompetitionGroupSummary;
}
```

Extend args:

```ts
interface BuildNewGamesDashboardArgs {
  games: GameWithScore[];
  selectedTeamId?: number;
  teamCompetitions?: CompetitionWithTeam[];
  opponentSearch?: string;
}
```

Extend view:

```ts
export interface NewGamesDashboardView {
  allGames: GameWithScore[];
  liveGames: GameWithScore[];
  upcomingGames: GameWithScore[];
  recentGames: GameWithScore[];
  competitionGroups: NewGamesCompetitionGroup[];
  summary: NewGamesDashboardSummary;
  hasTeamScope: boolean;
}
```

- [ ] **Step 4: Implement grouping helpers**

Add helpers:

```ts
function isLiveGame(game: GameWithScore) {
  return game.status === "started";
}

function isCompletedGame(game: GameWithScore) {
  return game.status === "ended";
}

function isUpcomingGame(game: GameWithScore) {
  return !isLiveGame(game) && !isCompletedGame(game);
}

function filterByOpponentSearch(games: GameWithScore[], opponentSearch?: string) {
  const normalizedSearch = opponentSearch?.trim().toLocaleLowerCase();
  if (!normalizedSearch) {
    return games;
  }

  return games.filter((game) =>
    game.opponent_name.toLocaleLowerCase().includes(normalizedSearch)
  );
}
```

Implement group sorting so active groups come first:

```ts
function sortCompetitionGroups(
  left: NewGamesCompetitionGroup,
  right: NewGamesCompetitionGroup
) {
  if (left.isInitiallyExpanded !== right.isInitiallyExpanded) {
    return left.isInitiallyExpanded ? -1 : 1;
  }

  const leftDate = left.isInitiallyExpanded
    ? left.nextRelevantDate
    : left.mostRecentDate;
  const rightDate = right.isInitiallyExpanded
    ? right.nextRelevantDate
    : right.mostRecentDate;

  return left.isInitiallyExpanded
    ? compareDatesAscending(leftDate, rightDate)
    : compareDatesDescending(leftDate, rightDate);
}
```

Use small date comparison helpers that treat missing dates as last.

- [ ] **Step 5: Keep existing view fields compatible**

Keep `liveGames`, `upcomingGames`, `recentGames`, and `allGames` so existing tests/components keep working while the page migrates.

- [ ] **Step 6: Run reducer tests**

Run:

```bash
cd frontend && npm test -- buildNewGamesDashboard.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit grouped All Games reducer**

```bash
git add frontend/src/new-ui/games/buildNewGamesDashboard.ts frontend/src/new-ui/games/__tests__/buildNewGamesDashboard.test.ts
git commit -m "Group new UI games by competition"
```

---

## Task 3: Implement The All Games Accordion Page

**Files:**
- Create: `frontend/src/new-ui/games/NewCompetitionGamesAccordion.tsx`
- Modify: `frontend/src/new-ui/pages/NewAllGamesPage.tsx`
- Modify: `frontend/src/new-ui/games/NewGameCard.tsx`
- Modify: `frontend/src/new-ui/games/NewGamesSummaryStrip.tsx`
- Modify: `frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Add failing page tests**

Update `NewAllGamesPage.test.tsx` to assert:

```tsx
expect(screen.getByRole("button", { name: /New game/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /New competition/i })).toBeInTheDocument();
expect(screen.getByText("Results")).toBeInTheDocument();
expect(screen.queryByText("Record")).not.toBeInTheDocument();
expect(screen.queryByRole("link", { name: /Record game/i })).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: /Spring Cup/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /^Go$/i })).toHaveAttribute("href", "/live/1");
expect(screen.getByRole("link", { name: /^Review$/i })).toHaveAttribute("href", "/games/2");
```

Add an opponent search assertion:

```tsx
await user.type(screen.getByRole("textbox", { name: /Opponent search/i }), "Blue");
expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
expect(screen.queryByText("Red Hawks")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run page tests and confirm they fail**

Run:

```bash
cd frontend && npm test -- NewAllGamesPage.test.tsx
```

Expected before implementation: fail because the page still renders old section/card layout and old actions.

- [ ] **Step 3: Create competition accordion component**

Create `NewCompetitionGamesAccordion.tsx` with props:

```ts
interface NewCompetitionGamesAccordionProps {
  group: NewGamesCompetitionGroup;
  formatDate: (value: string | null) => string;
  labels: {
    live: string;
    upcoming: string;
    completed: string;
    results: string;
  };
}
```

Render with Material UI:

```tsx
<Accordion defaultExpanded={group.isInitiallyExpanded} disableGutters>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography component="h2" fontWeight={800} variant="subtitle1">
        {group.competitionName}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {formatDate(group.nextRelevantDate ?? group.mostRecentDate)}
      </Typography>
    </Stack>
    <Stack direction="row" spacing={0.75} sx={{ ml: "auto", flexWrap: "wrap" }}>
      {group.summary.live > 0 && (
        <Chip label={`${labels.live}: ${group.summary.live}`} size="small" />
      )}
      {group.summary.upcoming > 0 && (
        <Chip label={`${labels.upcoming}: ${group.summary.upcoming}`} size="small" />
      )}
      {group.summary.completed > 0 && (
        <Chip label={`${labels.completed}: ${group.summary.completed}`} size="small" />
      )}
      {group.summary.completed > 0 && (
        <Chip
          label={`${labels.results}: ${group.summary.wins}-${group.summary.losses}-${group.summary.draws}`}
          size="small"
          variant="outlined"
        />
      )}
    </Stack>
  </AccordionSummary>
  <AccordionDetails>
    <Stack spacing={1}>
      {group.games.map((game) => (
        <NewGameCard game={game} key={game.id} />
      ))}
    </Stack>
  </AccordionDetails>
</Accordion>
```

Keep native accordion affordance only. Do not add large expand/collapse buttons.

- [ ] **Step 4: Update game row/card behavior**

In `NewGameCard.tsx`, change labels:

```ts
if (status === "started" || status === "ready") {
  return t("navigation:newUiPages.allGames.actions.go", {
    defaultValue: "Go",
  });
}

return t("navigation:newUiPages.allGames.actions.review", {
  defaultValue: "Review",
});
```

Change route behavior:

```ts
const cardPath =
  game.status === "ended" ? `/games/${game.id}` : `/live/${game.id}`;
```

The component can remain a compact `CardActionArea` first, then later become a denser row if visual QA shows the card is too heavy. Keep this change minimal in this task.

- [ ] **Step 5: Update All Games page state and actions**

In `NewAllGamesPage.tsx`:

1. Add local state:

```ts
const [opponentSearch, setOpponentSearch] = useState("");
const [isCreateCompetitionOpen, setIsCreateCompetitionOpen] = useState(false);
const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
```

2. Pass search to reducer:

```ts
buildNewGamesDashboard({
  games,
  selectedTeamId: effectiveSelectedTeamId,
  teamCompetitions,
  opponentSearch,
});
```

3. Replace `Record game`, `Live games`, `Statistics` buttons with:

```tsx
{canEditData && (
  <>
    <Button onClick={() => setIsCreateGameOpen(true)} variant="contained">
      {t("newUiPages.allGames.actions.newGame")}
    </Button>
    <Button onClick={() => setIsCreateCompetitionOpen(true)} variant="outlined">
      {t("newUiPages.allGames.actions.newCompetition")}
    </Button>
  </>
)}
```

4. Add opponent search:

```tsx
<TextField
  fullWidth
  label={t("newUiPages.allGames.filters.opponent")}
  onChange={(event) => setOpponentSearch(event.target.value)}
  value={opponentSearch}
/>
```

5. Render `dashboard.competitionGroups` with `NewCompetitionGamesAccordion`.

6. Mount existing modals:

```tsx
<CreateCompetitionModal
  isOpen={isCreateCompetitionOpen}
  onClose={() => setIsCreateCompetitionOpen(false)}
/>
<CreateGameModal
  isOpen={isCreateGameOpen}
  onClose={() => setIsCreateGameOpen(false)}
/>
```

- [ ] **Step 6: Update summary strip labels**

Change summary labels from:

```ts
record: t("newUiPages.allGames.summary.record")
```

to:

```ts
results: t("newUiPages.allGames.summary.results")
```

Update `NewGamesSummaryStrip.tsx` props accordingly while preserving the same displayed value format for wins/losses/draws.

- [ ] **Step 7: Update EN/FR copy**

In English:

```json
"copy": "Competitions and games for the selected team.",
"actions": {
  "newGame": "New game",
  "newCompetition": "New competition",
  "go": "Go",
  "review": "Review"
},
"summary": {
  "live": "Live",
  "upcoming": "Upcoming",
  "completed": "Completed",
  "results": "Results"
},
"filters": {
  "opponent": "Opponent search"
}
```

In French:

```json
"copy": "Compétitions et matchs de l'équipe sélectionnée.",
"actions": {
  "newGame": "Nouveau match",
  "newCompetition": "Nouvelle compétition",
  "go": "Go",
  "review": "Revoir"
},
"summary": {
  "live": "En direct",
  "upcoming": "À venir",
  "completed": "Terminés",
  "results": "Résultats"
},
"filters": {
  "opponent": "Rechercher un adversaire"
}
```

Keep `Go` untranslated for consistency with the approved button label.

- [ ] **Step 8: Run All Games tests**

Run:

```bash
cd frontend && npm test -- buildNewGamesDashboard.test.ts NewAllGamesPage.test.tsx NewGameCard.test.tsx
```

Expected: pass.

- [ ] **Step 9: Commit All Games accordion implementation**

```bash
git add frontend/src/new-ui/games frontend/src/new-ui/pages/NewAllGamesPage.tsx frontend/src/new-ui/pages/__tests__/NewAllGamesPage.test.tsx frontend/src/locales/en/navigation.json frontend/src/locales/fr/navigation.json
git commit -m "Implement new UI all games hub"
```

---

## Task 4: Route Ready And Live Games To One Tracker Surface

**Files:**
- Create: `frontend/src/new-ui/pages/NewGameTrackerPage.tsx`
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/new-ui/pages/NewLiveGamePage.tsx`
- Modify: `frontend/src/new-ui/pages/NewRecordGameDetailPage.tsx`
- Modify: `frontend/src/routes/__tests__/AppRoutes.test.tsx`
- Create or modify: `frontend/src/new-ui/pages/__tests__/NewGameTrackerPage.test.tsx`

- [ ] **Step 1: Add failing route tests**

In `AppRoutes.test.tsx`, assert New UI mode routes:

```tsx
renderAppRoutes("new", "/live/1");
expect(await screen.findByText(/Loading/i)).toBeInTheDocument();
```

Keep this test broad if MSW setup makes full route content noisy. The goal is to ensure `/live/:gameId` remains routable and is not protected for public users.

- [ ] **Step 2: Add failing tracker page tests**

Create `NewGameTrackerPage.test.tsx` to cover:

1. public user sees score and no recording controls
2. team member sees game actions
3. ready/started games render the shared tracker

Use MSW responses for:

- `GET /games/:id`
- `GET /games/:id/live-state`
- `GET /games/:id/turnovers`

Assert:

```tsx
expect(await screen.findByText("Monkey vs Blue Tigers")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /^Roster$/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /^Stats$/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /^Edit$/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /^Complete$/i })).toBeInTheDocument();
```

For public:

```tsx
expect(screen.queryByRole("button", { name: /^New point$/i })).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: /^Complete$/i })).not.toBeInTheDocument();
```

- [ ] **Step 3: Run tracker route tests and confirm they fail**

Run:

```bash
cd frontend && npm test -- AppRoutes.test.tsx NewGameTrackerPage.test.tsx
```

Expected before implementation: `NewGameTrackerPage` does not exist and `/live/:gameId` still renders the spectator board/list behavior.

- [ ] **Step 4: Create `NewGameTrackerPage`**

Move the fetch/mutation structure from `NewRecordGameDetailPage.tsx` into the new page, but do not include game history. Use:

```ts
const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
const canViewPlayerStatistics =
  !shouldProtectUi || auth.capabilities.canViewPlayerStatistics;
const data = useGameDetailPageData(gameId, canViewPlayerStatistics);
```

Render:

- compact score/header
- game actions row/rail
- `LivePointTracker` or its field variant
- roster/edit/complete dialogs

Keep:

- `GameRosterDialog`
- `EditGameModal`
- `finishGame`
- `updateGame`
- `invalidateGameAfterPointMutation`

Remove from this new page:

- `GameHistorySection`
- point delete dialog
- halftime delete handling

Those remain in old/new review pages until history is redesigned.

- [ ] **Step 5: Wire routes**

In `NewUiRoutes.tsx`:

```tsx
const NewGameTrackerPage = lazy(() => import("./pages/NewGameTrackerPage"));
```

Set:

```tsx
<Route path="live/:gameId" element={renderLazyRoute(<NewGameTrackerPage />)} />
<Route
  path="record/:gameId"
  element={renderLazyRoute(
    <RequireMinimumRole minimumRole="team_member">
      <NewGameTrackerPage />
    </RequireMinimumRole>
  )}
/>
```

Keep `/live` for the current live list page for now, but remove it from shell navigation. It can be revisited later.

- [ ] **Step 6: Keep `NewRecordGameDetailPage` temporarily intact or reduce it safely**

If `NewRecordGameDetailPage` becomes unused after route changes, leave it in place for this task to reduce risk. Remove it only in a later cleanup after tests prove no route imports it.

- [ ] **Step 7: Run route and tracker tests**

Run:

```bash
cd frontend && npm test -- AppRoutes.test.tsx NewGameTrackerPage.test.tsx
```

Expected: pass.

- [ ] **Step 8: Commit route and tracker surface**

```bash
git add frontend/src/new-ui/NewUiRoutes.tsx frontend/src/new-ui/pages/NewGameTrackerPage.tsx frontend/src/new-ui/pages/__tests__/NewGameTrackerPage.test.tsx frontend/src/routes/__tests__/AppRoutes.test.tsx
git commit -m "Route new UI games to shared tracker"
```

---

## Task 5: Implement The Approved Active And No-Active Point Tracking UI

**Files:**
- Modify: `frontend/src/components/points/LivePointTracker.tsx`
- Modify: `frontend/src/components/points/liveTracker/LivePointHeader.tsx`
- Modify: `frontend/src/components/points/liveTracker/LivePointActionBar.tsx`
- Modify: `frontend/src/components/points/liveTracker/LivePointContextCards.tsx`
- Modify: `frontend/src/components/points/__tests__/LivePointTracker.test.tsx`
- Modify: `frontend/src/locales/en/points.json`
- Modify: `frontend/src/locales/fr/points.json`

- [x] **Step 1: Add failing tracker UI tests**

Extend `LivePointTracker.test.tsx` with a new describe block for the New UI variant:

```tsx
render(
  <LivePointTracker
    activePoint={runningPoint}
    activePointStoppages={[]}
    activePointTurnovers={[]}
    game={game}
    onPointUpdated={vi.fn()}
    players={players}
    readOnly={false}
    teamId={1}
    variant="field"
  />
);
```

Assert active state:

```tsx
expect(screen.getByText("Current point")).toBeInTheDocument();
expect(screen.getByText("Point 3")).toBeInTheDocument();
expect(screen.getByText("Defense")).toBeInTheDocument();
expect(screen.getByText("Women")).toBeInTheDocument();
expect(screen.getByText("Defense / Zone defense")).toBeInTheDocument();
expect(screen.queryByText(/Line valid/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Field side/i)).not.toBeInTheDocument();
```

Assert no-active state:

```tsx
expect(screen.getByText("No active point")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /^New point$/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /^Half time$/i })).toBeInTheDocument();
expect(screen.queryByText(/Game history/i)).not.toBeInTheDocument();
```

- [x] **Step 2: Run tracker tests and confirm they fail**

Run:

```bash
cd frontend && npm test -- LivePointTracker.test.tsx
```

Expected before implementation: fail because `variant="field"` does not exist and current labels differ.

- [x] **Step 3: Add an optional variant prop**

In `LivePointTracker.tsx`, extend the existing props interface with only the new optional field:

```ts
interface LivePointTrackerProps {
  activePoint: PointWithPlayers | null;
  activePointTurnovers: TurnoverWithPlayer[];
  activePointStoppages?: Stoppage[];
  game: GameDetail;
  onPointUpdated?: () => void;
  players: Player[];
  readOnly?: boolean;
  teamId: number;
  variant?: "classic" | "field";
}
```

Default:

```ts
variant = "classic",
```

Keep current behavior for `classic` so Old UI and existing New UI pages are not broken.

- [x] **Step 4: Render field no-active state**

When `variant === "field"` and `!currentPoint`, render a field-style card:

```tsx
<Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1 }}>
  <Typography color="text.secondary" variant="overline">
    {t("points:tracker.liveTracking", "Live tracking")}
  </Typography>
  <Typography component="h2" fontWeight={900} variant="h5">
    {t("points:tracker.noActivePoint", "No active point")}
  </Typography>
  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
    {t(
      "points:tracker.noActivePointCopy",
      "No point is currently running. The next action is available at the bottom of the screen."
    )}
  </Typography>
</Paper>
```

For recorder mobile actions, use the same existing `Start Point` dialog trigger and halftime confirmation trigger, but label them:

```tsx
{t("points:tracker.newPoint", "New point")}
{t("points:tracker.halfTime", "Half time")}
```

Do not duplicate these buttons inside the no-active card on mobile. For desktop, inline actions are acceptable if the sticky mobile deck is hidden by breakpoint.

- [x] **Step 5: Render field active state**

For `variant === "field"` and `currentPoint`, render:

- `Current point`
- point number
- timer
- chips for status, offense/defense, gender ratio
- strategy row
- comment row
- sticky mobile actions

Do not render:

- field side
- pull inbound at top level
- `Line valid`

Keep pull inbound mutation available through dialogs or future More menu if current behavior still needs it. If existing pull prompt is required to launch defensive points, place it behind `More` for this first implementation only if tests show the old prompt blocks normal use.

- [x] **Step 6: Update field action labels**

For running points in the field variant:

```tsx
primary: t("points:tracker.finish", "Finish point")
secondary: t("points:recordTurnover", "Record Turnover")
secondary: t("points:recordCall", "Record stoppage")
secondary: t("points:tracker.line", "Line")
secondary: t("common:action.moreActions", "More")
```

Keep the existing button handlers.

- [x] **Step 7: Update EN/FR point copy**

Add English:

```json
"tracker": {
  "liveTracking": "Live tracking",
  "noActivePoint": "No active point",
  "noActivePointCopy": "No point is currently running. The next action is available at the bottom of the screen.",
  "line": "Line"
}
```

Add French equivalents while keeping sport terms from `GLOSSARY.md` in English where applicable:

```json
"tracker": {
  "liveTracking": "Saisie en direct",
  "noActivePoint": "Aucun point actif",
  "noActivePointCopy": "Aucun point n'est en cours. La prochaine action est disponible en bas de l'écran.",
  "line": "Ligne"
}
```

- [x] **Step 8: Use the field variant in `NewGameTrackerPage`**

Pass:

```tsx
<LivePointTracker
  activePoint={activePoint || null}
  activePointStoppages={activePointStoppages}
  activePointTurnovers={activePointTurnovers}
  game={game}
  onPointUpdated={handlePointUpdated}
  players={game.players}
  readOnly={!canEditData}
  teamId={competition.team_id}
  variant="field"
/>
```

- [x] **Step 9: Run tracker tests**

Run:

```bash
cd frontend && npm test -- LivePointTracker.test.tsx NewGameTrackerPage.test.tsx
```

Expected: pass.

- [x] **Step 10: Commit field tracker UI**

```bash
git add frontend/src/components/points frontend/src/new-ui/pages/NewGameTrackerPage.tsx frontend/src/locales/en/points.json frontend/src/locales/fr/points.json
git commit -m "Implement field live tracking states"
```

---

## Task 6: Final Integration, Visual QA, And Cleanup

**Files:**
- Expected no required source files.
- If focused tests or visual QA expose a defect, modify only the affected New UI file and its matching test.
- Do not delete Old UI code.

- [x] **Step 1: Run focused New UI tests**

Run:

```bash
cd frontend && npm test -- NewAppShell.test.tsx buildNewGamesDashboard.test.ts NewAllGamesPage.test.tsx NewGameCard.test.tsx NewGameTrackerPage.test.tsx LivePointTracker.test.tsx
```

Expected: pass.

- [x] **Step 2: Run full frontend tests**

Run:

```bash
cd frontend && npm test
```

Expected: pass.

- [x] **Step 3: Run frontend build**

Run:

```bash
cd frontend && npm run build
```

Expected: pass.

- [x] **Step 4: Run browser visual checks**

Start the frontend if needed:

```bash
cd frontend && npm run dev
```

Check:

- New UI shell desktop navigation.
- New UI shell mobile drawer.
- All Games page mobile and desktop.
- `/live/:gameId` for a ready game as team member.
- `/live/:gameId` for a started game as team member.
- `/live/:gameId` as public/spectator.

Confirm:

- no text overlaps
- sticky mobile actions do not cover required controls
- Old/New toggle remains reachable
- game actions and point actions are visually separate
- no hardcoded pink/blue gender stereotypes are introduced

- [x] **Step 5: Decide whether stale New UI entry points stay**

Run:

```bash
rg "NewRecordGamePage|NewLiveGamePage|path=\"record\"|path=\"live\"" frontend/src
```

Decision for this implementation:

- Keep `/record` and `/live` routes if the search shows tests or route references.
- Do not delete `NewRecordGamePage` or `NewLiveGamePage` in this implementation.
- File a follow-up note in the final answer if they remain as non-primary fallback routes.

- [x] **Step 6: Commit final cleanup only when files changed**

```bash
git add frontend/src
git commit -m "Polish new UI game flows"
```

Skip this commit if `git status --short` is clean after verification.

---

## Review Checklist

- Shell nav matches the latest All Games spec: `All games`, `Statistics`, `Team setup`, and admin when allowed.
- `Record` is not a New UI top-level nav item.
- `Live game` is not a New UI top-level nav item.
- Old/New UI toggle remains available on desktop and mobile.
- All Games is grouped by competitions using Material accordions.
- All Games has `New game` and `New competition`.
- All Games uses `Results`, not `Record`.
- All Games has opponent search only.
- Ready and live games use `Go`.
- Completed games use `Review`.
- `Go` opens a tracker page/component with permission-adapted behavior.
- Live tracker game actions are `Roster`, `Stats`, `Edit`, and `Complete`.
- Live tracker does not show delete as a primary action.
- Current point does not show field side, pull inbound, or `Line valid` at the top.
- No-active-point state says `No active point`.
- Mobile no-active-point state shows `New point` and `Half time` once.
- Game history redesign is not included.
- EN/FR locale keys stay in sync.
- Frontend tests and build pass.
