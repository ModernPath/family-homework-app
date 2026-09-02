# Architecture Specification

**Status:** Draft  
**Last updated:** 2026-09-02  
**Scope:** v1 MVP — single tablet, local-first, sync-ready boundaries

---

## 1. Goals

| Goal | How architecture supports it |
|------|------------------------------|
| Fast MVP | Three layers, one JSON document, pure domain functions |
| Easy to test | Domain has zero React/DOM/IndexedDB imports |
| Sync-ready later | `Store` interface + timestamps; no sync in v1 |
| Easy to reason about | Unidirectional flow: UI → hooks → domain → store |

---

## 2. Architectural style

**Modular monolith in a single SPA.** No microservices, no backend, no ORM, no global state library.

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer          pages + presentational components      │
│  (React)           TodayView, WeekView, SetupView, …    │
└───────────────────────────┬─────────────────────────────┘
                            │ hooks (useHousehold)
┌───────────────────────────▼─────────────────────────────┐
│  Application Layer     load/save orchestration, routing   │
│  (hooks + bootstrap)   optimistic UI optional in v2       │
└───────────────────────────┬─────────────────────────────┘
                            │ pure function calls
┌───────────────────────────▼─────────────────────────────┐
│  Domain Layer          business rules, no I/O             │
│  (TypeScript)          members, tasks, rotation, points  │
└───────────────────────────┬─────────────────────────────┘
                            │ read/write Household
