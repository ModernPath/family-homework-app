# Feature: Members

## Problem Statement

The household needs named, visually distinct identities on the shared board without login accounts. Members are the unit of assignment (rotation), credit (pool completions), and gamification (points). Without member management, tasks cannot be assigned and the Today view cannot show per-person lanes.

## Proposed Change

Add member CRUD in Setup: create with name, color, and optional emoji avatar; edit existing fields; remove member with defined behavior when referenced by tasks. Enforce a hard cap of 6 active members. Persist members with `id`, `name`, `color` (hex `#RRGGBB`), optional `avatar` (single emoji string), `createdAt`, and `updatedAt` ISO-8601 timestamps.

**Decision (PRD OD-6):** UI supports English and Finnish. New households auto-detect from `navigator.languages` (Finnish → `fi`, otherwise `en`). Locale is stored in `household.settings.locale` and can be switched from the main nav (EN | FI). Date formatting follows the active locale via `date-fns` locales.

## Acceptance Criteria

### AC1: Add member with required fields
**Given** the household has 0–5 members and Setup → Members is open  
**When** the user enters name `"Emma"`, selects color `#3B82F6`, leaves avatar empty, and taps Save  
**Then** a member exists with `name === "Emma"`, `color === "#3B82F6"`, `avatar === null`, a non-empty `id`, and `createdAt`/`updatedAt` set to the current UTC instant; the member list shows exactly one row with display text `Emma`

### AC2: Add member with emoji avatar
**Given** the household has fewer than 6 members  
**When** the user saves a member with name `"Dad"`, color `#22C55E`, avatar `"👨"`  
**Then** the stored member has `avatar === "👨"` and the member list row shows `👨` immediately left of `Dad`

### AC3: Reject seventh member
**Given** the household already has 6 members  
**When** the user attempts to save a new member with any valid name and color  
**Then** Save does not create a member, the member count remains 6, and the UI shows the exact message `Maximum 6 family members`

### AC4: Reject empty name
**Given** Setup → Members → Add is open  
**When** the user leaves name blank (or whitespace only) and taps Save  
**Then** no member is created and the UI shows the exact message `Name is required`

### AC5: Edit member
**Given** a member exists with `id = "m1"`, `name = "Emma"`, `color = "#3B82F6"`  
**When** the user changes name to `"Em"` and color to `#EF4444` and saves  
**Then** member `m1` has `name === "Em"`, `color === "#EF4444"`, and `updatedAt` strictly greater than the previous `updatedAt`

### AC6: Remove unreferenced member
**Given** member `m1` is not listed in any task's rotation `memberIds` and has zero completion records  
**When** the user confirms delete for `m1`  
**Then** member `m1` is absent from `household.members` and the member list length decreases by 1

### AC7: Block delete when member is referenced
**Given** member `m1` appears in rotation task `t1` assignment `memberIds`  
**When** the user attempts to delete `m1`  
**Then** the member is not deleted and the UI shows the exact message `Remove this member from all tasks first`

## Files to Modify

| File | Change |
|---|---|
| `src/domain/members.ts` | Member type, validation (name, color, max count), add/update/remove |
| `src/store/store.ts` | Store methods: `addMember`, `updateMember`, `removeMember` |
| `src/ui/setup/MembersPanel.tsx` | Member list, add/edit form, delete confirmation |
| `src/ui/components/MemberBadge.tsx` | Reusable name + color + avatar display |

## Risk

- What could break: deleting a member referenced by completions or rotation without guard corrupts task assignments.
- Rollback: remove member domain module and Setup panel; household can operate with seed members only.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `validateMemberName` | happy path | `name = "Emma"` | `validateMemberName(name)` | returns `{ valid: true }` |
| `validateMemberName` | empty | `name = "   "` | `validateMemberName(name)` | returns `{ valid: false, error: "Name is required" }` |
| `addMember` | happy path | 5 existing members, valid payload | `addMember({ name: "Emma", color: "#3B82F6" })` | returns member with `name === "Emma"`, household count 6 |
| `addMember` | max exceeded | 6 existing members | `addMember({ name: "X", color: "#000000" })` | throws or returns error `"Maximum 6 family members"`, count stays 6 |
| `updateMember` | happy path | member `m1` exists | `updateMember("m1", { name: "Em" })` | `m1.name === "Em"`, `updatedAt` increased |
| `removeMember` | unreferenced | member not in any task | `removeMember("m1")` | member absent from store |
| `removeMember` | referenced | `m1` in task rotation list | `removeMember("m1")` | error `"Remove this member from all tasks first"`, member still present |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
