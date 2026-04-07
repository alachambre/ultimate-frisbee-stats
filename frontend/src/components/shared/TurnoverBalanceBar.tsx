import { Box, LinearProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface TurnoverBalanceBarProps {
  opponentCount: number;
  ourCount: number;
  opponentLabel: string;
  ourLabel: string;
  compact?: boolean;
}

export default function TurnoverBalanceBar({
  opponentCount,
  ourCount,
  opponentLabel,
  ourLabel,
  compact = false,
}: TurnoverBalanceBarProps) {
  const totalTurns = opponentCount + ourCount;
  const opponentRatio = totalTurns > 0 ? (opponentCount / totalTurns) * 100 : 0;
  const ourRatio = totalTurns > 0 ? (ourCount / totalTurns) * 100 : 0;

  return (
    <Box sx={{ width: "100%", mt: compact ? 1 : 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {opponentLabel}
          </Typography>
          <Typography variant={compact ? "body1" : "h6"} fontWeight="bold">
            {opponentCount}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {ourLabel}
          </Typography>
          <Typography variant={compact ? "body1" : "h6"} fontWeight="bold">
            {ourCount}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={(theme) => ({
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0.5,
          alignItems: "center",
          px: 0.5,
          py: 0.5,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.text.primary, 0.04),
        })}
      >
        <LinearProgress
          variant="determinate"
          value={opponentRatio}
          sx={(theme) => ({
            height: compact ? 8 : 10,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.success.main, 0.12),
            transform: "scaleX(-1)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              backgroundColor: theme.palette.success.main,
            },
          })}
        />
        <LinearProgress
          variant="determinate"
          value={ourRatio}
          sx={(theme) => ({
            height: compact ? 8 : 10,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.warning.main, 0.12),
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              backgroundColor: theme.palette.warning.main,
            },
          })}
        />
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 2,
            height: compact ? 16 : 20,
            transform: "translate(-50%, -50%)",
            borderRadius: 999,
            bgcolor: theme.palette.background.paper,
            boxShadow: `0 0 0 1px ${alpha(theme.palette.divider, 0.8)}`,
          })}
        />
      </Box>
    </Box>
  );
}
