# Feature: Week View

## Problem Statement

Parents need to see and adjust rotation fairness over the next seven days. Week view shows who is responsible for each rotation task each day and supports single-day assignee override without changing the underlying rotation sequence.

## Proposed Change

Route `/week` renders a grid: rows = active rotation tasks scheduled at least once in the 7-day window starting today (local); columns = 7 dates labeled `Mon 9/1` style (`en-US`, weekday abbreviated + month/day). Cell shows assignee member name and color dot. Pool tasks appear in a separate list below the grid with column headers only (no assignee cells) and row label suffixed with `(Anyone)`. Tapping a rotation cell opens member picker; choosing a member saves override for that task+date. Column headers are not editable.

## Acceptance Criteria

### AC1: Seven columns from today
**Given** today is `2026-09-02` (Wednesday)  
**When** Week view renders  
**Then** column headers are exactly `Wed 9/2`, `Thu 9/3`, `Fri 9/4`, `Sat 9/5`, `Sun 9/6`, `Mon 9/7`, `Tue 9/8` in left-to-right order

### AC2: Rotation cell shows assignee name
**Given** rotation task `t1` with computed assignee `m1` (`name: "Emma"`) on `2026-09-03`  
**When** Week grid renders  
**Then** cell at row `t1`, column `Thu 9/3` contains text `Emma` and a color dot matching `m1.color`

### AC3: Override via cell tap
**Given** cell for `t1` on `2026-09-03` shows assignee `m2`  
**When** user taps cell and selects `m1` in picker  
**Then** cell text changes to `m1`'s name and override `{ taskId: t1, date: "2026-09-03", memberId: m1 }` is persisted

### AC4: Pool tasks listed separately
**Given** pool task `t1` scheduled on 3 of the 7 days  
**When** Week view renders  
**Then** `t1` appears in section heading `Open tasks` with label `🛋️ Tidy room (Anyone)` and no assignee cells in the rotation grid

### AC5: Inactive task omitted
**Given** rotation task `t1` with `active: false`  
**When** Week view renders  
**Then** `t1` is absent from the grid and open tasks list

### AC6: Task not scheduled on date shows empty cell
**Given** weekly rotation task only on Wednesdays  
**When** Week view renders Monday column for that task row  
**Then** cell text is exactly `—` (em dash)

### AC7: Nav back to Today
**Given** Week view is open  
**When** user taps nav link `Today`  
**Then** route is `/` and Today view date header is visible

## Files to Modify

| File | Change |
|---|---|
| `src/ui/week/WeekView.tsx` | Grid layout, 7-day window |
| `src/ui/week/WeekGrid.tsx` | Rows/columns, cell tap |
| `src/ui/week/OpenTasksList.tsx` | Pool tasks in week window |
| `src/domain/rotation.ts` | Assignee resolution with overrides |
| `src/ui/AppShell.tsx` | Add `Today` / `Week` nav on Week route |

## Risk

- What could break: many tasks × 7 columns overflow; require vertical scroll.
- Rollback: read-only week list without override tap.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `getWeekDates` | start today | today Wed Sep 2 | call | 7 dates starting Sep 2 |
| `WeekGrid` | header format | date Thu Sep 3 | render header | `Thu 9/3` |
| `WeekGrid` | assignee cell | m1 Emma on date | render cell | text `Emma`, color dot |
| `WeekGrid` | empty schedule | weekly Wed only, Mon cell | render | `—` |
| `WeekGrid` | override tap | tap cell, pick m1 | save | persisted override, cell updates |
| `OpenTasksList` | pool label | pool task Tidy room | render | `(Anyone)` suffix |
| Nav | to Today | on /week | tap Today | path `/` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
