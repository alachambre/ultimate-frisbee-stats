# Data Model Design - Ultimate Frisbee Stats Platform

## Overview
This document defines the complete data model for the expanded ultimate frisbee statistics platform. The design supports real-time game tracking, comprehensive analytics, and flexible team management.

**Design Principles:**
- Mobile-first: Optimized for sideline data entry
- Relational integrity: Proper foreign keys and cascade rules
- Analytics-ready: Structure supports complex queries for statistics
- Flexible: User-defined groups (lines), strategies, and workflows

---

## Entity Definitions

### 1. Team
**Purpose:** Represents a frisbee team (your team)

**Fields:**
- `id` (int, PK, auto-increment)
- `name` (string, required, max 100 chars)
- `created_at` (datetime, auto-generated)

**Relationships:**
- 1:N → Player
- 1:N → Competition
- 1:N → Line
- 1:N → Strategy

**Constraints:**
- Unique team names (enforced at DB level)

**Cascade Rules:**
- On delete: CASCADE to all related entities (players, competitions, lines, strategies)

---

### 2. Player
**Purpose:** Represents an individual player on a team

**Fields:**
- `id` (int, PK, auto-increment)
- `team_id` (int, FK → Team.id, required)
- `name` (string, required, max 100 chars)
- `number` (int, optional)
- `gender` (enum: 'M' | 'W', required) ← **NEW**
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Team
- M:N → Line (through `line_players` association table)
- M:N → Competition (through `competition_players` association table) - players attending competition
- M:N → Game (through `game_players` association table) - players selected for game
- M:N → Point (through `point_players` association table) - players on field for point
- 1:N → Turnover (as responsible player)

**Constraints:**
- Player number unique within team (if provided)
- Gender required (no null values)

**Cascade Rules:**
- On team delete: CASCADE (delete player)
- On player delete: CASCADE to association tables, SET NULL on turnovers

---

### 3. Competition
**Purpose:** Represents a tournament or event (e.g., "Nationals 2026", "Spring League")

**Fields:**
- `id` (int, PK, auto-increment)
- `team_id` (int, FK → Team.id, required)
- `name` (string, required, max 100 chars)
- `description` (text, optional)
- `start_date` (date, required)
- `end_date` (date, required)
- `status` (enum: 'ongoing' | 'completed', required, default: 'ongoing')
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Team
- 1:N → Game
- M:N → Player (through `competition_players` association table) - roster for this competition

**Constraints:**
- `end_date` >= `start_date`
- Status transitions are enforced at application level only (DB allows any status change)
- ✅ CONFIRMED: Status can be toggled between ongoing ↔ completed (for mistake correction)

**Cascade Rules:**
- On team delete: CASCADE (delete competition)
- On competition delete: CASCADE to games

**Business Rules:**
- Games can only be created on competitions with status='ongoing'
- Only players in competition roster can be selected for games in that competition

---

### 4. Line
**Purpose:** User-defined player groups for quick selection (e.g., "O-Line", "Defense A", "Handler Line")

**Fields:**
- `id` (int, PK, auto-increment)
- `team_id` (int, FK → Team.id, required)
- `name` (string, required, max 100 chars)
- `description` (text, optional)
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Team
- M:N → Player (through `line_players` association table)

**Constraints:**
- Line name unique within team

**Cascade Rules:**
- On team delete: CASCADE (delete line)
- On line delete: CASCADE to association table entries

**Business Rules:**
- No constraints on gender composition (lines are just groups)
- A line can have any number of players (including 0)
- A player can be in multiple lines

---

### 5. Game
**Purpose:** Represents a single game within a competition

**Fields:**
- `id` (int, PK, auto-increment)
- `competition_id` (int, FK → Competition.id, required) ← **NEW** (replaces team_id)
- `opponent_name` (string, required, max 100 chars)
- `game_date` (datetime, required)
- `status` (enum: 'ready' | 'started' | 'ended', required, default: 'ready') ← **CHANGED** (was: 'in_progress' | 'finished')
- `our_score` (int, default: 0)
- `opponent_score` (int, default: 0)
- `comments` (text, optional) ← **NEW**
- `created_at` (datetime, auto-generated)
- `started_at` (datetime, optional) ← **NEW** - set when first point starts
- `ended_at` (datetime, optional) ← **NEW** - set when game manually ended

