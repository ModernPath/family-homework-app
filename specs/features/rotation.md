# Feature: Rotation

## Problem Statement

Shared chores must rotate fairly among members without a separate “whose turn” state that can drift. The family needs predictable assignments visible for the week and the ability to swap one day when life happens (manual override only in v1 — PRD OD-3).

## Proposed Change

Implement deterministic rotation: for rotation task `t` with ordered `memberIds = [m0, m1, …, m(n-1)]`, the assignee for the *k*-th scheduled occurrence (0-based, counting only dates where the task schedule fires, in chronological order from task creation or a fixed epoch date `1970-01-01`) is `memberIds[k mod n]`. Store optional per-occurrence overrides as `{ taskId, date: "YYYY-MM-DD", memberId }`; an override replaces the computed assignee for that date only. Week view reads computed or overridden assignees for 7 days starting today (local calendar).

**Assumption (OD-3):** No away/sick mode in v1; absences handled only via manual single-day override in Week view.

## Acceptance Criteria

### AC1: Deterministic assignee for first three daily occurrences
**Given** rotation task `t1` with `memberIds: ["m1","m2","m3"]`, schedule `daily`, created before `2026-09-01`  
**When** assignees are resolved for dates `2026-09-01`, `2026-09-02`, `2026-09-03` with no overrides  
**Then** assignees are `m1`, `m2`, `m3` respectively

### AC2: Rotation wraps
**Given** same task as AC1  
**When** assignee is resolved for date `2026-09-04` (4th daily occurrence from epoch counting)  
**Then** assignee is `m1` (index `3 mod 3 === 0`)

### AC3: Weekday schedule counts only firing days
**Given** rotation task with `memberIds: ["m1","m2"]`, schedule weekdays `[1,3,5]` (Mon/Wed/Fri), first occurrence on `2026-09-01` (Tuesday) is not a firing day  
**When** assignees are resolved for `2026-09-01` (Mon), `2026-09-03` (Wed)  
**Then** assignees are `m1` then `m2` (occurrence indices 0 and 1 among firing days only)

### AC4: Override replaces computed assignee for one date
**Given** computed assignee for task `t1` on `2026-09-05` is `m2`  
**When** the user saves override `{ taskId: "t1", date: "2026-09-05", memberId: "m1" }`  
**Then** resolved assignee for `t1` on `2026-09-05` is `m1` and on `2026-09-06` remains the computed value (unaffected)

### AC5: Override does not change occurrence index
**Given** daily rotation `["m1","m2"]` with computed sequence `m1` on Mon, `m2` on Tue  
**When** Mon is overridden to `m2`  
**Then** Tue computed assignee is still `m2` (occurrence index 1 → `memberIds[1]`)

### AC6: Reject override for pool task
**Given** pool task `t2`  
**When** the user attempts override `{ taskId: "t2", date: "2026-09-05", memberId: "m1" }`  
**Then** override is not saved and the UI shows the exact message `Overrides apply to rotation tasks only`

## Files to Modify

| File | Change |
|---|---|
| `src/domain/rotation.ts` | `getRotationAssignee(task, date, overrides)`, occurrence index counting |
| `src/domain/overrides.ts` | Override CRUD and validation |
| `src/store/store.ts` | Persist `overrides[]` on household document |
| `src/ui/week/WeekView.tsx` | Display assignees; tap-to-swap issues override |

## Risk

- What could break: inconsistent epoch/start date for occurrence counting shifts entire rotation after reload.
- Rollback: remove overrides; display computed assignees only.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `getRotationAssignee` | three-day cycle | daily, `[m1,m2,m3]`, dates Sep 1–3 | resolve each | `m1`, `m2`, `m3` |
| `getRotationAssignee` | wrap | 4th daily occurrence, n=3 | resolve | `m1` |
| `getRotationAssignee` | weekdays only | Mon/Wed/Fri list | Tue | `null` or no occurrence |
| `getRotationAssignee` | override | override m1 on date D | resolve D | `m1` |
| `getRotationAssignee` | override next day | override on D only | resolve D+1 | computed, not override |
| `saveOverride` | pool task | pool task id | save override | error `"Overrides apply to rotation tasks only"` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
