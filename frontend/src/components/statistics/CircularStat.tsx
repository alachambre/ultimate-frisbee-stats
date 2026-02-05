import { Box, Typography, CircularProgress, Tooltip, IconButton } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface CircularStatProps {
  label: string;
  percentage: number;
  count?: number;
  total?: number;
  color: string | ((theme: Theme) => string);
  tooltip?: string;
}

export default function CircularStat({
  label,
  percentage,
  count,
  total,
  color,
  tooltip,
}: CircularStatProps) {
  const displayPercentage = Math.round(percentage * 100);

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          mb: 2,
        }}
      >
        {/* Background circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={4}
          sx={{
            color: (theme) => alpha(theme.palette.common.black, 0.1),
            position: "absolute",
          }}
        />
        {/* Progress circle */}
        <CircularProgress
          variant="determinate"
          value={displayPercentage}
          size={140}
          thickness={4}
          sx={{
            color: typeof color === "function" ? color : color,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        {/* Center content */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: typeof color === "function" ? color : color }}
          >
            {displayPercentage}%
          </Typography>
          {count !== undefined && total !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {count}/{total}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <Typography variant="body1" fontWeight="medium" color="text.primary">
          {label}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ p: 0, color: "text.secondary" }}>
              <InfoOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
