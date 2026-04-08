import { Card, CardActionArea, CardContent, Typography, Box, Chip } from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslation } from "react-i18next";
import type { PlayerGameStats } from "../../types";

interface PlayerStatsCardProps {
  stats: PlayerGameStats;
  view: "offense" | "defense" | "all";
  onClick?: () => void;
}

interface StatItemProps {
  label: string;
  value: string | number;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function formatRateStat(count: number, rate: number, enabled: boolean): string {
  return enabled ? `${count} (${formatPercent(rate)})` : "-";
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {value}
      </Typography>
    </Box>
  );
}

export default function PlayerStatsCard({ stats, view, onClick }: PlayerStatsCardProps) {
  const { t } = useTranslation("statistics");
  const playerNumberLabel = stats.player_number != null ? `#${stats.player_number}` : "-";
  const isOffense = view === "offense";
  const isDefense = view === "defense";
  const showAll = view === "all";
  const offensePoints = stats.offense.points_played;
  const defensePoints = stats.defense.points_played;

  const content = (
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip label={playerNumberLabel} size="small" sx={{ width: 45, fontWeight: "bold" }} />
          <Typography variant="body1" fontWeight="medium">
            {stats.player_name}
          </Typography>
        </Box>
        {isOffense ? (
          <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main, fontSize: 20 }} />
        ) : isDefense ? (
          <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main, fontSize: 20 }} />
        ) : (
          <Box display="flex" alignItems="center" gap={0.5}>
            <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main, fontSize: 18 }} />
            <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main, fontSize: 18 }} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: showAll ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
          gap: 2,
          mb: 1.5,
        }}
      >
        <StatItem
          label={t("playerStats.playingTime")}
          value={formatTime(stats.effective_time_seconds)}
        />
        {showAll ? (
          <>
            <StatItem label={t("playerStats.offensePoints")} value={offensePoints} />
            <StatItem label={t("playerStats.defensePoints")} value={defensePoints} />
          </>
        ) : (
          <StatItem
            label={isOffense ? t("playerStats.offensePoints") : t("playerStats.defensePoints")}
            value={isOffense ? offensePoints : defensePoints}
          />
        )}
      </Box>

      {isOffense && (
        <Box display="flex" gap={2}>
          <Box flex={1}>
            <StatItem
              label={t("playerStats.offenseWinRate")}
              value={formatRateStat(
                stats.offense.points_won,
                stats.offense.hold_rate,
                offensePoints > 0
              )}
            />
          </Box>
          <Box flex={1}>
            <StatItem
              label={t("playerStats.cleanPoints")}
              value={formatRateStat(
                stats.offense.points_won_no_turnover,
                stats.offense.clean_hold_rate,
                stats.offense.points_won > 0
              )}
            />
          </Box>
        </Box>
      )}

      {isDefense && (
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" gap={2}>
            <Box flex={1}>
              <StatItem
                label={t("playerStats.forcedTurnovers")}
                value={formatRateStat(
                  stats.defense.points_with_turnover,
                  stats.defense.turnover_rate,
                  defensePoints > 0
                )}
              />
            </Box>
            <Box flex={1}>
              <StatItem
                label={t("playerStats.defenseWinRate")}
                value={formatRateStat(
                  stats.defense.points_won,
                  stats.defense.break_rate,
                  defensePoints > 0
                )}
              />
            </Box>
          </Box>
          <Box>
            <StatItem
              label={t("playerStats.cleanBreak")}
              value={formatRateStat(
                stats.defense.points_won_no_turnover,
                stats.defense.clean_break_rate,
                stats.defense.points_won > 0
              )}
            />
          </Box>
        </Box>
      )}

      {showAll && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box>
            <Box display="flex" alignItems="center" gap={0.75} mb={0.75}>
              <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main, fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {t("teamStats.offense")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 2,
              }}
            >
              <StatItem
                label={t("playerStats.offenseWinRate")}
                value={formatRateStat(
                  stats.offense.points_won,
                  stats.offense.hold_rate,
                  offensePoints > 0
                )}
              />
              <StatItem
                label={t("playerStats.cleanPoints")}
                value={formatRateStat(
                  stats.offense.points_won_no_turnover,
                  stats.offense.clean_hold_rate,
                  stats.offense.points_won > 0
                )}
              />
            </Box>
          </Box>

          <Box>
            <Box display="flex" alignItems="center" gap={0.75} mb={0.75}>
              <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main, fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {t("teamStats.defense")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 2,
              }}
            >
              <StatItem
                label={t("playerStats.forcedTurnovers")}
                value={formatRateStat(
                  stats.defense.points_with_turnover,
                  stats.defense.turnover_rate,
                  defensePoints > 0
                )}
              />
              <StatItem
                label={t("playerStats.defenseWinRate")}
                value={formatRateStat(
                  stats.defense.points_won,
                  stats.defense.break_rate,
                  defensePoints > 0
                )}
              />
              <StatItem
                label={t("playerStats.cleanBreak")}
                value={formatRateStat(
                  stats.defense.points_won_no_turnover,
                  stats.defense.clean_break_rate,
                  stats.defense.points_won > 0
                )}
              />
            </Box>
          </Box>
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card
      sx={{
        boxShadow: "none",
        backgroundColor: "action.hover",
      }}
    >
      {onClick ? (
        <CardActionArea
          onClick={onClick}
          aria-label={t("page.viewPlayerStatsAria", { playerName: stats.player_name })}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