**Relationships:**
- N:1 → Competition
- 1:N → Point
- M:N → Player (through `game_players` association table) - players selected for this game ← **NEW**

**Constraints:**
- Scores must be >= 0
- Status transitions: ready → started → ended (one-way)
- `started_at` must be set when status='started'
- `ended_at` must be set when status='ended'

**Cascade Rules:**
- On competition delete: CASCADE (delete game)
- On game delete: CASCADE to points

**Business Rules:**
- Game auto-transitions to 'started' when first point is started
- Only players from competition roster can be selected for game
- Comments can be added/edited at any time

**Computed Fields:**
- `duration_seconds` - calculated from started_at to ended_at (null if not ended)
- `team_id` - derived from competition.team_id (for convenience in queries)

---

### 6. Strategy
**Purpose:** Named plays/strategies (e.g., "Vert Stack", "Zone Defense", "Handler Iso")

**Fields:**
- `id` (int, PK, auto-increment)
- `team_id` (int, FK → Team.id, required)
- `name` (string, required, max 100 chars)
- `description` (text, optional)
- `category` (enum: 'offense' | 'defense', required)
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Team
- 1:N → Point (points using this strategy)

**Constraints:**
- Strategy name unique within team

**Cascade Rules:**
- On team delete: CASCADE (delete strategy)
- On strategy delete: SET NULL on points
- ✅ CONFIRMED: Strategy optional on points, SET NULL on deletion minimizes impact

**Business Rules:**
- Strategies are team-level (not competition-specific)
- Can be reused across multiple games/competitions

---

### 7. Point
**Purpose:** Represents a single point in a game (complete rewrite from Phase 3)

**Fields:**
- `id` (int, PK, auto-increment)
- `game_id` (int, FK → Game.id, required)
- `strategy_id` (int, FK → Strategy.id, optional) ← **NEW**
- `status` (enum: 'ready' | 'running' | 'scored' | 'completed', required, default: 'ready') ← **CHANGED**
- `point_number` (int, required) - sequential within game
- `started_on_offense` (boolean, required) - did we pull or receive?
- `mixity` (enum: 'mens' | 'womens', required) ← **NEW** - mens=4M+3W, womens=3M+4W
- `field_side` (enum: 'left' | 'right', optional) ← **NEW** - relative to score table
- `pull_in_bounds` (boolean, optional) ← **NEW** - was pull inside field?
- `won_point` (boolean, optional) - set when status transitions to 'completed'
- `comments` (text, optional) ← **NEW**
- `start_datetime` (datetime, optional) - set when status → 'running'
- `end_datetime` (datetime, optional) - set when status → 'scored'
- `completed_at` (datetime, optional) ← **NEW** - set when status → 'completed'
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Game
- N:1 → Strategy (optional)
- M:N → Player (through `point_players` association table) - exactly 7 players on field ← **NEW**
- 1:N → Call
- 1:N → Turnover

**Constraints:**
- Point number unique within game
- Status transitions: ready → running → scored → completed (one-way, except scored can go back to running)
- Exactly 7 players must be selected (enforced at application level)
- Player gender ratio must match mixity: mens=4M+3W, womens=3M+4W (enforced at application level)
- All 7 players must be from game's player selection
- `start_datetime` must be set when status='running'
- `end_datetime` must be set when status='scored' or 'completed'
- `won_point` must be set when status='completed'

**Cascade Rules:**
- On game delete: CASCADE (delete point)
- On strategy delete: SET NULL
- On point delete: CASCADE to calls, turnovers, association table entries

**Business Rules:**
- Status='ready': Point created, selecting players, mixity, strategy
- Status='running': Pull thrown, chronometer running, can add calls/turnovers
- Status='scored': Disc hit ground in endzone, chronometer stopped, awaiting outcome confirmation
- Status='completed': Counts for statistics, but still editable for corrections
- ✅ CONFIRMED: Completed points remain editable (timestamps, players, etc.) for post-game corrections
- When transitioning scored → running (resume), clear `end_datetime`
- Pull in/out can be set anytime after point starts (optional)

**Player Lineup Editing (Data Integrity):**
- Player lineup always editable (any status, including 'completed')
- When removing a player who has assigned turnovers:
  - Auto SET NULL on those turnover.player_id references
  - UI must show warning before confirming: "Removing Player A will clear N turnover assignments"
  - Prevents broken references while maintaining flexibility
