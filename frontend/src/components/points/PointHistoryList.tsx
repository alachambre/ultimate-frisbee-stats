import { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import PointHistoryItem from "./PointHistoryItem";
import HalftimeHistoryItem from "./HalftimeHistoryItem";
import GameEndHistoryItem from "./GameEndHistoryItem";
import type { PointWithPlayers, Halftime } from "../../types";
import { buildHistorySummarySnapshot } from "./historySummarySnapshot";

interface PointHistoryListProps {
  points: PointWithPlayers[];
  halftime?: Halftime | null;
  gameEndedAt?: string | null;
  onEditPoint?: (point: PointWithPlayers) => void;
  onDeletePoint?: (point: PointWithPlayers) => void;
  onDeleteHalftime?: (halftime: Halftime) => void;
  isDeletingHalftime?: boolean;
}

export default function PointHistoryList({
  points,
  halftime,
  gameEndedAt,
  onEditPoint,
  onDeletePoint,
  onDeleteHalftime,
  isDeletingHalftime = false,
}: PointHistoryListProps) {
  const { t } = useTranslation("points");

  const historyItems = useMemo(() => {
    const pointItems = points.map((point) => ({
      type: "point" as const,
      id: `point-${point.id}`,
      timestamp: point.start_datetime || point.end_datetime || point.created_at,
      point,
    }));

    const halftimeItems = halftime
      ? [
          {
            type: "halftime" as const,
            id: `halftime-${halftime.id}`,
            timestamp: halftime.halftime_timestamp,
            halftime,
          },
        ]
      : [];

    const gameEndItems = gameEndedAt
      ? [
          {
            type: "gameEnd" as const,
            id: "game-end",
            timestamp: gameEndedAt,
          },
        ]
      : [];

    const toTimestamp = (value: string) => {
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [...pointItems, ...halftimeItems, ...gameEndItems].sort(
      (left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp)
    );
  }, [points, halftime, gameEndedAt]);

  const halftimeSnapshot = useMemo(
    () => (halftime ? buildHistorySummarySnapshot(points, halftime.halftime_timestamp) : null),
    [points, halftime]
  );
  const gameEndSnapshot = useMemo(
    () => (gameEndedAt ? buildHistorySummarySnapshot(points, gameEndedAt) : null),
    [points, gameEndedAt]
  );

  if (historyItems.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          {t("empty.noPointsYet")}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {historyItems.map((item) =>
        item.type === "point" ? (
          <PointHistoryItem
            key={item.id}
            point={item.point}
            onEdit={onEditPoint}
            onDelete={onDeletePoint}
          />
        ) : item.type === "gameEnd" ? (
          <GameEndHistoryItem key={item.id} snapshot={gameEndSnapshot ?? undefined} />
        ) : (
          <HalftimeHistoryItem
            key={item.id}
            halftime={item.halftime}
            snapshot={halftimeSnapshot ?? undefined}
            onDelete={onDeleteHalftime}
            isDeleting={isDeletingHalftime}
          />
        )
      )}
    </Stack>
  );
}
