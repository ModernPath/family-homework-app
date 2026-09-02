import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask } from "@/domain/tasks";
import { createInMemoryStore } from "./inMemoryStore";

const NOW = new Date("2026-09-02T10:00:00.000Z");

describe("createInMemoryStore", () => {
  it("round-trips household data", async () => {
    const store = createInMemoryStore();
    let h = createEmptyHousehold(NOW);

    const m1 = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    const m2 = addMember(m1.ok ? m1.value : h, { name: "Dad", color: "#22C55E" }, NOW);
    if (!m1.ok || !m2.ok) throw new Error("setup failed");
    h = m2.value;

    for (let i = 0; i < 3; i++) {
      const added = addTask(
        h,
        {
          title: `Task ${i}`,
          icon: "🍽️",
          schedule: { type: "daily" },
          assignment: { type: "pool" },
        },
        NOW,
      );
      if (!added.ok) throw new Error(added.error);
      h = added.value;
    }

    await store.save(h);
    const loaded = await store.load();

    expect(loaded.members).toHaveLength(2);
    expect(loaded.tasks).toHaveLength(3);
    expect(loaded.members.map((m) => m.id)).toEqual(h.members.map((m) => m.id));
  });

  it("notifies subscribers on save", async () => {
    const store = createInMemoryStore();
    const seen: number[] = [];
    store.subscribe((h) => seen.push(h.members.length));

    await store.save(createEmptyHousehold(NOW));
    expect(seen).toEqual([0]);
  });
});
