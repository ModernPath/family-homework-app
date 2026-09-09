# Family Task Board

Example exercise built during the **Saranen / ModernPath AI-assisted coding course**.

This repository is a teaching artifact: it shows how a local-first family chore board can be designed, specified, and implemented with AI-assisted workflows (research → PRD → specs → TDD → review). It is not a production product.

## What it is

A wall-tablet chore app for a shared kitchen:

- **Today** — who does what today (rotation + open pool tasks)
- **Week** — rotation plan for the next 7 days
- **Coach** — AI homework coach (who should do what, who has done the most)
- **Setup** — members, tasks, rewards, backup/import
- **Local-first** — SQLite in the browser, no accounts, PWA-friendly

## Tech stack

- Vite 6, React 18, TypeScript, React Router 6
- Vitest + Testing Library + Playwright smoke tests
- Spec-driven development (`specs/`, `AGENTS.md`)

## Quick start

```bash
npm install
npm run dev       # http://localhost:5180
npm run coach:api # homework coach FastAPI on http://127.0.0.1:8001
npm test
npm run test:agent
npm run build
```

Load sample data: **Setup → Backup → Load Vuorio family sample**.

## Course context

Built as a hands-on example for learning:

- Product research and PRD writing with AI
- Feature specs with Given/When/Then acceptance criteria
- Test-driven development against specs
- Iterative UX polish and audit cycles

See `specs/PRD.md`, `specs/features/`, and `prompts.md` for the documentation trail.

Python agents live in `agents/` — copyable kit in `agents/AGENTS.md`, worked example `agents/homework-coach-agent/`.

## License

MIT — use freely for learning and teaching.
