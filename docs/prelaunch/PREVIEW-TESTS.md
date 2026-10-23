# Stage 2/3 preview checks — Oct 22, 2026 ~7:23 PM CT
Preview: https://the-sham-report-v2-phw2hzpve-sham-god-media-s-projects.vercel.app (commit 8b40164). Only reads and rejected writes were sent; no successful write reached any database.
- GET /api/grades → 200, 17 legacy grades served unchanged (legacy docs without status stay visible).
- POST /api/auth from evil origin → 403 Origin forbidden.
- POST /api/content from evil origin → 403.
- POST /api/grades without token → 401; with non-token X-Admin-Secret → 401.
- DELETE /api/articles without token → 401.
- POST /api/auth wrong password ×12 → 401 each, no 429: in-memory limiter is per serverless instance, so it does not trigger across instances. Needs a shared store (e.g. Upstash/Vercel KV) for real limiting — deferred.
- NOT tested on preview: successful login + authenticated write, because previews still use the production DB and secrets (Stage 1 blocked). Covered by local tests against mongodb-memory-server.
Local: `npm test` → 17/17 pass (incl. memory-server integration and migration dry-run/apply idempotency).
