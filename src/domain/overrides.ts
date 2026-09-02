import { touchHousehold } from "./seed";
import type { Household, Override, Result } from "./types";

export function saveOverride(
  household: Household,
  override: Override,
  now: Date = new Date(),
): Result<Household> {
  const task = household.tasks.find((t) => t.id === override.taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  if (task.assignment.type !== "rotation") {
    return { ok: false, error: "Overrides apply to rotation tasks only" };
  }

  const memberExists = household.members.some((m) => m.id === override.memberId);
  if (!memberExists) {
    return { ok: false, error: "Member not found" };
  }

  const overrides = household.overrides.filter(
    (o) => !(o.taskId === override.taskId && o.date === override.date),
  );

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        overrides: [...overrides, override],
      },
      now,
    ),
  };
}

export function removeOverride(
  household: Household,
  taskId: string,
  date: string,
  now: Date = new Date(),
): Result<Household> {
  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        overrides: household.overrides.filter(
          (o) => !(o.taskId === taskId && o.date === date),
        ),
      },
      now,
    ),
  };
}
