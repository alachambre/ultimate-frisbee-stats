# All Games Match Hub Design

## Context

This spec records the agreed redesign for the New UI `All games` page. It refines the broader New UI redesign spec and should be treated as the source of truth when implementing this page.

The page is no longer a generic dashboard-card grid. It is the selected team's match hub: the place to find competitions, schedule future games, enter a ready or live game, and review completed games.

Reference mockup:

- `.superpowers/brainstorm/18210-1779457497/content/all-games-final-steel-blue.html`

## Goals

- Make `All games` the main entry point for games, including games that can be recorded.
- Group games by competition.
- Keep the layout realistic for Material UI.
- Use a calmer primary color than the current navy.
- Keep the page distinct from Statistics: it shows game state and results, not detailed performance analysis.
- Keep the page usable on mobile.

## Non-Goals

- Building a separate standalone spectator page from this entry point.
- Showing detailed statistics such as hold rate, break rate, player stats, or turnover analytics.
- Adding year/status filters in the first version.
- Reworking the full Team setup or Statistics pages in this spec.

## Visual Direction

The page uses a restrained Material UI style:

- `AppBar` / top navigation in steel blue.
- `Container` for page width.
- `Paper` for summary metrics and accordion sections.
- `Accordion`, `AccordionSummary`, and `AccordionDetails` for competition groups.
- `Button` for page and row actions.
- `Chip` for compact state and result indicators.
- `TextField` or equivalent search input for opponent search.

Primary color:

- Steel blue: `#2F6690`

The color should become part of the semantic theme instead of being hardcoded in components.

## Navigation

The New UI top navigation for this page should show:

- `All games`
- `Statistics`
- `Team setup`

`Record` should not be a top-level navigation item. The recording entry point is the `Go` action on ready or live games inside `All games`.

## Header

The page header shows:

- selected team context, for example `Monkey Stats`
- title: `All games`
- short copy: `Competitions and games for the selected team.`
- primary action: `New game`
- secondary action: `New competition`

`New game` creates a game that will happen later. It does not imply immediate sideline recording.

`New competition` creates a competition from this page because competition grouping is central to the workflow.

## Summary

The summary strip contains four compact metrics:

- `Live`
- `Upcoming`
- `Completed`
- `Results`

`Results` is the win-loss-draw summary for completed games. Use `Results`, not `Record`, for this label.

If draws exist, display them consistently with the current app convention. A compact format such as `8-4-1` is acceptable when space is limited.

## Search And Sorting

The first version only needs opponent search.

Do not show year or status filters in the initial design.

Competitions and games should be sorted by dates without explanatory helper text:

- competitions with live or upcoming games appear first, ordered by their next relevant game date
- completed-only competitions appear after active/upcoming competitions, ordered by most recent game date
- games inside each competition are ordered by date, with live and upcoming games before older completed games when the competition is active

## Competition Sections

Each competition renders as a Material accordion.

Use native accordion affordances:

- chevron/expand icon from Material UI
- no large `Expand` / `Collapse` buttons
- summary row is clickable

Competition summary content:

- competition name
- date range or relevant date context
- total game count
- next game hint when useful
- compact chips for live/upcoming/completed/results, as applicable

Default expansion:

- competitions with live or upcoming games start expanded
- completed-only competitions start collapsed

This keeps current work visible without letting old competitions dominate the page.

## Game Rows

Each game row should be scan-friendly and compact.

Data shown:

- opponent name
- scheduled date/time or final date
- status chip or text (`Live`, `Ready`, `Won`, `Lost`, draw equivalent)
- score
- one primary row action

Actions:

- live game: `Go`
- ready game: `Go`
- completed game: `Review`

`Go` opens the live tracker route/component. The tracker decides, from permissions, whether the user can record the game or only follow it.

`Review` opens the completed game detail/review page.

## Permission Behavior

The page inherits existing auth and rollout behavior.

Public users:

- can see public-safe game information when allowed by existing redaction rules
- can use `Go` to follow a live or ready game in spectator-safe mode when the game is public-safe
- cannot create games or competitions

Team members:

- can create games and competitions
- can use `Go` to record ready or live games
- can review completed games

Analysts/admins:

- keep their current additional capabilities where relevant

The UI must not expose privileged controls in enforced mode when the user lacks the required capability.

## Mobile Behavior

The mobile layout keeps the same information hierarchy but stacks rows:

- page actions wrap under the title
- summary metrics become a two-column grid
- accordion summary keeps the chevron and competition name prominent
- game rows show opponent/date and score first
- row action becomes a full-width touch target when space is tight

Touch targets should be sized for field use, but the page remains a browsing hub rather than the active point-recording surface.

## Data Needs

The current frontend can build most of this view from:

- teams
- competitions
- games with score

If frontend joins become too fragile or inefficient, an additive backend view-model endpoint is acceptable, as long as old UI contracts remain unchanged.

Candidate view-model shape:

- selected team summary
- competition groups
- games per competition
- per-competition counts and results
- page-level summary counts and results

This is optional for the first implementation if the existing contracts are sufficient.

## Testing And Verification

Implementation should include:

- reducer/view-model tests for competition grouping and date sorting
- React tests for rendering active and completed competition accordions
- React tests for opponent search
- permission-aware action tests for `New game`, `New competition`, and `Go`
- mobile and desktop browser visual checks
- `npm test`
- `npm run build`

Backend tests are only required if a new backend endpoint is introduced.

## Approved Decisions

- Use a competition-grouped match hub list, not a dashboard card grid.
- Use Material UI accordions for competitions.
- Use native accordion affordances, not explicit large expand/collapse buttons.
- Use steel blue `#2F6690` as the primary color direction.
- Remove `Record` from the top-level New UI navigation.
- Use `All games` as the entry point for ready/live games.
- Use `New game` to schedule a future game.
- Add `New competition` from this page.
- Use `Go` for ready and live games.
- `Go` opens the tracker, with behavior depending on permissions.
- Drop the standalone spectator page as a primary navigation concept.
- Use `Review` for completed games.
- Use `Results` for win/loss/draw counts, not `Record`.
- Keep opponent search.
- Do not include year or status filters in the first version.
- Sort competitions and games by date.
