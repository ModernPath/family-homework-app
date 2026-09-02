# UI/UX Specification

**Status:** Draft  
**Last updated:** 2026-09-02  
**Scope:** v1 MVP — kitchen tablet, ages 5+, up to 6 members, English

---

## 1. Design intent

**Feels like:** A bright, friendly chore chart on the fridge — not a corporate dashboard or a game.

**Primary device:** Shared tablet, arm's length, often portrait, sometimes landscape. Stand or wall mount.

**Design priorities (ordered):**

1. Scannable in under 5 seconds
2. Large, forgiving touch targets
3. Member identity via color + emoji before reading text
4. Minimal navigation depth (3 top-level views)
5. Celebration on success without blocking the next action

---

## 2. Visual language

### 2.1 Theme

**Default: light theme** for kitchen daylight readability. CSS variables allow dark mode later (PRD OD-8 deferred).

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#F8FAFC` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--text` | `#0F172A` | Primary text |
| `--text-muted` | `#64748B` | Secondary labels |
| `--border` | `#E2E8F0` | Card borders |
| `--accent` | `#2563EB` | Links, focus ring |
| `--success` | `#16A34A` | Completed checkmark |
| `--highlight` | `#EAB308` | Most-active border (gamification spec) |
| `--danger` | `#DC2626` | Errors only |

Member colors are user-chosen from a **preset palette of 8** (avoid custom hex picker in MVP):

`#3B82F6` `#22C55E` `#EF4444` `#F59E0B` `#8B5CF6` `#EC4899` `#14B8A6` `#6366F1`

### 2.2 Typography

System stack (no webfont CDN — offline + fast load):

