import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { createMemoryByteStore } from "./byteStore";
import { createSqliteStore } from "./sqliteStore";
import defaultStoreSource from "./createDefaultStore.ts?raw";

const NOW = new Date("2026-09-02T10:00:00.000Z");

function householdWithEmma() {
  const added = addMember(createEmptyHousehold(NOW, "en"), { name: "Emma", color: "#3B82F6" }, NOW);
  if (!added.ok) throw new Error(added.error);
  return added.value;
}

describe("createSqliteStore", () => {
  it("round-trips a member through save and load", async () => {
    const persist = createMemoryByteStore();
    const store = createSqliteStore({ persist });
    const h = householdWithEmma();

    await store.save(h);
    const loaded = await store.load();

    expect(loaded.members).toHaveLength(1);
    expect(loaded.members[0]!.name).toBe("Emma");
    expect(loaded.members[0]!.id).toBe(h.members[0]!.id);
  });

  it("persists a SQLite database file", async () => {
    const persist = createMemoryByteStore();
    const store = createSqliteStore({ persist });
    await store.save(householdWithEmma());

    const bytes = await persist.read();
    expect(bytes).not.toBeNull();
    expect(new TextDecoder().decode(bytes!.slice(0, 15))).toBe("SQLite format 3");
  });

  it("reloads from the same byte store after a new store instance", async () => {
    const persist = createMemoryByteStore();
    const first = createSqliteStore({ persist });
    const h = householdWithEmma();
    await first.save(h);

    const second = createSqliteStore({ persist });
    const loaded = await second.load();
    expect(loaded.members).toHaveLength(1);
    expect(loaded.members[0]!.id).toBe(h.members[0]!.id);
  });

  it("returns an empty household when the file is missing", async () => {
    const store = createSqliteStore({ persist: createMemoryByteStore() });
    const loaded = await store.load();
    expect(loaded.members).toHaveLength(0);
    expect(loaded.tasks).toHaveLength(0);
    expect(loaded.settings.weekStartsOn).toBe(1);
  });

  it("returns an empty household when the file is corrupt", async () => {
    const persist = createMemoryByteStore();
    await persist.write(new Uint8Array([0, 1, 2, 3]));
    const store = createSqliteStore({ persist });
    const loaded = await store.load();
    expect(loaded.members).toHaveLength(0);
  });

  it("migrates IndexedDB household once when SQLite is empty", async () => {
    const persist = createMemoryByteStore();
    const dad = addMember(createEmptyHousehold(NOW, "en"), { name: "Dad", color: "#22C55E" }, NOW);
    if (!dad.ok) throw new Error(dad.error);

    const store = createSqliteStore({
      persist,
      migrateFrom: async () => dad.value,
    });
    const loaded = await store.load();
    expect(loaded.members[0]!.name).toBe("Dad");

    const bytes = await persist.read();
    expect(new TextDecoder().decode(bytes!.slice(0, 15))).toBe("SQLite format 3");
  });

  it("does not migrate when SQLite already has data", async () => {
    const persist = createMemoryByteStore();
    const existing = createSqliteStore({ persist });
    await existing.save(householdWithEmma());

    const dad = addMember(createEmptyHousehold(NOW, "en"), { name: "Dad", color: "#22C55E" }, NOW);
    if (!dad.ok) throw new Error(dad.error);

    const store = createSqliteStore({
      persist,
      migrateFrom: async () => dad.value,
    });
    const loaded = await store.load();
    expect(loaded.members[0]!.name).toBe("Emma");
  });

  it("notifies subscribers on save", async () => {
    const store = createSqliteStore({ persist: createMemoryByteStore() });
    const h = householdWithEmma();
    const seen: number[] = [];
    store.subscribe((next) => seen.push(next.members.length));

    await store.save(h);
    expect(seen).toEqual([1]);
  });
});

describe("createDefaultStore", () => {
  it("is implemented with createSqliteStore", () => {
    expect(defaultStoreSource).toContain("createSqliteStore");
    expect(defaultStoreSource).not.toMatch(/return createIndexedDbStore\(/);
  });
});
