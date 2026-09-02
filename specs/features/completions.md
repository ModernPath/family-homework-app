# Feature: Completions

## Problem Statement

The board must record when chores are done, attribute them to the correct member, award points, and allow same-day undo if tapped by mistake. Completions are the source of truth for gamification and for hiding finished tasks on Today.

## Proposed Change

A completion record: `{ id, taskId, memberId, date: "YYYY-MM-DD", points, createdAt }`. Rotation tasks: assigned member taps their card on Today to toggle complete. Pool tasks: completion created via member picker (see pool-tasks spec). Undo: tap completed rotation task again on the same local date removes the completion and subtracts the awarded points. Undo is not offered for pool tasks in v1 (picker would be required to re-attribute). Completing triggers a 800 ms visible overlay showing exactly `+<points> pts` in the member's color.

## Acceptance Criteria

### AC1: Complete rotation task
**Given** rotation task `t1` assigned to `m1` today with `points: 10`, no completion yet  
**When** the user taps the incomplete card for `t1` in `m1`'s lane  
**Then** completion exists with `{ taskId: "t1", memberId: "m1", date: <today>, points: 10 }`, card shows checked state, overlay text is exactly `+10 pts`

### AC2: Undo rotation completion same day
**Given** completion for `t1` by `m1` on today's date with `points: 10`  
**When** the user taps the completed card for `t1`  
**Then** the completion record is removed, card returns to unchecked state, and `m1` week points decrease by 10

### AC3: Block undo on a different calendar date
**Given** completion for `t1` on `2026-09-01` and today is `2026-09-02`  
**When** the user views `t1` on Today  
**Then** no completed card is shown for `t1` (occurrence not listed per date-bound rule) and no undo action is available for the Sep 1 record from Today

### AC4: Block completing another member's rotation task
**Given** rotation task `t1` assigned to `m2` today  
**When** the user taps `t1` while viewing from any context that is not `m2`'s lane complete action  
**Then** no completion is created for a different member from a single tap on another lane; card in `m2`'s lane remains the only tappable complete target for `t1`

### AC5: Points match task at completion time
**Given** task `t1` with `points: 20`  
**When** user completes `t1`  
**Then** completion `points === 20` even if task points change later; historical completion points unchanged

### AC6: One completion per task per date
**Given** completion already exists for `{ taskId: "t1", date: <today> }`  
**When** `completeRotationTask("t1", "m1", today)` is invoked again without undo  
**Then** exactly one completion record exists for `t1` on that date

## Files to Modify

| File | Change |
|---|---|
| `src/domain/completions.ts` | `completeRotationTask`, `uncompleteRotationTask`, guards |
| `src/domain/points.ts` | Derive week/all-time totals from completions and redemptions |
| `src/store/store.ts` | Append/remove completions atomically |
| `src/ui/today/TaskCard.tsx` | Checked state, tap handler, points overlay |
| `src/ui/components/PointsPopup.tsx` | `+<n> pts` overlay, 800 ms duration |

## Risk

- What could break: double-tap races create duplicate completions; store writes must be atomic.
- Rollback: disable undo; completions append-only.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `completeRotationTask` | happy path | uncompleted t1, m1, 10 pts | complete | 1 completion, points 10 |
| `completeRotationTask` | duplicate | already complete | complete again | still 1 completion |
| `uncompleteRotationTask` | same day | completion today | uncomplete | 0 completions, points -10 |
| `uncompleteRotationTask` | wrong day | completion yesterday | uncomplete today | error or no-op, completion still exists |
| `getCompletionsForDate` | filter | 2 completions different dates | query today | returns only today's |
| Points overlay | display | 15 pts awarded | complete | overlay text `+15 pts`, visible 800ms ±50ms |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
