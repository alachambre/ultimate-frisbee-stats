# Turnover Type Implementation Plan

## Objective

Add a structured `turnover_type` to turnovers across the full app:

- stored in database
- required at turnover creation time
- visible in point history, including `public` mode
- available in backend statistics
- displayed in team / player / strategy statistics

This change requires a database migration because existing turnovers must be backfilled.

## Product Rules

### Turnover types

Recommended internal enum values:

- `defended_pass`
- `missed_pass`
- `defended_huck`
- `missed_huck`
- `drop`
- `stall_out`
- `wind`
- `other`

Recommended labels:

| Internal value | French label | English label |
| --- | --- | --- |
| `defended_pass` | Passe défendue | Defended pass |
| `missed_pass` | Passe ratée | Missed pass |
| `defended_huck` | Longue défendue | Defended huck |
| `missed_huck` | Longue ratée | Missed huck |
| `drop` | Drop | Drop |
| `stall_out` | Stall out | Stall out |
| `wind` | Vent | Wind |
| `other` | Autre | Other |

Notes:

- I recommend stable English snake_case values in the API and DB, with translated labels only in the UI.
- `huck` is a more natural ultimate term here than `deep`, while `longue` stays the right French user-facing label.

### Existing data

All existing turnovers should be backfilled to:

- `turnover_type = 'other'`

After backfill, `turnover_type` should be non-nullable.

### Public mode

Turnover type should remain visible in `public` mode.

That means public turnover redaction should still hide:

- comments

But should keep:

- timestamp
- structured turnover ownership inferred from sequence
- turnover type

### Statistics expectations

We want turnover type statistics:

- globally across all selected points
- on points started on offense
- on points started on defense
- and within each of those scopes:
  - turnovers when we had the disc and lost possession
  - turnovers when the opponent had the disc and lost possession
- with count and percentage for each turnover type in each bucket

Later or in a second pass, we can also split those stats by defensive strategy.

### Statistics matrix

For each statistics scope (game, competition, team, filtered dataset, player on-field view), we want 6 turnover-type buckets:

- `all_points.our_possession_turnovers`
- `all_points.opponent_possession_turnovers`
- `started_on_offense.our_possession_turnovers`
- `started_on_offense.opponent_possession_turnovers`
- `started_on_defense.our_possession_turnovers`
- `started_on_defense.opponent_possession_turnovers`

This matches the product question you want to answer:

- what kinds of turnovers happen when we lose the disc
- what kinds of turnovers happen when we win the disc back
- globally, on offensive starts, and on defensive starts

## Recommended Architecture

### 1. Turnover type as a first-class enum

Treat turnover type as a required structured field, similar to `stoppage_type`.

This should exist consistently in:

- SQLAlchemy model
- Pydantic schemas
- TypeScript types
- creation / update API contracts
- i18n label helpers

### 2. Use percentages relative to bucket totals

For team and player stats, percentages should be phase-relative:

- `all_points.our_possession_turnovers` percentage
  = count of that type / all turnovers where we lost possession
- `all_points.opponent_possession_turnovers` percentage
  = count of that type / all turnovers where opponent lost possession
- `started_on_offense.our_possession_turnovers` percentage
  = count of that type / turnovers where we lost possession on points started on offense
- `started_on_offense.opponent_possession_turnovers` percentage
  = count of that type / turnovers where opponent lost possession on points started on offense
- `started_on_defense.our_possession_turnovers` percentage
  = count of that type / turnovers where we lost possession on points started on defense
- `started_on_defense.opponent_possession_turnovers` percentage
  = count of that type / turnovers where opponent lost possession on points started on defense

This produces intuitive distribution stats inside each real analytical bucket.

### 3. Keep possession ownership and turnover type separate

The existing possession logic is still correct and should remain the source of truth for:

- `our_turnovers`
- `opponent_turnovers`

Turnover type is a classification of the turnover event itself, not a replacement for possession-based logic.

### 4. Player turnover type stats remain on-field stats

As today, player turnover statistics should continue to mean:

- events while that player was on the field

Not:

- events personally caused by that player

This is important because the turnover UI intentionally does not attribute a player.

## Current Touchpoints

### Backend

- [backend/app/models/turnover.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\models\turnover.py)
- [backend/app/schemas/turnover.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\schemas\turnover.py)
- [backend/app/crud/turnovers.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\crud\turnovers.py)
- [backend/app/routers/turnovers.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\routers\turnovers.py)
- [backend/app/auth/redaction.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\auth\redaction.py)
- [backend/app/crud/statistics_calculations.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\crud\statistics_calculations.py)
- [backend/app/schemas/statistics.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\schemas\statistics.py)
- [backend/app/crud/statistics.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\crud\statistics.py)
- [backend/app/crud/statistics_queries.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\crud\statistics_queries.py)

