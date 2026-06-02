import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { NewGamesDashboardSummary } from "./buildNewGamesDashboard";

interface NewGamesSummaryStripProps {
  summary: NewGamesDashboardSummary;
  labels: {
    live: string;
    upcoming: string;
    completed: string;
    results: string;
  };
}

export default function NewGamesSummaryStrip({
  summary,
  labels,
}: NewGamesSummaryStripProps) {
  const items = [
    { label: labels.live, value: summary.liveGames },
    { label: labels.upcoming, value: summary.upcomingGames },
    { label: labels.completed, value: summary.completedGames },
    {
      label: labels.results,
      value: `${summary.wins}-${summary.losses}-${summary.draws}`,
    },
  ];

  return (
    <Box
      sx={{
        display: { xs: "none", sm: "grid" },
        gap: 1.5,
        gridTemplateColumns: {
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {items.map((item) => (
        <Paper
          elevation={0}
          key={item.label}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 1.5, sm: 2 },
          })}
        >
          <Typography color="text.secondary" variant="body2">
            {item.label}
          </Typography>
          <Typography component="p" fontWeight={800} variant="h5">
            {item.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
