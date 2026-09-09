# Feature: Today View

## Problem Statement

The kitchen tablet must answer “who does what today?” within seconds. Today is the default screen: current date, pool section, per-member rotation tasks, weekly activity strip, and navigation to Week and Setup.

## Proposed Change

Route `/` (or app default) renders Today view. Header shows local date: English `Wednesday, Sep 2`; Finnish `keskiviikkona 2.9.` (see `specs/features/i18n.md`). Layout: (1) `Anyone` pool section at top, (2) member task area below with tab bar when members > 1 — each tab shows member avatar/emoji + name, default tab is first member by `createdAt`, (3) activity strip at bottom. Each member panel lists only today's incomplete and complete rotation tasks assigned to that member. Task cards show emoji, title, checkbox; minimum tap target 48×48 px (CSS). Nav links labeled exactly `Week` and `Setup`. On first load after app open, Today is visible within 1000 ms on a reference device (PRD NFR).

**Assumption (OD-2):** Yesterday's incomplete rotation tasks are not shown today.

**Assumption (OD-9):** Activity strip shows current-week completion counts per member.

## Acceptance Criteria

### AC1: Default route is Today
**Given** the app loads with any household state  
**When** the initial route resolves  
**Then** the visible primary heading date matches today's local date (`Wednesday, Sep 2` when locale is `en`, `keskiviikkona 2.9.` when locale is `fi` on 2026-09-02) and URL path is `/`

### AC2: Anyone section above member tabs
**Given** at least one pool task scheduled today  
**When** Today renders  
**Then** the `Anyone` section's top edge is above the member tab bar in the document layout order

### AC3: Member tab shows today's rotation tasks only
**Given** member `m1` assigned rotation tasks `t1` (today) and `t2` (Wednesday only), today is Monday  
**When** user selects `m1` tab  
**Then** task list contains `t1` only and does not contain `t2`

### AC4: Completed rotation task shows checked state
**Given** `m1` completed rotation task `t1` today  
**When** `m1` tab renders  
**Then** `t1` card has `aria-checked="true"` and visible checkmark icon

### AC5: Activity strip shows week completion counts
**Given** member `m1` has 3 completions and `m2` has 1 completion in the ISO week containing today (week starts Monday)  
**When** Today renders  
**Then** activity strip contains substring `m1` followed by `3` and `m2` followed by `1` in the same strip element

### AC6: Tab bar for multiple members
**Given** 4 active members  
**When** Today renders  
**Then** tab bar shows exactly 4 tabs, each with minimum height 48 px and member name visible

### AC7: Navigation labels
**Given** Today is visible  
**When** user inspects primary nav  
**Then** link text is exactly `Week` and exactly `Setup`

### AC8: Empty member lane message
**Given** member `m1` has zero rotation tasks today  
**When** `m1` tab is selected  
**Then** lane shows exact text `Nothing scheduled today`

## Files to Modify

| File | Change |
|---|---|
| `src/ui/today/TodayView.tsx` | Layout, date header, data wiring |
| `src/ui/today/MemberLane.tsx` | Per-member task list |
| `src/ui/today/ActivityStrip.tsx` | Weekly completion counts |
| `src/ui/today/AnyoneSection.tsx` | Pool section (pool-tasks feature) |
| `src/ui/AppShell.tsx` | Default route, nav |
| `src/ui/components/TaskCard.tsx` | Card UI, 48px min target |

## Risk

- What could break: 6 members overflow tab bar on narrow portrait tablet.
- Rollback: single scrollable list without tabs.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `TodayView` route | default | app load | navigate `/` | date heading matches today |
| `TodayView` layout | pool above tabs | pool task today | render | Anyone precedes tab bar in DOM |
| `MemberLane` | filter tasks | m1 assigned t1 Mon, t2 Wed, Monday | render m1 | only t1 |
| `TaskCard` | completed | completion exists | render | `aria-checked="true"` |
| `ActivityStrip` | counts | m1:3, m2:1 this week | render | strip includes `3` for m1, `1` for m2 |
| `MemberLane` | empty | no tasks today | render | text `Nothing scheduled today` |
| Nav | labels | Today visible | inspect links | `Week`, `Setup` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
