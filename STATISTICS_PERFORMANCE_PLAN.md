# Statistics Performance Improvement Plan

## Context

The `/statistics` page has become slower as the workflow gained richer filters, player-filtered datasets, evolution charts, strategy analytics, timeline charts, and turnover-type breakdowns.

The current page can trigger several independent statistics requests for the same selected dataset:

- team aggregate statistics
- player statistics
- strategy statistics
- team evolution data
- single-game timeline data when exactly one game is selected

Each backend endpoint currently reloads and recomputes its own view of the dataset. Player filters are also applied after loading completed points, which means they do not reduce the initial point query cost.

The goal is to improve perceived and actual performance while keeping the app simple enough for a personal/team PWA.

## Goals

- Make the statistics page feel responsive when opening it and changing filters.
- Avoid repeated DB work for identical statistics datasets.
- Keep statistics correctness predictable after game edits.
- Avoid introducing infrastructure complexity unless needed.
- Preserve the current filter-based statistics UX.

## Non-Goals

- Real-time statistics during a running point.
- Distributed cache correctness across many backend instances.
- Rewriting the statistics domain model before measuring the current bottlenecks.

## Milestone 1: Frontend Request Reduction

### Objective

Stop fetching data before the user needs it.

### Work

- Fetch the Team tab first.
- Lazy-fetch Evolution, Strategies, Players, and Game trends only when their tab/section is opened.
- Keep React Query cache keys stable and normalized.
- Use previous/placeholder data while a filtered dataset is loading, so the full page does not visually reset.
- Keep the current player-filter draft behavior: apply player filter only when the dropdown closes.
- Add lightweight frontend timing/logging around statistics page load and filter changes while implementing the request-flow changes.

### Success Criteria

- Opening `/statistics` with a selected team no longer starts every statistics endpoint.
- Switching tabs fetches missing data once and then reuses cached data.
- Changing player filters causes one refetch batch, not one request per player click.

## Milestone 2: Backend Short-TTL Statistics Cache

Status: implemented with `backend/app/statistics_cache.py`, router-level cache
wrapping for the selected read-only statistics endpoints, and broad invalidation
after stats-affecting mutations.

### Objective

Avoid recomputing identical statistics datasets while a user explores the page.

### Proposed Approach

Use an in-memory TTL cache in the FastAPI process first. This is intentionally simple and acceptable for the current deployment profile.

### Cache Scope

Cache read-only statistics endpoints:

- `GET /statistics/teams/{team_id}/team`
- `GET /statistics/teams/{team_id}/players`
- `GET /statistics/teams/{team_id}/strategies`
- `GET /statistics/teams/{team_id}/evolution`
- `GET /statistics/games/{game_id}/timeline`

Do not cache:

- auth/session endpoints
- user/admin endpoints
- live tracker state
- mutations
- CSV exports initially

### Cache Key

Normalize all filters before building the key:

```text
statistics:{endpoint}:{scope_id}:competitions={sorted_ids}:games={sorted_ids}:players={sorted_ids}
```

Examples:

```text
statistics:team:12:competitions=3,4:games=all:players=7,9
statistics:evolution:12:competitions=all:games=all:players=all
statistics:timeline:44:players=7
```

### TTL

Start with 5 minutes.

This is acceptable because statistics are analytical in this app. The live tracker remains uncached and continues to show the current game state.

### Safety Rules

- Run auth and permission checks before returning cached data.
- Include every filter and scope value in the key.
- Cache only successful responses.
- Keep cache values process-local; accept cache loss on backend restart.
- Add a `STATISTICS_CACHE_TTL_SECONDS` setting so the cache can be disabled with `0`.
- Add compact backend timing logs for cached and uncached statistics reads:
  - endpoint path
  - team/game scope
  - filter sizes
  - cache hit/miss
  - duration

### Optional Invalidation

In addition to TTL, clear statistics cache after mutations that affect stats:

- point create/update/delete
- turnover create/update/delete
- stoppage create/update/delete
- game roster updates
- competition roster updates
- strategy updates if strategy names/categories affect returned statistics

This can start broad: clear the whole statistics cache on those mutations. The dataset is small enough that precise invalidation is not required initially.

### Success Criteria

- Reopening the same filtered statistics dataset within 5 minutes avoids backend recomputation.
- Cache behavior is covered by backend tests.
- Cache can be disabled through configuration.

## Milestone 3: Query and Relationship Optimization

### Objective

Reduce DB work for a single uncached statistics request.

### Work

- Eager-load `Point.players` for statistics point queries that need player filtering.
- Consider eager-loading `Point.strategy` where useful.
- Push player filtering into SQL when `player_ids` is present:
  - require points whose joined `point_players` contain every selected player
  - avoid loading unrelated points only to discard them in Python
- Optimize `/games` list score calculation with grouped aggregate queries instead of per-game point queries.
- Add indexes if missing for:
  - `points.game_id`
  - `points.status`
  - `point_players.point_id`
  - `point_players.player_id`
  - `turnovers.point_id`
  - `stoppages.point_id`

### Success Criteria

- Uncached player-filtered statistics requests load fewer rows.
- No N+1 query pattern for `point.players` during player filtering.
- `/statistics` controls load is not dominated by `/games`.

## Milestone 4: Shared Backend Statistics Dataset

### Objective

Avoid loading and filtering the same points separately for each statistics endpoint.

### Work

- Introduce an internal `StatisticsDataset` object containing:
  - scope metadata
  - completed points
  - players
  - turnovers by point
  - stoppages by point when needed
  - strategies by id when needed
  - normalized filters
- Refactor team/player/strategy/evolution calculations to use this dataset builder.
- Optionally expose a bundled endpoint if frontend needs multiple sections at once:

```text
GET /statistics/teams/{team_id}/summary?sections=team,players,strategies,evolution
```

### Success Criteria

- Backend calculations reuse one loaded dataset per request path.
- Existing endpoint contracts remain stable.
- Unit tests cover the shared dataset builder.

## Milestone 5: Regression Protection and UX Polish

### Objective

Keep performance from degrading again.

### Work

- Add backend tests for cache keys, TTL expiry, and mutation invalidation.
- Add frontend tests for lazy tab fetching.
- Add a small in-app refresh action for statistics data if users want immediate updates after editing games.
- Document expected statistics freshness:
  - live game state is immediate
  - statistics may be cached for up to 5 minutes

### Success Criteria

- Users understand that statistics are analytical and may be briefly cached.
- Tests prevent accidental eager refetching of every statistics endpoint.
- Performance behavior is documented for future changes.

## Recommended Order

1. Milestone 1: lazy frontend fetching and previous-data UX.
2. Milestone 2: 5-minute backend TTL cache.
3. Milestone 3: SQL/eager-loading optimization.
4. Milestone 4: shared backend dataset.
5. Milestone 5: polish and regression protection.

## Open Questions

- Should the cache be disabled automatically for games with status `started`, or is a 5-minute TTL acceptable for all statistics?
- Should a manual refresh button bypass the backend cache, or simply invalidate React Query on the frontend?
- Are CSV exports expected to reflect edits immediately, or can they reuse the same short TTL cache later?
- What is the largest realistic team dataset: number of games, completed points, and players?
