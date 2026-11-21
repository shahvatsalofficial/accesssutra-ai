# AccessSutra AI — Plugins, MCP, Browser Tools and Server Catalog

**Publisher:** Vatsal Shah · **Chief agent:** AccessSutra Prime · **Product ID:** AI-010

This catalog separates *implemented*, *optional adapter source*, *human-operated*, and *planned*. No external integration is represented as installed or tested unless evidence exists.

| Layer | Tool / integration | Status | Security and permission boundary |
| --- | --- | --- | --- |
| Offline CLI | Node.js 22+ and built-in test runner | Implemented and tested | Local regular HTML only; no cloud key |
| HTML review | Limited dependency-free static tokenizer | Implemented and tested | Heuristic, not full HTML5/DOM/axe |
| Browser | Playwright Chromium | Optional source included; not executed | Explicit install; file/loopback origin only; no form submission |
| Automated rules | `@axe-core/playwright` | Optional source included; not executed | Same approved local browser; report incomplete rules separately |
| Automated scanner | axe-core direct, Pa11y | Candidates | Require reviewed dependency/license and actual execution |
| Performance/a11y context | Lighthouse | Candidate | Never replace task and manual testing |
| Manual browser | Accessibility Insights, WAVE, DevTools | Reviewer-operated candidates | Manual observations need provenance |
| Assistive technology | NVDA, JAWS, VoiceOver, TalkBack | Human-operated only | Record OS/browser/AT versions; never simulate tests |
| CI | GitHub Actions | Matrix workflow template included, not hosted-run | Node 22, Linux/macOS/Windows; no conformance badge |
| CI | GitLab CI, Azure DevOps | Planned | Explicit repository authorization |
| MCP | Read-only local tools | Design contract only | Root allowlist, JSON Schema, auth, no arbitrary shell |
| Server | Node HTTP report API | Implemented/tested locally | `127.0.0.1`, token, GET-only, no CORS, rate limit |
| Enterprise server | PostgreSQL, OIDC/SSO, queue, evidence store | Planned | Tenant isolation, encryption, signed audit, backups |
| Cloud | Firebase, Vercel, AWS, GCP, Azure | Deployment candidates only | User approval, cost/security/region review |

## Required approval and audit checklist

Before enabling any external plugin: document the exact plugin version, maintainer, license, permissions, origin/egress, data sent, retention, cost, secret handling, fallback, vulnerability scan, test results and rollback. No global installation or cloud deployment is authorized by this document.

## Official guidance

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI Easy Checks: https://www.w3.org/WAI/test-evaluate/preliminary/
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing

Automated scans alone cannot establish accessibility conformance.
