import { describe, expect, it } from "vitest";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { addMember } from "@/domain/members";

const NOW = new Date("2026-09-02T10:00:00.000Z");

describe("HouseholdProvider dispatch serialization", () => {
  it("applies sequential mutations without dropping updates", async () => {
    const store = createInMemoryStore();
    let household = await store.load();

    const first = addMember(household, { name: "Emma", color: "#3B82F6" }, NOW);
    const second = addMember(
      first.ok ? first.value : household,
      { name: "Dad", color: "#22C55E" },
      NOW,
    );

    if (!first.ok || !second.ok) throw new Error("setup failed");

    await store.save(first.value);
    const loaded = await store.load();
    const chained = addMember(loaded, { name: "Dad", color: "#22C55E" }, NOW);
    if (!chained.ok) throw new Error(chained.error);
    await store.save(chained.value);

    const finalState = await store.load();
    expect(finalState.members).toHaveLength(2);
    expect(finalState.members.map((m) => m.name)).toEqual(["Emma", "Dad"]);
  });
});
