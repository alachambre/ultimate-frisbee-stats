# Phase 8: Statistics Implementation Plan

## Status: IN PROGRESS

### ✅ Completed: Live Game Statistics
- **Backend**: `GET /statistics/games/{game_id}/live`
  - Returns: player_id, player_name, points_played, effective_time_seconds
  - Only completed points counted
  - Effective time = point duration - call durations
  - 14 tests (357 total backend tests passing)
- **Frontend**: Integrated into GameDetailPage player roster
  - 5-second polling for started games
  - One-time fetch for ended games
  - Sorting: name/points/time
  - Visual highlighting: top/bottom 20% quintiles (green/orange)
  - Mobile-first 2-column layout
  - i18n support (EN/FR)

---

## 🔄 Next: Aggregated Statistics

### Phase 1: Game-Level Team Statistics (NEXT)
**Priority**: HIGH - Foundation for all other stats

**Endpoint**: `GET /statistics/games/{game_id}/team`

**Response Schema**:
```json
{
  "game_id": 1,
  "total_completed_points": 15,
  "offense": {
    "points_started": 8,
    "points_won": 6,
    "points_lost": 2,
    "win_rate": 0.75,
    "points_won_no_turnover": 4,
    "clean_point_rate": 0.667,
    "break_rate": 0.25  // points lost on offense (broken)
  },
  "defense": {
    "points_started": 7,
    "points_won": 5,
    "points_lost": 2,
    "win_rate": 0.714,
    "points_with_turnover": 6,
    "turnover_rate": 0.857,
    "points_won_no_turnover": 1,
    "clean_break_rate": 0.143,
    "points_lost_no_turnover": 1,  // opponent scored without turnover
    "hold_rate": 0.714  // opponent didn't score on defense
  }
}
```

**Calculation Logic** (from requirements.md):

**Offense:**
1. Points started in offense = count(points where starting_on_offense=true, status=completed)
2. Points won in offense = count(points where starting_on_offense=true, won=true, status=completed)
3. Points won without turnover = count(points where starting_on_offense=true, won=true, turnovers.count=0)
4. Points lost in offense (breaks) = count(points where starting_on_offense=true, won=false)
5. Calculate percentages

**Defense:**
1. Points started in defense = count(points where starting_on_offense=false, status=completed)
2. Points won in defense = count(points where starting_on_offense=false, won=true, status=completed)
3. Points with ≥1 turnover = count(points where starting_on_offense=false, turnovers.count>0)
4. Points won without turnover from our team = count(points where starting_on_offense=false, won=true, our_turnovers=0)
5. Points won with turnovers from our team = count(points where starting_on_offense=false, won=true, our_turnovers>0)
6. Points lost without turnover = count(points where starting_on_offense=false, won=false, turnovers.count=0)

**Turnover Attribution**:
- Need to determine "our turnovers" vs "opponent turnovers"
- Logic: Based on possession alternation from starting_on_offense + turnover sequence
- Odd-numbered turnovers when starting_on_offense=true are OURS
- Even-numbered turnovers when starting_on_offense=true are THEIRS
- Flip logic when starting_on_offense=false

**Implementation Steps**:
1. Create `crud/statistics.py::get_game_team_stats()`
2. Create `schemas/statistics.py::GameTeamStats` with nested OffenseStats/DefenseStats
3. Create `routers/statistics.py::GET /statistics/games/{game_id}/team`
4. Write 10-15 comprehensive tests covering edge cases
5. Update backend/README.md

**Edge Cases to Test**:
- Game with no completed points
- Game with only offense points
- Game with only defense points
- Points with no turnovers
- Points with multiple turnovers
- Division by zero scenarios

---

### Phase 2: Game-Level Player Statistics
**Priority**: MEDIUM

**Endpoint**: `GET /statistics/games/{game_id}/players`

Extend existing live stats with:
```json
{
  "player_id": 1,
  "player_name": "Alice",
  "points_played": 10,
  "effective_time_seconds": 1800,
  "offense": {
    "points_played": 6,
    "points_won": 5,
    "win_rate": 0.833,
    "points_lost": 1
  },
  "defense": {
    "points_played": 4,
    "points_won": 3,
    "win_rate": 0.75,
    "points_lost": 1
  },
  "turnovers": 2  // turnovers attributed to this player
}
```

**Implementation**:
- Extend existing `get_live_game_player_stats()` function
- Add offense/defense breakdowns
- Include turnover count from turnovers table

---

### Phase 3: Competition-Level Aggregations
**Priority**: MEDIUM

**Endpoints**:
- `GET /statistics/competitions/{competition_id}/team` - Aggregate team stats across all games
- `GET /statistics/competitions/{competition_id}/players` - Aggregate player stats across all games

**Logic**: Sum/average game-level stats across competition

---

### Phase 4: Team-Level (All-Time) Aggregations
**Priority**: LOW

**Endpoints**:
- `GET /statistics/teams/{team_id}/team` - All-time team stats
- `GET /statistics/teams/{team_id}/players` - All-time player stats

**Logic**: Sum/average stats across all competitions/games

---

### Phase 5: Frontend Statistics Dashboard
**Priority**: MEDIUM (after backend phases 1-2)

**Pages/Components**:
1. `GameStatsPage` - Game-level statistics with charts
2. `CompetitionStatsPage` - Competition-level statistics
3. `PlayerStatsCard` - Enhanced player stats display
4. Charts/visualizations (Chart.js or similar)

**Features**:
- Offense/defense efficiency charts
- Playing time distribution
- Turnover statistics
- Win/loss trends
- Export to CSV/PDF

---

## Implementation Order

### Immediate (Current Session):
1. ✅ Live game statistics (DONE)
2. 🔄 Game-level team statistics (START HERE)

### Next Session:
3. Game-level player statistics (extend existing)
4. Frontend dashboard for game stats

### Future Sessions:
5. Competition/team aggregations
6. Advanced visualizations
7. Export/sharing features

---

## Notes

- All statistics only count **completed points** (status = "completed")
- Effective time = point duration - call durations (dead time)
- Possession tracking uses turnover sequence + starting_on_offense
- Statistics are read-only (no mutations)
- Cache considerations: Stats are expensive to calculate, consider caching for ended games

---

## References

- User requirements: `requirements.md` (Statistics section)
- Data model: `data-model-design.md`
- Backend API docs: `backend/README.md`
- Current context: `CLAUDE.md`
