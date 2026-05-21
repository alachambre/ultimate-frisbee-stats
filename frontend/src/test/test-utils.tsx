/* eslint-disable react-refresh/only-export-components */
import { type ReactElement } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import i18n from "../locales";
import { AuthProvider } from "../auth";
import type { AppRole, AuthEnforcementMode } from "../auth";
import { createAppTheme } from "../theme";

// Create a custom render function that includes providers
// Similar to backend's conftest.py fixtures

const theme = createAppTheme();

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
  auth?: TestAuthOptions;
}

interface TestAuthOptions {
  role?: AppRole;
  email?: string | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  hasAppAccess?: boolean;
  isConfigured?: boolean;
  enforcementMode?: AuthEnforcementMode;
  authUserId?: string | null;
}

// Clone i18n instance for tests with English only
const testI18n = i18n.cloneInstance({
  lng: 'en',
  fallbackLng: 'en',
  react: { useSuspense: false },
});

const AllTheProviders = ({ children, auth }: AllTheProvidersProps) => {
  const testQueryClient = createTestQueryClient();

  return (
    <I18nextProvider i18n={testI18n}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={testQueryClient}>
          <AuthProvider {...auth}>
            <BrowserRouter>{children}</BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  auth?: TestAuthOptions;
  route?: string;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { auth, route, ...renderOptions } = options ?? {};
  if (route) {
    window.history.pushState({}, "", route);
  }

  return rtlRender(ui, {
    wrapper: ({ children }) => <AllTheProviders auth={auth}>{children}</AllTheProviders>,
    ...renderOptions,
  });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
