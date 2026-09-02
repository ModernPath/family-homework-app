import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import type { Household } from "./types";
import {
  addMember,
  formatDeleteMemberMessage,
  removeMember,
  updateMember,
  validateMemberName,
} from "./members";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const LATER = new Date("2026-09-02T11:00:00.000Z");

function householdWithMembers(count: number): Household {
  const h = createEmptyHousehold(NOW);
  for (let i = 0; i < count; i++) {
    const result = addMember(h, { name: `M${i}`, color: "#3B82F6" }, NOW);
    if (!result.ok) throw new Error(result.error);
    Object.assign(h, result.value);
  }
  return h;
}

describe("validateMemberName", () => {
  it("accepts a non-empty name", () => {
    expect(validateMemberName("Emma")).toEqual({ valid: true });
  });

  it("rejects whitespace-only name", () => {
    expect(validateMemberName("   ")).toEqual({
      valid: false,
      error: "Name is required",
    });
  });
});

describe("addMember", () => {
  it("adds a member with required fields", () => {
    const h = createEmptyHousehold(NOW);
    const result = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.members).toHaveLength(1);
    const m = result.value.members[0]!;
    expect(m.name).toBe("Emma");
    expect(m.color).toBe("#3B82F6");
    expect(m.avatar).toBeNull();
    expect(m.id).toBeTruthy();
    expect(m.createdAt).toBe(NOW.toISOString());
    expect(m.updatedAt).toBe(NOW.toISOString());
  });

  it("adds a member with emoji avatar", () => {
    const h = createEmptyHousehold(NOW);
    const result = addMember(
      h,
      { name: "Dad", color: "#22C55E", avatar: "👨" },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.members[0]!.avatar).toBe("👨");
  });

  it("rejects a seventh member", () => {
    const h = householdWithMembers(6);
    const result = addMember(h, { name: "X", color: "#000000" }, NOW);

    expect(result).toEqual({ ok: false, error: "Maximum 6 family members" });
    expect(h.members).toHaveLength(6);
  });

  it("rejects empty name", () => {
    const h = createEmptyHousehold(NOW);
    const result = addMember(h, { name: "  ", color: "#3B82F6" }, NOW);

    expect(result).toEqual({ ok: false, error: "Name is required" });
    expect(h.members).toHaveLength(0);
  });
});

describe("removeMember with completions", () => {
  it("blocks delete when member has completion records", () => {
    const h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    const id = added.value.members[0]!.id;
    const withCompletion = {
      ...added.value,
      completions: [
        {
          id: "c1",
          taskId: "t1",
          memberId: id,
          date: "2026-09-02",
          points: 10,
          createdAt: NOW.toISOString(),
        },
      ],
    };

    const result = removeMember(withCompletion, id);

    expect(result).toEqual({ ok: false, error: "Member has completion records" });
  });
});

describe("updateMember", () => {
  it("updates name and color with newer updatedAt", () => {
    const h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    const id = added.value.members[0]!.id;

    const result = updateMember(
      added.value,
      id,
      { name: "Em", color: "#EF4444" },
      LATER,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const updated = result.value.members.find((m) => m.id === id)!;
    expect(updated.name).toBe("Em");
    expect(updated.color).toBe("#EF4444");
    expect(updated.updatedAt).toBe(LATER.toISOString());
    expect(updated.updatedAt > NOW.toISOString()).toBe(true);
  });
});

describe("formatDeleteMemberMessage", () => {
  it("includes member name", () => {
    expect(formatDeleteMemberMessage("Emma")).toBe("Delete Emma? This cannot be undone.");
  });
});

describe("removeMember", () => {
  it("removes an unreferenced member", () => {
    const h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    const id = added.value.members[0]!.id;

    const result = removeMember(added.value, id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.members).toHaveLength(0);
  });

  it("blocks delete when member is in a rotation task", () => {
    const h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    const id = added.value.members[0]!.id;

    const withTask: Household = {
      ...added.value,
      tasks: [
        {
          id: "t1",
          title: "Dishes",
          icon: "🍽️",
          schedule: { type: "daily" },
          assignment: { type: "rotation", memberIds: [id, "m2"] },
          points: 10,
          active: true,
          createdAt: NOW.toISOString(),
          updatedAt: NOW.toISOString(),
        },
      ],
    };

    const result = removeMember(withTask, id);

    expect(result).toEqual({
      ok: false,
      error: "Remove this member from all tasks first",
    });
    expect(withTask.members).toHaveLength(1);
  });
});
