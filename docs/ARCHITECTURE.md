# AccessSutra AI — Multi-Level Architecture

**Enterprise/business:** public services, education and web teams need to know whether users can complete essential tasks. Users are product owners, QA, accessibility specialists and participating reviewers. The outcome is a traceable decision and remediation queue, not a compliance score.

**Capability:** scope/consent → task model → static hints → browser observations (optional) → human AT/cognitive review → findings → remediation/retest → independent review.

**Domain:** `Task`, `Step`, `TestEnvironment`, `Scope`, `ScanRun`, `Rule`, `Finding`, `EvidenceRef`, `KeyboardObservation`, `HumanObservation`, `Remediation`, `Retest`, `ReviewDecision`, `AuditEvent`. Every result distinguishes provenance and unknowns.

**Solution/application:** Node.js 22+ CLI (`packages/cli`), offline limited HTML parser/checks (`packages/core`), manual checklist, report renderers, optional browser adapter (`packages/browser`) and localhost report API (`packages/server`). No mandatory hosted LLM.

**Component:** input validator, HTML tokenizer, rule engine, candidate WCAG mapper, source SHA-256, manual plan/observation validator, report builder, HTML escaper, hash chain, IDE copier, bearer-token API. All adapters have explicit capability flags.

**Data:** local JSON and HTML, no raw form input values, source basename/hash, rule IDs and positional selectors. Manual observation text is user-supplied and should be reviewed for PII. Future DB must support tenant-scoped encryption and retention.

**Integration:** Playwright/axe optional; Pa11y/Lighthouse/WAVE/Accessibility Insights candidates; NVDA/JAWS/VoiceOver/TalkBack are human-driven; MCP tools planned read-only; GitHub/GitLab CI planned. Do not claim adapters work until tested.

**Security/privacy:** allowlisted local inputs, size limits, no network in offline mode, browser loopback/file origin restrictions, no form submission, report escaping, token-protected localhost server, minimal evidence, explicit consent. See THREAT_MODEL.md.

**Infrastructure/deployment:** starter is local CLI and loopback API. Future self-hosted deployment uses gateway, OIDC, RBAC, worker queue, PostgreSQL, object storage with retention, signed audit, secrets manager, backups and observability; separate tenant boundaries.

**UX/accessibility:** future dashboard must itself be keyboard accessible, screen reader tested, WCAG 2.2 AA design target, high contrast, reflow, task-first navigation, no score-as-certification UI, explicit evidence status.

**DevOps/QA/operations:** Node test runner, fixture regression, threat tests, CI OS matrix, build reproducibility, versioned schemas, dependency review, vulnerability disclosure, backup/restore and incident playbooks for enterprise future.

**Decision:** M0 deliberately avoids browser runtime dependency and cloud services. M1 adds approved Playwright/axe test execution with explicit measured results. Full multi-user service and dashboard are separate milestones.
