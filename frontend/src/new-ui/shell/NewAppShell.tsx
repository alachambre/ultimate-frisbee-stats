import { useMemo, useState } from "react";
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
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import LoginDialog from "../../components/auth/LoginDialog";
import { APP_MONKEY_EMOJI } from "../../constants/branding";
import NewTeamSelector from "./NewTeamSelector";
import NewUiModeToggle from "./NewUiModeToggle";

interface NavigationItem {
  label: string;
  path: string;
}

function isActivePath(currentPath: string, itemPath: string) {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export default function NewAppShell() {
  const auth = useAuth();
  const location = useLocation();
  const { t } = useTranslation(["common", "navigation"]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
    const canViewStatistics =
      !shouldProtectUi || auth.capabilities.canViewStatistics;

    return [
      ...(canEditData
        ? [{ label: t("navigation:menu.recordGame"), path: "/record" }]
        : []),
      { label: t("navigation:menu.liveGame"), path: "/live" },
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
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Toolbar
          sx={{
            gap: { xs: 1, md: 2 },
            minHeight: { xs: 64, md: 72 },
          }}
        >
          <IconButton
            aria-label={t("navigation:drawer.title")}
            edge="start"
            onClick={() => setIsDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", lg: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={(theme) => ({
              alignItems: "center",
              color: theme.palette.text.primary,
              display: "inline-flex",
              flexShrink: 0,
              fontWeight: 800,
              gap: 0.75,
              textDecoration: "none",
              whiteSpace: "nowrap",
            })}
          >
            <Box component="span" aria-hidden>
              {APP_MONKEY_EMOJI}
            </Box>
            {t("common:app.name")}
          </Typography>

          <Box
            component="nav"
            sx={{
              display: { xs: "none", lg: "flex" },
              flex: 1,
              gap: 0.5,
              minWidth: 0,
            }}
          >
            {navigationItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <Button
                  color={isActive ? "primary" : "inherit"}
                  component={Link}
                  key={item.path}
                  to={item.path}
                  variant={isActive ? "contained" : "text"}
                  sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
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
            <NewUiModeToggle />
            {auth.isConfigured && (
              <Button
                disabled={auth.isLoading}
                onClick={handleAuthAction}
                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
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
            <Typography
              component={Link}
              to="/"
              onClick={closeDrawer}
              variant="h6"
              sx={(theme) => ({
                color: theme.palette.text.primary,
                display: "inline-flex",
                fontWeight: 800,
                gap: 0.75,
                textDecoration: "none",
              })}
            >
              <Box component="span" aria-hidden>
                {APP_MONKEY_EMOJI}
              </Box>
              {t("common:app.name")}
            </Typography>
            <Box sx={{ mt: 2 }}>
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
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.18),
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
                sx={{ mb: 1 }}
                type="button"
                variant="outlined"
              >
                {auth.isAuthenticated
                  ? t("common:auth.signOut")
                  : t("common:auth.signIn")}
              </Button>
            )}
            <NewUiModeToggle />
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
