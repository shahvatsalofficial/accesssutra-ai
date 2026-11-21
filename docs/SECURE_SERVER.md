# Server Architecture and Operations

**Implemented:** `packages/server/server.mjs` read-only HTTP GET `/health` and `/reports` for `assessment.json` in an explicitly selected local directory. Bound to `127.0.0.1` only, bearer token >=24 chars, no CORS, basic per-IP minute rate limiting, no write endpoints. No cookies or browser session reuse. A local token is not enterprise identity.

**Not implemented:** hosted service, multi-user UI, TLS termination, OAuth/OIDC, database, tenant isolation, signed audit, backups, deployment hardening, admin console or production-grade rate limiter.

**Target enterprise design:** ingress/TLS and WAF → API gateway and OIDC → ABAC/RBAC authorization → task/review API → queue/workers for consented browser jobs → PostgreSQL tenant-scoped records → encrypted evidence object storage → signed external audit → telemetry and backup. Separate untrusted browser runners from API and database; deny egress except explicitly approved hosts; apply job resource quotas and browser sandboxing. Design GDPR/India DPDP/data residency as jurisdiction-specific legal reviews, not automatic claims.

Do not deploy this starter server to public networks. For local use see README. The Dockerfile is a development example, not a hardened production image.
