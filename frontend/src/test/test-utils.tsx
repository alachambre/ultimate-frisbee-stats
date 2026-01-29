import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import i18n from "../locales";

// Create a custom render function that includes providers
// Similar to backend's conftest.py fixtures

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e3a8a",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    secondary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0284c7",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  gradients: {
    primary: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
    primaryReverse: "linear-gradient(180deg, #1e3a8a 0%, #38bdf8 100%)",
    light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
    middle: "#2b7cc1",
  },
  colors: {
    offense: {
      main: "#1e3a8a",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    defense: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
    },
    men: {
      main: "#1e3a8a",
    },
    women: {
      main: "#38bdf8",
    },
  },
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Clone i18n instance for tests with English only
const testI18n = i18n.cloneInstance({
  lng: 'en',
  fallbackLng: 'en',
  react: { useSuspense: false },
});

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const testQueryClient = createTestQueryClient();

  return (
    <I18nextProvider i18n={testI18n}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={testQueryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
