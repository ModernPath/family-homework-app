import { openDB } from "idb";
import { createEmptyHousehold } from "@/domain/seed";
import type { Household } from "@/domain/types";
import type { Store } from "./store";

const DB_NAME = "family-task-board";
const STORE = "household";
const KEY = "default";

export function createIndexedDbStore(): Store {
  const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });

  const listeners = new Set<(h: Household) => void>();

  return {
    async load() {
      const db = await dbPromise;
      const value = await db.get(STORE, KEY);
      return (value as Household | undefined) ?? createEmptyHousehold();
    },
    async save(household) {
      const db = await dbPromise;
      await db.put(STORE, household, KEY);
      listeners.forEach((listener) => listener(household));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
