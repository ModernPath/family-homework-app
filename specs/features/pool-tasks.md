# Feature: Pool Tasks

## Problem Statement

Some chores are not assigned to a specific person — any family member can do them. Pool tasks need clear visibility in a shared section and a completion flow that records who gets credit and points on a device with no logged-in user.

## Proposed Change

On Today view, active pool tasks scheduled for the current local date appear in a section titled exactly `Anyone`. Tapping an incomplete pool task opens a member picker listing all active members (name + color + avatar). Selecting a member records completion for that member in one action (picker selection = complete). Completed pool tasks for today are removed from the `Anyone` list. Points equal the task's `points` value.

**Assumption (OD-4):** Two-step flow — tap task, then tap member in picker — rather than claim-then-complete as separate persisted states.

## Acceptance Criteria

### AC1: Pool tasks appear in Anyone section
**Given** active pool task `t1` scheduled for today and incomplete  
**When** Today view renders  
**Then** section heading text is exactly `Anyone` and `t1` appears once with its `icon` and `title`

### AC2: Pool task hidden when not scheduled today
**Given** pool task with schedule weekdays `[1]` (Monday only) and today is Tuesday  
**When** Today view renders  
**Then** `t1` is absent from the `Anyone` section

### AC3: Member picker on tap
**Given** incomplete pool task `t1` in `Anyone`  
**When** the user taps `t1`  
**Then** a member picker overlay lists every active member exactly once, ordered by member `createdAt` ascending

### AC4: Complete pool task for selected member
**Given** pool task `t1` with `points: 15`, members `m1`, `m2` active, picker open for `t1`  
**When** the user taps member `m2`  
**Then** a completion record exists with `{ taskId: "t1", memberId: "m2", date: <today YYYY-MM-DD>, points: 15 }`, `t1` is removed from `Anyone`, and `m2` week points increase by 15

### AC5: Completed pool task not shown again today
**Given** pool task `t1` completed today by `m1`  
**When** Today view re-renders  
**Then** `t1` is absent from `Anyone` for the remainder of that local calendar date

### AC6: Pool task reappears on next scheduled date
**Given** daily pool task `t1` completed on `2026-09-02`  
**When** Today view opens on `2026-09-03` with no completion for that date  
**Then** `t1` is present in `Anyone`

### AC7: Cancel picker without completing
**Given** picker open for pool task `t1`  
**When** the user taps outside the picker or a Cancel control labeled exactly `Cancel`  
**Then** no new completion record is created and `t1` remains in `Anyone` incomplete

## Files to Modify

| File | Change |
|---|---|
| `src/ui/today/AnyoneSection.tsx` | Pool task list for today |
| `src/ui/components/MemberPicker.tsx` | Overlay for member selection |
| `src/domain/completions.ts` | `completePoolTask(taskId, memberId, date)` |
| `src/ui/today/TodayView.tsx` | Wire tap → picker → completion |

## Risk

- What could break: accidental tap completes for wrong member; mitigated by requiring explicit member pick.
- Rollback: hide `Anyone` section; pool tasks omitted from v1 Today view.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `getPoolTasksForToday` | scheduled | daily pool, today | call | array length 1 containing task |
| `getPoolTasksForToday` | wrong day | Monday-only, Tuesday | call | empty array |
| `getPoolTasksForToday` | completed today | completion exists today | call | empty array |
| `completePoolTask` | happy path | t1 points 15, m2 | complete | completion points 15, memberId m2 |
| `completePoolTask` | idempotent same day | already completed today | complete again | error or no second completion (exactly 1 completion for t1+date) |
| MemberPicker | cancel | picker open | Cancel | no completion added |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