┌───────────────────────────▼─────────────────────────────┐
│  Store Layer           persistence abstraction            │
│  (interface)           IndexedDbStore (v1)                │
└─────────────────────────────────────────────────────────┘
```

**Rule:** Dependencies point downward only. Domain never imports from `ui/`, `store/indexedDbStore.ts`, or React.

---

## 3. Repository layout

```
family-homework-app/
├── public/
│   ├── manifest.webmanifest
│   └── icons/                    # PWA icons 192, 512
├── src/
│   ├── app/
│   │   ├── bootstrap.ts          # mount, store init, SW register
│   │   └── routes.tsx            # /, /week, /setup
│   ├── domain/
│   │   ├── types.ts              # Household, Member, Task, …
│   │   ├── members.ts
│   │   ├── tasks.ts
│   │   ├── occurrences.ts        # schedule → dates
│   │   ├── rotation.ts
│   │   ├── overrides.ts
│   │   ├── completions.ts
│   │   ├── points.ts
│   │   ├── rewards.ts
│   │   └── seed.ts               # empty household factory
│   ├── store/
│   │   ├── store.ts              # Store interface
│   │   ├── indexedDbStore.ts     # v1 implementation
│   │   ├── inMemoryStore.ts      # tests
│   │   └── exportImport.ts
│   ├── hooks/
│   │   └── useHousehold.ts       # single app-state hook
│   └── ui/
│       ├── AppShell.tsx
│       ├── components/           # shared: TaskCard, MemberPicker, …
│       ├── today/
│       ├── week/
│       └── setup/
├── tests/
│   └── domain/                   # unit tests mirror domain/
├── index.html
├── vite.config.ts
└── package.json
```

**MVP constraint:** No `src/server/`, no `src/api/`, no `packages/` monorepo split until v2.

---

## 4. Core data model

Single document per household, versioned:

```typescript
interface Household {
  members: Member[];
  tasks: Task[];
  completions: Completion[];
  overrides: Override[];
  rewards: Reward[];
  redemptions: Redemption[];
  settings: {
    weekStartsOn: 1;           // Monday, ISO
    locale: "en";
  };
  meta: {
    schemaVersion: 1;
    lastModified: string;      // ISO-8601 UTC
  };
}
```

Entity IDs: `crypto.randomUUID()` strings.

**Write pattern:** Load document → domain function returns `{ household, error? }` → save full document. No partial field patches in v1 (keeps IndexedDB trivial: one key, one JSON blob).

**Occurrences are not stored.** Computed at read time from `tasks` + `schedule` + `rotation` + `overrides` + `completions`. Avoids stale occurrence rows and simplifies missed-chore policy (date-bound per tasks spec).

---

## 5. Store interface

```typescript
interface Store {
  load(): Promise<Household>;
  save(household: Household): Promise<void>;
  subscribe(listener: (h: Household) => void): () => void;
}
```

| Implementation | Use |
|----------------|-----|
| `InMemoryStore` | Unit tests, Storybook (optional) |
| `IndexedDbStore` | Production v1 |

**IndexedDB key:** database `family-task-board`, store `household`, key `"default"`.

**v2 extension (not built now):** `LanStore implements Store` backed by `fetch('/api/household')` + WebSocket push. UI and domain unchanged.

---

## 6. Application state

One React hook owns household state:

```typescript
function useHousehold() {
  // load on mount, subscribe to store
  // expose: household, dispatch(action)
}
```

**Actions** are typed discriminated unions, e.g. `{ type: "COMPLETE_ROTATION"; taskId; memberId; date }`. The hook calls domain mutators, saves, updates React state.

**Do not use** Redux, Zustand, or Jotai in v1 — one context + one hook is enough for three routes and one document.

---

## 7. Domain module responsibilities

| Module | Exports (examples) | Imports |
|--------|-------------------|---------|
| `types.ts` | All interfaces | — |
| `members.ts` | `addMember`, `updateMember`, `removeMember`, validators | `types` |
| `tasks.ts` | `addTask`, `updateTask`, validators | `types`, `members` |
| `occurrences.ts` | `occursOnDate(task, date)`, `getTasksForDate(h, date)` | `types`, `rotation` |
| `rotation.ts` | `getRotationAssignee(task, date, overrides)` | `types` |
| `completions.ts` | `completeRotation`, `uncompleteRotation`, `completePool` | `types`, `points` |
| `points.ts` | `weekPoints`, `allTimePoints`, `getMostActiveMemberIds` | `types` |
| `rewards.ts` | `redeemReward`, validators | `types`, `points` |

Every mutator signature:

```typescript
function addMember(h: Household, input: AddMemberInput): Result<Household>
type Result<T> = { ok: true; value: T } | { ok: false; error: string }
```

Exact error strings match feature specs (`"Name is required"`, etc.).

---

## 8. Routing

| Path | Page | Default |
|------|------|---------|
| `/` | TodayView | yes |
| `/week` | WeekView | |
| `/setup` | SetupView (sub-tabs via `?tab=members\|tasks\|rewards\|backup` or internal state) | |

React Router v6+, `BrowserRouter`. No lazy routes in MVP (bundle stays small).

---

## 9. Cross-cutting concerns

### 9.1 Dates and time

- All **dates** are local calendar strings `YYYY-MM-DD` via `date-fns/format`.
- **Week boundaries:** ISO week, Monday start (`settings.weekStartsOn: 1`).
- Rotation occurrence index: count schedule-firing dates from epoch `1970-01-01` through target date inclusive (see rotation feature spec).

### 9.2 IDs and referential integrity

- `removeMember` blocked if member in any task `memberIds` or has completions (feature spec).
- `deactivateTask` preferred over hard delete if completions exist (implement as soft delete: `active: false`).

### 9.3 Error handling

- Domain returns `{ ok: false, error: string }`.
- UI shows `error` in toast or inline banner — exact string from domain, no paraphrasing.

### 9.4 Concurrency

- Single tablet, single tab assumed v1. No merge logic.
- `save()` overwrites whole document; last write wins.

---

## 10. MVP build order

Build vertically in this sequence to get a demoable app early:

| Phase | Deliverable | Demo |
|-------|-------------|------|
| **0** | Vite + React + TS, empty routes, AppShell nav | Navigate 3 pages |
| **1** | `types`, `seed`, `Store`, `IndexedDbStore`, `useHousehold` | Reload persists empty doc |
| **2** | `members` domain + Setup Members panel | Add 3 members |
| **3** | `tasks`, `occurrences`, `rotation` domain | Add rotation + pool tasks |
| **4** | TodayView read-only (no complete yet) | See today's assignments |
| **5** | `completions`, TaskCard tap, points popup | Complete chores |
| **6** | Pool member picker, Anyone section | Pool flow works |
| **7** | Activity strip + gamification | Points and highlight |
| **8** | WeekView + overrides | Swap one day |
| **9** | Rewards + Setup sub-tabs | Redeem reward |
| **10** | export/import, PWA manifest + SW | Offline + backup |

**Stop line for MVP ship:** Phase 10 complete. Do not start v2 sync until MVP acceptance criteria in PRD §18 pass.

---

## 11. Testing strategy

| Layer | What to test | Tool |
|-------|--------------|------|
| Domain | All feature spec ACs as unit tests | Vitest |
| Store | Round-trip save/load, export/import | Vitest + fake-indexeddb |
| UI | Defer E2E in MVP; optional 2–3 Playwright smoke tests post-MVP | Playwright (optional) |

**Target:** ≥90% line coverage on `src/domain/` before calling MVP done. UI coverage via domain tests + manual tablet QA.

---

## 12. Explicit non-decisions (deferred)

Do not architect for these in MVP:

- Multi-tab conflict resolution
- CRDT / operational transforms
- Role-based access control
- Plugin system
- Theming engine beyond CSS variables
- i18n framework
- Background jobs / cron (occurrences computed on read)

---

## 13. Architecture acceptance criteria

### AC1: Domain purity
**Given** any file in `src/domain/`  
**When** scanned for imports  
**Then** zero imports from `react`, `src/ui`, or `src/store/indexedDbStore`

### AC2: Single store injection
**Given** app bootstrap  
**When** `InMemoryStore` is passed to bootstrap in test  
**Then** app runs without opening IndexedDB

### AC3: One-document save
**Given** any user action that mutates state  
**When** save completes  
**Then** exactly one `store.save()` call with full `Household` object

### AC4: Occurrences computed not stored
**Given** household with tasks but empty `occurrences` array (field absent)  
**When** Today view queries today's tasks  
**Then** correct task list renders per schedule + rotation rules

### AC5: Feature-to-folder traceability
**Given** each file in `specs/features/*.md`  
**When** mapped to `Files to Modify`  
**Then** every path lives under `src/domain/`, `src/store/`, or `src/ui/` as listed in this doc's layout

---

## 14. Spec Readiness checklist

- [x] Every AC has a precise expected value
- [x] Another person could implement from this doc without guessing layer boundaries
- [x] Every AC can fail
- [x] MVP scope has explicit stop line and build order
- [x] v2 extension point (`Store`) named without over-building sync