### Frontend

- [frontend/src/types/index.ts](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\types\index.ts)
- [frontend/src/components/modals/RecordTurnoverDialog.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\modals\RecordTurnoverDialog.tsx)
- [frontend/src/components/points/PointEventsHistory.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\points\PointEventsHistory.tsx)
- [frontend/src/services/turnovers.ts](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\services\turnovers.ts)
- [frontend/src/components/statistics/TeamStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\TeamStatistics.tsx)
- [frontend/src/components/statistics/PlayerScopeStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\PlayerScopeStatistics.tsx)
- [frontend/src/components/statistics/StrategyStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\StrategyStatistics.tsx)
- turnover / points locale files under `frontend/src/locales/*`

## Proposed Milestones

## Milestone 1: Data Model, Enum, and Migration

### Scope

Add the structured turnover type in the backend model and database.

### Deliverables

- new turnover type enum in backend
- `turnover_type` column on `turnovers`
- Supabase migration with backfill to `other`
- schemas updated to expose the field

### Tasks

- Add backend enum definition for turnover types
- Add `turnover_type` column to [turnover.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\models\turnover.py)
- Update [turnover.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\schemas\turnover.py):
  - `TurnoverBase`
  - `TurnoverCreate`
  - `TurnoverUpdate`
  - `Turnover`
  - `TurnoverWithPlayer`
- Create Supabase migration in `supabase/migrations/`:
  - add column nullable
  - backfill all rows to `other`
  - set default temporarily if needed
  - make column non-nullable
- Update local/test builders if turnover builders or fixtures exist

### Acceptance Criteria

- all turnover payloads include `turnover_type`
- existing DB rows are backfilled to `other`
- new rows cannot be created without a valid turnover type

### Tests

#### UTests

- turnover schema validation accepts only supported enum values
- default/backfill logic is correct for legacy rows

#### ITests

- create turnover API persists `turnover_type`
- get/list turnover endpoints return `turnover_type`
- invalid `turnover_type` returns `400` or validation failure

## Milestone 2: Turnover Creation UX and History Display

### Scope

Expose turnover type selection in the UI and display it in point history, including public mode.

### Deliverables

- turnover type selector in create dialog
- localized labels and helper mapping
- turnover type shown in point chronology/history cards
- public-safe turnover serialization keeps the type

### Tasks

- Add TS turnover type union in [index.ts](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\types\index.ts)
- Update [RecordTurnoverDialog.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\modals\RecordTurnoverDialog.tsx):
  - add required type selection
  - use button-based selector similar to stoppage type
  - keep comments optional
- Add turnover type label helper, similar to stoppages
- Update [PointEventsHistory.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\points\PointEventsHistory.tsx) to show the type label on turnover cards
- Update backend redaction so public mode still returns `turnover_type`
- Add EN/FR translation keys

### Acceptance Criteria

- users must choose a turnover type before saving
- turnover history shows the selected type
- public users can see turnover type in history
- turnover comments remain redacted in public mode

### Tests

#### UTests

- label helper maps every turnover type correctly in EN and FR
- turnover dialog submit payload includes `turnover_type`

#### ITests

- turnover creation flow works from the live tracker
- point chronology renders type labels
- public game history returns turnover types but not turnover comments

## Milestone 3: Statistics Data Model and Backend Aggregation

### Scope

Add turnover type aggregations to statistics payloads.

### Deliverables

- reusable turnover type aggregation helpers
- structured turnover-type totals and percentages for all 6 buckets
- player on-field turnover type stats
- optional strategy split foundation

### Tasks

- Introduce shared statistics schema blocks, for example:
  - `TurnoverTypeCount`
  - `TurnoverTypeDistribution`
- Recommended contract shape:
  - `total_turnovers`
  - `by_type: { defended_pass: { count, percentage }, ... }`
- Recommended phase contract shape:
  - `all_points`
    - `our_possession_turnovers`
    - `opponent_possession_turnovers`
  - `started_on_offense`
    - `our_possession_turnovers`
    - `opponent_possession_turnovers`
  - `started_on_defense`
    - `our_possession_turnovers`
    - `opponent_possession_turnovers`
- Compute aggregations in [statistics_calculations.py](C:\Users\lacha\projets\ultimate-frisbee-stats\backend\app\crud\statistics_calculations.py)
- Extend:
  - team stats
  - player offense stats
  - player defense stats
- Decide whether strategy stats ship in the same milestone or the next one

### Recommended Aggregation Rules

#### Ownership dimension

For every turnover event, first classify who had the disc before the turnover:

- if we had possession before the event:
  - bucket it under `our_possession_turnovers`
- if the opponent had possession before the event:
  - bucket it under `opponent_possession_turnovers`

