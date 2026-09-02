import { createIndexedDbStore } from "@/store/indexedDbStore";
import { createInMemoryStore } from "@/store/inMemoryStore";
import type { Store } from "@/store/store";

export function createDefaultStore(): Store {
  if (typeof indexedDB !== "undefined") {
    return createIndexedDbStore();
  }
  return createInMemoryStore();
}
