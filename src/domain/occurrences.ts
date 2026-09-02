import { differenceInCalendarDays, getISODay, parse } from "date-fns";
import type { Schedule, Task } from "./types";

export const ROTATION_EPOCH = "1970-01-01";

function parseDateString(date: string): Date {
  return parse(date, "yyyy-MM-dd", new Date());
}

export function occursOnDate(task: Task, date: string): boolean {
  if (!task.active) {
    return false;
  }

  const weekday = getISODay(parseDateString(date));
  const schedule = task.schedule;

  switch (schedule.type) {
    case "daily":
      return true;
    case "weekdays":
      return schedule.days.includes(weekday);
    case "weekly":
      return schedule.day === weekday;
    case "once":
      return schedule.date === date;
    default:
      return false;
  }
}

export function countOccurrencesThroughDate(task: Task, date: string): number {
  if (!occursOnDate(task, date)) {
    return 0;
  }

  if (task.schedule.type === "daily") {
    const end = parseDateString(date);
    const start = parseDateString(ROTATION_EPOCH);
    return differenceInCalendarDays(end, start) + 1;
  }

  if (task.schedule.type === "once") {
    return 1;
  }

  const end = parseDateString(date);
  const start = parseDateString(ROTATION_EPOCH);
  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    if (occursOnDate(task, iso)) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function getOccurrenceIndex(task: Task, date: string): number | null {
  if (!occursOnDate(task, date)) {
    return null;
  }
  return countOccurrencesThroughDate(task, date) - 1;
}

export function taskOccursOnDate(task: Task, date: string): boolean {
  return occursOnDate(task, date);
}

export function scheduleMatchesDate(schedule: Schedule, date: string): boolean {
  const weekday = getISODay(parseDateString(date));
  switch (schedule.type) {
    case "daily":
      return true;
    case "weekdays":
      return schedule.days.includes(weekday);
    case "weekly":
      return schedule.day === weekday;
    case "once":
      return schedule.date === date;
    default:
      return false;
  }
}
