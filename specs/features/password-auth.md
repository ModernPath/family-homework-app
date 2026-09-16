# Feature: Password-protected hosted family app

## Overview

- **Status:** In Progress
- **Created:** 2026-09-16
- **Affected Subsystems:** [Hosting](../../docs/subsystems/hosting/README.md), frontend application shell, hosted coach API

## Problem Statement

The published application currently exposes the frontend and hosted coach API
without access control. The household document remains in browser storage and
is submitted to `/agent-api/coach/ask`, so an unauthenticated visitor can use
the hosted endpoint and the app must not be treated as private.

## Current Behavior

The hosted adapter in `hosting/app.py` is stateless and deterministic. It has no
login, session, user identity, or authorization boundary. The React app loads
the household store immediately on startup and calls the coach endpoint from
`src/agent/homeworkCoach.ts`.

## Proposed Change

Add a password gate for the hosted deployment:

1. Store one family password as a scrypt password hash in the deployment
   environment (`FAMILY_APP_PASSWORD_HASH`). Never commit or bundle the plain
   password.
2. Store a separate random signing secret (`FAMILY_AUTH_SECRET`) in the
   deployment environment.
3. Add stateless login, session, and logout endpoints under `/agent-api/auth`.
4. Issue a signed, expiring, `HttpOnly`, `SameSite=Lax`, production-`Secure`
   cookie after successful password verification.
5. Require a valid session for `/agent-api/coach/ask` and the hosted app's
   authenticated functionality. Keep only health, login, session discovery,
   and logout available without an authenticated session.
6. Add a frontend auth gate before `HouseholdProvider` mounts, so an
   unauthenticated browser does not load the local household database into the
   application UI.
7. Model the authenticated session as a small principal (`sub`, tenant/family
   id, roles, issued/expiry times) behind an auth service boundary. The first
   implementation has one principal (`family`) and no user management; a later
   user-auth provider can replace the password verifier without changing coach
   or household code.

The hosted path continues to use deterministic `homework_core` logic only. It
does not call Gemini, persist household data, or expose the local agent's
memory routes.

## Acceptance Criteria

### AC1: Password configuration fails closed

**Given** the hosted adapter has no complete password hash and signing secret
**When** a protected API request is made
**Then** it does not execute the coach or return household data, and returns a
controlled server error without echoing configuration values.

### AC2: Successful login creates a session

**Given** the configured password hash and correct password
**When** `POST /agent-api/auth/login` is called
**Then** it returns success and sets an expiring `HttpOnly`, `SameSite=Lax`
session cookie; production configuration marks the cookie `Secure`.

### AC3: Incorrect password is rejected safely

**Given** any incorrect password
**When** login is attempted
**Then** the response is `401`, contains no password or household data, and no
session cookie is issued.

### AC4: Protected coach endpoint

**Given** no valid session cookie
**When** `POST /agent-api/coach/ask` is called
**Then** it returns `401` and does not run the coach core.

### AC5: Authenticated coach request

**Given** a valid session cookie and a valid household request
**When** `POST /agent-api/coach/ask` is called
**Then** the existing structured response is returned and remains stateless,
deterministic, and `no-store`.

### AC6: Session expiry and logout

**Given** an expired or logged-out session
**When** a protected endpoint is called
**Then** it returns `401`; logout clears the session cookie.

### AC7: Frontend gate precedes local data loading

**Given** a production build and no authenticated session
**When** the app loads
**Then** it shows a password form and does not mount `HouseholdProvider` or
render household routes.

### AC8: Authenticated frontend flow

**Given** a correct password
**When** the family submits the password
**Then** the application loads normally, the existing local household data is
available, and Coach requests use the authenticated session cookie.

### AC9: User-auth extension seam

**Given** the first-release password implementation
**When** auth code is inspected
**Then** session verification returns a provider-neutral principal and coach
routes depend on that boundary, with no household or coach logic coupled to a
password-specific implementation.

### AC10: No hosted LLM or persistence regression

**Given** authenticated and unauthenticated hosted requests
**When** the app is exercised
**Then** hosted code does not import the local file-memory API or Gemini client,
and `/agent-api/sessions` and `/agent-api/household/snapshot` remain unavailable.

## Files to Modify

