import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import { addMember } from "./members";
import { saveOverride } from "./overrides";
import { addTask } from "./tasks";

const NOW = new Date("2026-09-02T10:00:00.000Z");

describe("saveOverride", () => {
  it("rejects override for pool task", () => {
    const h = createEmptyHousehold(NOW);
    const withTask = addTask(
      h,
      {
        title: "Tidy",
        icon: "🛋️",
        schedule: { type: "daily" },
        assignment: { type: "pool" },
      },
      NOW,
    );
    if (!withTask.ok) throw new Error(withTask.error);
    const taskId = withTask.value.tasks[0]!.id;

    const result = saveOverride(withTask.value, {
      taskId,
      date: "2026-09-05",
      memberId: "m1",
    });

    expect(result).toEqual({
      ok: false,
      error: "Overrides apply to rotation tasks only",
    });
  });

  it("persists override for rotation task", () => {
    const h = createEmptyHousehold(NOW);
    const withMembers = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!withMembers.ok) throw new Error(withMembers.error);
    const withMember2 = addMember(
      withMembers.value,
      { name: "Dad", color: "#22C55E" },
      NOW,
    );
    if (!withMember2.ok) throw new Error(withMember2.error);
    const m1 = withMember2.value.members[0]!.id;
    const m2 = withMember2.value.members[1]!.id;

    const withTask = addTask(
      withMember2.value,
      {
        title: "Dishes",
        icon: "🍽️",
        schedule: { type: "daily" },
        assignment: { type: "rotation", memberIds: [m1, m2] },
      },
      NOW,
    );
    if (!withTask.ok) throw new Error(withTask.error);
    const taskId = withTask.value.tasks[0]!.id;

    const result = saveOverride(withTask.value, {
      taskId,
      date: "2026-09-05",
      memberId: m1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.overrides).toEqual([
      { taskId, date: "2026-09-05", memberId: m1 },
    ]);
  });
});
