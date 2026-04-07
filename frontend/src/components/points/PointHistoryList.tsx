import { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import PointHistoryItem from "./PointHistoryItem";
import HalftimeHistoryItem from "./HalftimeHistoryItem";
import type { PointWithPlayers, Halftime } from "../../types";

interface PointHistoryListProps {
  points: PointWithPlayers[];
  halftime?: Halftime | null;
  onEditPoint?: (point: PointWithPlayers) => void;
  onDeletePoint?: (point: PointWithPlayers) => void;
  onDeleteHalftime?: (halftime: Halftime) => void;
  isDeletingHalftime?: boolean;
}

export default function PointHistoryList({
  points,
  halftime,
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

    const toTimestamp = (value: string) => {
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [...pointItems, ...halftimeItems].sort(
      (left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp)
    );
  }, [points, halftime]);

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
      {historyItems.map((item) => (
        item.type === "point" ? (
          <PointHistoryItem
            key={item.id}
            point={item.point}
            onEdit={onEditPoint}
            onDelete={onDeletePoint}
          />
        ) : (
          <HalftimeHistoryItem
            key={item.id}
            halftime={item.halftime}
            onDelete={onDeleteHalftime}
            isDeleting={isDeletingHalftime}
          />
        )
      ))}
    </Stack>
  );
}
