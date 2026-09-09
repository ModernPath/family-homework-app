# Feature: SQLite persistence

## Problem Statement

Household data currently lives in IndexedDB as one JSON document (or in a JS object when IndexedDB is missing). The kitchen tablet should persist in a **SQLite database file** so restarts, backups, and a future LAN server share the same engine instead of a browser document store.

## Proposed Change

Keep the `Store` interface (`load` / `save` / `subscribe`). Production `createDefaultStore()` uses **sql.js** (SQLite compiled to WASM). The household document is stored in table `household` row `id = 'default'` column `document` (JSON text). Database bytes persist to OPFS file `family-task-board.sqlite`. On first SQLite load, if that file is empty/missing, copy any existing IndexedDB household into SQLite. Tests may inject `createMemoryByteStore()` or keep `InMemoryStore`. Domain still must not import sql.js or OPFS.

## Acceptance Criteria

### AC1: Save then load round-trip
**Given** an empty SQLite store and household `H` with member name `"Emma"`  
**When** `save(H)` then `load()`  
**Then** loaded `members[0].name === "Emma"` and `members[0].id` equals `H.members[0].id`

### AC2: Persisted bytes are a SQLite file
**Given** a store backed by `createMemoryByteStore()`  
**When** `save` of any valid household completes  
**Then** persist `read()` returns bytes whose first 15 characters (UTF-8) are exactly `SQLite format 3`

### AC3: Restart uses the same file
**Given** store A saved household with 1 member into byte store `B`  
**When** store C is created with the same `B` and calls `load()`  
**Then** `load()` returns 1 member with the same `id` as saved by A

### AC4: Missing file seeds empty household
**Given** persist `read()` returns `null` and no IndexedDB household  
**When** `load()`  
**Then** result equals `createEmptyHousehold` shape: `members.length === 0`, `tasks.length === 0`, `settings.weekStartsOn === 1`

### AC5: Corrupt file does not throw
**Given** persist contains bytes `[0, 1, 2, 3]`  
**When** `load()`  
**Then** it resolves (does not reject) with `members.length === 0`

### AC6: One-time IndexedDB migration
**Given** persist is empty and `migrateFrom` returns household with member `"Dad"`  
**When** first `load()`  
**Then** result has `members[0].name === "Dad"` and a later `read()` of persist starts with `SQLite format 3`

### AC7: Migration skipped when SQLite already has data
**Given** persist already has a SQLite file for household with member `"Emma"` and `migrateFrom` would return member `"Dad"`  
**When** `load()`  
**Then** `members[0].name === "Emma"` (Emma kept; Dad not imported)

### AC8: Subscribe after save
**Given** a subscriber registered on the sqlite store  
**When** `save(H)`  
**Then** the subscriber is called once with a household whose `members` length equals `H.members.length`

### AC9: Production default is SQLite
**Given** `createDefaultStore` source  
**When** inspecting the factory  
**Then** it returns `createSqliteStore(...)` and does not call `createIndexedDbStore()` as the live store

## Files to Modify

| File | Change |
|---|---|
| `src/store/sqliteStore.ts` | sql.js store, schema, export/import bytes |
| `src/store/byteStore.ts` | memory + OPFS byte persistence |
| `src/store/createDefaultStore.ts` | default to SQLite + IndexedDB migrate |
| `src/store/indexedDbStore.ts` | keep as migrate-only reader |
| `src/store/sqliteStore.test.ts` | AC tests |
| `vite.config.ts` | include `.wasm` in PWA cache |
| `specs/features/persistence.md` | SQLite as v1 store |
| `specs/tech-stack.md` | sql.js + OPFS |
| `specs/architecture.md` | SqliteStore |

## Risk

- What could break: first load after upgrade if OPFS is unavailable (Safari private mode); WASM fetch blocked by service worker.
- Rollback: point `createDefaultStore` back at `createIndexedDbStore`.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `createSqliteStore.save/load` | round trip | Emma member | save, load | same name and id |
| persist `read` | magic | after save | read bytes | prefix `SQLite format 3` |
| `createSqliteStore` | restart | save on store A, load store C, same bytes | load | 1 member same id |
| `load` | missing | read null, no migrate | load | 0 members, 0 tasks |
| `load` | corrupt | bytes `[0,1,2,3]` | load | resolves, 0 members |
| `load` | migrate | empty persist, migrate Dad | load | name Dad, file is sqlite |
| `load` | skip migrate | sqlite has Emma, migrate Dad | load | name Emma |
| `subscribe` | save | listener attached | save | called once, matching member count |
| `createDefaultStore` | factory | module source | inspect | uses `createSqliteStore` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
