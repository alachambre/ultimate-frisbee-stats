import { describe, expect, it } from "vitest";

import { mockDb, resetMockData } from "../mockDb";

describe("mockDb", () => {
  it("resets mutable mock API state", () => {
    mockDb.teams.push({
      id: 42,
      name: "Test",
      created_at: "2026-01-01T00:00:00Z",
    });
    mockDb.nextTeamId = 99;

    resetMockData();

    expect(mockDb.teams).toEqual([]);
    expect(mockDb.nextTeamId).toBe(1);
  });
});
