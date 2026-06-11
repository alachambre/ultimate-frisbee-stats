import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { createAppTheme } from "../theme";
import LegacyUiRoutes from "../legacy-ui/routes/LegacyUiRoutes";
import { useUiMode } from "../uiMode/useUiMode";
import DefaultRoutes from "./DefaultRoutes";

const legacyLightTheme = createAppTheme("light");

function LegacyLightThemeRoutes() {
  return (
    <ThemeProvider theme={legacyLightTheme}>
      <CssBaseline enableColorScheme />
      <LegacyUiRoutes />
    </ThemeProvider>
  );
}

export default function AppRoutes() {
  const { uiMode } = useUiMode();

  return uiMode === "old" ? <LegacyLightThemeRoutes /> : <DefaultRoutes />;
}
