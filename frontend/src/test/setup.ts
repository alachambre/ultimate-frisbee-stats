// @ts-expect-error - expect is used to extend global test matchers
import { expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { handlers, resetMockData } from "./mocks/handlers";
import i18n from "../locales";

// Set up MSW server
const server = setupServer(...handlers);

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
