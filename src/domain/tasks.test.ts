import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import { addTask, updateTask, validateAssignment, validateTaskTitle, formatDeactivateTaskMessage } from "./tasks";
import { occursOnDate } from "./occurrences";
import type { Task } from "./types";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const LATER = new Date("2026-09-02T11:00:00.000Z");

function makeTask(overrides: Partial<Task> & Pick<Task, "id">): Task {
  return {
    id: overrides.id,
    title: overrides.title ?? "Task",
    icon: overrides.icon ?? "🍽️",
    schedule: overrides.schedule ?? { type: "daily" },
    assignment: overrides.assignment ?? { type: "pool" },
    points: overrides.points ?? 10,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? NOW.toISOString(),
    updatedAt: overrides.updatedAt ?? NOW.toISOString(),
  };
}

describe("validateTaskTitle", () => {
  it("accepts valid title", () => {
    expect(validateTaskTitle("Dishes")).toEqual({ valid: true });
  });

  it("rejects title over 30 characters", () => {
    expect(validateTaskTitle("a".repeat(31))).toEqual({
      valid: false,
      error: "Title must be 30 characters or fewer",
    });
  });

  it("rejects empty title", () => {
    expect(validateTaskTitle("   ")).toEqual({
      valid: false,
      error: "Title is required",
    });
  });
});

describe("validateAssignment", () => {
  it("rejects rotation with fewer than two members", () => {
    expect(validateAssignment({ type: "rotation", memberIds: ["m1"] })).toEqual({
      valid: false,
      error: "Rotation requires at least 2 members",
    });
  });

  it("accepts pool assignment", () => {
    expect(validateAssignment({ type: "pool" })).toEqual({ valid: true });
  });
});

describe("addTask", () => {
  it("creates daily rotation task with default points", () => {
    const h = createEmptyHousehold(NOW);
    const result = addTask(
      h,
      {
        title: "Dishes",
        icon: "🍽️",
        schedule: { type: "daily" },
        assignment: { type: "rotation", memberIds: ["m1", "m2", "m3"] },
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const task = result.value.tasks[0]!;
    expect(task.active).toBe(true);
    expect(task.points).toBe(10);
    expect(task.assignment.type).toBe("rotation");
  });

  it("rejects missing icon", () => {
    const h = createEmptyHousehold(NOW);
    const result = addTask(
      h,
      {
        title: "Dishes",
        icon: "  ",
        schedule: { type: "daily" },
        assignment: { type: "pool" },
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "Choose an icon" });
  });
});

describe("updateTask", () => {
  it("updates title and points", () => {
    const h = createEmptyHousehold(NOW);
    const added = addTask(
      h,
      {
        title: "Dishes",
        icon: "🍽️",
        schedule: { type: "daily" },
        assignment: { type: "pool" },
        points: 10,
      },
      NOW,
    );
    if (!added.ok) throw new Error(added.error);
    const taskId = added.value.tasks[0]!.id;

    const updated = updateTask(
      added.value,
      taskId,
      { title: "Trash", points: 15 },
      LATER,
    );
    if (!updated.ok) throw new Error(updated.error);

    const task = updated.value.tasks[0]!;
    expect(task.title).toBe("Trash");
    expect(task.points).toBe(15);
    expect(task.updatedAt > added.value.tasks[0]!.updatedAt).toBe(true);
  });

  it("formats deactivate message", () => {
    expect(formatDeactivateTaskMessage("Dishes")).toBe(
      'Deactivate "Dishes"? It will no longer appear on the board.',
    );
  });
});

describe("occursOnDate", () => {
  it("returns true for daily task", () => {
    const task = makeTask({ id: "t1", schedule: { type: "daily" } });
    expect(occursOnDate(task, "2026-09-02")).toBe(true);
  });

  it("matches weekdays schedule on Saturday", () => {
    const task = makeTask({
      id: "t1",
      schedule: { type: "weekdays", days: [6, 7] },
    });
    expect(occursOnDate(task, "2026-09-05")).toBe(true);
  });

  it("does not match weekdays on Monday", () => {
    const task = makeTask({
      id: "t1",
      schedule: { type: "weekdays", days: [6, 7] },
    });
    expect(occursOnDate(task, "2026-09-07")).toBe(false);
  });

  it("matches once schedule only on exact date", () => {
    const task = makeTask({
      id: "t1",
      schedule: { type: "once", date: "2026-09-10" },
    });
    expect(occursOnDate(task, "2026-09-10")).toBe(true);
    expect(occursOnDate(task, "2026-09-09")).toBe(false);
    expect(occursOnDate(task, "2026-09-11")).toBe(false);
  });

  it("returns false for inactive task", () => {
    const task = makeTask({ id: "t1", active: false });
    expect(occursOnDate(task, "2026-09-02")).toBe(false);
  });

  it("matches weekly schedule on Wednesday", () => {
    const task = makeTask({
      id: "t1",
      schedule: { type: "weekly", day: 3 },
    });
    expect(occursOnDate(task, "2026-09-02")).toBe(true);
    expect(occursOnDate(task, "2026-09-03")).toBe(false);
  });
});

describe("deactivateTask", () => {
  it("prevents occurrences when inactive", async () => {
    const { deactivateTask } = await import("./tasks");
    const h = createEmptyHousehold(NOW);
    const added = addTask(
      h,
      {
        title: "Dishes",
        icon: "🍽️",
        schedule: { type: "daily" },
        assignment: { type: "pool" },
      },
      NOW,
    );
    if (!added.ok) throw new Error(added.error);
    const taskId = added.value.tasks[0]!.id;

    const deactivated = deactivateTask(added.value, taskId, NOW);
    if (!deactivated.ok) throw new Error(deactivated.error);

    expect(occursOnDate(deactivated.value.tasks[0]!, "2026-09-02")).toBe(false);
  });
});
