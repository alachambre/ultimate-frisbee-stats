import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiMode = "old" | "new";

const UI_MODE_STORAGE_KEY = "monkey-statistics-ui-mode";

interface UiModeContextValue {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  toggleUiMode: () => void;
}

const UiModeContext = createContext<UiModeContextValue | undefined>(undefined);

function readInitialUiMode(): UiMode {
  if (typeof window === "undefined") {
    return "old";
  }

  const storedMode = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
  return storedMode === "new" ? "new" : "old";
}

interface UiModeProviderProps {
  children: ReactNode;
}

export function UiModeProvider({ children }: UiModeProviderProps) {
  const [uiMode, setUiModeState] = useState<UiMode>(() => readInitialUiMode());

  const setUiMode = useCallback((mode: UiMode) => {
    setUiModeState(mode);
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
  }, []);

  const toggleUiMode = useCallback(() => {
    setUiModeState((currentMode) => {
      const nextMode: UiMode = currentMode === "old" ? "new" : "old";
      window.localStorage.setItem(UI_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      uiMode,
      setUiMode,
      toggleUiMode,
    }),
    [setUiMode, toggleUiMode, uiMode]
  );

  return (
    <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUiMode() {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error("useUiMode must be used within UiModeProvider");
  }
  return context;
}
