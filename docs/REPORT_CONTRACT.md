# Evidence and Reporting Contract

`scan.json` contains `schemaVersion`, `scope` (source basename, SHA-256, bytes, element count), `summary`, `findings` (stable ID, rule, kind, candidate WCAG refs, line, selector, reproduction, remediation), `untested`, `limitations`, `disclaimer`.

`manual.json` contains task steps, 10 reviewer checks and `not-run` statuses until attributed observations are supplied. Reviewer reports are **human-reported**, not independently verified by the software.

`browser.json` is optional. If a separately installed Playwright/axe adapter is executed, record browser version, bounded Tab samples and normalized axe findings; still not a full conformance test.

`assessment.json|md|html` merges the evidence while retaining untested states. Reports must never display a global accessibility pass score or certificate.

Hash chain in `audit.jsonl` detects accidental modification but does not provide a digital signature or immutable audit store.
