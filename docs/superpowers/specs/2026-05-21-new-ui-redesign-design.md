# New UI Redesign Design

## Context

Monkey Statistics currently supports the needed workflows, but the UI mixes several contexts:

- recording a game from the sideline
- following a live game as a spectator
- browsing competitions and games after they are played
- analyzing statistics
- configuring teams, rosters, lines, and strategies

The new UI should make those contexts explicit while keeping the old UI available during the transition.

## Goals

- Provide an application-level Old/New UI toggle saved in `localStorage`.
- Keep the old UI available and working while the new UI is built and tested.
- Scope the new UI around the selected team.
- Auto-select the team when exactly one accessible team exists.
- Keep the interface professional, restrained, and Material UI based.
- Use a consistent semantic color system across the app.
- Avoid gender stereotypes and gender-coded color choices.
- Separate game-day recording, live spectator use, game archive browsing, and statistics analysis.
- Make sideline recording excellent on mobile.
- Preserve the current permission model and rollout behavior.
- Allow additive backend endpoints when they make the new UI simpler or more efficient.

## Non-Goals

- Removing the old UI in this project.
- Redesigning admin/user management deeply.
- Replacing the current auth and role model.
- Making multi-team operation a primary workflow. It remains supported, but the new UI optimizes for the common one-team case.

## Product Structure

The new UI is a parallel application shell behind an app-level toggle. The user is either in Old UI or New UI, not a mixed route-by-route experiment.

Top-level new UI areas:

- **Record game**: team-member sideline workflow for starting and continuing games.
- **Live game**: public spectator view for currently running games.
- **All games**: selected-team dashboard, competition/game archive, scheduling, and overview.
- **Statistics**: coach overview first, with advanced filtering and analysis still available.
- **Team setup**: team details, roster, lines, strategies, and configuration.
- **Admin**: existing user/admin surfaces, lightly restyled and kept simple.

The new UI can reuse existing service modules and components where they fit, but it should have its own page composition when the workflow is materially different.

## UI Mode Toggle

The Old/New UI toggle behaves like a theme toggle:

- It is persistently available in the app shell when space allows.
- On mobile, it is available from the burger menu or compact top bar.
- It is stored in `localStorage`.
- It must never lock the user into the new UI.
- Switching modes should preserve equivalent context when reasonable.
- If there is no equivalent route, switching to the new UI should fall back to the selected team's dashboard.

The old UI routes and current API contracts must keep working.

## Team Scope

The new UI is team-first:

- The shell owns selected-team state.
- If exactly one accessible team exists, it is auto-selected.
- If multiple teams exist, the last selected team is remembered in `localStorage`.
- If no team exists:
  - team members/admins see a path to create one in Team setup
  - public users see a public-safe empty state

Statistics and game workflows inherit the selected team instead of asking the user to pick a team repeatedly.

## Navigation And Shell

Most new UI pages use a standard team-scoped shell:

- selected team
- Old/New UI toggle
- language/auth controls
- permission-aware navigation
- top-level entries for Record game, Live game, All games, Statistics, Team setup, and Admin when available

Desktop can use a left rail or compact horizontal navigation. Mobile uses a top bar with a burger menu.

Active recording uses a game-specific top bar rather than the full global shell:

- score
- opponent
- current point state
- compact navigation menu

This keeps recording focused while still letting users navigate away when needed. Risky exits from an active point should preserve state or confirm the action.

## Record Game

Record game is optimized for team members on mobile.

Entry screen:

- shows ready/started games for the selected team
- prioritizes "Continue recording" for started games
- prioritizes "Start recording" for scheduled/ready games
- supports "Create quick game" for unscheduled matches

Field recording screen:

- large touch targets
- dominant current score, point status, and timer
- one primary action for the current state
- quick actions for Turnover, stoppage, line adjustment, comment, and related field tasks
- minimal statistics and minimal reading
- neutral mixity validation without gender-coded colors

Game-day quick setup is allowed from the recording flow:

- add a strategy
- adjust the current line
- add a missing player to the roster
- edit essential player details when needed

Broader or destructive setup remains in Team setup.

## Live Game

Live game is a dedicated spectator mode, primarily for unauthenticated friends following games.

It is read-only and public-safe:

- score
- game status
- current point context
- point timeline
- basic momentum or overview signals
- refresh/live status

It must not expose:

- recording controls
- roster management
- line edits
- strategy management
- privileged player statistics
- exports
- private team setup actions

Live game should be shareable by URL. It should use current public-safe/redacted payloads or new additive public-safe endpoints.

## All Games

All games is the main selected-team hub and archive. It is distinct from Statistics.

It is dashboard-first:

- selected-team overview
- current competitions
- upcoming games
- recent games
- recent results
- competition drill-down
- game drill-down

Team members can create competitions and schedule games from All games. Record game remains focused on actually starting or continuing a match.

