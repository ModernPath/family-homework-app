import { describe, expect, it } from "vitest";
import {
  allTimePoints,
  formatPointsBadge,
  getMostActiveMemberIds,
  weekCompletionCount,
  weekPoints,
} from "./points";
import type { Completion, Household, Redemption } from "./types";
import { createEmptyHousehold } from "./seed";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const REF = "2026-09-02";

function householdWithPoints(): Household {
  const h = createEmptyHousehold(NOW);
  return {
    ...h,
    members: [
      {
        id: "m1",
        name: "Emma",
        color: "#3B82F6",
        avatar: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
      {
        id: "m2",
        name: "Dad",
        color: "#22C55E",
        avatar: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
      {
        id: "m3",
        name: "Mom",
        color: "#EF4444",
        avatar: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    ],
    completions: [
      completion("c1", "m1", "2026-09-01", 10),
      completion("c2", "m1", "2026-09-02", 15),
      completion("c3", "m1", "2026-09-03", 10),
      completion("c4", "m1", "2026-09-04", 10),
      completion("c5", "m1", "2026-08-30", 5),
      completion("c6", "m2", "2026-09-02", 10),
      completion("c7", "m2", "2026-09-01", 10),
      completion("c8", "m3", "2026-09-02", 10),
    ],
    redemptions: [
      redemption("r1", "m1", "2026-08-01", 20),
      redemption("r2", "m1", "2026-07-01", 20),
    ],
  };
}

function completion(
  id: string,
  memberId: string,
  date: string,
  points: number,
): Completion {
  return {
    id,
    taskId: "t1",
    memberId,
    date,
    points,
    createdAt: NOW.toISOString(),
  };
}

function redemption(
  id: string,
  memberId: string,
  date: string,
  pointsSpent: number,
): Redemption {
  return {
    id,
    rewardId: "reward1",
    memberId,
    date,
    pointsSpent,
    createdAt: NOW.toISOString(),
  };
}

describe("weekPoints", () => {
  it("sums completion points minus redemptions in ISO week", () => {
    const h: Household = {
      ...createEmptyHousehold(NOW),
      members: householdWithPoints().members,
      completions: [
        completion("c1", "m1", "2026-09-01", 10),
        completion("c2", "m1", "2026-09-02", 15),
      ],
      redemptions: [],
    };
    expect(weekPoints(h, "m1", REF)).toBe(25);
  });
});

describe("allTimePoints", () => {
  it("subtracts all-time redemptions from earned points", () => {
    const h: Household = {
      ...createEmptyHousehold(NOW),
      members: householdWithPoints().members,
      completions: [
        completion("c1", "m1", "2026-01-01", 50),
        completion("c2", "m1", "2026-02-01", 50),
      ],
      redemptions: [redemption("r1", "m1", "2026-03-01", 20)],
    };
    expect(allTimePoints(h, "m1")).toBe(80);
  });
});

describe("weekCompletionCount", () => {
  it("counts completions in current week", () => {
    const h = householdWithPoints();
    expect(weekCompletionCount(h, "m1", REF)).toBe(4);
    expect(weekCompletionCount(h, "m2", REF)).toBe(2);
  });
});

describe("getMostActiveMemberIds", () => {
  it("returns single leader", () => {
    const h = householdWithPoints();
    expect(getMostActiveMemberIds(h, REF)).toEqual(["m1"]);
  });

  it("returns tied leaders", () => {
    const h = householdWithPoints();
    const tied: Household = {
      ...h,
      completions: [
        completion("c1", "m1", "2026-09-01", 10),
        completion("c2", "m1", "2026-09-02", 10),
        completion("c3", "m1", "2026-09-03", 10),
        completion("c4", "m1", "2026-09-04", 10),
        completion("c5", "m2", "2026-09-01", 10),
        completion("c6", "m2", "2026-09-02", 10),
        completion("c7", "m2", "2026-09-03", 10),
        completion("c8", "m2", "2026-09-04", 10),
        completion("c9", "m3", "2026-09-02", 10),
      ],
    };
    expect(getMostActiveMemberIds(tied, "2026-09-04")).toEqual(["m1", "m2"]);
  });

  it("returns empty when all counts are zero", () => {
    const h = createEmptyHousehold(NOW);
    expect(getMostActiveMemberIds(h, REF)).toEqual([]);
  });
});

describe("formatPointsBadge", () => {
  it("formats integer points badge", () => {
    expect(formatPointsBadge(80)).toBe("80 pts");
  });
});
