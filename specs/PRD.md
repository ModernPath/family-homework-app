# Product Requirements Document: Family Task Board

**Status:** Draft  
**Last updated:** 2026-09-02  
**Scope:** v1 — local kitchen tablet, single device, multi-device-ready architecture

---

## 1. Overview

A local-first family task board for a shared kitchen tablet. The app replaces a paper chore chart with a glanceable “who does what today” view, a weekly rotation plan, and lightweight gamification that rewards active contributors.

There are no user accounts. The household trusts the device. Parents maintain tasks and members; everyone can complete chores and earn recognition on the shared screen.

---

## 2. Problem

Families need a simple, always-visible way to:

- See today’s household responsibilities at a glance
- Run fair rotations (dishes, trash, etc.) without “whose turn is it?” arguments
- Let anyone pick up open tasks when they have time
- Give kids (from ~5 years) positive feedback for contributing

Existing apps typically require accounts, cloud sync, or phone-first UX. This product is wall-first: one shared pad in the kitchen, no login friction.

---

## 3. Goals

| Goal | Success looks like |
|------|-------------------|
| Glanceable today view | Any family member understands their tasks in &lt;5 seconds |
| Fair rotation | Assignments are predictable and visible for the week |
| Flexible shared work | Rotation and open-pool tasks both supported |
| Motivation | Active members are visibly rewarded |
| Local & private | All data stays at home; no accounts |
| Future-ready | v1 runs on one tablet; architecture does not block LAN multi-device later |

---

## 4. Non-goals (v1)

- User accounts, authentication, or cloud hosting
- Multi-device sync (only prepare for it)
- Phone-native apps
- External calendar integration (Google, iCal)
- PIN locks or parent approval workflows
- Private/hidden per-member tasks
- Push notifications or reminders
- Photo proof of completion
- Localization beyond English and Finnish

---

## 5. Users & personas

### Parent (organizer)
Maintains members, tasks, schedules, and rewards. Uses Setup and occasionally Week view to adjust plans. Expects quick edits without typing-heavy flows on the wall tablet.

### Child (contributor, 5+)
Checks the board, completes assigned chores, claims pool tasks, sees points and activity feedback. May not read fluently — relies on color, icons, and short labels.

### Family (collective)
Everyone sees the same shared board. Completing a task is one tap. Trust replaces permissions.

**Household limits (v1):** up to 6 members.

---

## 6. Product principles

1. **Today is home** — the default screen answers “what do I do now?”
2. **Wall-first UX** — large touch targets, high contrast, minimal navigation
3. **Trust, not locks** — no PIN; parents are the intended maintainers
4. **Shared visibility** — all tasks visible to the whole family
5. **Celebrate effort** — gamification encourages activity; avoid shaming low contributors
6. **Simple beats complete** — daily/weekly schedules before exotic recurrence rules
7. **Local-first** — works offline; data survives browser restarts

---

## 7. Core concepts

### Member
A person in the household. Has display name, color, and optional emoji/avatar. No login.

### Task (template)
A recurring or one-off chore definition: title, icon, schedule, assignment mode, point value.

### Assignment modes

| Mode | Behavior | Example |
|------|----------|---------|
| **Rotation** | Exactly one member is responsible per occurrence; order repeats deterministically | Dishes: Emma → Dad → Mom → … |
| **Pool** | Unassigned; any member may complete; completer receives credit and points | “Tidy living room” |

Both modes are required in v1. A task uses one mode only.

### Occurrence
A task instance on a specific calendar day, with an assignee (rotation) or no assignee (pool).

### Completion
Record of a member completing an occurrence: task, member, date, points awarded.

### Points & activity
Running totals per member. Weekly activity counts drive “most active” highlighting on the board.

### Reward (optional)
Parent-defined redemption item with a point cost (e.g. “Movie night — 50 pts”). Redemption is honor-system on the pad.

---

## 8. Functional requirements

### 8.1 Members

- **FR-M1:** Add a member with name, color, and optional emoji/avatar.
- **FR-M2:** Edit or remove a member from Setup.
- **FR-M3:** Support 1–6 active members.
- **FR-M4:** Member color appears consistently across Today, Week, and activity displays.

### 8.2 Tasks

- **FR-T1:** Create a task with title, icon/emoji, schedule, assignment mode, and point value.
- **FR-T2:** Schedules supported in v1: daily, specific weekdays, weekly (one day), once (specific date).
- **FR-T3:** Assignment mode is rotation (ordered member list) or pool.
- **FR-T4:** Edit or deactivate/delete a task from Setup.
- **FR-T5:** All tasks are visible on the shared board (no private tasks).

### 8.3 Rotation logic