All games explains what exists and what happened. Statistics explains performance.

## Statistics

Statistics becomes a coach overview first.

Default experience:

- high-signal KPIs
- trend summaries
- selected dataset context
- useful presets
- clear links into deeper analysis

Existing analytical power remains available:

- competition filters
- game filters
- player/cohort filters when permissions allow
- team, player, strategy, and evolution views
- refresh
- CSV export when permissions allow

Filters should be progressive:

- dataset summary first
- common presets next
- advanced filters in a drawer or collapsible panel
- active filters shown as chips

The page inherits the selected team from the shell.

## Team Setup

Team setup is the full configuration area:

- create/edit team
- roster
- lines
- strategies
- team-level configuration

It must remain usable on mobile. It does not need the same one-handed priority as Record game.

During recording, limited quick setup actions may open focused dialogs or bottom sheets and return the user to the active point.

## Admin

Admin/user management is included in the new shell, but it is a low-focus area for this redesign.

Expectations:

- keep current behavior
- lightly restyle for consistency
- keep it usable
- avoid deep workflow redesign unless required for compatibility

## Permissions And Rollout Modes

The new UI preserves the existing auth model:

- **public**: public spectator-safe reads
- **team_member**: recording and operational team data
- **team_analyst**: player filters, player statistics, CSV exports, and deeper analysis
- **admin**: user management and admin-only surfaces

The UI must respect rollout modes:

- `off`: preserve compatibility and avoid hard blocking
- `shadow`: allow validation without breaking workflows
- `enforced`: apply permission gates

New backend endpoints must follow the same permission and redaction rules as existing endpoints.

## Backend Design

Backend changes are allowed when they are additive and backward-compatible.

Candidate additive endpoints:

- selected-team dashboard / All games summary
- public live spectator summary
- coach overview statistics summary

Do not remove or break current endpoint contracts used by the old UI.

Prefer backend view models when they:

- avoid multiple fragile frontend joins
- centralize public redaction
- reduce statistics page complexity
- produce a stable dashboard or spectator contract

Avoid backend changes when the existing endpoint is already direct and clear.

## Visual System

The visual direction is professional and restrained:

- Material UI components
- semantic theme tokens
- consistent navigation, buttons, cards, panels, and empty/error states
- no hardcoded component colors
- no gender-coded palette
- high contrast for field actions
- compact layouts for operational surfaces
- calmer progressive disclosure for analysis surfaces

The current theme extraction provides a starting point. The new UI can extend it with more explicit semantic tokens if needed.

## Implementation Milestones

1. **Mode and shell foundation**
   - localStorage-backed Old/New UI state
   - new team-scoped shell
   - team auto-selection
   - permission-aware navigation

2. **All games foundation**
   - dashboard-first team hub
   - current competitions
   - upcoming/recent games
   - create competition and schedule game actions for team members

3. **Record game**
   - ready/started game entry
   - create quick game
   - mobile-first field recording screen
   - quick setup actions

4. **Live game spectator**
   - public read-only live board
   - shareable URL
   - public-safe endpoint usage or additive spectator endpoint

5. **Statistics**
   - coach overview
   - presets and dataset summary
   - advanced filter drawer/panel
   - analyst-only filters/export preserved

6. **Team setup and admin**
   - new shell integration
   - mobile-usable setup pages
   - light admin restyling

7. **Polish and compatibility**
   - route mapping for Old/New switching
   - visual QA on mobile and desktop
   - accessibility pass
   - old UI compatibility verification

## Testing And Verification

Implementation should include:

- focused React tests for mode switching, team selection, and permission-aware navigation
- MSW coverage for new view-model contracts where added
- backend API tests for any new endpoints
- frontend tests for Record game, Live game, All games, and Statistics entry flows
- `npm test`
- `npm run build`
- backend `pytest` when backend contracts change
- browser visual verification on mobile and desktop for major new screens

## Approved Decisions

- The New UI is application-level, not route-by-route.
- The Old/New toggle remains available to users.
- UI mode is saved in `localStorage`.
- The new UI is team-scoped.
- If there is one team, it is auto-selected.
- Primary flows are Record game, Live game, All games, Statistics, Team setup, and Admin.
- Live game spectator mode is separate from recording mode.
- Live game is mainly public/unauthenticated.
- Record game requires team-member permission when enforcement applies.
- All games is dashboard-first.
- Statistics is coach overview first, with full filters preserved.
- Backend additions are allowed if old UI compatibility is preserved.

## Open Validation Areas

These are design choices to validate during implementation and visual QA:

- Whether the recording screen's game-specific top bar is better than the standard shell on mobile.
- Whether Live game needs a dedicated public endpoint or can cleanly use existing public-safe payloads.
- Which statistics KPIs make the coach overview most useful by default.
- Whether Team setup belongs as a top-level item on all desktop widths or moves into a team/settings menu at some breakpoints.
