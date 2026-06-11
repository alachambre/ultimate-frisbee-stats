import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { createAppTheme, type AppThemeMode } from "../theme";

const THEME_MODE_STORAGE_KEY = "monkey-statistics-theme-mode";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

interface ThemeModeContextValue {
  setThemeMode: (mode: AppThemeMode) => void;
  themeMode: AppThemeMode;
  toggleThemeMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(
  undefined,
);

function isThemeMode(value: string | null): value is AppThemeMode {
  return value === "light" || value === "dark";
}

function getSystemThemeMode(): AppThemeMode {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.(DARK_MODE_QUERY).matches
  ) {
    return "dark";
  }

  return "light";
}

function readInitialThemeMode(): AppThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return isThemeMode(storedMode) ? storedMode : getSystemThemeMode();
}

interface ThemeModeProviderProps {
  children: ReactNode;
}

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
  const [themeMode, setThemeModeState] = useState<AppThemeMode>(() =>
    readInitialThemeMode(),
  );

  const setThemeMode = useCallback((mode: AppThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeModeState((currentMode) => {
      const nextMode: AppThemeMode = currentMode === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);
  const value = useMemo(
    () => ({
      setThemeMode,
      themeMode,
      toggleThemeMode,
    }),
    [setThemeMode, themeMode, toggleThemeMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }

  return context;
}

