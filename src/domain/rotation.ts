import type { Override, Task } from "./types";
import { getOccurrenceIndex, occursOnDate } from "./occurrences";

export function getRotationAssignee(
  task: Task,
  date: string,
  overrides: Override[],
): string | null {
  if (task.assignment.type !== "rotation") {
    return null;
  }

  if (!occursOnDate(task, date)) {
    return null;
  }

  const override = overrides.find((o) => o.taskId === task.id && o.date === date);
  if (override) {
    return override.memberId;
  }

  const index = getOccurrenceIndex(task, date);
  if (index === null) {
    return null;
  }

  const { memberIds } = task.assignment;
  return memberIds[index % memberIds.length] ?? null;
}
