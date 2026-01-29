# Phase 8: Statistics Implementation Plan

## Status: IN PROGRESS

### ✅ Completed: Live Game Statistics
- **Backend**: `GET /statistics/games/{game_id}/live`
  - Returns: player_id, player_name, points_played, effective_time_seconds
  - Only completed points counted
  - Effective time = point duration - call durations
  - 14 tests
- **Frontend**: Integrated into GameDetailPage player roster
  - 5-second polling for started games
  - One-time fetch for ended games
  - Sorting: name/points/time
  - Visual highlighting: top/bottom 20% quintiles (green/orange)
  - Mobile-first 2-column layout
  - i18n support (EN/FR)

### ✅ Completed: Game-Level Team Statistics
- **Backend**: `GET /statistics/games/{game_id}/team`
  - Returns: game_id, total_completed_points, offense stats, defense stats
  - Offense: points_started, points_won, win_rate, clean_point_rate, break_rate
  - Defense: points_started, points_won, win_rate, turnover_rate, clean_break_rate, hold_rate
  - Turnover attribution: Possession tracking based on starting_on_offense + turnover sequence
  - Only completed points counted
  - 15 tests

### ✅ Completed: Game-Level Player Statistics
- **Backend**: Extended `GET /statistics/games/{game_id}/live`
  - Added offense breakdown: points_played, points_won, points_lost, win_rate per player
  - Added defense breakdown: points_played, points_won, points_lost, win_rate per player
  - Added turnover counting: Number of turnovers attributed to each player
  - All stats calculated from completed points only
  - 5 new tests (35 total statistics tests, 377 total backend tests passing)

---

## 🔄 Next: Frontend Dashboard

### Phase 3: Frontend Statistics Dashboard (NEXT)
**Priority**: HIGH - Visualize backend statistics

### Phase 4: Competition-Level Aggregations
**Priority**: MEDIUM

**Endpoints**:
- `GET /statistics/competitions/{competition_id}/team` - Aggregate team stats across all games
- `GET /statistics/competitions/{competition_id}/players` - Aggregate player stats across all games

**Logic**: Sum/average game-level stats across competition

---

### Phase 5: Team-Level (All-Time) Aggregations
**Priority**: LOW

**Endpoints**:
- `GET /statistics/teams/{team_id}/team` - All-time team stats
- `GET /statistics/teams/{team_id}/players` - All-time player stats

**Logic**: Sum/average stats across all competitions/games

---

### Phase 3: Frontend Statistics Dashboard
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

### ✅ Completed:
1. Live game statistics (basic)
2. Game-level team statistics
3. Game-level player statistics (offense/defense/turnovers)

### Next Session:
4. 🔄 Frontend statistics dashboard (display all backend stats)

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
