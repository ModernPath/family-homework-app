import { canUseOpfs, createMemoryByteStore, createOpfsByteStore } from "@/store/byteStore";
import { peekIndexedDbHousehold } from "@/store/indexedDbStore";
import { createSqliteStore } from "@/store/sqliteStore";
import type { Store } from "@/store/store";

export function createDefaultStore(): Store {
  return createSqliteStore({
    persist: canUseOpfs() ? createOpfsByteStore() : createMemoryByteStore(),
    migrateFrom: peekIndexedDbHousehold,
  });
}
