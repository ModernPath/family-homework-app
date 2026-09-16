# Hosting adapter

Parent: [hosting subsystem](../README.md).
Source: `hosting/app.py`, `api/index.py`.

`create_app(static_dir=None)` exposes health, password session endpoints, and the
current UI's ask endpoint.
With a static directory, only known SPA routes return index.html; other GETs
must resolve to an existing file within that directory. Memory routes are absent.

`BoundedBody` counts received bytes before parsing, including chunked requests.
Pydantic constrains top-level input, lists, query length, locale and request date.
Nested core shape errors become generic 422 responses. Validation is deliberately
small, not a full domain schema or a tenant security layer. Errors omit input.
API responses use no-store. Input is not written by the adapter or logged as a body.
Hosting-provider retention/diagnostics are separate from application persistence.

Limits: 256 KiB request; 6 members; 25 tasks; 1000 rows per event collection;
2000 query characters; reference years 2000–2100. These bound this teaching
core's work but do not replace host-level rate limiting or billing controls.

Coach requests require a valid signed `family_session` cookie. The initial
provider verifies `FAMILY_APP_PASSWORD_HASH` and signs sessions with
`FAMILY_AUTH_SECRET`; missing configuration fails closed for protected routes.
The frontend checks the session before mounting the local household provider.
Tests: `tests/hosting/test_hosting.py`, `tests/hosting/test_auth.py`; rendered flow:
`scripts/hosting-smoke.mjs`. Deployment instructions: [guide](../../../hosting.md).
