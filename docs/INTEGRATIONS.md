# Optional Tools, Plugins and MCP Plan

**Implemented local core:** Node.js 22+, deterministic static hints, manual plans, reports and localhost API; no provider key.

**Optional adapter source (not executed here):** `playwright` + `@axe-core/playwright`. Install only after approval, pin compatible versions and verify browser download/license/security; no automatic install.

**Candidates only:** axe-core, Pa11y, Lighthouse, Accessibility Insights, WAVE, NVDA, VoiceOver, JAWS, TalkBack, Chrome DevTools, BrowserStack/Sauce Labs, GitHub Actions, GitLab CI, Azure DevOps. Do not assert installed/connected.

**MCP design (planned):** read-only tools `accesssutra.scan_local_html`, `accesssutra.create_manual_plan`, `accesssutra.read_report`, `accesssutra.list_rules`. JSON Schema input validation, explicit root allowlist, no network, no write endpoints, no arbitrary commands, no PII in outputs. Hosted MCP and authenticated remote API are separate future milestones.

**Plugin safety:** list tool permissions, data sent, scopes, cost and telemetry before user approval. Keep no-key core useful when every external plugin is disabled.
