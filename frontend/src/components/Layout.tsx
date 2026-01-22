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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Teams", path: "/teams" },
    { label: "Competitions", path: "/competitions" },
    { label: "Games", path: "/games" },
  ];

  const handleDrawerClose = () => {
    setMobileMenuOpen(false);
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
          borderBottom: "3px solid rgba(255, 255, 255, 0.2)",
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
              color: "white",
              fontWeight: "bold",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              letterSpacing: "0.5px",
            }}
          >
            🥏 Ultimate Stats
          </Typography>

          {/* Mobile Menu Icon */}
          <IconButton
            edge="end"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              display: { xs: "flex", md: "none" },
              color: "white",
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: "white",
                  fontWeight: location.pathname.startsWith(item.path) ? "bold" : "normal",
                  backgroundColor: location.pathname.startsWith(item.path)
                    ? "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                  },
                  borderRadius: 2,
                  px: 2,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleDrawerClose}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{
          sx: {
            background: (theme) => theme.gradients.primaryReverse,
            color: "white",
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
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            Navigation
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={handleDrawerClose}
                  selected={location.pathname.startsWith(item.path)}
                  sx={{
                    color: "white",
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
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
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
