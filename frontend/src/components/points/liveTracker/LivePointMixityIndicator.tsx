import { Chip, useTheme } from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { useTranslation } from "react-i18next";
import type { GenderRatio } from "../../../utils/playerComposition";

interface LivePointMixityIndicatorProps {
  requiredGenderRatio: GenderRatio | null;
}

export function LivePointMixityIndicator({
  requiredGenderRatio,
}: LivePointMixityIndicatorProps) {
  const { t } = useTranslation(["points"]);
  const theme = useTheme();

  if (!requiredGenderRatio) {
    return null;
  }

  const isMenMixity = requiredGenderRatio.men > requiredGenderRatio.women;

  return (
    <Chip
      icon={isMenMixity ? <MaleIcon /> : <FemaleIcon />}
      label={isMenMixity ? t("points:dialog.start.men") : t("points:dialog.start.women")}
      size="small"
      sx={{
        bgcolor: isMenMixity ? theme.colors.men.main : theme.colors.women.main,
        color: theme.palette.common.white,
        "& .MuiChip-icon": {
          color: theme.palette.common.white,
        },
      }}
    />
  );
}
