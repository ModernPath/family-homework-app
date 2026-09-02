# Feature: Tasks

## Problem Statement

Chore definitions must be reusable templates with schedule and assignment rules. Without task templates, the board cannot show recurring rotation or pool work. Parents need to define what happens, how often, who rotates, and how many points a completion earns.

## Proposed Change

Add task CRUD in Setup. Each task stores: `id`, `title` (1–30 chars), `icon` (single emoji, required), `schedule`, `assignment`, `points` (integer 1–100, default 10), `active` (boolean), timestamps. Schedule types: `daily`, `weekdays` (array of ISO weekday numbers 1=Mon…7=Sun), `weekly` (single weekday), `once` (ISO date `YYYY-MM-DD`). Assignment: `{ type: "rotation", memberIds: string[] }` (min 2 members, order matters) or `{ type: "pool" }`. Inactive tasks do not generate occurrences. All tasks are visible on the shared board when active and scheduled for the day.

**Assumption (OD-5):** Schedules are whole-day only; no morning/afternoon/evening buckets in v1.

**Assumption (OD-2):** Occurrences are date-bound. An incomplete occurrence is shown only on its scheduled calendar date; it is not carried forward to the next day.

## Acceptance Criteria

### AC1: Create daily rotation task
**Given** members `m1`, `m2`, `m3` exist  
**When** the user saves task `{ title: "Dishes", icon: "🍽️", schedule: { type: "daily" }, assignment: { type: "rotation", memberIds: ["m1","m2","m3"] }, points: 10 }`  
**Then** stored task has `active === true`, `points === 10`, and appears in Setup task list as `🍽️ Dishes` with badge text `Rotation`

### AC2: Create weekday pool task
**Given** at least one member exists  
**When** the user saves `{ title: "Tidy room", icon: "🛋️", schedule: { type: "weekdays", days: [6,7] }, assignment: { type: "pool" }, points: 15 }`  
**Then** stored task has `assignment.type === "pool"` and generates occurrences only on Saturday and Sunday (ISO weekdays 6 and 7)

### AC3: Create weekly rotation task
**Given** members `m1`, `m2` exist  
**When** the user saves schedule `{ type: "weekly", day: 3 }` (Wednesday) with rotation `["m1","m2"]`  
**Then** the task generates occurrences only on Wednesdays

### AC4: Create one-off task
**Given** today is `2026-09-02`  
**When** the user saves schedule `{ type: "once", date: "2026-09-10" }`  
**Then** the task generates an occurrence on `2026-09-10` only and zero occurrences on `2026-09-09` and `2026-09-11`

### AC5: Reject title over 30 characters
**Given** Setup → Tasks → Add is open  
**When** the user enters a 31-character title and taps Save  
**Then** no task is created and the UI shows the exact message `Title must be 30 characters or fewer`

### AC6: Reject rotation with fewer than two members
**Given** members `m1` exists  
**When** the user saves assignment `{ type: "rotation", memberIds: ["m1"] }`  
**Then** no task is created and the UI shows the exact message `Rotation requires at least 2 members`

### AC7: Reject missing icon
**Given** Setup → Tasks → Add is open  
**When** the user leaves icon empty and taps Save  
**Then** no task is created and the UI shows the exact message `Choose an icon`

### AC8: Deactivate task
**Given** active task `t1` exists  
**When** the user toggles `t1` to inactive and saves  
**Then** `t1.active === false` and `t1` produces zero occurrences for any date until reactivated

### AC9: Default points
**Given** Setup → Tasks → Add with points field left at default  
**When** the user saves a valid task without changing points  
**Then** stored task has `points === 10`

## Files to Modify

| File | Change |
|---|---|
| `src/domain/tasks.ts` | Task type, validation, create/update/deactivate |
| `src/domain/occurrences.ts` | `getOccurrencesForDate(task, date)` for each schedule type |
| `src/store/store.ts` | `addTask`, `updateTask`, `deactivateTask` |
| `src/ui/setup/TasksPanel.tsx` | Task list, add/edit form with schedule and assignment pickers |

## Risk

- What could break: invalid schedule params cause silent wrong occurrence dates.
- Rollback: remove task CRUD; hard-code demo tasks in seed data.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `validateTaskTitle` | valid | `title = "Dishes"` (6 chars) | validate | `{ valid: true }` |
| `validateTaskTitle` | too long | 31-char string | validate | `{ valid: false, error: "Title must be 30 characters or fewer" }` |
| `validateAssignment` | rotation too few | `memberIds: ["m1"]` | validate | `{ valid: false, error: "Rotation requires at least 2 members" }` |
| `validateAssignment` | pool | `{ type: "pool" }` | validate | `{ valid: true }` |
| `getOccurrencesForDate` | daily | daily task, date `2026-09-02` | call | returns 1 occurrence for that date |
| `getOccurrencesForDate` | weekdays match | weekdays `[6,7]`, date Saturday | call | returns 1 occurrence |
| `getOccurrencesForDate` | weekdays no match | weekdays `[6,7]`, date Monday | call | returns 0 occurrences |
| `getOccurrencesForDate` | once match | once `2026-09-10`, date `2026-09-10` | call | returns 1 occurrence |
| `getOccurrencesForDate` | inactive task | `active: false` | call for any date | returns 0 occurrences |
| `createTask` | default points | points omitted | create | `points === 10` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
