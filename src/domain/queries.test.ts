import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import {
  getPoolTasksForToday,
  getRotationTasksForMemberOnDate,
  getPoolTasksForWeek,
  getRotationTasksForWeek,
  isPoolTaskCompletedOnDate,
} from "./queries";
import { completePoolTask } from "./completions";
import type { Household, Task } from "./types";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = "2026-09-02";

function baseHousehold(): Household {
  return {
    ...createEmptyHousehold(NOW),
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
        id: "p1",
        title: "Tidy room",
        icon: "🛋️",
        schedule: { type: "daily" },
        assignment: { type: "pool" },
        points: 15,
        active: true,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      } satisfies Task,
      {
        id: "r1",
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

describe("getPoolTasksForToday", () => {
  it("returns scheduled incomplete pool tasks", () => {
    const tasks = getPoolTasksForToday(baseHousehold(), DATE);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]!.id).toBe("p1");
  });

  it("excludes completed pool tasks for the date", () => {
    const completed = completePoolTask(baseHousehold(), "p1", "m2", DATE, NOW);
    if (!completed.ok) throw new Error(completed.error);
    expect(getPoolTasksForToday(completed.value, DATE)).toHaveLength(0);
  });

  it("excludes pool tasks not scheduled on date", () => {
    const h = baseHousehold();
    h.tasks[0]!.schedule = { type: "weekdays", days: [1] };
    expect(getPoolTasksForToday(h, DATE)).toHaveLength(0);
  });
});
describe("week task filters", () => {
  it("includes pool task only when scheduled in range", () => {
    const h = baseHousehold();
    h.tasks[0]!.schedule = { type: "weekdays", days: [1] };
    const monday = "2026-09-07";
    const tuesday = "2026-09-08";
    expect(getPoolTasksForWeek(h, [monday])).toHaveLength(1);
    expect(getPoolTasksForWeek(h, [tuesday])).toHaveLength(0);
  });

  it("includes rotation task scheduled in range", () => {
    const h = baseHousehold();
    expect(getRotationTasksForWeek(h, ["2026-09-02"])).toHaveLength(1);
  });
});

describe("getRotationTasksForMemberOnDate", () => {
  it("returns rotation tasks assigned to member", () => {
    const tasks = getRotationTasksForMemberOnDate(baseHousehold(), "m1", DATE);
    expect(tasks.map((t) => t.id)).toEqual(["r1"]);
  });
});

describe("isPoolTaskCompletedOnDate", () => {
  it("returns true after pool completion", () => {
    const completed = completePoolTask(baseHousehold(), "p1", "m2", DATE, NOW);
    if (!completed.ok) throw new Error(completed.error);
    expect(isPoolTaskCompletedOnDate(completed.value, "p1", DATE)).toBe(true);
  });
});