- **FR-R1:** Rotation assignee is computed deterministically from occurrence index and member order (no separate “whose turn” state that can drift).
- **FR-R2:** Week view shows who is assigned to each rotation task for the next 7 days.
- **FR-R3:** Parent can override assignee for a single day from Week view (manual swap).

### 8.4 Pool logic

- **FR-P1:** Pool tasks appear in a shared “Anyone” section on Today.
- **FR-P2:** Completing a pool task awards points to the member who completed it.
- **FR-P3:** A pool task completed for a given day does not reappear until its next scheduled occurrence.

*Pool claim flow (claim-then-complete vs one-tap complete) — see Open Decisions.*

### 8.5 Today view

- **FR-D1:** Default screen on app open; shows current date.
- **FR-D2:** Displays rotation assignments per member for today.
- **FR-D3:** Displays open pool tasks in a shared section.
- **FR-D4:** One tap marks a chore complete; tap again undoes (same day only).
- **FR-D5:** Completion triggers brief visual feedback (animation and/or point popup).
- **FR-D6:** Shows weekly activity summary (e.g. completion counts or points per member).
- **FR-D7:** Layout supports up to 6 members without unusably small touch targets (see UX notes).

### 8.6 Week view

- **FR-W1:** 7-day view of rotation assignments.
- **FR-W2:** Pool tasks shown as shared/unassigned where relevant.
- **FR-W3:** Tap to swap assignee for one rotation occurrence (parent use case).

### 8.7 Setup view

- **FR-S1:** Manage members and tasks.
- **FR-S2:** Manage optional rewards (title, point cost).
- **FR-S3:** Export data to a file (JSON).
- **FR-S4:** Import data from a file (JSON), with confirmation before overwrite.
- **FR-S5:** No PIN or role gate — accessible to anyone at the pad.

### 8.8 Gamification

- **FR-G1:** Each completion awards configurable points (default per task).
- **FR-G2:** Display per-member point totals (all-time and/or current week — see Open Decisions).
- **FR-G3:** Highlight most active member(s) for the current week.
- **FR-G4:** Optional rewards list; parent marks reward as redeemed (deducts points).
- **FR-G5:** Gamification tone is encouraging, not punitive — no “shame” rankings for children.

### 8.9 Persistence & backup

- **FR-X1:** All state persists across browser restarts on the same device.
- **FR-X2:** Manual export/import for backup and recovery.
- **FR-X3:** Data layer is abstracted behind a store interface to allow future LAN sync without rewriting UI/domain logic.
- **FR-X4:** Edited records include timestamps to support future conflict resolution.

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Device** | Optimized for shared tablet in landscape or portrait; PWA fullscreen |
| **Touch** | Minimum 48×48 px tap targets; prefer larger for ages 5–7 |
| **Performance** | Today view interactive within 1 s of open on target tablet |
| **Offline** | Fully usable without network after first load |
| **Privacy** | No telemetry, no third-party accounts, no cloud dependency |
| **Accessibility** | High contrast; icons on every task; short labels (≤ ~30 characters) |
| **Kiosk** | Suitable for always-on kitchen display (burn-in mitigation — see Open Decisions) |

---

## 10. Information architecture

```
Today (default)
 ├── Member lanes / pages (rotation tasks)
 ├── Anyone (pool tasks)
 └── Activity strip (weekly counts / highlights)

Week
 ├── 7-day rotation grid
 └── Single-day assignee override

Setup
 ├── Members
 ├── Tasks
 ├── Rewards
 └── Backup (export / import)
```

---

## 11. Key user flows

### Flow A: Child completes assigned chore
1. Open app → Today.
2. Find own color/lane.
3. Tap chore → marked done, points added, brief celebration.
4. Activity strip updates.

### Flow B: Child picks up pool chore
1. Open Today → “Anyone” section.
2. Tap pool chore → complete (exact steps depend on Open Decision: claim vs one-tap).
3. Points credited to that child; chore removed for today.

### Flow C: Parent adds rotation task
1. Setup → Tasks → Add.
2. Title, icon, weekdays, rotation order, points.
3. Save → appears on Today/Week according to schedule.

### Flow D: Parent checks fairness
1. Week view → scan next 7 days for rotation task.
2. Optionally tap a day to swap assignee.

### Flow E: Backup before tablet reset
1. Setup → Export → save JSON file (via browser download or file picker).
2. After reset → Import → confirm → restore household state.

---

## 12. UX notes (wall tablet, ages 5+)

- **Layout:** Shared pool always visible at top; member tasks below via tabs or horizontal swipe (6 full columns is too cramped).
- **Icons:** Every task has an emoji or pictogram set by parent.
- **Labels:** Short, plain language.
- **Colors:** Strong member color coding on cards and activity strip.
- **Feedback:** Completion animation should feel rewarding for young children; keep sound optional/off by default.
- **Setup typing:** Minimize free-text on the wall; favor pickers, emoji picker, and preset schedules.

