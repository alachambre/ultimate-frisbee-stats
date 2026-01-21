import { Link, Outlet, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";

export default function Layout() {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
            }}
          >
            Ultimate Stats
          </Typography>
          <Box>
            <Button
              component={Link}
              to="/teams"
              color={location.pathname.startsWith("/teams") ? "primary" : "inherit"}
            >
              Teams
            </Button>
            <Button
              component={Link}
              to="/competitions"
              color={location.pathname.startsWith("/competitions") ? "primary" : "inherit"}
            >
              Competitions
            </Button>
            <Button
              component={Link}
              to="/games"
              color={location.pathname.startsWith("/games") ? "primary" : "inherit"}
            >
              Games
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
