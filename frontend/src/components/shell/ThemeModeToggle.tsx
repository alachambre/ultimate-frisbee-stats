import Button, { type ButtonProps } from "@mui/material/Button";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "../../themeMode/useThemeMode";

type ThemeModeToggleProps = Pick<
  ButtonProps,
  "color" | "fullWidth" | "sx" | "variant"
> & {
  iconOnly?: boolean;
  iconButtonProps?: Pick<IconButtonProps, "edge" | "size" | "sx">;
};

export default function ThemeModeToggle({
  color,
  fullWidth,
  iconButtonProps,
  iconOnly = false,
  sx,
  variant,
}: ThemeModeToggleProps = {}) {
  const { t } = useTranslation(["navigation"]);
  const { themeMode, toggleThemeMode } = useThemeMode();
  const isDark = themeMode === "dark";
  const label = isDark
    ? t("navigation:theme.switchToLight")
    : t("navigation:theme.switchToDark");
  const Icon = isDark ? LightModeIcon : DarkModeIcon;
  const baseSx = { flexShrink: 0, whiteSpace: "nowrap" };

  if (iconOnly) {
    return (
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          edge={iconButtonProps?.edge}
          onClick={toggleThemeMode}
          size={iconButtonProps?.size ?? "medium"}
          sx={iconButtonProps?.sx}
          type="button"
        >
          <Icon />
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
        onClick={toggleThemeMode}
        startIcon={<Icon />}
        sx={[baseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
        type="button"
        variant={variant}
      >
        {t(`navigation:theme.${themeMode}`)}
      </Button>
    </Tooltip>
  );
}

