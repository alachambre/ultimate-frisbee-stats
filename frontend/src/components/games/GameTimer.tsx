import { useState, useEffect } from "react";
import { Typography } from "@mui/material";

interface GameTimerProps {
  startDatetime: string; // ISO string
  endDatetime?: string | null; // ISO string, if game has ended
}

export default function GameTimer({ startDatetime, endDatetime }: GameTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startDatetime).getTime();
      const end = endDatetime ? new Date(endDatetime).getTime() : Date.now();
      const diffMs = end - start;
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    // Set initial value
    setElapsedSeconds(calculateElapsed());

    // Only update if game hasn't ended
    if (!endDatetime) {
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);

      return () => clearInterval(interval);
    }
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
      variant="h4"
      fontWeight="bold"
      sx={{
        fontFamily: "monospace",
        color: endDatetime ? "text.secondary" : "primary.main",
      }}
    >
      {formatTime(elapsedSeconds)}
    </Typography>
  );
}
