import { Box, Chip, IconButton, Typography, alpha } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface RosterSummaryHeaderProps {
  title: string;
  subtitle?: string;
  totalLabel: string;
  menLabel: string;
  womenLabel: string;
  rightContent?: ReactNode;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  toggleAriaLabel?: string;
  showBorder?: boolean;
}

export default function RosterSummaryHeader({
  title,
  subtitle,
  totalLabel,
  menLabel,
  womenLabel,
  rightContent,
  isCollapsible = false,
  isExpanded = false,
  onToggle,
  toggleAriaLabel,
  showBorder = false,
}: RosterSummaryHeaderProps) {
  const { t } = useTranslation("common");
  const resolvedToggleAriaLabel = toggleAriaLabel ?? t("ariaLabel.toggleRoster");

  return (
    <Box
      p={3}
      borderBottom={showBorder ? "1px solid" : "none"}
      borderColor="divider"
      sx={{
        backgroundImage: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {rightContent}
          {isCollapsible && onToggle && (
            <IconButton size="small" onClick={onToggle} aria-label={resolvedToggleAriaLabel}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
        <Chip icon={<GroupIcon />} label={totalLabel} variant="outlined" />
        <Chip
          icon={<MaleIcon />}
          label={menLabel}
          variant="outlined"
          sx={{ borderColor: (theme) => alpha(theme.colors.men.main, 0.5) }}
        />
        <Chip
          icon={<FemaleIcon />}
          label={womenLabel}
          variant="outlined"
          sx={{ borderColor: (theme) => alpha(theme.colors.women.main, 0.5) }}
        />
      </Box>
    </Box>
  );
}
