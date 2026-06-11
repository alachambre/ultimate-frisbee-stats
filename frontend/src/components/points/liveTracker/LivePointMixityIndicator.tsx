import { Chip, useTheme } from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { GenderRatio } from "../../../utils/playerComposition";

interface LivePointMixityIndicatorProps {
  requiredGenderRatio: GenderRatio | null;
  tone?: "filled" | "soft";
}

export function LivePointMixityIndicator({
  requiredGenderRatio,
  tone = "filled",
}: LivePointMixityIndicatorProps) {
  const { t } = useTranslation(["points"]);
  const theme = useTheme();

  if (!requiredGenderRatio) {
    return null;
  }

  const isMenMixity = requiredGenderRatio.men > requiredGenderRatio.women;
  const accentColor = isMenMixity
    ? theme.colors.men.main
    : theme.colors.women.main;
  const textColor =
    tone === "filled" ? theme.palette.getContrastText(accentColor) : accentColor;

  return (
    <Chip
      icon={isMenMixity ? <MaleIcon /> : <FemaleIcon />}
      label={
        isMenMixity
          ? t("points:dialog.start.men")
          : t("points:dialog.start.women")
      }
      size="small"
      sx={{
        bgcolor:
          tone === "filled"
            ? accentColor
            : alpha(accentColor, theme.palette.mode === "dark" ? 0.18 : 0.1),
        border:
          tone === "soft"
            ? `1px solid ${alpha(
                accentColor,
                theme.palette.mode === "dark" ? 0.44 : 0.22,
              )}`
            : 0,
        color: textColor,
        fontWeight: 800,
        "& .MuiChip-icon": {
          color: textColor,
        },
      }}
    />
  );
}
