import { describe, expect, it } from "vitest";
import { createVuorioHousehold, VUORIO_MEMBER_IDS } from "./demoHousehold";
import { validateAssignment } from "./tasks";

describe("createVuorioHousehold", () => {
  it("includes all five family members", () => {
    const h = createVuorioHousehold();
    expect(h.members.map((m) => m.name)).toEqual([
      "Pasi",
      "Minna",
      "Sini",
      "Saara",
      "Miska",
    ]);
  });

  it("has rotation tasks with valid assignments", () => {
    const h = createVuorioHousehold();
    const rotationTasks = h.tasks.filter((t) => t.assignment.type === "rotation");
    expect(rotationTasks.length).toBeGreaterThan(0);
    for (const task of rotationTasks) {
      if (task.assignment.type !== "rotation") continue;
      expect(validateAssignment(task.assignment).valid).toBe(true);
    }
  });

  it("includes pool tasks and rewards", () => {
    const h = createVuorioHousehold();
    expect(h.tasks.some((t) => t.assignment.type === "pool")).toBe(true);
    expect(h.rewards.length).toBe(3);
  });

  it("uses stable member ids", () => {
    const h = createVuorioHousehold();
    expect(h.members.find((m) => m.name === "Pasi")?.id).toBe(VUORIO_MEMBER_IDS.pasi);
  });
});
