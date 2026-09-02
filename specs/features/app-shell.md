# Feature: App Shell

## Problem Statement

The kitchen tablet needs a installable, offline-capable shell: consistent navigation across Today, Week, and Setup; no login; usable without network after first load (PRD NFR).

## Proposed Change

Single-page app with `AppShell` wrapping all routes. Web app manifest: `name: "Family Task Board"`, `short_name: "Tasks"`, `display: "standalone"`, `start_url: "/"`. Service worker caches static assets (HTML, JS, CSS) on install; cache-first for static, network-not-required for app logic (data is local store). Document `lang="en"`. Primary nav visible on Today, Week, Setup with links `Today`, `Week`, `Setup` — current route link has `aria-current="page"`. No telemetry scripts loaded.

## Acceptance Criteria

### AC1: Manifest display mode
**Given** `manifest.webmanifest` is served  
**When** parsed  
**Then** `display === "standalone"` and `start_url === "/"`

### AC2: Offline app load
**Given** user opened app once online and service worker installed  
**When** device is offline and user navigates to `/`  
**Then** Today view shell renders within 3000 ms and shows date header (data from local store)

### AC3: Nav aria-current
**Given** user is on `/week`  
**When** AppShell renders  
**Then** link with text `Week` has `aria-current="page"` and `Today` link does not

### AC4: No auth screens
**Given** any route  
**When** app renders  
**Then** zero elements with role `form` whose accessible name contains `password` or `login` (case insensitive)

### AC5: Document language
**Given** any page  
**When** inspecting `<html>`  
**Then** `lang` attribute is exactly `en`

### AC6: No external telemetry
**Given** production build  
**When** inspecting loaded script URLs  
**Then** zero requests to domains other than `self` and `data:` during normal Today → Week → Setup navigation

## Files to Modify

| File | Change |
|---|---|
| `public/manifest.webmanifest` | PWA metadata |
| `src/sw.ts` or `public/sw.js` | Cache static assets |
| `src/ui/AppShell.tsx` | Nav, aria-current |
| `index.html` | `lang="en"`, manifest link |
| `src/app/bootstrap.ts` | Register service worker |

## Risk

- What could break: service worker caches stale JS after deploy; version cache name on build.
- Rollback: remove service worker; online-only still works with local store.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| manifest | display | load manifest | parse | standalone, start_url / |
| service worker | offline | SW installed, offline | GET / | shell renders, date visible |
| AppShell | aria-current | route /week | render | Week link aria-current page |
| AppShell | no auth | any route | render | no password/login form |
| index.html | lang | load page | inspect html | lang=en |
| network | no telemetry | navigate views | capture requests | no third-party domains |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
