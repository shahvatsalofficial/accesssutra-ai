# Security Policy

**Creator:** Vatsal Shah. Report suspected vulnerabilities privately through the repository's eventual security advisory channel; no email/contact address is assumed.

Threats: prompt injection in HTML/MCP data, path traversal, symlink escape, external URL SSRF, browser redirects, accidental production form submission, credential/PII leakage, XSS in HTML reports, token theft, hostile plugins, misleading conformance claims, tampered audit history and supply-chain attacks.

Defaults: no network for offline scan; local HTML size <=2 MiB; symlink input refused; no raw form values in scan output; report HTML escaped; optional browser only file/loopback, blocks off-scope requests, no clicks/submissions; localhost server bearer token >=24 chars, read-only GET, no CORS, rate limit. Do not expose local API to the public Internet.

Limitations: HTML tokenizer is heuristic; reviewer observation text can contain user-provided sensitive data—do not put PII there; local hash chain is not signed/WORM; optional browser dependencies and host plugins have not been audited or executed; future production needs stronger auth, tenant isolation, signing, retention controls and external review.

## Reporting

Report vulnerabilities through a private GitHub security advisory on https://github.com/shahvatsalofficial/accesssutra-ai/security/advisories/new. Do not post exploits or tokens publicly. Best-effort response.

## v0.2.0 hardening

Linear-time parser with documented limits, Host header check and fixed endpoints on the report API, sealed reports, assurance checks for each control (see documents/html/06-security-and-privacy.html).
