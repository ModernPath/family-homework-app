# Feature: Persistence

## Problem Statement

All household data must survive browser restarts on the kitchen tablet, support manual backup/restore, and expose a store abstraction so LAN multi-device sync can replace the backend later without rewriting domain or UI logic.

## Proposed Change

Define `Store` interface: `load(): Promise<Household>`, `save(household: Household): Promise<void>`, `subscribe(listener): Unsubscribe`. v1 implementation `SqliteStore` (sql.js) persists the household JSON in SQLite table `household` row `id = 'default'`, file `family-task-board.sqlite` in OPFS. First SQLite load copies any existing IndexedDB `family-task-board` document. Every entity includes `createdAt`/`updatedAt` ISO-8601 UTC on write. `Household.meta` includes `schemaVersion: 1` and `lastModified` updated on each save. Export: serialize full household to JSON file download named exactly `family-task-board-backup.json`. Import: file picker accepts `.json` only; preview shows member count and task count; confirm dialog text exactly `Replace all data? This cannot be undone.`; on confirm replace store contents and reload UI. Empty first launch seeds `{ members: [], tasks: [], completions: [], rewards: [], redemptions: [], overrides: [], settings: { weekStartsOn: 1, locale: <detected en|fi> }, meta: { schemaVersion: 1 } }` where `locale` is `fi` when `navigator.languages` prefers Finnish, otherwise `en`.

**Assumption (OD-7):** Manual export/import only in v1; no automatic LAN backup.

## Acceptance Criteria

### AC1: Persist across reload
**Given** household with 2 members and 3 tasks saved  
**When** browser tab is closed and reopened to the app URL  
**Then** `load()` returns 2 members and 3 tasks with identical ids and fields as before close

### AC2: UpdatedAt on save
**Given** member `m1` with `updatedAt = T0`  
**When** user updates `m1` name and save completes  
**Then** persisted `m1.updatedAt` is strictly greater than `T0` and `meta.lastModified` is strictly greater than `T0`

### AC3: Export filename and shape
**Given** any non-empty household  
**When** user taps Export in Setup  
**Then** downloaded file name is exactly `family-task-board-backup.json` and parsed JSON has top-level keys `members`, `tasks`, `completions`, `rewards`, `redemptions`, `overrides`, `settings`, `meta`

### AC4: Export round-trip equality
**Given** household state `H`  
**When** user exports then imports the same file on empty store with confirm  
**Then** loaded household deep-equals `H` for all arrays and `settings`, ignoring `meta.lastModified` timestamps if within 1 second of export

### AC5: Import confirm required
**Given** existing household with 2 members  
**When** user selects valid backup file with 4 members but dismisses confirm dialog  
**Then** store still has exactly 2 members

### AC6: Import confirm overwrites
**Given** existing 2-member household and backup with 4 members  
**When** user confirms dialog `Replace all data? This cannot be undone.`  
**Then** store has exactly 4 members matching backup ids

### AC7: Reject invalid import file
**Given** file content `{ "foo": 1 }` without `schemaVersion`  
**When** user attempts import  
**Then** import aborts and message exactly `Invalid backup file`

### AC8: Store interface swappable
**Given** `InMemoryStore` implementing `Store`  
**When** app bootstrap receives `InMemoryStore` instead of `SqliteStore`  
**Then** all Setup and Today flows operate without importing IndexedDB module in domain layer

## Files to Modify

| File | Change |
|---|---|
| `src/store/store.ts` | `Store` interface, `Household` type |
| `src/store/sqliteStore.ts` | v1 persistence (sql.js + OPFS) |
| `src/store/indexedDbStore.ts` | One-time migrate reader |
| `src/store/inMemoryStore.ts` | Test double |
| `src/store/exportImport.ts` | JSON serialize, validate `schemaVersion` |
| `src/ui/setup/BackupPanel.tsx` | Export/import UI |
| `src/app/bootstrap.ts` | Inject store implementation |

## Risk

- What could break: OPFS unavailable in private mode; WASM blocked by stale service worker.
- Rollback: point `createDefaultStore` at `createIndexedDbStore`.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `SqliteStore.save/load` | round trip | 2 members 3 tasks | save, load | equal counts and ids |
| `save` | updatedAt | member T0 | update name | updatedAt > T0 |
| `exportHousehold` | filename | any household | export | filename `family-task-board-backup.json` |
| `exportHousehold` | keys | any household | parse file | all required top-level keys |
| `importHousehold` | cancel | 2 members, file has 4 | dismiss confirm | still 2 members |
| `importHousehold` | confirm | 2 members, file has 4 | confirm | 4 members |
| `validateBackup` | invalid | `{ foo: 1 }` | validate | error `Invalid backup file` |
| Bootstrap | inject | InMemoryStore | start app | domain runs without indexedDb import |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
