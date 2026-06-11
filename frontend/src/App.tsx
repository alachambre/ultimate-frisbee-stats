import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Analytics } from "@vercel/analytics/react";
import i18n from "./locales";
import { AuthProvider } from "./auth";
import AppRoutes from "./routes/AppRoutes";
import { ThemeModeProvider } from "./themeMode/ThemeModeProvider";
import { UiModeProvider } from "./uiMode/UiModeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeModeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UiModeProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </UiModeProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Analytics />
      </ThemeModeProvider>
    </I18nextProvider>
  );
}

export default App;
