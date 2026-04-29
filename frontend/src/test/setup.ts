import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { createElement, forwardRef } from "react";
import { handlers, resetMockData } from "./mocks/handlers";
import i18n from "../locales";

vi.mock("react-chartjs-2", () => ({
  Chart: forwardRef(function MockChart(props: Record<string, unknown>, _ref) {
    return createElement("div", {
      "data-testid": "chartjs-chart",
      "data-chart-type": props.type,
      role: props.role ?? "img",
      "aria-label": props["aria-label"] ?? "Chart preview",
    });
  }),
  Line: forwardRef(function MockLine(_props, _ref) {
    return createElement("div", {
      "data-testid": "chartjs-line",
      role: "img",
      "aria-label": "Chart preview",
    });
  }),
}));

// Set up MSW server
const server = setupServer(...handlers);

// Export server for use in tests that need to override handlers
export { server };

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });

  // Initialize i18n for tests
  if (!i18n.isInitialized) {
    i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      react: { useSuspense: false },
    });
  } else {
    // If already initialized, change to English
    i18n.changeLanguage('en');
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockData();
});

// Stop server after all tests
afterAll(() => {
  server.close();
});
