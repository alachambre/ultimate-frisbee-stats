import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

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
  // Custom theme extensions
  gradients: {
    primary: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
    primaryReverse: "linear-gradient(180deg, #1e3a8a 0%, #38bdf8 100%)",
    light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
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

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const testQueryClient = createTestQueryClient();

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