- ✅ CONFIRMED: Option 2 - Allow editing with automatic cleanup and warnings

**Computed Fields:**
- `raw_duration_seconds` - (end_datetime - start_datetime) - includes all time, even dead time from calls
- `effective_duration_seconds` - raw_duration - sum(call durations) - actual playing time, excludes dead time
- ✅ CLARIFIED: Raw = total elapsed time, Effective = playing time only (for player stats) 

---

### 8. Call
**Purpose:** Represents fouls, violations, or stoppages during a point

**Fields:**
- `id` (int, PK, auto-increment)
- `point_id` (int, FK → Point.id, required)
- `start_datetime` (datetime, required)
- `end_datetime` (datetime, optional) - set when call is resolved
- `comments` (text, optional)
- `created_at` (datetime, auto-generated)

**Relationships:**
- N:1 → Point

**Constraints:**
- Point must have status='running' to create call
- `end_datetime` >= `start_datetime` (if set)

**Cascade Rules:**
- On point delete: CASCADE (delete call)

**Business Rules:**
- Calls created on-the-fly during running point
- Call chronometer tracks dead time
- Dead time excluded from player effective playing time
- Comments can be added/edited anytime

**Computed Fields:**
- `duration_seconds` - end_datetime - start_datetime (null if not ended)

---

### 9. Turnover
**Purpose:** Tracks turnovers during a point

**Fields:**
- `id` (int, PK, auto-increment)
- `point_id` (int, FK → Point.id, required)
- `player_id` (int, FK → Player.id, optional) ← responsible player (ALWAYS optional)
- `sequence_number` (int, required) - order within point (1st turnover, 2nd, etc.)
- `occurred_at` (datetime, required) - when turnover happened
- `comments` (text, optional)
- `created_at` (datetime, auto-generated)

**✅ IMPORTANT - Player Always Optional:**
Even when we had possession, player_id remains optional because:
- User might be uncertain who was responsible
- Sometimes no one is to blame (exceptional opponent play)
- Better to have missing data than incorrect data

**Relationships:**
- N:1 → Point
- N:1 → Player (optional - only if we turned it over)

**Constraints:**
- Point must have status='running' to create turnover
- Sequence number unique within point
- Player_id always optional (even when we had possession)

**Cascade Rules:**
- On point delete: CASCADE (delete turnover)
- On player delete: SET NULL

**Business Rules:**
- Turnovers created on-the-fly during running point
- Player assignment is always optional (user discretion)
- Sequence number determines possession throughout point
- To determine who has possession: start with `started_on_offense`, toggle with each turnover
- Opponent turnovers tracked for possession logic (player_id = null)

**Computed Fields/Logic:**
- `we_had_possession` - derived from point.started_on_offense + count of previous turnovers

---

## Association Tables

### line_players
**Purpose:** Many-to-many relationship between Lines and Players

**Fields:**
- `line_id` (int, FK → Line.id, PK)
- `player_id` (int, FK → Player.id, PK)
- `created_at` (datetime, auto-generated)

**Constraints:**
- Composite primary key (line_id, player_id)
- Player must belong to same team as line

---

### competition_players
**Purpose:** Players attending a specific competition (roster)

**Fields:**
- `competition_id` (int, FK → Competition.id, PK)
- `player_id` (int, FK → Player.id, PK)
- `created_at` (datetime, auto-generated)

**Constraints:**
- Composite primary key (competition_id, player_id)
- Player must belong to same team as competition

---

### game_players
**Purpose:** Players selected for a specific game

**Fields:**
- `game_id` (int, FK → Game.id, PK)
- `player_id` (int, FK → Player.id, PK)
- `created_at` (datetime, auto-generated)

**Constraints:**
- Composite primary key (game_id, player_id)
- Player must be in competition roster (competition_players)

---

### point_players
**Purpose:** Players on field for a specific point (exactly 7)

**Fields:**
- `point_id` (int, FK → Point.id, PK)
- `player_id` (int, FK → Player.id, PK)
- `created_at` (datetime, auto-generated)

**Constraints:**
- Composite primary key (point_id, player_id)
- Player must be in game's player selection (game_players)
- Exactly 7 players per point (enforced at application level)
- Gender ratio must match point.mixity (enforced at application level)

