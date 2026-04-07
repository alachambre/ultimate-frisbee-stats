import { useState } from "react";
import { Typography, Box, Grid, Collapse, IconButton, LinearProgress } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTranslation } from "react-i18next";
import type { StrategyStatsBase } from "../../types";
import {
  BREAK_RATE_VALUE_MIDPOINT,
  HOLD_RATE_VALUE_MIDPOINT,
  TURNOVER_RATE_VALUE_MIDPOINT,
  getValueGradientColor,
  getValueGradientTrackColor,
} from "./statValueColors";

interface StrategyStatisticsProps {
  strategyStats: StrategyStatsBase;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

interface StrategyBarProps {
  label: string;
  percentage: number;
  count: number;
  total: number;
  valueGradientMidpoint?: number;
}

function StrategyBar({
  label,
  percentage,
  count,
  total,
  valueGradientMidpoint,
}: StrategyBarProps) {
  const theme = useTheme();
  const hasData = total > 0;
  const barColor = getValueGradientColor(theme, percentage, hasData, valueGradientMidpoint);
  const percentLabel = hasData ? formatPercent(percentage) : "-";

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium" sx={{ color: barColor }}>
          {percentLabel} ({count}/{total})
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={hasData ? percentage * 100 : 0}
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: getValueGradientTrackColor(
            theme,
            percentage,
            hasData,
            valueGradientMidpoint
          ),
          "& .MuiLinearProgress-bar": {
            backgroundColor: barColor,
            borderRadius: 1,
          },
        }}
      />
    </Box>
  );
}

export default function StrategyStatistics({ strategyStats }: StrategyStatisticsProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
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

  // Sort strategies by their main metric (descending - best first)
  const sortedOffenseStrategies = [...strategyStats.offense_strategies].sort(
    (a, b) => b.hold_rate - a.hold_rate
  );
  const sortedDefenseStrategies = [...strategyStats.defense_strategies].sort(
    (a, b) => b.turnover_rate - a.turnover_rate
  );

  if (!hasOffenseStrategies && !hasDefenseStrategies) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{
          mb: 3,
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            bottom: -1,
            width: 64,
            height: 3,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.primary.main, 0.75),
          },
        }}
      >
        {t("strategyStats.title")}
      </Typography>

      {/* Offense Strategies */}
      {hasOffenseStrategies && (
        <Box sx={{ mb: hasDefenseStrategies ? 4 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
            <Typography variant="h6">{t("strategyStats.offenseStrategies")}</Typography>
          </Box>

          <Grid container spacing={2}>
            {sortedOffenseStrategies.map((strategy) => {
              const isExpanded = expandedOffense.has(strategy.strategy_id);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={strategy.strategy_id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
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
                          {strategy.points_played} {t("strategyStats.pointsPlayed")}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Main metric - always visible */}
                    <StrategyBar
                      label={t("strategyStats.holdRate")}
                      percentage={strategy.hold_rate}
                      count={strategy.points_won}
                      total={strategy.points_played}
                      valueGradientMidpoint={HOLD_RATE_VALUE_MIDPOINT}
                    />

                    {/* Expanded details */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <StrategyBar
                          label={t("strategyStats.cleanHolds")}
                          percentage={strategy.clean_hold_rate}
                          count={strategy.clean_holds}
                          total={strategy.points_played}
                        />
                        <StrategyBar
                          label={t("strategyStats.quickScores")}
                          percentage={strategy.quick_score_rate}
                          count={strategy.quick_scores}
                          total={strategy.points_played}
                        />
                      </Box>
                    </Collapse>
                  </Box>
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
            <Typography variant="h6">{t("strategyStats.defenseStrategies")}</Typography>
          </Box>

          <Grid container spacing={2}>
            {sortedDefenseStrategies.map((strategy) => {
              const isExpanded = expandedDefense.has(strategy.strategy_id);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={strategy.strategy_id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
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
                          {strategy.points_played} {t("strategyStats.pointsPlayed")}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Main metric - always visible (Turnover Rate is the key defense metric) */}
                    <StrategyBar
                      label={t("strategyStats.turnoverRate")}
                      percentage={strategy.turnover_rate}
                      count={strategy.points_with_turnover}
                      total={strategy.points_played}
                      valueGradientMidpoint={TURNOVER_RATE_VALUE_MIDPOINT}
                    />

                    {/* Expanded details */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                        <StrategyBar
                          label={t("strategyStats.breakRate")}
                          percentage={strategy.break_rate}
                          count={strategy.points_won}
                          total={strategy.points_played}
                          valueGradientMidpoint={BREAK_RATE_VALUE_MIDPOINT}
                        />
                      </Box>
                    </Collapse>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
