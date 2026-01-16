import { expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { handlers, resetMockData } from "./mocks/handlers";

// Set up MSW server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
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