```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

| Element | Size | Weight | Line height |
|---------|------|--------|-------------|
| Date header (Today) | 28px | 700 | 1.2 |
| Section title (`Anyone`) | 20px | 600 | 1.3 |
| Task title | 18px | 500 | 1.4 |
| Member tab label | 16px | 600 | 1.2 |
| Body / setup forms | 16px | 400 | 1.5 |
| Activity strip | 14px | 500 | 1.3 |
| Badge (`80 pts`) | 14px | 600 | 1 |

**Minimum readable size on wall:** 16px. No text below 14px except disabled hints.

### 2.3 Spacing and touch

- Base unit: **8px grid**
- Card padding: 16px
- Gap between task cards: 12px
- **Minimum touch target:** 48×48px (WCAG 2.5.5); task row height **minimum 56px**
- Nav links: min 48px height, 16px horizontal padding

### 2.4 Iconography

- Task icon: **single emoji** per task (32×32px visual size in card)
- Member avatar: optional emoji in 24px circle on tabs
- Checkmark: Unicode `✓` or SVG 24px in `--success` when complete
- No icon font dependency; emoji + inline SVG only

---

## 3. Layout system

### 3.1 App shell

```
┌──────────────────────────────────────────────┐
│  [Today]  [Week]  [Setup]          ← top nav  │  56px height
├──────────────────────────────────────────────┤
│                                              │
│              Main content                    │  flex 1, scroll if needed
│                                              │
├──────────────────────────────────────────────┤
│  Activity strip (Today only)                 │  48px, optional
└──────────────────────────────────────────────┘
```

- Nav: horizontal, equal spacing, active route uses `--accent` underline 3px + `aria-current="page"`
- Content max-width: none (full tablet width)
- Safe area: `padding: env(safe-area-inset-*)` for notched tablets

### 3.2 Today view

```
┌──────────────────────────────────────────────┐
│  Wednesday, Sep 2                            │
├──────────────────────────────────────────────┤
│  Anyone                                      │
│  ┌────────────────────────────────────────┐  │
│  │ 🛋️ Tidy room                            │  │  pool cards
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ [👧 Emma] [👨 Dad] [👩 Mom] [+]  ← scroll tabs│  horizontal scroll if >4 tabs
├──────────────────────────────────────────────┤
│  ┌─ member color bar 4px ─────────────────┐  │
│  │ ☐ 🍽️ Dishes                            │  │
│  │ ☑ 🗑️ Trash              +10 pts flash  │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  Emma 4 · Dad 2 · Mom 1    ★ Emma most active│
└──────────────────────────────────────────────┘
```

**Tab behavior:** 1 member = no tab bar, show lane directly. 2–6 members = scrollable tab bar; selected tab shows 4px top border in member color.

**Empty lane:** Centered text `Nothing scheduled today` in `--text-muted`.

**Rewards (read-only):** Collapsible section below member lane, default **collapsed**. Header `Rewards`; expanded shows `Title — N pts` rows.

### 3.3 Week view

```
┌──────────────────────────────────────────────┐
│  This week                                   │
├──────────────────────────────────────────────┤
│         Wed 9/2  Thu 9/3  Fri 9/4  …         │  horizontal scroll on narrow
│  Dishes  Emma    Dad      Mom                │
│  Trash   —       —        Emma               │  — = not scheduled
├──────────────────────────────────────────────┤
│  Open tasks                                  │
│  🛋️ Tidy room (Anyone)                       │
└──────────────────────────────────────────────┘
```

- Grid cells: min 64×48px, tap opens member picker sheet
- Assignee: first name only in cell to save space
- Color dot 8px left of name

### 3.4 Setup view

```
┌──────────────────────────────────────────────┐
│  Members | Tasks | Rewards | Backup          │  sub-tabs, 48px min
├──────────────────────────────────────────────┤
│  [form or list content]                      │
│                                              │
│  [Save]  [Cancel]                            │  sticky footer on forms
└──────────────────────────────────────────────┘
```

- Lists: full-width rows, swipe not required; **Edit** and **Delete** as explicit buttons (no hidden gestures in Setup)
- Forms: single column, max field width 480px centered on wide screens

### 3.5 Overlays

| Overlay | Trigger | Layout |
|---------|---------|--------|
| Member picker | Pool task tap, Week cell tap | Bottom sheet, 50% height max, member rows 56px |
| Points popup | Task complete | Centered on card, fades in/out 800ms |
| Confirm dialog | Import, delete member, redeem | Modal, max-width 400px, 2 buttons: Cancel / Confirm |
| Emoji picker | Task icon, member avatar | Grid 6×4, 48px cells |

**Member picker row:** `[color dot] [avatar emoji] [name]` — entire row tappable.

---

## 4. Component catalog

| Component | Location | Key props / behavior |
|-----------|----------|-------------------|
| `AppShell` | all routes | nav links, `aria-current` |
| `TaskCard` | Today | icon, title, checked, member color accent, onTap |
| `MemberTab` | Today | name, avatar, badge `N pts`, `most-active` class |
| `AnyoneSection` | Today | heading `Anyone`, list of TaskCards |
| `MemberLane` | Today | filtered rotation tasks for member |
| `ActivityStrip` | Today | `Name count · …`, highlight chip |
| `MemberPicker` | Today, Week | sheet, Cancel button |
| `PointsPopup` | TaskCard | `+N pts` |
| `WeekGrid` | Week | 7 columns, em dash empty |
| `EmojiPicker` | Setup | ≥24 emoji |
| `MemberBadge` | shared | dot + name |
| `ConfirmDialog` | Setup, persistence | exact copy from feature specs |

**MVP rule:** No component library (MUI, Chakra). Custom components + CSS only — fewer dependencies, full control of 48px targets.

---

## 5. Interaction patterns

| Action | Feedback | Duration |
|--------|----------|----------|
| Tap incomplete rotation task | Checkmark + points popup | popup 800ms |
| Tap complete rotation task | Uncheck, points subtract | immediate |
| Tap pool task | Bottom sheet opens | immediate |
| Select member in picker | Sheet closes, task leaves list | <200ms |
| Tab switch | Lane swap, no page reload | immediate |
| Save in Setup | Inline success text `Saved` 2s | 2000ms |
| Validation error | Red border field + error text below | until fixed |
| Most active | Gold 2px border on tab + strip chip | persists until counts change |

**Sound:** Off by default. No audio in MVP.

**Animation:** CSS transitions only (`opacity`, `transform` ≤200ms). Points popup may use `@keyframes fade` — no Lottie, no confetti library in MVP (optional CSS scale pulse on checkmark).

---

## 6. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Touch targets ≥48px | Enforced in component CSS |
| Color not sole indicator | Task always has emoji + text; member has name |
| Focus visible | 2px `--accent` outline on keyboard focus (setup on laptop) |
| Screen reader | TaskCard `role="checkbox"` + `aria-checked`; nav `aria-current` |
| Contrast | Text on `--surface`: ≥4.5:1 for body, ≥3:1 for large headings |

**Age 5:** Do not rely on reading alone — every task has emoji; member tabs show avatar emoji when set.

---

## 7. Responsive behavior

Primary breakpoint: **tablet ≥600px width**.

| Width | Behavior |
|-------|----------|
| &lt;600px | Single column; week grid horizontal scroll; tabs scroll |
| 600–900px | Default target (10" portrait tablet) |
| &gt;900px | Week grid fits all 7 columns; optional 2-column Setup list+form |

No phone-first bottom nav in MVP — top nav sufficient for tablet.

---

## 8. Copy and tone

- **Voice:** Short, warm, imperative for actions (`Save`, `Export backup`, `Cancel`)
- **Errors:** Exact strings from feature specs — do not reword
- **Empty states:** Neutral (`Nothing scheduled today`), never blame user
- **Gamification:** `"★ {name} most active"` for highlight chip — no "loser" or rank numbers

Language: English (`en-US` dates per today-view spec).

---

## 9. Wireframe-to-route map

| Route | Primary user | Exit paths |
|-------|--------------|------------|
| `/` | Child + parent glance | Week, Setup |
| `/week` | Parent plan | Today, Setup |
| `/setup` | Parent configure | Today |

Maximum clicks from Today to any Setup sub-tab: **1** (tap Setup, default Members; 2 if other sub-tab).

Maximum clicks to complete rotation chore from Today open: **1**.

Maximum clicks to complete pool chore: **2** (tap task, tap member).

---

## 10. MVP UX exclusions

Do not design or build in MVP:

- On-screen keyboard (PRD v1.1; use emoji picker + presets to minimize typing)
- Screensaver / burn-in dimming
- Drag-and-drop reorder
- Swipe-to-complete (tap only — simpler, one code path)
- Custom themes / member photo upload
- Animations >300ms blocking interaction

---

## 11. UX acceptance criteria

### AC1: Today task row height
**Given** Today view on viewport width 768px  
**When** any task card is measured  
**Then** computed height ≥56px and checkbox hit area ≥48×48px

### AC2: Anyone section position
**Given** pool tasks exist today  
**When** Today layout is measured  
**Then** `Anyone` section bounding box top is less than member tab bar top (section above tabs)

### AC3: Member picker cancel
**Given** member picker open  
**When** user taps button labeled exactly `Cancel`  
**Then** picker unmounts within 200ms and underlying task remains visible and incomplete

### AC4: Most-active styling
**Given** member `m1` is sole most-active  
**When** Today renders  
**Then** `m1` tab computed `border-color` is `#EAB308` and width is `2px`

### AC5: Week empty cell
**Given** task not scheduled on a column date  
**When** cell renders  
**Then** visible text content is exactly `—` (U+2014 em dash)

### AC6: No rank shame copy
**Given** any rendered view  
**When** DOM text content is collected  
**Then** no match for `/(1st|2nd|3rd|last place|least active)/i`

### AC7: Setup sub-tab touch target
**Given** Setup view  
**When** sub-tab `Tasks` is measured  
**Then** height ≥48px

---

## 12. Spec Readiness checklist

- [x] Every AC has a precise expected value
- [x] Another person could build UI from tokens, layouts, and component list
- [x] Every AC can fail (measurable CSS/DOM outcomes)
- [x] MVP exclusions explicit to prevent scope creep
- [x] Traceable to feature specs (exact strings, 48px, `#EAB308`)
