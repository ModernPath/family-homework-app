# Feature: Docker and Vercel hosting examples

Status: In Progress

Implementation and local verification complete; Vercel cloud verification pending.

## Scope

User requested ready-made Docker and Vercel examples for the existing training
application. Keep the browser-local household store and existing coach response
contract. Add a stateless hosting adapter around the deterministic Python core.
The original local API/CLI retains its file memory; it is not exposed by these
deployments. The hosted deployment uses one shared family password and signed
stateless sessions; it does not introduce accounts, cloud household sync,
model calls or paid resources. User-specific auth remains a follow-up feature.

## Acceptance criteria

- AC1: Given a built app and an authenticated family session, Docker serves `/`,
  `/coach`, `/setup`, `/week` and assets, and `/agent-api/coach/ask` returns the
  current structured coach answer. Unauthenticated coach calls are rejected.
- AC2: Given the Vercel entrypoint and configured auth secrets, the same
  authenticated request returns the same answer; Vercel configuration routes API
  requests ahead of SPA fallback.
- AC3: Given two authenticated independent clients, an answer uses only that
  request's household. `/sessions` and `/household/snapshot` are unavailable.
  No hosted request writes server memory or calls Gemini.
- AC4: Given invalid JSON, invalid dates/household, or an oversized request,
  return a controlled 4xx with no submitted data echoed in the error. API
  responses are not cached. Unknown API paths return JSON 404, not index.html.
- AC5: Given a new browser at the hosted URL, enter the family password, create a
  synthetic member, use Coach, reload and retain that member; a second browser
  must authenticate independently and starts with its own local store.
- AC6: Learner instructions explain both deployments, storage boundaries,
  secrets, logs, restart, rollback, cost controls and next auth steps honestly.

## Files and boundaries

- `hosting/app.py`: hosted API factory and Docker static-serving adapter.
- `hosting/auth.py`: password hash verification and provider-neutral sessions.
- `api/index.py`: Vercel function entrypoint; `requirements.txt`: hosting deps.
- `Dockerfile`, `compose.yaml`, `.dockerignore`: reproducible non-root runtime.
- `vercel.json`, `.vercelignore`, `.python-version`: hosted build/routing.
- `tests/hosting/test_hosting.py`, `tests/hosting/test_auth.py`,
  `scripts/hosting-smoke.mjs`: HTTP and browser evidence.
- `package.json`: hosting commands; `.gitignore`: local test/build artifacts.
- `docs/hosting.md`, `docs/subsystems/hosting/README.md`,
  `docs/subsystems/hosting/modules/app.md`, `content-plan.md`, `README.md`:
  learner walkthrough and architecture navigation.

## Test strategy

RED first: new hosting contract tests fail because the adapter is absent.
Then test real ASGI requests for AC1–4: correct answers, separate clients,
unavailable memory routes, malformed/oversized/chunked inputs, no-cache and SPA
fallback/traversal. Build Docker and exercise AC5 in a real browser against the
container. Run existing TypeScript and Python tests, build, and review AC6 docs.
Target: evidence for every AC; no aggregate code-coverage percentage claimed.
Cloud routing can only be declared verified after an actual Vercel deployment;
local entrypoint/config checks are recorded separately.

## Risks and rollback

Browser data is scoped to origin/device; changing URL does not migrate it.
Stateless hosting intentionally has no server coaching history. Anonymous public
hosting has no user/tenant authorisation; use synthetic data and host controls.
Rollback by redeploying a prior image/commit; no database migration is involved.

## Documentation

Existing architecture: [architecture](../architecture.md).
Existing feature: [homework coach](homework-coach.md).
Hosting: [learner guide](../../docs/hosting.md),
[subsystem](../../docs/subsystems/hosting/README.md),
[module](../../docs/subsystems/hosting/modules/app.md).

## Verification record — 12 September 2026

- Initial hosting test collection failed because `hosting.app` did not exist.
  After the first implementation, tests exposed a missing API fallback and
  missing task-shape validation; both were corrected.
- Hosting contracts: 19 passed, including the Vercel ASGI entrypoint.
- Existing frontend: 131 tests passed; TypeScript/Vite production build passed.
- Existing Python agent: 29 tests passed with memory redirected to a temporary
  directory, preserving the developer's stored snapshots and sessions.
- Docker: image built; non-root uid 10001; read-only container healthy.
- Browser: real member/task creation, real coach response, direct route,
  reload, independent second browser and same-browser container restart passed.
  Inspected `artifacts/hosting-coach.png` (local, ignored).
- Vercel JSON fields validated against the provider's published schema using
  draft-07 semantics because its draft-04 metadata contains newer constraints.
  This is configuration validation, not a cloud build/routing result.
- Documentation links and git diff whitespace checks passed.
- Existing npm audit reports four moderate entries in React Router/Vitest
  dependency families. Suggested fixes require major upgrades; not bundled into
  this hosting change. Do not describe this example as security-audited production.

Review verdict: local hosting example verified; Vercel cloud acceptance remains
open until a project is deployed and the browser test passes at its URL. No
cloud deployment, account creation or billing change was performed.
