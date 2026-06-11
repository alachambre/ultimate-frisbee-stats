import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppBar from "@mui/material/AppBar";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
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
import Typography from "@mui/material/Typography";
import BarChartIcon from "@mui/icons-material/BarChart";
import LanguageIcon from "@mui/icons-material/Language";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import LoginDialog from "../auth/LoginDialog";
import {
  ENGLISH_FLAG_EMOJI,
  FRENCH_FLAG_EMOJI,
} from "../../constants/branding";
import { getAllGames } from "../../services/games";
import type { GameWithScore } from "../../types";
import { queryKeys } from "../../utils/queryKeys";
import { isMobileFullscreenRoute } from "./mobileFullscreenRoutes";
import TeamSelector from "./TeamSelector";
import ThemeModeToggle from "./ThemeModeToggle";
import UiModeToggle from "./UiModeToggle";
import { useSelectedTeam } from "../team/useSelectedTeam";

interface NavigationItem {
  label: string;
  path: string;
  value?: string;
  disabled?: boolean;
}

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/games" && currentPath.startsWith("/live/")) {
    return true;
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

function getCurrentSectionKey(pathname: string) {
  if (pathname.startsWith("/live")) {
    return "navigation:mobileNav.live";
  }
  if (pathname.startsWith("/statistics")) {
    return "navigation:mobileNav.statistics";
  }
  if (pathname.startsWith("/team-setup")) {
    return "navigation:menu.teamSetup";
  }
  if (pathname.startsWith("/strategies")) {
    return "navigation:menu.strategies";
  }
  if (pathname.startsWith("/admin/users")) {
    return "navigation:menu.admin";
  }
  if (pathname.startsWith("/record")) {
    return "navigation:menu.recordGame";
  }

  return "navigation:menu.allGames";
}

function getMobileNavValue(pathname: string) {
  if (pathname.startsWith("/games/") || pathname.startsWith("/live")) {
    return "/live";
  }
  if (pathname.startsWith("/statistics")) {
    return "/statistics";
  }
  if (pathname.startsWith("/games")) {
    return "/games";
  }

  return "more";
}

function compareGameDates(
  leftDate?: string | null,
  rightDate?: string | null
) {
  if (!leftDate && !rightDate) {
    return 0;
  }
  if (!leftDate) {
    return 1;
  }
  if (!rightDate) {
    return -1;
  }

  return new Date(leftDate).getTime() - new Date(rightDate).getTime();
}

function getSelectedTeamLiveGame(
  games: GameWithScore[],
  selectedTeamName?: string
): GameWithScore | undefined {
  if (selectedTeamName === undefined) {
    return undefined;
  }

  return games
    .filter(
      (game) =>
        game.status === "started" && game.team_name === selectedTeamName
    )
    .sort((left, right) => compareGameDates(left.date, right.date))[0];
}

