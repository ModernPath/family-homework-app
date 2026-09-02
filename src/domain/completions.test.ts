import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import {
  completePoolTask,
  completeRotationTask,
  getCompletionsForDate,
  uncompleteRotationTask,
} from "./completions";
import type { Household, Task } from "./types";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = "2026-09-02";

function householdWithRotationTask(): Household {
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
    ],
    tasks: [
      {
        id: "t1",
        title: "Dishes",
        icon: "🍽️",
        schedule: { type: "daily" },
        assignment: { type: "rotation", memberIds: ["m1", "m2"] },
        points: 10,
        active: true,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      } satisfies Task,
    ],
  };
}

describe("completeRotationTask", () => {
  it("creates completion with task points", () => {
    const h = householdWithRotationTask();
    const result = completeRotationTask(h, "t1", "m1", DATE, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.completions).toHaveLength(1);
    expect(result.value.completions[0]).toMatchObject({
      taskId: "t1",
      memberId: "m1",
      date: DATE,
      points: 10,
    });
  });

  it("does not duplicate completion for same task and date", () => {
    const h = householdWithRotationTask();
    const first = completeRotationTask(h, "t1", "m1", DATE, NOW);
    if (!first.ok) throw new Error(first.error);

    const second = completeRotationTask(first.value, "t1", "m1", DATE, NOW);
    if (!second.ok) throw new Error(second.error);

    expect(second.value.completions).toHaveLength(1);
  });

  it("blocks completion for non-assigned member", () => {
    const h = householdWithRotationTask();
    const result = completeRotationTask(h, "t1", "m2", DATE, NOW);

    expect(result).toEqual({
      ok: false,
      error: "Member is not assigned to this task",
    });
  });
});

describe("uncompleteRotationTask", () => {
  it("removes completion for same date", () => {
    const h = householdWithRotationTask();
    const completed = completeRotationTask(h, "t1", "m1", DATE, NOW);
    if (!completed.ok) throw new Error(completed.error);

    const result = uncompleteRotationTask(completed.value, "t1", DATE, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.completions).toHaveLength(0);
  });

  it("returns error when completion missing", () => {
    const h = householdWithRotationTask();
    const result = uncompleteRotationTask(h, "t1", DATE, NOW);

    expect(result).toEqual({ ok: false, error: "Completion not found" });
  });
});

describe("getCompletionsForDate", () => {
  it("returns only completions for requested date", () => {
    const h = householdWithRotationTask();
    const withTwoDates: Household = {
      ...h,
      completions: [
        {
          id: "c1",
          taskId: "t1",
          memberId: "m1",
          date: "2026-09-01",
          points: 10,
          createdAt: NOW.toISOString(),
        },
        {
          id: "c2",
          taskId: "t1",
          memberId: "m1",
          date: DATE,
          points: 10,
          createdAt: NOW.toISOString(),
        },
      ],
    };

    expect(getCompletionsForDate(withTwoDates, DATE)).toHaveLength(1);
    expect(getCompletionsForDate(withTwoDates, DATE)[0]!.id).toBe("c2");
  });
});

describe("completePoolTask", () => {
  it("awards points to selected member", () => {
    const h = householdWithRotationTask();
    const withPool: Household = {
      ...h,
      tasks: [
        {
          id: "p1",
          title: "Tidy room",
          icon: "🛋️",
          schedule: { type: "daily" },
          assignment: { type: "pool" },
          points: 15,
          active: true,
          createdAt: NOW.toISOString(),
          updatedAt: NOW.toISOString(),
        },
      ],
    };

    const result = completePoolTask(withPool, "p1", "m2", DATE, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.completions[0]).toMatchObject({
      taskId: "p1",
      memberId: "m2",
      points: 15,
    });
  });
});
