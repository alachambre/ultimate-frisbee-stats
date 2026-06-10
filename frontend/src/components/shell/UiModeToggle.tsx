import Button, { type ButtonProps } from "@mui/material/Button";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useUiMode } from "../../uiMode/useUiMode";
import type { UiMode } from "../../uiMode/useUiMode";

type UiModeToggleProps = Pick<
  ButtonProps,
  "color" | "fullWidth" | "sx" | "variant"
> & {
  iconOnly?: boolean;
  iconButtonProps?: Pick<IconButtonProps, "edge" | "size" | "sx">;
};

function getModeSwitchTarget(nextMode: UiMode, currentPath: string) {
  if (nextMode === "new") {
    if (currentPath.startsWith("/admin/users")) {
      return "/admin/users";
    }
    if (currentPath.startsWith("/statistics")) {
      return "/statistics";
    }
    if (
      currentPath.startsWith("/teams") ||
      currentPath.startsWith("/strategies") ||
      currentPath.startsWith("/lines")
    ) {
      return "/team-setup";
    }
    return "/games";
  }

  if (currentPath.startsWith("/admin/users")) {
    return "/admin/users";
  }
  if (currentPath.startsWith("/statistics")) {
    return "/statistics";
  }
  if (
    currentPath.startsWith("/record") ||
    currentPath.startsWith("/team-setup")
  ) {
    return "/teams";
  }
  if (currentPath.startsWith("/games") || currentPath.startsWith("/live")) {
    return "/competitions";
  }
  return "/";
}

export default function UiModeToggle({
  color,
  fullWidth,
  iconButtonProps,
  iconOnly = false,
  sx,
  variant,
}: UiModeToggleProps = {}) {
  const { t } = useTranslation(["navigation"]);
  const { setUiMode, uiMode } = useUiMode();
  const location = useLocation();
  const navigate = useNavigate();
  const nextMode = uiMode === "new" ? "old" : "new";
  const label =
    nextMode === "old"
      ? t("navigation:uiMode.switchToOld")
      : t("navigation:uiMode.switchToNew");
  const baseSx = { flexShrink: 0, whiteSpace: "nowrap" };

  const handleModeSwitch = () => {
    setUiMode(nextMode);
    navigate(getModeSwitchTarget(nextMode, location.pathname));
  };

  if (iconOnly) {
    return (
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          edge={iconButtonProps?.edge}
          onClick={handleModeSwitch}
          size={iconButtonProps?.size ?? "medium"}
          sx={iconButtonProps?.sx}
          type="button"
        >
          <SwapHorizIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        color={color}
        fullWidth={fullWidth}
        onClick={handleModeSwitch}
        startIcon={<SwapHorizIcon />}
        sx={[baseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
        type="button"
        variant={variant}
      >
        {t(`navigation:uiMode.${uiMode}`)}
      </Button>
    </Tooltip>
  );
}
