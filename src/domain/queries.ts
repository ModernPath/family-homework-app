import { getRotationAssignee } from "./rotation";
import { isTaskCompletedOnDate } from "./completions";
import { occursOnDate } from "./occurrences";
import type { Household, Task } from "./types";

export function getDateRangeStrings(startDate: string, days: number): string[] {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y!, m! - 1, d!);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  });
}

export function taskOccursInRange(task: Task, dates: string[]): boolean {
  return dates.some((date) => occursOnDate(task, date));
}

export function getRotationTasksForWeek(household: Household, dates: string[]): Task[] {
  return household.tasks.filter(
    (task) =>
      task.active &&
      task.assignment.type === "rotation" &&
      taskOccursInRange(task, dates),
  );
}

export function getPoolTasksForWeek(household: Household, dates: string[]): Task[] {
  return household.tasks.filter(
    (task) =>
      task.active &&
      task.assignment.type === "pool" &&
      taskOccursInRange(task, dates),
  );
}

export function getPoolTasksForToday(household: Household, date: string): Task[] {
  return household.tasks.filter(
    (task) =>
      task.active &&
      task.assignment.type === "pool" &&
      occursOnDate(task, date) &&
      !isTaskCompletedOnDate(household, task.id, date),
  );
}

export function getRotationTasksForMemberOnDate(
  household: Household,
  memberId: string,
  date: string,
): Task[] {
  return household.tasks.filter(
    (task) =>
      task.active &&
      task.assignment.type === "rotation" &&
      occursOnDate(task, date) &&
      getRotationAssignee(task, date, household.overrides) === memberId,
  );
}

export function isPoolTaskCompletedOnDate(
  household: Household,
  taskId: string,
  date: string,
): boolean {
  return isTaskCompletedOnDate(household, taskId, date);
}
