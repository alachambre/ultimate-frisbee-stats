import { useState } from "react";
import { Paper, Typography, Box, Grid, Collapse, IconButton, LinearProgress } from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { GameStrategyStats } from "../../types";

interface StrategyStatisticsProps {
  strategyStats: GameStrategyStats;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

interface StrategyBarProps {
  label: string;
  percentage: number;
  count: number;
  total: number;
  color: string;
}

function StrategyBar({ label, percentage, count, total, color }: StrategyBarProps) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {formatPercent(percentage)} ({count}/{total})
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage * 100}
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: "rgba(0, 0, 0, 0.08)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 1,
          },
        }}
      />
    </Box>
  );
}

export default function StrategyStatistics({ strategyStats }: StrategyStatisticsProps) {
  const [expandedOffense, setExpandedOffense] = useState<Set<number>>(new Set());
  const [expandedDefense, setExpandedDefense] = useState<Set<number>>(new Set());

  const toggleOffenseStrategy = (strategyId: number) => {
    const newExpanded = new Set(expandedOffense);
    if (newExpanded.has(strategyId)) {
      newExpanded.delete(strategyId);
    } else {
      newExpanded.add(strategyId);
    }
    setExpandedOffense(newExpanded);
  };

  const toggleDefenseStrategy = (strategyId: number) => {
    const newExpanded = new Set(expandedDefense);
    if (newExpanded.has(strategyId)) {
      newExpanded.delete(strategyId);
    } else {
      newExpanded.add(strategyId);
    }
    setExpandedDefense(newExpanded);
  };

  const hasOffenseStrategies = strategyStats.offense_strategies.length > 0;
  const hasDefenseStrategies = strategyStats.defense_strategies.length > 0;

  if (!hasOffenseStrategies && !hasDefenseStrategies) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Strategy Statistics
      </Typography>

      {/* Offense Strategies */}
      {hasOffenseStrategies && (
        <Box sx={{ mb: hasDefenseStrategies ? 4 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
            <Typography variant="h6">Offense Strategies</Typography>
          </Box>

          <Grid container spacing={2}>
            {strategyStats.offense_strategies.map((strategy) => {
              const isExpanded = expandedOffense.has(strategy.strategy_id);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={strategy.strategy_id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <Box
                      onClick={() => toggleOffenseStrategy(strategy.strategy_id)}
                      sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {strategy.strategy_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {strategy.points_played} points played
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Main metric - always visible */}
                    <StrategyBar
                      label="Hold Rate"
                      percentage={strategy.hold_rate}
                      count={strategy.points_won}
                      total={strategy.points_played}
                      color="#1e3a8a"
                    />

                    {/* Expanded details */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <StrategyBar
                          label="Clean Holds"
                          percentage={strategy.clean_hold_rate}
                          count={strategy.clean_holds}
                          total={strategy.points_won}
                          color="#3b82f6"
                        />
                        <StrategyBar
                          label="Quick Scores (< 90s)"
                          percentage={strategy.quick_score_rate}
                          count={strategy.quick_scores}
                          total={strategy.points_won}
                          color="#60a5fa"
                        />
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Defense Strategies */}
      {hasDefenseStrategies && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
            <Typography variant="h6">Defense Strategies</Typography>
          </Box>

          <Grid container spacing={2}>
            {strategyStats.defense_strategies.map((strategy) => {
              const isExpanded = expandedDefense.has(strategy.strategy_id);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={strategy.strategy_id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <Box
                      onClick={() => toggleDefenseStrategy(strategy.strategy_id)}
                      sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {strategy.strategy_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {strategy.points_played} points played
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Main metric - always visible */}
                    <StrategyBar
                      label="Break Rate"
                      percentage={strategy.break_rate}
                      count={strategy.points_won}
                      total={strategy.points_played}
                      color="#0ea5e9"
                    />

                    {/* Expanded details */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <StrategyBar
                          label="Turnover Rate"
                          percentage={strategy.turnover_rate}
                          count={strategy.points_with_turnover}
                          total={strategy.points_played}
                          color="#38bdf8"
                        />
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
