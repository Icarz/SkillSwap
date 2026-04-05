import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

// Stop MSW after all tests
afterAll(() => server.close());
