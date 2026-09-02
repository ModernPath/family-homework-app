import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { createIndexedDbStore } from "./indexedDbStore";

const NOW = new Date("2026-09-02T10:00:00.000Z");

describe("createIndexedDbStore", () => {
  it("persists household across load", async () => {
    const store = createIndexedDbStore();
    let h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    h = added.value;

    await store.save(h);
    const loaded = await store.load();

    expect(loaded.members).toHaveLength(1);
    expect(loaded.members[0]!.id).toBe(h.members[0]!.id);
  });
});
