# Tech Stack Specification

**Status:** Draft  
**Last updated:** 2026-09-02  
**Scope:** v1 MVP — optimize for speed-to-ship, single developer, kitchen tablet SPA

---

## 1. Decision summary

| Area | Choice | Rationale |
|------|--------|-----------|
| Language | **TypeScript 5.x** | Catches domain bugs early; matches feature spec types |
| Framework | **React 18** | Familiar, fast to build forms + tablet UI |
| Build | **Vite 5** | Instant dev server, simple config, PWA plugin |
| Routing | **React Router 6** | Three routes, no overhead |
| Styling | **CSS Modules + CSS variables** | No Tailwind build step; scoped styles, design tokens in `:root` |
| Dates | **date-fns 3** | Tree-shakeable, `format` / `eachDayOfInterval` / ISO week |
| Persistence | **sql.js 1.14** (SQLite WASM) + OPFS file `family-task-board.sqlite` | Real SQLite engine; IndexedDB kept only for one-time migrate |
| PWA | **vite-plugin-pwa** | Service worker + manifest generation |
| Tests | **Vitest 2** | Same config as Vite, fast domain tests |
| IDB in tests | **fake-indexeddb** | Node test env for store tests |
| Package manager | **npm** | Default, zero config |

**Explicitly rejected for MVP:**

| Alternative | Why not |
|-------------|---------|
| Next.js | SSR/API unused; adds complexity for offline SPA |
| Tailwind | Optional speed gain not worth extra config for ~15 components |
| Redux / Zustand | Single `Household` document + one hook sufficient |
| Dexie | ORM features unused for one-key storage |
| Backend (Node/Bun) | v1 is client-only local-first |
| SQLite (sql.js) | ~~Rejected~~ **Adopted** — production store; JSON document still lives inside one SQLite row for export/import simplicity |
| Workbox manual | vite-plugin-pwa covers MVP cache needs |

---

## 2. Runtime requirements

| Environment | Minimum |
|-------------|---------|
| Browser | Chromium 100+ (Android tablet Chrome), Safari 15.4+ (iPad) |
| JavaScript | ES2022 |
| Storage | OPFS (`family-task-board.sqlite`); IndexedDB only as migrate source |
| Display | 600×800 px viewport minimum |
| Network | Required once for initial load; offline after SW install |

**Target test device class:** 10" Android tablet or iPad in kitchen stand.

---

## 3. Project bootstrap

### 3.1 Scaffold command

```bash
npm create vite@latest . -- --template react-ts
npm install react-router-dom date-fns idb
npm install -D vitest fake-indexeddb @testing-library/react jsdom vite-plugin-pwa
```

### 3.2 `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 3.3 TypeScript config highlights

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["src/*"] }
  }
}
```

Path alias `@/` → `src/` for imports (`@/domain/types`).

---

## 4. Dependency list (pinned at init)

### Production

| Package | Version (major) | Purpose |
|---------|-----------------|---------|
| `react` | 18 | UI |
| `react-dom` | 18 | UI |
| `react-router-dom` | 6 | Routes |
| `date-fns` | 3 | Date formatting, week math |
| `idb` | 8 | IndexedDB |

**Total prod dependencies: 5.** No `@fontsource`, no UI kit, no animation lib.

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | Type check |
| `vite` | Dev + build |
| `@vitejs/plugin-react` | React refresh |
| `vite-plugin-pwa` | SW + manifest |
| `vitest` | Unit tests |
| `fake-indexeddb` | Store tests in Node |
| `@testing-library/react` | Hook/component smoke (minimal) |
| `jsdom` | Vitest DOM env |

---

## 5. Vite configuration

```typescript
// vite.config.ts — structural outline
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Family Task Board",
        short_name: "Tasks",
        display: "standalone",
        start_url: "/",
        theme_color: "#F8FAFC",
        background_color: "#F8FAFC",
        icons: [/* 192, 512 from public/icons */],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,webmanifest}"],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node", // domain tests
    // store/ui tests use environmentMatchGlobs for jsdom
  },
});
```

**Build output:** `dist/` static files — serve via any static host or `vite preview` on LAN for tablet testing.

---

## 6. Module conventions

### 6.1 Imports

```typescript
// UI may import:
import { completeRotation } from "@/domain/completions";
import { useHousehold } from "@/hooks/useHousehold";

// Domain may import only:
import type { Household } from "@/domain/types";
import { getRotationAssignee } from "@/domain/rotation";

// Domain must NOT import from @/ui or @/store/indexedDbStore
```

### 6.2 File naming

- Domain/store: `camelCase.ts`
- React components: `PascalCase.tsx`
- CSS modules: `ComponentName.module.css` co-located with component
- Tests: `members.test.ts` adjacent to `members.ts` or in `tests/domain/`

### 6.3 Result type (shared)

```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
```

All domain mutators return `Result<Household>`.

---

## 7. IndexedDB implementation sketch

```typescript
import { openDB } from "idb";
import type { Household } from "@/domain/types";
import type { Store } from "./store";

const DB_NAME = "family-task-board";
const STORE = "household";
const KEY = "default";

