import { Box, ButtonBase, Chip, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface StatisticsSelectionCardProps {
  title: string;
  subtitle?: string;
  details?: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
  badgeColor?: "primary" | "default" | "success" | "error";
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export default function StatisticsSelectionCard({
  title,
  subtitle,
  details,
  selected,
  onClick,
  badge,
  badgeColor = "default",
  icon,
  ariaLabel,
}: StatisticsSelectionCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        backgroundColor: selected
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : "background.paper",
        transition: "all 0.2s ease",
      }}
    >
      <ButtonBase
        onClick={onClick}
        aria-label={ariaLabel || title}
        sx={{
          width: "100%",
          textAlign: "left",
          display: "block",
          p: 2,
          borderRadius: 1,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1}>
              {icon}
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {title}
              </Typography>
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {details && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {details}
              </Typography>
            )}
          </Box>
          {badge && <Chip label={badge} size="small" color={badgeColor} />}
        </Box>
      </ButtonBase>
    </Paper>
  );
}
