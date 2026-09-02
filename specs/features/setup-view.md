# Feature: Setup View

## Problem Statement

Parents configure the household from one place: members, tasks, rewards, and backup. Setup must be reachable without PIN (trust model) and usable on the wall tablet with minimal typing.

## Proposed Change

Route `/setup` renders Setup with sub-navigation tabs labeled exactly `Members`, `Tasks`, `Rewards`, `Backup`. Default sub-tab on first visit is `Members`. Each sub-tab hosts the corresponding panel (members, tasks, rewards, persistence features). Setup is accessible from primary nav link `Setup` on all main views. No PIN or role gate. Touch targets for tabs and primary actions minimum 48×48 px. Task and member forms use emoji picker for icons/avatars (grid of at least 24 emoji choices); schedule uses preset buttons not free-form cron.

## Acceptance Criteria

### AC1: Setup route and default tab
**Given** user navigates to `/setup`  
**When** page renders  
**Then** URL is `/setup`, visible sub-tab `Members` has `aria-selected="true"`, and `Tasks`, `Rewards`, `Backup` have `aria-selected="false"`

### AC2: Sub-tab navigation
**Given** Setup open on `Members`  
**When** user taps sub-tab `Tasks`  
**Then** `Tasks` has `aria-selected="true"`, Members panel is hidden, Tasks panel is visible

### AC3: No PIN gate
**Given** fresh app with empty household  
**When** user taps nav `Setup` from Today  
**Then** Setup renders within 500 ms with no intermediate PIN or password screen

### AC4: Emoji picker for task icon
**Given** Tasks → Add task, icon field focused  
**When** emoji picker opens  
**Then** at least 24 emoji buttons each minimum 48×48 px are visible and tapping one sets icon field to that exact emoji character

### AC5: Schedule preset buttons
**Given** Tasks → Add task, schedule section  
**When** form renders  
**Then** visible preset controls include exactly the labels `Daily`, `Weekdays`, `Weekly`, and `Once` (no cron text field)

### AC6: Backup tab export control
**Given** Setup → Backup  
**When** panel renders  
**Then** button labeled exactly `Export backup` is visible and triggers export per persistence spec

### AC7: Backup tab import control
**Given** Setup → Backup  
**When** panel renders  
**Then** control labeled exactly `Import backup` accepts files with extension `.json` only

## Files to Modify

| File | Change |
|---|---|
| `src/ui/setup/SetupView.tsx` | Route shell, sub-tab nav |
| `src/ui/setup/MembersPanel.tsx` | Members feature UI |
| `src/ui/setup/TasksPanel.tsx` | Tasks feature UI |
| `src/ui/setup/RewardsPanel.tsx` | Rewards feature UI |
| `src/ui/setup/BackupPanel.tsx` | Export/import UI |
| `src/ui/components/EmojiPicker.tsx` | Shared emoji grid |
| `src/ui/AppShell.tsx` | Nav link to Setup |

## Risk

- What could break: long forms unusable on wall without on-screen keyboard (future); v1 relies on emoji picker and presets.
- Rollback: single-page Setup without sub-tabs.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `SetupView` route | default tab | navigate /setup | render | Members selected |
| `SetupView` tabs | switch | on Members | tap Tasks | Tasks visible, Members hidden |
| `SetupView` | no PIN | from Today | tap Setup | no PIN screen, Setup visible <500ms |
| `EmojiPicker` | grid size | open picker | count buttons | ≥24, each ≥48px |
| `EmojiPicker` | select | tap 🍽️ | select | icon field `🍽️` |
| `TasksPanel` | schedule labels | add task form | inspect | Daily, Weekdays, Weekly, Once present |
| `BackupPanel` | export button | render | inspect | `Export backup` |
| `BackupPanel` | import accept | render | inspect input accept | `.json` |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
