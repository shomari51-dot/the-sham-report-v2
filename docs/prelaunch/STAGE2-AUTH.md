# Stage 2: Admin sessions

`POST /api/auth` checks ADMIN_PASSWORD using constant-time SHA-256 digest comparison and returns an HMAC-SHA256 token, never ADMIN_SECRET. Format: base64url(JSON payload).base64url(signature). Payload contains sub=admin, iat/exp (Unix seconds), and random jti. ADMIN_SECRET signs sessions; ADMIN_TOKEN_TTL_SECONDS defaults to 28800 (8 hours). Missing configuration fails closed. Responses are no-store.

Writes use `Authorization: Bearer <token>` or the compatibility `X-Admin-Secret: <token>`. Raw secrets are rejected. Draft article visibility (including slug lookup) and grades `?include=all` use the same verifier. Admin pages retain signed tokens in sessionStorage and clear them on 401, returning to login with “Session expired”. Bulk publisher uses Bearer; the CMS compatibility header carries the signed token.

Public reads retain `Access-Control-Allow-Origin: *`. Auth and writes accept only ALLOWED_ORIGINS (comma-separated exact origins). If unset, allowed origins are the two HTTPS production domains, HTTPS project previews matching `the-sham-report-v2-*-sham-god-media-s-projects.vercel.app`, and HTTP localhost with a numeric port. Origin is echoed with Vary: Origin; other origins receive 403. Preflight uses the same origin policy. No-Origin requests require a valid token, including login requests: initial non-browser login must supply an allowed Origin.

Per-instance in-memory limits are best-effort, not shared across Vercel instances: five failed logins per IP in 15 minutes, and 60 authenticated write attempts per IP per minute. Expired windows are removed on access. IP uses the first Vercel x-forwarded-for address, then socket address. Deployment proxies must control that header. Limits reset on cold starts.

Launch step (not performed): rotate production ADMIN_SECRET **and ADMIN_PASSWORD** in Vercel, then redeploy. All existing admin sessions are invalidated. Use separate preview credentials and database configuration before preview admin writes. No credential values belong in source or documentation.

Validation: `npm test` (Node 24; cached mongodb-memory-server binary, downloads disabled). This workspace currently has Node 20 and forbids local socket binding (EPERM), preventing Mongo integration execution. Pure tests and file-only dry run can still execute. No production or external database was contacted.
