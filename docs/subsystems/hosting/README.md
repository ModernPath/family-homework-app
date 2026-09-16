# Hosting subsystem

Parent: [learner guide](../../hosting.md).
Module: [adapter](modules/app.md).
Specification: [hosting examples](../../../specs/features/hosting-examples.md).

The production Vite build calls `/agent-api/coach/ask`. Docker serves static
files and this route through `hosting.app:app`; Vercel serves static files and
rewrites the API prefix to `api/index.py`. Both call `homework_core.answer_query`
through the same stateless adapter. Browser SQLite remains the source of truth.

The hosted module does not import the original memory-writing FastAPI API,
dotenv or the Gemini client. It returns deterministic answers only. The hosted
API uses a stateless signed session cookie backed by a deployment-only family
password hash. No CORS wildcard is needed because frontend and API have the
same origin. User-specific identity and household authorization remain a later
extension behind the provider-neutral principal boundary.

See [existing architecture](../../../specs/architecture.md) for browser storage.
