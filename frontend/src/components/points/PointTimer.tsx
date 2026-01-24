import { useState, useEffect } from "react";
import { Typography } from "@mui/material";

interface PointTimerProps {
  startDatetime: string; // ISO string
  endDatetime?: string | null; // ISO string - if provided, shows static duration
}

export default function PointTimer({ startDatetime, endDatetime }: PointTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // If endDatetime is provided (not null/undefined), calculate static duration
    if (endDatetime !== null && endDatetime !== undefined) {
      const start = new Date(startDatetime).getTime();
      const end = new Date(endDatetime).getTime();
      const diffMs = end - start;
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      return; // No need for interval
    }

    // Otherwise, calculate live elapsed time
    const calculateElapsed = () => {
      const start = new Date(startDatetime).getTime();
      const now = Date.now();
      const diffMs = now - start;
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    // Set initial value immediately
    const elapsed = calculateElapsed();
    setElapsedSeconds(elapsed);

    // Update every second
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startDatetime, endDatetime]);

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
        color: "primary.main",
      }}
    >
      {formatTime(elapsedSeconds)}
    </Typography>
  );
}
