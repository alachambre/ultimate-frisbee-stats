import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha, type Theme, useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { getValueGradientColor, type ValueGradientStops } from "./statValueColors";

interface CircularStatProps {
  label: string;
  percentage: number;
  count?: number;
  total?: number;
  color?: string | ((theme: Theme) => string);
  tooltip?: string;
  useValueGradient?: boolean;
  valueGradientStops?: ValueGradientStops;
}

export default function CircularStat({
  label,
  percentage,
  count,
  total,
  color,
  tooltip,
  useValueGradient = false,
  valueGradientStops,
}: CircularStatProps) {
  const theme = useTheme();
  const displayPercentage = Math.round(percentage * 100);
  const hasNoData = total !== undefined && total === 0;
  const resolvedAccentColor =
    typeof color === "function" ? color(theme) : color ?? theme.palette.primary.main;
  const statColor = useValueGradient
    ? getValueGradientColor(theme, percentage, !hasNoData, valueGradientStops)
    : resolvedAccentColor;
  const centerValueLabel = hasNoData ? "\u2014" : `${displayPercentage}%`;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          mb: 2,
        }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={4}
          sx={{
            color: alpha(theme.palette.text.primary, 0.12),
            position: "absolute",
          }}
        />
        <CircularProgress
          variant="determinate"
          value={hasNoData ? 0 : displayPercentage}
          size={140}
          thickness={4}
          sx={{
            color: statColor,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
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
          <Typography variant="h4" fontWeight="bold" sx={{ color: statColor }}>
            {centerValueLabel}
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
