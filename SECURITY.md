# Security Policy — CivicResolve AI

- **HTTP Security Headers:** CSP (`object-src 'none'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, and CORP.
- **API Protections:** Explicit CORS allowlist, per-IP sliding-window rate limiter (`429 Too Many Requests`), `100kb` JSON body cap, strict payload validation, and HTML entity sanitization.
- **Container Hardening:** Multi-stage Alpine Dockerfile running as unprivileged `USER node` with built-in `/api/health` check.
