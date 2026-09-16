# Security boundary

<!-- @tier: 1 -->

## Current hosted model

The published app is protected by one shared family password. The password is
stored outside the repository as a scrypt hash in `FAMILY_APP_PASSWORD_HASH`.
`FAMILY_AUTH_SECRET` signs a short-lived, HttpOnly, SameSite=Lax session cookie.
Production must use HTTPS and `FAMILY_AUTH_COOKIE_SECURE=true`.

The hosted API is stateless and deterministic. It does not call Gemini and does
not write household data or coaching history. The browser remains the source of
truth and sends a request-scoped household copy to the Coach endpoint.

## Protected surface

- `/agent-api/coach/ask` requires a valid session.
- `/agent-api/auth/login`, `/agent-api/auth/session`, and
  `/agent-api/auth/logout` manage the password session.
- `/agent-api/health` is public and returns health status only.
- Local memory routes such as `/agent-api/sessions` and
  `/agent-api/household/snapshot` are not exposed by the hosted adapter.
- The frontend gates `HouseholdProvider`, so it does not load browser household
  data until the session check succeeds.

## What this does not protect

Password access control is not end-to-end encryption. The hosting provider can
process request data while the Coach response is computed, and anyone with
access to an already-unlocked family browser profile can read its local OPFS/
SQLite data. Host-level HTTPS, secret storage, rate limiting, log retention,
backups, and account security remain part of the deployment responsibility.

## User-auth preparation

The auth layer returns a provider-neutral principal containing a subject,
tenant/family ID, roles, and session timestamps. The shared-password provider
currently uses the synthetic `family` principal. A later user-auth provider
should replace verification, assign users to household tenants, and enforce
authorization for every household read/write operation before adding server
persistence or synchronization.

## Related Documents

- **Tier 1:** [architecture](../specs/architecture.md), [hosting](hosting.md)
- **Tier 2:** [hosting subsystem](subsystems/hosting/README.md)
- **Feature:** [password authentication](../specs/features/password-auth.md)
