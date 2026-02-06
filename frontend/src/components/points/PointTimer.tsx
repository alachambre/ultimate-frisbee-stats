import { useCallback, useEffect, useMemo, useState } from "react";
import { Typography } from "@mui/material";

interface PointTimerProps {
  startDatetime: string; // ISO string
  endDatetime?: string | null; // ISO string - if provided, shows static duration
  color?: string; // Optional color for the timer
}

export default function PointTimer({ startDatetime, endDatetime, color }: PointTimerProps) {
  const calculateElapsed = useCallback(() => {
    const start = new Date(startDatetime).getTime();
    const end = endDatetime ? new Date(endDatetime).getTime() : Date.now();
    const diffMs = end - start;
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [startDatetime, endDatetime]);

  const [tickSeconds, setTickSeconds] = useState(calculateElapsed);

  useEffect(() => {
    if (endDatetime) return;

    // Update every second
    const interval = setInterval(() => {
      setTickSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateElapsed, endDatetime]);

  const elapsedSeconds = useMemo(() => {
    if (endDatetime) {
      return calculateElapsed();
    }
    return tickSeconds;
  }, [calculateElapsed, endDatetime, tickSeconds]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Typography
      variant="h5"
      fontWeight="bold"
      sx={{
        fontFamily: "monospace",
        color: color || "primary.main",
      }}
    >
      {formatTime(elapsedSeconds)}
    </Typography>
  );
}
