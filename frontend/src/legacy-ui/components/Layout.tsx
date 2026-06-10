import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";

import LoginDialog from "../../components/auth/LoginDialog";
import { shouldEnforcePermissions, useAuth } from "../../auth";
import {
  APP_MONKEY_EMOJI,
  ENGLISH_FLAG_EMOJI,
  FRENCH_FLAG_EMOJI,
} from "../../constants/branding";
import UiModeToggle from "../../components/shell/UiModeToggle";

export default function Layout() {
  const location = useLocation();
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "common"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canAccessTeamAreas = !shouldProtectUi || auth.capabilities.canEditData;
  const canAccessStatistics = !shouldProtectUi || auth.capabilities.canViewStatistics;
  const canAccessAdmin = auth.capabilities.canManageUsers;

  const menuItems = [
    ...(canAccessTeamAreas
      ? [
          { label: t("navigation:menu.teams"), path: "/teams" },
          { label: t("navigation:menu.strategies"), path: "/strategies" },
        ]
      : []),
    { label: t("navigation:menu.competitions"), path: "/competitions" },
    ...(canAccessStatistics
      ? [{ label: t("navigation:menu.statistics"), path: "/statistics" }]
      : []),
    ...(canAccessAdmin
      ? [{ label: t("navigation:menu.users"), path: "/admin/users" }]
      : []),
  ];

  const handleDrawerClose = () => {
    setMobileMenuOpen(false);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    handleLanguageMenuClose();
  };

  const handleAuthAction = async () => {
    if (!auth.isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }

    try {
      await auth.signOut();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: (theme) => theme.gradients.light,
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: (theme) => theme.gradients.primary,
          borderBottom: (theme) => `3px solid ${alpha(theme.palette.common.white, 0.2)}`,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: (theme) => theme.palette.common.white,
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              letterSpacing: "0.5px",
            }}
          >
            {APP_MONKEY_EMOJI} {t("common:app.name")}
          </Typography>

          {auth.isConfigured && auth.isAuthenticated && auth.email && (
            <Typography
              variant="body2"
              sx={(theme) => ({
                display: { xs: "none", lg: "block" },
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.common.white,
                mr: 2,
              })}
            >
              {auth.email}
            </Typography>
          )}

          <IconButton
            onClick={handleLanguageMenuOpen}
            sx={(theme) => ({
              color: theme.palette.common.white,
              mr: { xs: 1, md: 2 },
            })}
            aria-label="select language"
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={languageMenuAnchor}
            open={Boolean(languageMenuAnchor)}
            onClose={handleLanguageMenuClose}
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

          <IconButton
            edge="end"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={(theme) => ({
              display: { xs: "flex", md: "none" },
              color: theme.palette.common.white,
            })}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={(theme) => ({
                  color: theme.palette.common.white,
                  fontWeight: location.pathname.startsWith(item.path) ? "bold" : "normal",
                  backgroundColor: location.pathname.startsWith(item.path)
                    ? alpha(theme.palette.common.white, 0.2)
                    : "transparent",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                  },
                  borderRadius: 2,
                  px: 2,
                })}
              >
                {item.label}
              </Button>
            ))}
            {auth.isConfigured && (
              <Button
                onClick={handleAuthAction}
                disabled={auth.isLoading}
                variant="outlined"
                sx={(theme) => ({
                  color: theme.palette.common.white,
                  borderColor: alpha(theme.palette.common.white, 0.35),
                  "&:hover": {
                    borderColor: alpha(theme.palette.common.white, 0.5),
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                })}
              >
                {auth.isAuthenticated
                  ? t("common:auth.signOut")
                  : t("common:auth.signIn")}
              </Button>
            )}
            <UiModeToggle
              variant="outlined"
              sx={(theme) => ({
                color: theme.palette.common.white,
                borderColor: alpha(theme.palette.common.white, 0.35),
                "&:hover": {
                  borderColor: alpha(theme.palette.common.white, 0.5),
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              })}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleDrawerClose}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{
          sx: {
            background: (theme) => theme.gradients.primaryReverse,
            color: (theme) => theme.palette.common.white,
          },
        }}
      >
        <Box sx={{ width: 250, pt: 2 }} role="presentation">
          <Typography
            variant="h6"
            sx={{
              px: 2,
              pb: 2,
              fontWeight: "bold",
              borderBottom: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            }}
          >
            {t("common:app.name")}
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={handleDrawerClose}
                  selected={location.pathname.startsWith(item.path)}
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.common.white, 0.2),
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.common.white, 0.25),
                      },
                    },
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    },
                  })}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: location.pathname.startsWith(item.path) ? "bold" : "normal",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {auth.isConfigured && (
            <Box sx={{ px: 2, pt: 1, pb: 2 }}>
              {auth.isAuthenticated && auth.email && (
                <Typography
                  variant="body2"
                  sx={(theme) => ({
                    mb: 1.5,
                    color: alpha(theme.palette.common.white, 0.85),
                    wordBreak: "break-word",
                  })}
                >
                  {auth.email}
                </Typography>
              )}
              <Button
                fullWidth
                variant="outlined"
                onClick={handleAuthAction}
                disabled={auth.isLoading}
                sx={(theme) => ({
                  color: theme.palette.common.white,
                  borderColor: alpha(theme.palette.common.white, 0.35),
                  "&:hover": {
                    borderColor: alpha(theme.palette.common.white, 0.5),
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                })}
              >
                {auth.isAuthenticated
                  ? t("common:auth.signOut")
                  : t("common:auth.signIn")}
              </Button>
            </Box>
          )}
          <Box sx={{ px: 2, pb: 2 }}>
            <UiModeToggle
              fullWidth
              variant="outlined"
              sx={(theme) => ({
                color: theme.palette.common.white,
                borderColor: alpha(theme.palette.common.white, 0.35),
                "&:hover": {
                  borderColor: alpha(theme.palette.common.white, 0.5),
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              })}
            />
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
    </Box>
  );
}
