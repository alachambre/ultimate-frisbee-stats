import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import LanguageIcon from "@mui/icons-material/Language";
import MenuIcon from "@mui/icons-material/Menu";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import LoginDialog from "../../components/auth/LoginDialog";
import {
  ENGLISH_FLAG_EMOJI,
  FRENCH_FLAG_EMOJI,
} from "../../constants/branding";
import { isMobileFullscreenRoute } from "./mobileFullscreenRoutes";
import NewTeamSelector from "./NewTeamSelector";
import NewUiModeToggle from "./NewUiModeToggle";

interface NavigationItem {
  label: string;
  path: string;
}

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/games" && currentPath.startsWith("/live/")) {
    return true;
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export default function NewAppShell() {
  const auth = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation(["common", "navigation"]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const shouldUseMobileFullscreen = isMobileFullscreenRoute(location.pathname);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const canViewStatistics =
      !shouldProtectUi || auth.capabilities.canViewStatistics;
    const canEditData = !shouldProtectUi || auth.capabilities.canEditData;

    return [
      { label: t("navigation:menu.allGames"), path: "/games" },
      ...(canViewStatistics
        ? [{ label: t("navigation:menu.statistics"), path: "/statistics" }]
        : []),
      ...(canEditData
        ? [{ label: t("navigation:menu.teamSetup"), path: "/team-setup" }]
        : []),
      ...(auth.capabilities.canManageUsers
        ? [{ label: t("navigation:menu.admin"), path: "/admin/users" }]
        : []),
    ];
  }, [
    auth.capabilities.canEditData,
    auth.capabilities.canManageUsers,
    auth.capabilities.canViewStatistics,
    shouldProtectUi,
    t,
  ]);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const closeLanguageMenu = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageChange = (language: string) => {
    void i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
    closeLanguageMenu();
  };

  const handleAuthAction = async () => {
    if (!auth.isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }

    try {
      await auth.signOut();
      closeDrawer();
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const languageMenu = (
    <Menu
      anchorEl={languageMenuAnchor}
      onClose={closeLanguageMenu}
      open={Boolean(languageMenuAnchor)}
    >
      <MenuItem
        onClick={() => handleLanguageChange("en")}
        selected={i18n.language === "en"}
      >
        {ENGLISH_FLAG_EMOJI} {t("navigation:language.english")}
      </MenuItem>
      <MenuItem
        onClick={() => handleLanguageChange("fr")}
        selected={i18n.language === "fr"}
      >
        {FRENCH_FLAG_EMOJI} {t("navigation:language.french")}
      </MenuItem>
    </Menu>
  );

  const newUiIconButtonSx = (theme: import("@mui/material/styles").Theme) => ({
    color: theme.colors.newUi.primary,
    "&:hover": {
      bgcolor: alpha(theme.colors.newUi.primary, 0.08),
    },
  });
  const newUiOutlinedButtonSx = (
    theme: import("@mui/material/styles").Theme,
  ) => ({
    borderColor: theme.colors.newUi.primaryBorder,
    color: theme.colors.newUi.primary,
    flexShrink: 0,
    whiteSpace: "nowrap",
    "&:hover": {
      bgcolor: alpha(theme.colors.newUi.primary, 0.08),
      borderColor: theme.colors.newUi.primary,
    },
  });

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <AppBar
        color="default"
        elevation={0}
        position="sticky"
        sx={(theme) => ({
          bgcolor: "background.default",
          borderBottom: {
            xs: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            md: `1px solid ${alpha(theme.palette.divider, 0.45)}`,
          },
          display: {
            xs: shouldUseMobileFullscreen ? "none" : "block",
            sm: "block",
          },
        })}
      >
        <Toolbar
          sx={(theme) => ({
            gap: { xs: 1, md: 2 },
            maxWidth: theme.breakpoints.values.lg,
            minHeight: { xs: 64, md: 72 },
            mx: "auto",
            px: { xs: 2, sm: 3 },
            width: "100%",
          })}
        >
          <IconButton
            aria-label={t("navigation:drawer.open")}
            edge="start"
            onClick={() => setIsDrawerOpen(true)}
            sx={(theme) => ({
              ...newUiIconButtonSx(theme),
              display: { xs: "inline-flex", xl: "none" },
            })}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="nav"
            sx={{
              display: { xs: "none", xl: "flex" },
              flex: 1,
              gap: 0.5,
              minWidth: 0,
            }}
          >
            {navigationItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <Button
                  component={Link}
                  key={item.path}
                  to={item.path}
                  variant={isActive ? "contained" : "text"}
                  sx={(theme) => ({
                    bgcolor: isActive
                      ? theme.colors.newUi.primary
                      : "transparent",
                    boxShadow: "none",
                    color: isActive
                      ? theme.palette.common.white
                      : theme.palette.text.primary,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      bgcolor: isActive
                        ? theme.colors.newUi.primary
                        : alpha(theme.palette.text.primary, 0.06),
                      boxShadow: "none",
                    },
                  })}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              alignItems: "center",
              display: { xs: "none", lg: "flex" },
              flexShrink: 0,
              gap: 1.5,
            }}
          >
            <NewTeamSelector />
            <Tooltip title={t("navigation:language.select")}>
              <IconButton
                aria-label={t("navigation:language.select")}
                onClick={handleLanguageMenuOpen}
                sx={newUiIconButtonSx}
                type="button"
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <NewUiModeToggle
              iconButtonProps={{
                sx: newUiIconButtonSx,
              }}
              iconOnly
            />
            {auth.isConfigured && (
              <Button
                disabled={auth.isLoading}
                onClick={handleAuthAction}
                sx={newUiOutlinedButtonSx}
                type="button"
                variant="outlined"
              >
                {auth.isAuthenticated
                  ? t("common:auth.signOut")
                  : t("common:auth.signIn")}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {languageMenu}

      <Drawer
        anchor="left"
        onClose={closeDrawer}
        open={isDrawerOpen}
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            width: 300,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          <Box sx={{ px: 2, py: 2 }}>
            <Box>
              <NewTeamSelector />
            </Box>
          </Box>

          <Divider />

          <List component="nav" sx={{ py: 1 }}>
            {navigationItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <ListItem disablePadding key={item.path}>
                  <ListItemButton
                    component={Link}
                    onClick={closeDrawer}
                    selected={isActive}
                    to={item.path}
                    sx={(theme) => ({
                      borderRadius: 1,
                      mx: 1,
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.colors.newUi.primary, 0.12),
                        color: theme.colors.newUi.primary,
                        "&:hover": {
                          bgcolor: alpha(theme.colors.newUi.primary, 0.18),
                        },
                      },
                    })}
                  >
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Box sx={{ mt: "auto", p: 2 }}>
            {auth.isConfigured && (
              <Button
                disabled={auth.isLoading}
                fullWidth
                onClick={handleAuthAction}
                sx={(theme) => ({
                  ...newUiOutlinedButtonSx(theme),
                  mb: 1,
                })}
                type="button"
                variant="outlined"
              >
                {auth.isAuthenticated
                  ? t("common:auth.signOut")
                  : t("common:auth.signIn")}
              </Button>
            )}
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 1,
                justifyContent: "flex-end",
              }}
            >
              <Tooltip title={t("navigation:language.select")}>
                <IconButton
                  aria-label={t("navigation:language.select")}
                  onClick={handleLanguageMenuOpen}
                  sx={newUiIconButtonSx}
                  type="button"
                >
                  <LanguageIcon />
                </IconButton>
              </Tooltip>
              <NewUiModeToggle
                iconButtonProps={{
                  sx: newUiIconButtonSx,
                }}
                iconOnly
              />
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
    </Box>
  );
}
