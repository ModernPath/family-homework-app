import type { Assignment, Schedule, Task } from "@/domain/types";

export type SchedulePreset = "daily" | "weekdays" | "weekly" | "once";

export interface TaskFormState {
  title: string;
  icon: string;
  points: number;
  preset: SchedulePreset;
  weekdayDays: number[];
  weeklyDay: number;
  assignmentType: "rotation" | "pool";
  rotationMemberIds: string[];
  onceDate: string;
}

export const DEFAULT_TASK_FORM: TaskFormState = {
  title: "",
  icon: "",
  points: 10,
  preset: "daily",
  weekdayDays: [1, 2, 3, 4, 5],
  weeklyDay: 1,
  assignmentType: "rotation",
  rotationMemberIds: [],
  onceDate: "",
};

export function taskToFormState(task: Task): TaskFormState {
  const base: TaskFormState = {
    title: task.title,
    icon: task.icon,
    points: task.points,
    preset: "daily",
    weekdayDays: [1, 2, 3, 4, 5],
    weeklyDay: 1,
    assignmentType: task.assignment.type === "pool" ? "pool" : "rotation",
    rotationMemberIds:
      task.assignment.type === "rotation" ? [...task.assignment.memberIds] : [],
    onceDate: "",
  };

  switch (task.schedule.type) {
    case "daily":
      return { ...base, preset: "daily" };
    case "weekdays":
      return { ...base, preset: "weekdays", weekdayDays: [...task.schedule.days] };
    case "weekly":
      return { ...base, preset: "weekly", weeklyDay: task.schedule.day };
    case "once":
      return { ...base, preset: "once", onceDate: task.schedule.date };
  }
}

export function buildScheduleFromForm(state: TaskFormState): Schedule {
  switch (state.preset) {
    case "daily":
      return { type: "daily" };
    case "weekdays":
      return { type: "weekdays", days: [...state.weekdayDays].sort((a, b) => a - b) };
    case "weekly":
      return { type: "weekly", day: state.weeklyDay };
    case "once":
      return { type: "once", date: state.onceDate };
  }
}

export function buildAssignmentFromForm(state: TaskFormState): Assignment {
  if (state.assignmentType === "pool") {
    return { type: "pool" };
  }
  return { type: "rotation", memberIds: state.rotationMemberIds };
}