export function createIndexedDbStore(): Store {
  const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });

  const listeners = new Set<(h: Household) => void>();

  return {
    async load() {
      const db = await dbPromise;
      return (await db.get(STORE, KEY)) ?? createEmptyHousehold();
    },
    async save(household) {
      const db = await dbPromise;
      await db.put(STORE, household, KEY);
      listeners.forEach((l) => l(household));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

One object store, one key. Export = `JSON.stringify(household, null, 2)`.

---

## 8. Testing setup

| Test type | Location | Command |
|-----------|----------|---------|
| Domain unit | `src/domain/*.test.ts` | `npm test` |
| Store | `src/store/*.test.ts` | `npm test` |
| Export/import | `src/store/exportImport.test.ts` | `npm test` |

**Vitest config:** domain tests run in `node` env; no browser required for MVP CI.

**Coverage gate (recommended):** `vitest run --coverage` with `@vitest/coverage-v8`; fail if `src/domain/` &lt; 90% lines.

**No Cypress/Playwright in MVP gate** — manual tablet QA checklist from PRD §18.

---

## 9. Development workflow

### 9.1 Local dev on tablet

1. `npm run dev -- --host` (expose on LAN)
2. Open `http://<laptop-ip>:5173` on tablet Chrome
3. Add to Home Screen for standalone test

### 9.2 Production-like test

1. `npm run build && npm run preview -- --host`
2. Verify service worker registers on second load
3. Toggle airplane mode → Today still loads from cache + IndexedDB

### 9.3 Seed data for dev

`src/domain/seed.ts` exports `createDemoHousehold()` — 3 members, 2 rotation tasks, 1 pool task. Dev-only button in Setup or `?demo=1` query flag; **not included in production build** (`import.meta.env.DEV` guard).

---

## 10. Deployment (MVP)

**No server required.** Options:

| Method | Use case |
|--------|----------|
| `dist/` on tablet via local static server | Kitchen permanent install |
| Raspberry Pi `nginx` serving `dist/` | Always-on LAN URL |
| USB / file copy | Offline sideload (limited SW on `file://` — prefer http) |

**Recommendation for kitchen tablet:** Install as PWA from `http://home-tablet.local` (Pi or old laptop serving `dist/`). Pure `file://` skips service worker — avoid for MVP.

---

## 11. v2 tech additions (document only)

When multi-device sync ships, add **without replacing** v1 stack:

| Addition | Role |
|----------|------|
| Small **Hono** or **Express** server on LAN | REST `GET/PUT /household` |
| `LanStore implements Store` | Swap at bootstrap |
| Optional **WebSocket** | Push updates to open tabs |

Keep React SPA; no rewrite to Next.js.

---

## 12. Security posture (v1)

| Topic | Stance |
|-------|--------|
| Auth | None |
| HTTPS | Optional on LAN; not required for local-only |
| Input validation | Domain layer only; UI mirrors error strings |
| XSS | React default escaping; no `dangerouslySetInnerHTML` |
| Secrets | None in app |

---

## 13. Tech stack acceptance criteria

### AC1: Dependency count
**Given** `package.json` after bootstrap  
**When** production dependencies are counted  
**Then** count ≤6 (react, react-dom, react-router-dom, date-fns, idb, and vite runtime chunks excluded)

### AC2: Build output is static
**Given** `npm run build`  
**When** `dist/` is inspected  
**Then** zero `.php`, `.py`, or server entry files exist; only HTML, JS, CSS, assets

### AC3: Domain tests run without browser
**Given** `npm test` on clean CI node image  
**When** only domain tests execute  
**Then** exit code 0 with no Playwright/Chromium launch

### AC4: IndexedDB wrapper
**Given** `src/store/indexedDbStore.ts`  
**When** scanned for raw `indexedDB.open` calls  
**Then** zero direct calls — all access via `idb` package

### AC5: Offline shell
**Given** app built with vite-plugin-pwa, loaded twice online, then offline  
**When** user navigates to `/`, `/week`, `/setup`  
**Then** each route renders shell within 3000ms (per app-shell spec)

### AC6: No backend in repo
**Given** repository root  
**When** searched for `express`, `fastify`, `hono` in `package.json` dependencies  
**Then** zero matches in v1 MVP branch

---

## 14. MVP implementation checklist

Ordered tasks matching architecture build order:

- [ ] Vite + React + TS scaffold, strict TS, path alias
- [ ] CSS variables in `src/ui/global.css` per ui-ux spec tokens
- [ ] React Router: `/`, `/week`, `/setup`
- [ ] `domain/types.ts` + `seed.ts`
- [ ] `Store` + `IndexedDbStore` + `InMemoryStore`
- [ ] `useHousehold` hook + `HouseholdProvider`
- [ ] Domain modules with Vitest (members → tasks → rotation → completions → points → rewards)
- [ ] UI components per ui-ux catalog
- [ ] vite-plugin-pwa + manifest icons
- [ ] export/import in Backup panel
- [ ] Manual tablet QA on PRD §18

**Estimated MVP effort:** 1 developer, ~5–8 focused days following spec build order (domain-first).

---

## 15. Spec Readiness checklist

- [x] Every AC has a precise expected value
- [x] Another person could scaffold project from §3–§5 without guessing packages
- [x] Every AC can fail (measurable counts, grep checks)
- [x] Rejected alternatives documented to prevent stack debates during build
- [x] Aligned with architecture.md layers and ui-ux.md styling approach