---

## 13. Conceptual data model

Single document (JSON-shaped), versioned:

```
Household
  members[]     { id, name, color, avatar, createdAt, updatedAt }
  tasks[]       { id, title, icon, schedule, assignment, points, active, ... }
  completions[] { id, taskId, memberId, date, points, createdAt }
  rewards[]     { id, title, cost, active }
  redemptions[] { id, rewardId, memberId, date, pointsSpent }
  settings      { locale?, weekStartsOn, ... }
  meta          { schemaVersion, lastModified }
```

**Schedule (v1):** `{ type: daily | weekdays | weekly | once, ...params }`  
**Assignment (v1):** `{ type: rotation, memberIds[] } | { type: pool }`

Domain logic (occurrence generation, rotation index, points) lives outside the UI and is storage-agnostic.

---

## 14. Architecture direction (tech stack deferred)

```
UI (Today / Week / Setup)
        ↓
Domain (tasks, rotations, points, occurrences)
        ↓
Store interface (load / save / subscribe)
        ↓
v1: IndexedDB (or equivalent) on device
v2: LAN server + sync (not in v1 scope)
```

**v1 storage:** one device, local persistence, export/import.  
**v2 preparation:** timestamps on entities, single-document shape, store abstraction — no sync protocol in v1.

---

## 15. Reference products (patterns, not implementation)

| Product | Relevant pattern |
|---------|------------------|
| [family-hub](https://github.com/drench44/family-hub) | Deterministic rotation, away mode (future), wall-first |
| [hearthboard](https://github.com/eemersonrosa/hearthboard) | Pool/bonus chores, tap-to-reassign |
| [openchore](https://github.com/liftedkilt/openchore) | Points economy, rewards, wall PWA |
| [chorestar](https://github.com/notfixingit3/chorestar) | Large touch layout, activity lanes |

---

## 16. Open decisions

These were not confirmed in discovery. v1 implementation should not proceed on assumed answers without product sign-off.

| # | Question | Options | Impact |
|---|----------|---------|--------|
| OD-1 | **Rewards depth** | (A) Points + weekly highlight only · (B) Points + redeemable rewards list | Setup UI, points ledger |
| OD-2 | **Missed chores** | Carry over · Disappear next day · Stay until done | Occurrence generation, Today clutter |
| OD-3 | **Away / sick days** | Skip · Backup assignee · Manual swap only | Week view, rotation logic |
| OD-4 | **Pool completion** | Claim then complete · One-tap complete | Today interaction model |
| OD-5 | **Time of day** | Whole day only · Morning / afternoon / evening buckets | Today layout, schedule model |
| OD-6 | **Language** | ~~Finnish · English · Both~~ **Resolved: both** — browser autodetect on first run; user-selectable `en` / `fi` in nav, persisted with household | Copy, date formatting |
| OD-7 | **Automatic backup** | Manual export only · Auto backup to LAN path (pre-sync) | Setup, infrastructure |
| OD-8 | **Screensaver / burn-in** | None in v1 · Dim/rotate after idle | Kiosk behavior |
| OD-9 | **Point display period** | All-time · Current week · Both | Activity strip, gamification |

---

## 17. Phasing

### v1 (MVP)
Members, tasks (rotation + pool), Today + Week + Setup, points, weekly activity highlight, export/import, local persistence, PWA-friendly wall UX, English/Finnish locale (OD-6).

### v1.1 (likely next)
Redeemable rewards (if OD-1 = B), away mode, missed-chore policy, screensaver.

### v2
LAN-hosted store, multi-device read/write, optional phone access on same Wi‑Fi.

---

## 18. Acceptance criteria (product level)

The product is ready for v1 release when:

1. A household of up to 6 members can be configured without documentation.
2. Today view correctly shows rotation and pool tasks for the current day.
3. Completing and uncompleting a task updates points and activity display immediately.
4. Week view reflects rotation assignments for 7 days and allows a one-day swap.
5. Data persists across browser restart on the same tablet.
6. Export and import round-trip restores full household state.
7. A 5-year-old can complete a chore using icon + color with parent-set labels.
8. No network connection is required during normal use.

Detailed feature specs (per `TEMPLATE.md`) will be derived from this PRD after open decisions are resolved.

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **Rotation** | Task assigned to one member per occurrence, cycling through a fixed order |
| **Pool** | Shared task any member can complete for credit |
| **Occurrence** | One instance of a task on a specific calendar day |
| **Activity** | Completion counts or points used to highlight engaged members |
| **Store** | Persistence layer abstraction between domain logic and storage backend |
