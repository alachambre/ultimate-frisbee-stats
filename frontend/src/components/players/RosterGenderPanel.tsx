import { Box, Paper, Typography, alpha } from "@mui/material";
import type { ReactNode } from "react";

interface RosterGenderPanelProps {
  label: string;
  countLabel: string;
  accent: "men" | "women";
  emptyLabel: string;
  hasContent: boolean;
  children: ReactNode;
}

export default function RosterGenderPanel({
  label,
  countLabel,
  accent,
  emptyLabel,
  hasContent,
  children,
}: RosterGenderPanelProps) {
  const colorPath = accent === "men" ? "men" : "women";

  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        overflow: "hidden",
        borderColor: (theme) => alpha(theme.colors[colorPath].main, 0.35),
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: (theme) => alpha(theme.colors[colorPath].main, 0.2),
          backgroundColor: (theme) => alpha(theme.colors[colorPath].main, 0.08),
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ color: (theme) => theme.colors[colorPath].main, fontWeight: "bold" }}
        >
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {countLabel}
        </Typography>
      </Box>
      <Box p={2.5}>
        {hasContent ? (
          children
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {emptyLabel}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
