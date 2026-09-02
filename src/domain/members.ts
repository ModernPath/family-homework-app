import { touchHousehold } from "./seed";
import type { Household, Result } from "./types";
import { MAX_MEMBERS } from "./types";

export interface AddMemberInput {
  name: string;
  color: string;
  avatar?: string | null;
}

export interface UpdateMemberInput {
  name?: string;
  color?: string;
  avatar?: string | null;
}

export function validateMemberName(
  name: string,
): { valid: true } | { valid: false; error: string } {
  if (name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }
  return { valid: true };
}

function memberReferencedInTasks(household: Household, memberId: string): boolean {
  return household.tasks.some(
    (task) =>
      task.assignment.type === "rotation" &&
      task.assignment.memberIds.includes(memberId),
  );
}

export function addMember(
  household: Household,
  input: AddMemberInput,
  now: Date = new Date(),
): Result<Household> {
  const nameCheck = validateMemberName(input.name);
  if (!nameCheck.valid) {
    return { ok: false, error: nameCheck.error };
  }

  if (household.members.length >= MAX_MEMBERS) {
    return { ok: false, error: "Maximum 6 family members" };
  }

  const iso = now.toISOString();
  const member = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    color: input.color,
    avatar: input.avatar ?? null,
    createdAt: iso,
    updatedAt: iso,
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        members: [...household.members, member],
      },
      now,
    ),
  };
}

export function updateMember(
  household: Household,
  memberId: string,
  input: UpdateMemberInput,
  now: Date = new Date(),
): Result<Household> {
  const index = household.members.findIndex((m) => m.id === memberId);
  if (index === -1) {
    return { ok: false, error: "Member not found" };
  }

  if (input.name !== undefined) {
    const nameCheck = validateMemberName(input.name);
    if (!nameCheck.valid) {
      return { ok: false, error: nameCheck.error };
    }
  }

  const existing = household.members[index]!;
  const iso = now.toISOString();
  const updated = {
    ...existing,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    updatedAt: iso,
  };

  const members = [...household.members];
  members[index] = updated;

  return {
    ok: true,
    value: touchHousehold({ ...household, members }, now),
  };
}

function memberHasCompletions(household: Household, memberId: string): boolean {
  return household.completions.some((c) => c.memberId === memberId);
}

export function formatDeleteMemberMessage(name: string): string {
  return `Delete ${name}? This cannot be undone.`;
}

export function removeMember(
  household: Household,
  memberId: string,
  now: Date = new Date(),
): Result<Household> {
  const index = household.members.findIndex((m) => m.id === memberId);
  if (index === -1) {
    return { ok: false, error: "Member not found" };
  }

  if (memberReferencedInTasks(household, memberId)) {
    return { ok: false, error: "Remove this member from all tasks first" };
  }

  if (memberHasCompletions(household, memberId)) {
    return { ok: false, error: "Member has completion records" };
  }

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        members: household.members.filter((m) => m.id !== memberId),
      },
      now,
    ),
  };
}
