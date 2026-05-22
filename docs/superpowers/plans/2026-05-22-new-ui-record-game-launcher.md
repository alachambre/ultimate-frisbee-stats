# New UI Record Game Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the new UI record placeholder with a mobile-first field dashboard for team members.

**Architecture:** `/record` stays authenticated and shows started games first, then ready games, scoped to the selected team when one is available. Cards route to `/record/:gameId`; that route temporarily reuses the existing `GameDetailPage` recorder behind the new shell so the URL stays in the record flow while the dedicated recorder UI is built later.

**Tech Stack:** React, TypeScript, Material UI v7, TanStack Query, react-i18next, Vitest, React Testing Library, MSW.

---

## Files

- Create: `frontend/src/new-ui/record/buildNewRecordGamesView.ts`
- Create: `frontend/src/new-ui/record/__tests__/buildNewRecordGamesView.test.ts`
- Create: `frontend/src/new-ui/record/NewRecordGameCard.tsx`
- Create: `frontend/src/new-ui/record/NewRecordGamesSection.tsx`
- Create: `frontend/src/new-ui/record/__tests__/NewRecordGameCard.test.tsx`
- Modify: `frontend/src/new-ui/pages/NewRecordGamePage.tsx`
- Create: `frontend/src/new-ui/pages/__tests__/NewRecordGamePage.test.tsx`
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/routes/__tests__/AppRoutes.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

---

### Task 1: Record Games Builder

**Files:**
- Create: `frontend/src/new-ui/record/buildNewRecordGamesView.ts`
- Create: `frontend/src/new-ui/record/__tests__/buildNewRecordGamesView.test.ts`

- [ ] **Step 1: Write failing tests**

Cover selected-team scoping by competition id and splitting started/ready games:

```ts
expect(view.startedGames.map((game) => game.id)).toEqual([1]);
expect(view.readyGames.map((game) => game.id)).toEqual([2]);
expect(view.allRecordableGames.map((game) => game.id)).toEqual([1, 2]);
```

- [ ] **Step 2: Run RED**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewRecordGamesView.test.ts --reporter=verbose
```

- [ ] **Step 3: Implement builder**

Create a pure helper that accepts `games`, optional `selectedTeamId`, and optional `teamCompetitions`. If a team is selected, keep only games whose `competition_id` is in that team competition set. Split `startedGames` and `readyGames`; exclude ended games.

- [ ] **Step 4: Run GREEN and commit**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewRecordGamesView.test.ts --reporter=verbose
git add frontend/src/new-ui/record/buildNewRecordGamesView.ts frontend/src/new-ui/record/__tests__/buildNewRecordGamesView.test.ts
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add new UI record games builder"
```

---

### Task 2: Record Game Cards

**Files:**
- Create: `frontend/src/new-ui/record/NewRecordGameCard.tsx`
- Create: `frontend/src/new-ui/record/NewRecordGamesSection.tsx`
- Create: `frontend/src/new-ui/record/__tests__/NewRecordGameCard.test.tsx`

- [ ] **Step 1: Write failing card tests**

Assert a started game links to `/record/:id`, shows the score, and uses a continue-recording label. Assert a ready game uses a prepare-game label and still links to `/record/:id`.

- [ ] **Step 2: Run RED**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewRecordGameCard.test.tsx --reporter=verbose
```

- [ ] **Step 3: Implement cards**

Use Material UI cards with a large tap target, `StatusChip`, opponent, competition, score, date, and action label. Keep the layout compact for phone use.

- [ ] **Step 4: Run GREEN and commit**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewRecordGameCard.test.tsx --reporter=verbose
git add frontend/src/new-ui/record/NewRecordGameCard.tsx frontend/src/new-ui/record/NewRecordGamesSection.tsx frontend/src/new-ui/record/__tests__/NewRecordGameCard.test.tsx
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Add new UI record game cards"
```

---

### Task 3: Record Page Integration And Transitional Route

**Files:**
- Modify: `frontend/src/new-ui/pages/NewRecordGamePage.tsx`
- Create: `frontend/src/new-ui/pages/__tests__/NewRecordGamePage.test.tsx`
- Modify: `frontend/src/new-ui/NewUiRoutes.tsx`
- Modify: `frontend/src/routes/__tests__/AppRoutes.test.tsx`
- Modify: `frontend/src/locales/en/navigation.json`
- Modify: `frontend/src/locales/fr/navigation.json`

- [ ] **Step 1: Write failing page tests**

Cover:
- selected-team record dashboard shows started and ready games but excludes other-team games
- empty state appears when no recordable games exist
- `/record/:gameId` is routable and remains protected by `team_member`

- [ ] **Step 2: Run RED**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewRecordGamePage.test.tsx AppRoutes.test.tsx --reporter=verbose
```

- [ ] **Step 3: Implement page data flow**

Fetch `getAllGames()` with `queryKeys.games`, fetch selected-team competitions with `queryKeys.competitionsByTeam(selectedTeamId)`, pass both to `buildNewRecordGamesView`, and render started/ready sections with loading, error, and empty states.

- [ ] **Step 4: Add route and copy**

Add `record/:gameId` in `NewUiRoutes.tsx`, wrapping `GameDetailPage` with `RequireMinimumRole minimumRole="team_member"`. Add EN/FR labels under `navigation:newUiPages.recordGame`.

- [ ] **Step 5: Run focused tests and commit**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- NewRecordGamePage.test.tsx AppRoutes.test.tsx localeParity.test.ts --reporter=verbose
git add frontend/src/new-ui/pages/NewRecordGamePage.tsx frontend/src/new-ui/pages/__tests__/NewRecordGamePage.test.tsx frontend/src/new-ui/NewUiRoutes.tsx frontend/src/routes/__tests__/AppRoutes.test.tsx frontend/src/locales/en/navigation.json frontend/src/locales/fr/navigation.json
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH git commit -m "Build new UI record game launcher"
```

---

### Task 4: Verification And Browser QA

**Files:**
- No planned source edits; fix only concrete failures found during verification.

- [ ] **Step 1: Run targeted tests**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test -- buildNewRecordGamesView.test.ts NewRecordGameCard.test.tsx NewRecordGamePage.test.tsx AppRoutes.test.tsx localeParity.test.ts --reporter=verbose
```

- [ ] **Step 2: Run full frontend suite**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm test
```

- [ ] **Step 3: Run build**

```bash
cd frontend && PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

- [ ] **Step 4: Browser QA**

Open `/record`, verify started/ready sections, card tap targets, drawer access, old/new toggle, and `/record/1` transitional recorder route. Use `127.0.0.1:5173` for frontend QA so backend CORS allows the origin.

