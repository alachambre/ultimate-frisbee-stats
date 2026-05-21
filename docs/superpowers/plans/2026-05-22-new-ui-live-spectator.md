# New UI Live Spectator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real public spectator mode in the new UI, separate from record-game usage.

**Architecture:** The new live page uses public-safe contracts only: `GET /games` to discover started games and `GET /games/{id}/live-state` to poll the selected game. The page renders `/live` as a live-games selector and `/live/:gameId` as the selected spectator board. All Games live cards route to `/live/:gameId`; non-live cards keep the transitional `/games/:gameId` detail route.

**Tech Stack:** React, TypeScript, Material UI v7, TanStack Query, react-i18next, Vitest, React Testing Library, MSW.

---

## Files

- Create: `frontend/src/new-ui/live/buildNewLiveGamesView.ts`
- Create: `frontend/src/new-ui/live/__tests__/buildNewLiveGamesView.test.ts`
- Create: `frontend/src/new-ui/live/NewLiveGameBoard.tsx`
- Create: `frontend/src/new-ui/live/NewLiveGamesList.tsx`
- Create: `frontend/src/new-ui/live/__tests__/NewLiveGameBoard.test.tsx`
- Modify: `frontend/src/new-ui/games/NewGameCard.tsx`
- Modify: `frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx`
- Modify: `frontend/src/new-ui/pages/NewLiveGamePage.tsx`
- Create: `frontend/src/new-ui/pages/__tests__/NewLiveGamePage.test.tsx`
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

---

### Task 1: Live Games View Builder And Card Routing

**Files:**
- Create: `frontend/src/new-ui/live/buildNewLiveGamesView.ts`
- Create: `frontend/src/new-ui/live/__tests__/buildNewLiveGamesView.test.ts`
- Modify: `frontend/src/new-ui/games/NewGameCard.tsx`
- Modify: `frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx`

- [ ] **Step 1: Write failing builder tests**

Test started games are selected, sorted by date ascending, and a requested game is selected when it is live.

```ts
expect(buildNewLiveGamesView({ games, selectedGameId: 2 }).selectedGame?.id).toBe(2);
expect(buildNewLiveGamesView({ games }).liveGames.map((game) => game.id)).toEqual([2, 1]);
```

- [ ] **Step 2: Run builder tests to verify RED**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewLiveGamesView.test.ts --reporter=verbose
```

Expected: fails because the file/function does not exist.

- [ ] **Step 3: Implement builder**

Create a pure helper:

```ts
export function buildNewLiveGamesView({ games, selectedGameId }: BuildNewLiveGamesViewInput) {
  const liveGames = games
    .filter((game) => game.status === "started")
    .sort((left, right) => compareNullableDatesAsc(left.date, right.date));
  return {
    liveGames,
    selectedGame: liveGames.find((game) => game.id === selectedGameId) ?? liveGames[0] ?? null,
  };
}
```

- [ ] **Step 4: Write failing card route tests**

Extend `NewGameCard` tests so started games link to `/live/:id` and completed/ready games still link to `/games/:id`.

- [ ] **Step 5: Implement card path logic**

Keep the visible card design unchanged and derive `to` internally:

```ts
const cardPath = game.status === "started" ? `/live/${game.id}` : `/games/${game.id}`;
```

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewLiveGamesView.test.ts NewGameCard.test.tsx --reporter=verbose
```

Commit:

```bash
git add frontend/src/new-ui/live/buildNewLiveGamesView.ts frontend/src/new-ui/live/__tests__/buildNewLiveGamesView.test.ts frontend/src/new-ui/games/NewGameCard.tsx frontend/src/new-ui/games/__tests__/NewGameCard.test.tsx
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Route new UI live games to spectator view"
```

---

### Task 2: Spectator Board Components

**Files:**
- Create: `frontend/src/new-ui/live/NewLiveGameBoard.tsx`
- Create: `frontend/src/new-ui/live/NewLiveGamesList.tsx`
- Create: `frontend/src/new-ui/live/__tests__/NewLiveGameBoard.test.tsx`