#### Phase dimension

Then classify the same event into:

- `all_points`
- `started_on_offense` if the point started on offense
- `started_on_defense` if the point started on defense

### Acceptance Criteria

- team stats expose turnover type distributions for all 6 buckets
- player stats expose the same 6-bucket structure on on-field events
- percentages sum to approximately `100%` inside each populated bucket

### Tests

#### UTests

- aggregation helper counts each type correctly
- possession ownership bucketing is correct
- point-start phase bucketing is correct
- percentages use the correct bucket denominator
- empty datasets return zeroed distributions safely
- player on-field aggregation includes only points containing that player

#### ITests

- game statistics endpoint exposes turnover type distributions
- competition statistics endpoint aggregates correctly across multiple games
- team statistics endpoint aggregates correctly across selected filters

## Milestone 4: Statistics UI

### Scope

Display turnover type statistics on the statistics page.

### Deliverables

- turnover type breakdown in team statistics
- turnover type breakdown in player statistics
- optional strategy tab breakdown

### Tasks

- Add UI blocks in:
  - [TeamStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\TeamStatistics.tsx)
  - [PlayerScopeStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\PlayerScopeStatistics.tsx)
- Recommended UI pattern:
  - one `All points` subsection
  - one `Started on offense` subsection
  - one `Started on defense` subsection
  - inside each subsection:
    - one block for `We lost possession`
    - one block for `Opponent lost possession`
  - each block shows all turnover types with count + percentage
- Recommended visual pattern:
  - compact horizontal bars or stacked rows
  - avoid adding too many new circular stats

### Why not circles here

We already have many circular stats on the page. Turnover type breakdown is categorical, so rows or bars will read more naturally than 8 new donuts.

### Acceptance Criteria

- team stats clearly show the 6 turnover-type buckets
- player stats clearly show the same 6 buckets on on-field data
- labels are localized and readable on mobile

### Tests

#### UTests

- stat display helper renders count and percentage correctly
- empty turnover type blocks render a safe empty state or zero state

#### ITests

- statistics page renders turnover type sections for a game
- statistics page renders aggregated turnover type sections for competition/team filters
- player tab renders player turnover type stats without breaking existing offense/defense/all tabs

## Milestone 5: Strategy Split and CSV Export Follow-up

### Scope

Optional but recommended follow-up if we want the full analytical surface.

### Deliverables

- turnover type distribution by defensive strategy
- CSV export support

### Assumption

I interpret “per defense type” as:

- per defensive strategy

If by “defense type” you mean another future concept, we should rename this milestone before implementation.

### Tasks

- extend [StrategyStatistics.tsx](C:\Users\lacha\projets\ultimate-frisbee-stats\frontend\src\components\statistics\StrategyStatistics.tsx)
- extend backend strategy statistics payloads
- optionally add turnover type columns to CSV exports

### Acceptance Criteria

- defensive strategy stats can show turnover type breakdown
- export output stays readable and backward-compatible enough for existing use

### Tests

#### UTests

- strategy aggregation per turnover type is correct

#### ITests

- strategy statistics endpoint returns turnover type distribution
- CSV export includes expected columns and values

## Recommended Implementation Order

1. Milestone 1: DB + backend contracts
2. Milestone 2: turnover creation UI + public history display
3. Milestone 3: backend statistics aggregation
4. Milestone 4: statistics UI
5. Milestone 5: strategy/export follow-up

## Design Recommendations

### Turnover history

For chronology cards, I recommend:

- keep the existing ownership coloring
- add one small structured type chip or subtitle
- example:
  - `Turnover #2`
  - `Defended pass`

### Statistics UI

I recommend not using 8 new circular stats. Better options:

- grouped bar rows by phase
- a compact table of `type / count / %`
- possibly sorted by descending count within each phase

This will stay more readable on mobile and will scale better.

## Deployment Notes

### Safe rollout order

1. Apply Supabase migration
2. Deploy backend with new schemas and stats contracts
3. Deploy frontend turnover UI/history
4. Deploy frontend statistics UI

### Compatibility note

If frontend and backend are deployed separately for a short time:

- backend-first is safer than frontend-first
- because old frontend can ignore new `turnover_type`
- but new frontend should not require the field until backend is deployed

## Suggested Follow-up Decisions Before Coding

These are the only product choices I would lock before implementation:

1. Confirm the internal enum names above
2. Confirm that the 6-bucket turnover statistics matrix above is the intended structure
3. Confirm that “per defense type” means defensive strategy
4. Confirm that turnover type stats should be shown as rows/bars rather than more circles

## Recommended Next Step

Start with Milestone 1 and Milestone 2 together:

- add the enum + migration
- wire the create dialog and history display

That gives immediate product value and validates the taxonomy before we propagate it into statistics.
