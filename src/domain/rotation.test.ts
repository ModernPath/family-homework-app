import { addDays, format, getISODay, parse } from "date-fns";
import { describe, expect, it } from "vitest";
import { getRotationAssignee } from "./rotation";
import type { Task } from "./types";

const NOW = new Date("2026-09-02T10:00:00.000Z");

function rotationTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "t1",
    title: overrides.title ?? "Dishes",
    icon: "🍽️",
    schedule: overrides.schedule ?? { type: "daily" },
    assignment: overrides.assignment ?? {
      type: "rotation",
      memberIds: ["m1", "m2", "m3"],
    },
    points: 10,
    active: true,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe("getRotationAssignee", () => {
  it("assigns m1, m2, m3 for the first three daily occurrences", () => {
    const task = rotationTask();
    expect(getRotationAssignee(task, "2026-09-01", [])).toBe("m1");
    expect(getRotationAssignee(task, "2026-09-02", [])).toBe("m2");
    expect(getRotationAssignee(task, "2026-09-03", [])).toBe("m3");
  });

  it("wraps rotation on the fourth daily occurrence", () => {
    const task = rotationTask();
    expect(getRotationAssignee(task, "2026-09-04", [])).toBe("m1");
  });

  it("returns null when task does not occur on date", () => {
    const task = rotationTask({
      schedule: { type: "weekdays", days: [1, 3, 5] },
    });
    expect(getRotationAssignee(task, "2026-09-01", [])).toBeNull();
  });

  it("counts only firing weekdays for rotation index", () => {
    const task = rotationTask({
      assignment: { type: "rotation", memberIds: ["m1", "m2"] },
      schedule: { type: "weekdays", days: [1, 3, 5] },
    });
    expect(getRotationAssignee(task, "2026-09-07", [])).toBe("m1");
    expect(getRotationAssignee(task, "2026-09-09", [])).toBe("m2");
  });

  it("uses override for one date only", () => {
    const task = rotationTask({
      assignment: { type: "rotation", memberIds: ["m1", "m2", "m3"] },
    });
    const overrides = [{ taskId: "t1", date: "2026-09-05", memberId: "m1" }];
    expect(getRotationAssignee(task, "2026-09-05", overrides)).toBe("m1");
    expect(getRotationAssignee(task, "2026-09-06", overrides)).toBe("m3");
  });

  it("does not advance rotation index when overridden", () => {
    const task = rotationTask({
      assignment: { type: "rotation", memberIds: ["m1", "m2"] },
    });

    let monday = "";
    let tuesday = "";
    let cursor = parse("2026-01-01", "yyyy-MM-dd", new Date());

    while (!monday || !tuesday) {
      if (getISODay(cursor) === 1) {
        const mon = format(cursor, "yyyy-MM-dd");
        const tue = format(addDays(cursor, 1), "yyyy-MM-dd");
        if (
          getRotationAssignee(task, mon, []) === "m1" &&
          getRotationAssignee(task, tue, []) === "m2"
        ) {
          monday = mon;
          tuesday = tue;
          break;
        }
      }
      cursor = addDays(cursor, 1);
    }

    const overrides = [{ taskId: "t1", date: monday, memberId: "m2" }];
    expect(getRotationAssignee(task, monday, overrides)).toBe("m2");
    expect(getRotationAssignee(task, tuesday, overrides)).toBe("m2");
  });
});