- [ ] **Step 1: Write failing board component tests**

Render a selected `GameWithScore` plus `GameLiveState` and assert the board shows opponent, competition, current score, active point number, possession context, and live event counts without roster-management controls.

- [ ] **Step 2: Run board tests to verify RED**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewLiveGameBoard.test.tsx --reporter=verbose
```

Expected: fails because the component does not exist.

- [ ] **Step 3: Implement `NewLiveGameBoard`**

Use Material UI `Paper`, `Stack`, `Typography`, `Chip`, and `Divider`. Keep it spectator-focused: score, opponent, competition, active point, possession, turnovers, stoppages, and last refresh state only. Do not expose player names or record-game actions.

- [ ] **Step 4: Implement `NewLiveGamesList`**

Render live games as compact selectable cards using `Link` to `/live/:gameId`, preserving mobile tap targets and using existing `StatusChip`.

- [ ] **Step 5: Run component tests and commit**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewLiveGameBoard.test.tsx --reporter=verbose
```

Commit:

```bash
git add frontend/src/new-ui/live/NewLiveGameBoard.tsx frontend/src/new-ui/live/NewLiveGamesList.tsx frontend/src/new-ui/live/__tests__/NewLiveGameBoard.test.tsx
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add new UI live spectator board"
```

---

### Task 3: Live Page Integration And Routing

**Files:**
- Modify: `frontend/src/new-ui/pages/NewLiveGamePage.tsx`
- Create: `frontend/src/new-ui/pages/__tests__/NewLiveGamePage.test.tsx`
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Write failing page tests**

Cover:
- `/live` shows public spectator heading and live games from `GET /games`.
- `/live/:gameId` fetches `GET /games/:id/live-state` and renders the selected board.
- Empty state appears when there are no started games.
- A non-live/unknown route parameter falls back to the first live game or the empty state.

- [ ] **Step 2: Run page tests to verify RED**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewLiveGamePage.test.tsx --reporter=verbose
```

Expected: fails because the page is still a placeholder and `/live/:gameId` is not routed.

- [ ] **Step 3: Add `/live/:gameId` route**

In `NewUiRoutes.tsx`, render `NewLiveGamePage` for both `live` and `live/:gameId`.

- [ ] **Step 4: Implement page data flow**

Use `useQuery({ queryKey: queryKeys.games, queryFn: getAllGames })`, `buildNewLiveGamesView`, and a second enabled query for `getGameLiveState(selectedGame.id)` with a modest refetch interval. Show shared loading/error states.

- [ ] **Step 5: Add EN/FR copy**

Add i18n labels under `navigation:newUiPages.liveGame` for heading, copy, empty state, live list title, board labels, and error/loading messages.

- [ ] **Step 6: Run focused route/page tests and commit**

Run:

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewLiveGamePage.test.tsx AppRoutes.test.tsx localeParity.test.ts --reporter=verbose
```

Commit:

```bash
git add frontend/src/new-ui/pages/NewLiveGamePage.tsx frontend/src/new-ui/pages/__tests__/NewLiveGamePage.test.tsx frontend/src/new-ui/NewUiRoutes.tsx frontend/src/locales/en/navigation.json frontend/src/locales/fr/navigation.json
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Build new UI live spectator page"
```

---

### Task 4: Verification And Browser QA

**Files:**
- No planned source edits; fix only concrete failures found during verification.

- [ ] **Step 1: Run targeted new UI tests**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewLiveGamesView.test.ts NewGameCard.test.tsx NewLiveGameBoard.test.tsx NewLiveGamePage.test.tsx AppRoutes.test.tsx localeParity.test.ts --reporter=verbose
```

- [ ] **Step 2: Run full frontend suite**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test
```

- [ ] **Step 3: Run production build**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

- [ ] **Step 4: Browser QA**

Start frontend/backend if needed, open `http://127.0.0.1:5173/live`, verify desktop and mobile layouts, click a live card from `/games`, confirm the old/new UI toggle remains available, and check for overflow in the header and live board.

- [ ] **Step 5: Commit any verification fixes**

Only commit if verification finds a real fix.

