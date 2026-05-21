import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useTranslation } from "react-i18next";

import { useUiMode } from "../../uiMode/useUiMode";

export default function NewUiModeToggle() {
  const { t } = useTranslation(["navigation"]);
  const { setUiMode, uiMode } = useUiMode();
  const nextMode = uiMode === "new" ? "old" : "new";
  const label =
    nextMode === "old"
      ? t("navigation:uiMode.switchToOld")
      : t("navigation:uiMode.switchToNew");

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        onClick={() => setUiMode(nextMode)}
        startIcon={<SwapHorizIcon />}
        sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
        type="button"
      >
        {t(`navigation:uiMode.${uiMode}`)}
      </Button>
    </Tooltip>
  );
}
