Steps to run in each loop.
1. Check the task list and pick the highest prio **open** task from there
2. Make task specs if they are unclear
3. implement the task with TDD
4. Run and fix unit tests until all ok
5. review and audit the code until it passes the audit 100%
6. test the task results at browser, fix UI and UX issues
7. Mark the task **done** in the list below when it passes audit + browser

## Task list (highest prio first)

| Prio | Status | Task |
|------|--------|------|
| 1 | done | Persist household data in **SQLite** instead of browser memory / IndexedDB. Keep the `Store` interface. Production default must load/save via SQLite (not `indexedDB` or a JS object). Migrate or replace existing IndexedDB data so a kitchen tablet restart still shows the same members, tasks, completions, rewards, and locale. Tests may still use `InMemoryStore`. |
| 2 | done | EN/FI localization (PRD OD-6): nav switcher, dates, chrome, domain errors |
| 3 | done | Homework coach agent: Python+API (who should do what / who did the most) + Coach UI in the family app |