| File | Change Description |
|---|---|
| `hosting/auth.py` | Password hash verification, signed session tokens, provider-neutral principal and auth configuration |
| `hosting/app.py` | Auth endpoints, protected-route dependency, safe auth errors and cookie handling |
| `src/agent/auth.ts` | Browser auth-session/login/logout client |
| `src/ui/auth/AuthGate.tsx` | Password gate and authenticated context |
| `src/app/App.tsx` | Mount auth gate before `HouseholdProvider` |
| `src/ui/AppShell.tsx` | Logout control |
| `src/i18n/messages.ts` | English/Finnish auth strings |
| `src/ui/global.css` | Auth page and logout styling |
| `scripts/generate-password-hash.py` | Interactive scrypt hash generator that never accepts the password as a command-line argument |
| `tests/hosting/test_auth.py` | Auth API, cookies, expiry, protected routes, and future-principal contract tests |
| `tests/hosting/test_hosting.py` | Update hosted contract fixtures for explicit auth-disabled test mode and protected behavior |
| `src/ui/auth/AuthGate.test.tsx` | Frontend auth gate tests |
| `docs/hosting.md` | Password setup, secret handling, limitations, logout, and user-auth next step |
| `docs/subsystems/hosting/README.md` | Auth boundary and data-flow update |
| `docs/subsystems/hosting/modules/app.md` | Auth configuration and protected routes |
| `specs/architecture.md` | Hosted auth boundary and future user-auth extension |
| `content-plan.md` | Security/hosting documentation status |

## Risk Assessment

- **What could break:** Existing hosting smoke tests and direct local development
  if auth configuration is not explicit; PWA/service-worker cache behavior;
  deployment cookie behavior behind HTTPS proxies.
- **Privacy limitation:** The host still processes the household snapshot in
  memory for a coach request. Password protection prevents unauthenticated use
  but does not make the hosting provider cryptographically unable to see data.
- **Browser limitation:** The household database remains local to the browser
  profile and is not encrypted by this feature. Anyone with access to an
  already-unlocked family device/profile can access it.
- **Rollback plan:** Redeploy the prior commit/image. No household schema or
  server database migration is required.
- **Dependencies:** Deployment secrets must be configured before publishing.
  Host-level HTTPS, rate limiting, log retention, and access controls remain
  required.

## Testing Strategy

### Unit Tests

| Function | Test Case | Given | When | Then | Mocks |
|---|---|---|---|---|---|
| password verifier | correct hash | generated scrypt hash | verify correct password | true | none |
| password verifier | wrong password | generated scrypt hash | verify wrong password | false | none |
| session signer | valid token | principal and future expiry | sign then verify | same provider-neutral principal | none |
| session signer | tampered token | modified payload/signature | verify | invalid | none |
| session signer | expired token | expiry in the past | verify | invalid | fixed clock |
| auth config | incomplete secrets | missing hash or secret | build config | auth unavailable/fail closed | none |

### Integration Tests

| Scenario | Method | Input | Expected Output | Status Code |
|---|---|---|---|---|
| auth status unauthenticated | GET `/agent-api/auth/session` | no cookie | `authenticated: false` | 200 |
| login success | POST `/agent-api/auth/login` | correct password | session cookie | 200 |
| login failure | POST `/agent-api/auth/login` | wrong password | generic error | 401 |
| protected ask without session | POST `/agent-api/coach/ask` | valid household | no answer/data | 401 |
| protected ask with session | POST `/agent-api/coach/ask` | valid household | existing answer contract | 200 |
| logout | POST `/agent-api/auth/logout` | valid cookie | cleared cookie | 200 |
| expired session | POST `/agent-api/coach/ask` | expired cookie | no answer/data | 401 |
| public health | GET `/agent-api/health` | none | health only | 200 |
| unavailable memory routes | GET `/agent-api/sessions` | authenticated/unauthenticated | JSON 404 | 404 |

### E2E Tests

| User Journey | Steps | Expected Outcome |
|---|---|---|
| password unlock | open hosted app → enter wrong password → enter correct password | error first; app then loads and Coach works |
| logout | unlock → inspect board → logout → reload | board is hidden until password is entered again |
| independent browser | unlock browser A → open browser B | B is not authenticated and cannot call Coach |

### Coverage Target

- Auth module and protected routes: 100% of acceptance criteria
- Critical password/session paths: 100%
- Existing hosting and frontend test suites remain green

## Related Documentation

- **Tier 1:** [architecture](../architecture.md), [hosting guide](../../docs/hosting.md)
- **Tier 2:** [hosting subsystem](../../docs/subsystems/hosting/README.md)
- **Tier 3:** [hosting adapter](../../docs/subsystems/hosting/modules/app.md)
- **Feature:** [homework coach](homework-coach.md)
