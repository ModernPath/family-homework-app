import { touchHousehold } from "./seed";
import { getRotationAssignee } from "./rotation";
import type { Completion, Household, Result } from "./types";
import { occursOnDate } from "./occurrences";

export function getCompletionsForDate(
  household: Household,
  date: string,
): Completion[] {
  return household.completions.filter((c) => c.date === date);
}

export function getCompletionForTaskOnDate(
  household: Household,
  taskId: string,
  date: string,
): Completion | undefined {
  return household.completions.find((c) => c.taskId === taskId && c.date === date);
}

export function isTaskCompletedOnDate(
  household: Household,
  taskId: string,
  date: string,
): boolean {
  return getCompletionForTaskOnDate(household, taskId, date) !== undefined;
}

export function completeRotationTask(
  household: Household,
  taskId: string,
  memberId: string,
  date: string,
  now: Date = new Date(),
): Result<Household> {
  const task = household.tasks.find((t) => t.id === taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  if (task.assignment.type !== "rotation") {
    return { ok: false, error: "Not a rotation task" };
  }

  if (!occursOnDate(task, date)) {
    return { ok: false, error: "Task not scheduled on this date" };
  }

  const assignee = getRotationAssignee(task, date, household.overrides);
  if (assignee !== memberId) {
    return { ok: false, error: "Member is not assigned to this task" };
  }

  if (getCompletionForTaskOnDate(household, taskId, date)) {
    return { ok: true, value: household };
  }

  const completion: Completion = {
    id: crypto.randomUUID(),
    taskId,
    memberId,
    date,
    points: task.points,
    createdAt: now.toISOString(),
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        completions: [...household.completions, completion],
      },
      now,
    ),
  };
}

export function uncompleteRotationTask(
  household: Household,
  taskId: string,
  date: string,
  now: Date = new Date(),
): Result<Household> {
  const existing = getCompletionForTaskOnDate(household, taskId, date);
  if (!existing) {
    return { ok: false, error: "Completion not found" };
  }

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        completions: household.completions.filter((c) => c.id !== existing.id),
      },
      now,
    ),
  };
}

export function completePoolTask(
  household: Household,
  taskId: string,
  memberId: string,
  date: string,
  now: Date = new Date(),
): Result<Household> {
  const task = household.tasks.find((t) => t.id === taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  if (task.assignment.type !== "pool") {
    return { ok: false, error: "Not a pool task" };
  }

  if (!occursOnDate(task, date)) {
    return { ok: false, error: "Task not scheduled on this date" };
  }

  if (getCompletionForTaskOnDate(household, taskId, date)) {
    return { ok: true, value: household };
  }

  const memberExists = household.members.some((m) => m.id === memberId);
  if (!memberExists) {
    return { ok: false, error: "Member not found" };
  }

  const completion: Completion = {
    id: crypto.randomUUID(),
    taskId,
    memberId,
    date,
    points: task.points,
    createdAt: now.toISOString(),
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        completions: [...household.completions, completion],
      },
      now,
    ),
  };
}
