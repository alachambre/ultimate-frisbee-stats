import { Box, Typography, Stack } from "@mui/material";
import PointHistoryItem from "./PointHistoryItem";
import type { PointWithPlayers } from "../../types";

interface PointHistoryListProps {
  points: PointWithPlayers[];
  onEditPoint: (point: PointWithPlayers) => void;
  onDeletePoint: (point: PointWithPlayers) => void;
}

export default function PointHistoryList({
  points,
  onEditPoint,
  onDeletePoint,
}: PointHistoryListProps) {
  if (points.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No points yet. Start tracking points above.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {points.map((point) => (
        <PointHistoryItem
          key={point.id}
          point={point}
          onEdit={onEditPoint}
          onDelete={onDeletePoint}
        />
      ))}
    </Stack>
  );
}
