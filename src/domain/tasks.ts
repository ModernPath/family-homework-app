import { touchHousehold } from "./seed";
import type { Assignment, Household, Result, Task } from "./types";

export interface AddTaskInput {
  title: string;
  icon: string;
  schedule: Task["schedule"];
  assignment: Assignment;
  points?: number;
}

export interface UpdateTaskInput {
  title?: string;
  icon?: string;
  schedule?: Task["schedule"];
  assignment?: Assignment;
  points?: number;
  active?: boolean;
}

export function validateTaskTitle(
  title: string,
): { valid: true } | { valid: false; error: string } {
  if (title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }
  if (title.length > 30) {
    return { valid: false, error: "Title must be 30 characters or fewer" };
  }
  return { valid: true };
}

export function validateTaskIcon(
  icon: string,
): { valid: true } | { valid: false; error: string } {
  if (icon.trim().length === 0) {
    return { valid: false, error: "Choose an icon" };
  }
  return { valid: true };
}

export function validateAssignment(
  assignment: Assignment,
): { valid: true } | { valid: false; error: string } {
  if (assignment.type === "rotation" && assignment.memberIds.length < 2) {
    return { valid: false, error: "Rotation requires at least 2 members" };
  }
  return { valid: true };
}

function validateTaskInput(input: AddTaskInput): Result<AddTaskInput> {
  const titleCheck = validateTaskTitle(input.title);
  if (!titleCheck.valid) {
    return { ok: false, error: titleCheck.error };
  }

  const iconCheck = validateTaskIcon(input.icon);
  if (!iconCheck.valid) {
    return { ok: false, error: iconCheck.error };
  }

  const assignmentCheck = validateAssignment(input.assignment);
  if (!assignmentCheck.valid) {
    return { ok: false, error: assignmentCheck.error };
  }

  return { ok: true, value: input };
}

export function addTask(
  household: Household,
  input: AddTaskInput,
  now: Date = new Date(),
): Result<Household> {
  const validated = validateTaskInput(input);
  if (!validated.ok) {
    return validated;
  }

  const iso = now.toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    icon: input.icon,
    schedule: input.schedule,
    assignment: input.assignment,
    points: input.points ?? 10,
    active: true,
    createdAt: iso,
    updatedAt: iso,
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        tasks: [...household.tasks, task],
      },
      now,
    ),
  };
}

export function updateTask(
  household: Household,
  taskId: string,
  input: UpdateTaskInput,
  now: Date = new Date(),
): Result<Household> {
  const index = household.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) {
    return { ok: false, error: "Task not found" };
  }

  if (input.title !== undefined) {
    const titleCheck = validateTaskTitle(input.title);
    if (!titleCheck.valid) {
      return { ok: false, error: titleCheck.error };
    }
  }

  if (input.icon !== undefined) {
    const iconCheck = validateTaskIcon(input.icon);
    if (!iconCheck.valid) {
      return { ok: false, error: iconCheck.error };
    }
  }

  if (input.assignment !== undefined) {
    const assignmentCheck = validateAssignment(input.assignment);
    if (!assignmentCheck.valid) {
      return { ok: false, error: assignmentCheck.error };
    }
  }

  const existing = household.tasks[index]!;
  const iso = now.toISOString();
  const updated: Task = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.icon !== undefined ? { icon: input.icon } : {}),
    ...(input.schedule !== undefined ? { schedule: input.schedule } : {}),
    ...(input.assignment !== undefined ? { assignment: input.assignment } : {}),
    ...(input.points !== undefined ? { points: input.points } : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    updatedAt: iso,
  };

  const tasks = [...household.tasks];
  tasks[index] = updated;

  return {
    ok: true,
    value: touchHousehold({ ...household, tasks }, now),
  };
}

export function deactivateTask(
  household: Household,
  taskId: string,
  now: Date = new Date(),
): Result<Household> {
  return updateTask(household, taskId, { active: false }, now);
}

export function formatDeactivateTaskMessage(title: string): string {
  return `Deactivate "${title}"? It will no longer appear on the board.`;
}