export default function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation(["common", "navigation"]);
  const { canLoadTeams, selectedTeam } = useSelectedTeam();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const shouldUseMobileFullscreen = isMobileFullscreenRoute(location.pathname);
  const { data: games = [] } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
    enabled: !shouldUseMobileFullscreen,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const currentLiveGame = getSelectedTeamLiveGame(games, selectedTeam?.name);
  const liveHistoryPath = currentLiveGame
    ? `/games/${currentLiveGame.id}`
    : "/games";
  const selectedTeamLabel =
    selectedTeam?.name ??
    (canLoadTeams
      ? t("navigation:team.allTeams")
      : t("navigation:team.publicView"));
  const currentSectionLabel = t(getCurrentSectionKey(location.pathname));

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
      ...(canEditData
        ? [{ label: t("navigation:menu.strategies"), path: "/strategies" }]
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

  const mobileNavigationItems = useMemo<NavigationItem[]>(() => {
    const canViewStatistics =
      !shouldProtectUi || auth.capabilities.canViewStatistics;

    return [
      { label: t("navigation:mobileNav.games"), path: "/games" },
      {
        label: t("navigation:mobileNav.live"),
        path: liveHistoryPath,
        value: "/live",
        disabled: currentLiveGame === undefined,
      },
      ...(canViewStatistics
        ? [{ label: t("navigation:mobileNav.statistics"), path: "/statistics" }]
        : []),
    ];
  }, [
    auth.capabilities.canViewStatistics,
    currentLiveGame,
    liveHistoryPath,
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
          bgcolor: {
            xs: theme.colors.newUi.primarySurface,
            sm: "background.default",
          },
          color: {
            xs: theme.colors.newUi.primarySurfaceText,
            sm: theme.palette.text.primary,
          },
          borderBottom: {
            xs: "none",
            sm: `1px solid ${alpha(theme.palette.divider, 0.55)}`,
          },
          display: {
            xs: shouldUseMobileFullscreen ? "none" : "block",
            sm: "block",
          },
        })}
      >
        <Toolbar
          aria-label={t("navigation:mobileTopBar.label")}
          sx={(theme) => ({
            alignItems: "center",
            display: { xs: "flex", sm: "none" },
            justifyContent: "center",
            minHeight: 56,
            px: 2,
            width: "100%",
            ...(!shouldUseMobileFullscreen
              ? {}
              : {
                  [theme.breakpoints.only("xs")]: {
                    display: "none",
                  },
            }),
          })}
        >
          <Box
            sx={{
              minWidth: 0,
              textAlign: "center",
            }}
          >
            <Typography
              component="div"
              title={selectedTeamLabel}
              sx={{
                color: "inherit",
                fontWeight: 900,
                lineHeight: 1.15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              variant="subtitle1"
            >
              {selectedTeamLabel}
            </Typography>
            <Typography
              component="div"
              sx={(theme) => ({
                color: alpha(theme.palette.common.white, 0.78),
                fontSize: "0.75rem",
                fontWeight: 700,
                lineHeight: 1.15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {currentSectionLabel}
            </Typography>
          </Box>
        </Toolbar>

        <Toolbar
          sx={(theme) => ({
            display: { xs: "none", sm: "flex" },
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
              display: { sm: "inline-flex", lg: "none" },
            })}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="nav"
            sx={{
              display: { xs: "none", md: "flex" },
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
                      ? theme.colors.newUi.primaryAction
                      : "transparent",
                    boxShadow: "none",
                    color: isActive
                      ? theme.colors.newUi.primaryActionText
                      : theme.palette.text.primary,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    "&:hover": {
                      bgcolor: isActive
                        ? theme.colors.newUi.primaryActionHover
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
              display: { xs: "none", sm: "flex" },
              flexShrink: 0,
              gap: 1.5,
              ml: "auto",
            }}
          >
            <TeamSelector />
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
            <ThemeModeToggle
              iconButtonProps={{
                sx: newUiIconButtonSx,
              }}
              iconOnly
            />
            <UiModeToggle
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
              <TeamSelector />
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
              <ThemeModeToggle
                iconButtonProps={{
                  sx: newUiIconButtonSx,
                }}
                iconOnly
              />
              <UiModeToggle
                iconButtonProps={{
                  sx: newUiIconButtonSx,
                }}
                iconOnly
              />
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          pb: {
            xs: shouldUseMobileFullscreen
              ? 0
              : "calc(78px + env(safe-area-inset-bottom))",
            sm: 0,
          },
        }}
      >
        <Outlet />
      </Box>

      <Box
        aria-label={t("navigation:mobileNav.label")}
        component="nav"
        sx={(theme) => ({
          bottom: 0,
          display: {
            xs: shouldUseMobileFullscreen ? "none" : "block",
            sm: "none",
          },
          left: 0,
          position: "fixed",
          right: 0,
          zIndex: theme.zIndex.appBar,
        })}
      >
        <BottomNavigation
          showLabels
          value={getMobileNavValue(location.pathname)}
          sx={(theme) => ({
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            boxShadow: `0 -8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
            height: "calc(64px + env(safe-area-inset-bottom))",
            pb: "env(safe-area-inset-bottom)",
            "& .MuiBottomNavigationAction-root": {
              color: theme.palette.text.secondary,
              minWidth: 0,
              px: 0.5,
            },
            "& .Mui-selected": {
              color: theme.colors.newUi.primary,
            },
            "& .MuiBottomNavigationAction-root.Mui-disabled": {
              color: alpha(theme.palette.text.secondary, 0.48),
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.7rem",
              fontWeight: 800,
              whiteSpace: "nowrap",
            },
          })}
        >
          {mobileNavigationItems.map((item) => {
            const isLiveNavigationAvailable =
              item.value === "/live" && currentLiveGame !== undefined;
            const icon =
              item.value === "/live" ? (
                <PlayArrowIcon />
              ) : item.path === "/statistics" ? (
                <BarChartIcon />
              ) : (
                <SportsScoreIcon />
              );

            if (item.disabled) {
              return (
                <BottomNavigationAction
                  disabled
                  icon={icon}
                  key={item.value ?? item.path}
                  label={item.label}
                  value={item.value ?? item.path}
                />
              );
            }

            return (
              <BottomNavigationAction
                aria-current={
                  getMobileNavValue(location.pathname) ===
                  (item.value ?? item.path)
                    ? "page"
                    : undefined
                }
                component={Link}
                data-live-available={
                  isLiveNavigationAvailable ? "true" : undefined
                }
                icon={icon}
                key={item.value ?? item.path}
                label={item.label}
                sx={
                  isLiveNavigationAvailable
                    ? (theme) => ({
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: 1,
                        color: theme.palette.success.dark,
                        mx: 0.25,
                        position: "relative",
                        "& .MuiBottomNavigationAction-label": {
                          color: "inherit",
                        },
                        "& .MuiSvgIcon-root": {
                          color: theme.palette.success.main,
                        },
                        "&::after": {
                          bgcolor: theme.palette.success.main,
                          border: `2px solid ${theme.palette.background.paper}`,
                          borderRadius: "50%",
                          content: '""',
                          height: 10,
                          position: "absolute",
                          right: "28%",
                          top: 8,
                          width: 10,
                        },
                        "&&.Mui-selected": {
                          bgcolor: alpha(theme.palette.success.main, 0.16),
                          color: theme.palette.success.dark,
                        },
                      })
                    : undefined
                }
                to={item.path}
                value={item.value ?? item.path}
              />
            );
          })}
          <BottomNavigationAction
            icon={<MoreHorizIcon />}
            label={t("navigation:mobileNav.more")}
            onClick={() => setIsDrawerOpen(true)}
            value="more"
          />
        </BottomNavigation>
      </Box>

      <LoginDialog
        open={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
    </Box>
  );
}