---

## Key Design Decisions & Rationale

### 1. Competition as Parent of Game
**Decision:** Games belong to competitions (not directly to teams)
**Rationale:**
- Reflects real-world structure (games happen in tournaments)
- Enables competition-level analytics
- Simplifies player roster management (select once at competition level)

### 2. Four-Status Point Lifecycle
**Decision:** ready → running → scored → completed (vs simple active/completed)
**Rationale:**
- Separates physical play from administrative completion
- Allows outcome confirmation after disc hits ground
- Supports "resume point" if scored prematurely
- Prevents accidental early completion

### 3. Player Gender as Required Field
**Decision:** Gender is 'M' | 'W' (not optional, no 'other')
**Rationale:**
- Required by USAU/WFDF mixed division rules (4+3 or 3+4)
- Simplifies mixity validation
- Can be extended later if needed

### 4. Turnover Player Tracking
**Decision:** Turnover only tracks player_id when we had possession
**Rationale:**
- Only meaningful to track our mistakes, not opponent's
- Possession determined by started_on_offense + turnover count
- Optional field handles opponent turnovers (player_id = null)

### 5. Strategy at Team Level (not Competition)
**Decision:** Strategies belong to team, not competition
**Rationale:**
- Strategies reused across seasons/tournaments
- Simpler management (one strategy library per team)
- Can still filter by competition when analyzing

### 6. Game Player Selection
**Decision:** Three-tier player selection (competition → game → point)
**Rationale:**
- Competition roster: Not everyone travels to tournaments
- Game roster: Not everyone plays every game
- Point lineup: Exactly 7 on field
- Each tier narrows the selection logically

### 7. Comments Fields
**Decision:** Comments on Game, Point, Call, Turnover (all optional)
**Rationale:**
- Capture context that structured data can't
- Useful for post-game review
- Optional (don't slow down data entry)

### 8. Field Side Tracking
**Decision:** Simple 'left' | 'right' enum relative to score table
**Rationale:**
- Coach requirement (not fully justified yet)
- Keep it simple until we understand the analytics use case
- Optional field (low priority)

---

## Migration Notes (Phase 3 → Phase 4+)

### Breaking Changes:
1. **Game.team_id → Game.competition_id** - Games now require competition
2. **Game.status** - Enum values change ('in_progress' → 'started', 'finished' → 'ended')
3. **Point model** - Complete rewrite (different fields, different lifecycle)
4. **Player.gender** - New required field (no default)

### Migration Strategy:
- No migration needed (starting fresh, per user preference)
- Database will be recreated
- Phase 1-3 data is disposable (POC phase)

---

## Statistics Support

This data model supports the analytics requirements in `requirements.md`:

### Team Statistics:
- Offense efficiency: Query points where started_on_offense=true, aggregate won_point
- Defense efficiency: Query points where started_on_offense=false, aggregate won_point
- Turnover analysis: Join Point → Turnover, count by point

### Player Statistics:
- Points played: Count point_players entries
- Effective playing time: Sum point durations (excluding call durations)
- Offense/defense splits: Join through point_players, filter by started_on_offense
- Turnover responsibility: Count turnovers where player_id = player

### Game/Competition Statistics:
- All team/player stats can be filtered by game_id or competition_id
- Win rates, break rates, hold rates easily computed from point outcomes

---

## Design Decisions Summary

All questions resolved. Key decisions:

1. **Competition players**: ✅ Strict hierarchy enforced - game players must be in competition roster (roster can be updated if needed)

2. **Point resume**: ✅ When resuming 'scored' → 'running', existing turnovers/calls remain editable

3. **Strategy category validation**: ✅ UI will suggest appropriate strategies (O strategies for O points) but not enforce at DB level

4. **Line usage in points**: ✅ Lines are UI helpers only - not tracked on points. Players from multiple lines can be mixed in a point.

5. **Game comments**: ✅ Simple text field (not rich text)

6. **Call types**: ✅ No enum - comments field is sufficient for describing call types

7. **Player lineup editing**: ✅ Always editable (even completed points). Removing player with turnovers auto-clears those assignments with UI warning.

---

## Next Steps

1. Review this design document
2. Answer open questions
3. Validate entity relationships and constraints
4. Begin Phase 4 implementation (Competition + Player Gender)
