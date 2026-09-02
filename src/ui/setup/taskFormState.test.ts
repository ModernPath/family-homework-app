import { describe, expect, it } from "vitest";
import {
  buildAssignmentFromForm,
  buildScheduleFromForm,
  DEFAULT_TASK_FORM,
  taskToFormState,
} from "./taskFormState";
import type { Task } from "@/domain/types";

const TASK: Task = {
  id: "t1",
  title: "Trash",
  icon: "🗑️",
  schedule: { type: "weekdays", days: [1, 2, 3, 4, 5, 6] },
  assignment: { type: "pool" },
  points: 15,
  active: true,
  createdAt: "2026-09-02T10:00:00.000Z",
  updatedAt: "2026-09-02T10:00:00.000Z",
};

describe("taskFormState", () => {
  it("loads task into form state", () => {
    const form = taskToFormState(TASK);
    expect(form.title).toBe("Trash");
    expect(form.preset).toBe("weekdays");
    expect(form.weekdayDays).toEqual([1, 2, 3, 4, 5, 6]);
    expect(form.assignmentType).toBe("pool");
  });

  it("round-trips schedule and assignment", () => {
    const form = taskToFormState(TASK);
    expect(buildScheduleFromForm(form)).toEqual(TASK.schedule);
    expect(buildAssignmentFromForm(form)).toEqual(TASK.assignment);
  });

  it("builds daily schedule from defaults", () => {
    expect(buildScheduleFromForm(DEFAULT_TASK_FORM)).toEqual({ type: "daily" });
  });
});
