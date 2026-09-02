import { createEmptyHousehold } from "@/domain/seed";
import type { Household } from "@/domain/types";
import type { Store } from "./store";

export function createInMemoryStore(initial?: Household): Store {
  let household = initial ?? createEmptyHousehold();
  const listeners = new Set<(h: Household) => void>();

  return {
    async load() {
      return structuredClone(household);
    },
    async save(next) {
      household = structuredClone(next);
      listeners.forEach((listener) => listener(household));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
