import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

interface LivePointPossessionIndicatorProps {
  startingOnOffense: boolean;
}

export function LivePointPossessionIndicator({
  startingOnOffense,
}: LivePointPossessionIndicatorProps) {
  const { t } = useTranslation(["points"]);
  const theme = useTheme();
  const accentColor = startingOnOffense
    ? theme.colors.offense.main
    : theme.colors.defense.main;

  return (
    <Chip
      icon={startingOnOffense ? <FlashOnIcon /> : <ShieldIcon />}
      label={
        startingOnOffense
          ? t("points:tracker.offense")
          : t("points:tracker.defense")
      }
      size="small"
      sx={{
        bgcolor: alpha(accentColor, theme.palette.mode === "dark" ? 0.18 : 0.1),
        border: `1px solid ${alpha(
          accentColor,
          theme.palette.mode === "dark" ? 0.44 : 0.22,
        )}`,
        color: accentColor,
        fontWeight: 800,
        "& .MuiChip-icon": {
          color: accentColor,
        },
      }}
    />
  );
}
