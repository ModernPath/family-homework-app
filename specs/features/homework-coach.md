# Feature: Homework Coach Agent

## Problem Statement

The kitchen board shows today’s tasks, but it does not explain them. Families still ask “who should do what, and when?” and “who has done the most?” Parents want a coach that answers in plain language from the real household data, without moving chore logic into a cloud app.

## Proposed Change

A standalone Python agent (`agents/homework-coach-agent/`) plans assignments and contribution stats with the same rotation/points rules as the TypeScript domain. It exposes a FastAPI API and a Flask UI. The family app adds a **Coach** route that posts the local household snapshot to that API and shows the answer plus structured cards. Gemini is optional for wording; numbers always come from deterministic core logic.

## Acceptance Criteria

### AC1: Today assignment plan
**Given** Emma and Dad, a daily rotation task “Dishes” with memberIds `[emma, dad]`, and date `2026-09-02`  
**When** `build_day_plan` runs  
**Then** the assignee for Dishes is the same member `getRotationAssignee` would pick in the TypeScript domain, and the plan lists that member with `title === "Dishes"` and `date === "2026-09-02"`

### AC2: Open pool tasks
**Given** an active pool task “Tidy” that occurs on `2026-09-02` and is not completed  
**When** `build_day_plan` runs  
**Then** `open_pool` contains one item with `title === "Tidy"` and `assignment_type === "pool"`

### AC3: Who has done the most this week
**Given** the points fixture household (Emma 4 week completions, Dad 2, Mom 1) and reference date `2026-09-02`  
**When** `analyze_contributions` runs  
**Then** `most_active_ids === ["m1"]` and Emma’s `week_completions === 4`

### AC4: Tied leaders
**Given** Emma and Dad each have 4 completions in the ISO week of `2026-09-04`  
**When** `analyze_contributions` runs  
**Then** `most_active_ids` is `["m1", "m2"]` in that order

### AC5: Natural-language intent for contributions
**Given** query `"Who has done the most?"`  
**When** `classify_intent` runs  
**Then** the result is `"contributions"`

### AC6: Natural-language intent for assignments
**Given** query `"Who should do dishes today?"`  
**When** `classify_intent` runs  
**Then** the result is `"plan"`

### AC7: API ask returns structured + answer
**Given** a valid household snapshot and query `"Who should do what today?"`  
**When** `POST /coach/ask` runs  
**Then** HTTP 200, `answer` is a non-empty string, `plan.date` is set, and `contributions.members` is an array

### AC8: Empty household
**Given** a household with zero members  
**When** `POST /coach/ask` runs with `"Who should do what?"`  
**Then** HTTP 200, `answer` contains `Setup`, and `plan.by_member` is `[]`

### AC9: Coach nav in the family app
**Given** AppShell is rendered in English  
**When** the nav is inspected  
**Then** a link with accessible name `Coach` points to `/coach`

### AC10: Coach view shows today’s plan from the API
**Given** the Coach page and a mocked API that returns Emma → Dishes  
**When** the user taps `Today's plan`  
**Then** the page shows the answer text and a card containing `Emma` and `Dishes`

### AC11: Coach unavailable
**Given** the Coach page and `fetch` rejecting  
**When** the user taps `Today's plan`  
**Then** the page shows exactly the translated unavailable message (`Coach is unavailable. Start the homework coach API.` in English)

### AC12: Finnish chrome
**Given** locale `fi`  
**When** AppShell and CoachView render  
**Then** nav link text is `Valmentaja`, page title is `Valmentaja`, and the plan button is `Tämän päivän suunnitelma`

## Files to Modify

| File | Change |
|---|---|
| `agents/homework-coach-agent/**` | New Python agent (core, CLI, tools, skills, subagents, memory, FastAPI, Flask) |
| `agents/AGENTS.md` | Register `homework-coach-agent` |
| `src/ui/AppShell.tsx` | Coach nav link |
| `src/app/App.tsx` | `/coach` route |
| `src/ui/coach/CoachView.tsx` | Family-app coach UI |
| `src/agent/homeworkCoach.ts` | API client posting household snapshot |
| `src/i18n/messages.ts` | EN/FI strings |
| `vite.config.ts` | Dev proxy `/agent-api` → port 8001 |
| `package.json` | Scripts to run/test the agent |
| `scripts/browser-smoke.mjs` | Coach nav + page load |
| `specs/architecture.md` | Optional coach API boundary |
| `specs/features/app-shell.md` | Fourth nav item |

## Risk

- What could break: Coach fetch against a down API; rotation mismatch vs TypeScript if epoch/ISO weekday differs.
- Rollback: hide `/coach` nav; Python folder is isolated.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `get_rotation_assignee` | first three daily | 3-member daily rotation | dates 2026-09-01..03 | m1, m2, m3 |
| `get_rotation_assignee` | wrap | same | 2026-09-04 | m1 |
| `get_rotation_assignee` | weekday skip | weekdays [1,3,5] | 2026-09-01 | null |
| `build_day_plan` | pool | uncompleted Tidy on date | plan | open_pool title Tidy |
| `analyze_contributions` | leader | Emma 4 / Dad 2 / Mom 1 | week of 2026-09-02 | most_active m1, week_completions 4 |
| `analyze_contributions` | tie | Emma and Dad 4 each | 2026-09-04 | [m1, m2] |
| `classify_intent` | most | "Who has done the most?" | classify | contributions |
| `classify_intent` | plan | "Who should do dishes today?" | classify | plan |
| `POST /coach/ask` | happy | valid household | ask | 200, answer, plan, contributions |
| `POST /coach/ask` | empty | no members | ask | 200, Setup in answer |
| `AppShell` | nav | en locale | render | Coach link to /coach |
| `CoachView` | plan button | mocked Emma/Dishes | tap Today's plan | shows Emma and Dishes |
| `CoachView` | offline | fetch reject | tap Today's plan | English unavailable message |
| `CoachView` | fi | locale fi | render | Valmentaja + Tämän päivän suunnitelma |

## Spec Readiness checklist (run before calling the spec done)
- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
