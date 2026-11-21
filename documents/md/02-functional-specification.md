# Functional specification

## Capabilities

| ID | Capability | Behavior | Command |
|---|---|---|---|
| F1 | Static scan | Parse one local HTML file (max 2 MiB), apply {{RULES}} rules, emit findings with id, rule, severity, kind, candidate WCAG refs, line, selector, reproduce and remediation text | `scan` |
| F2 | CI gate | Exit 3 when a finding at or above a severity exists | `scan --fail-on` |
| F3 | Manual plan | 10 human checks (keyboard, trap, focus visibility, activation, labels, errors, screen reader, zoom/reflow, contrast, cognitive), all not-run | `manual` |
| F4 | Observations | Reviewer, environment and note required for any tested status; credential-like text rejected; max 500 chars | `manual --observations` |
| F5 | Evidence report | JSON, Markdown, HTML with summary, findings, manual table, browser status, not-covered list, limitations, seal | `report` |
| F6 | Browser observation | Chromium via Playwright: Tab sampling and axe-core violations on file or loopback URLs | `browser` |
| F7 | Assurance audit | {{CHECKS}} checks, gold-corpus accuracy, fuzzing; sealed JSON, Markdown, HTML | `audit` |
| F8 | Seal verification | Recompute SHA-256 over canonical JSON | `verify` |
| F9 | Ledger | Append and verify a hash-chained JSONL log | `audit append`, `audit verify` |
| F10 | Report API | Read-only, loopback, bearer token | `serve` |
| F11 | IDE install | Copy instructions into `<target>/accesssutra`; dry-run supported | `install-ide` |
| F12 | Demo | Scan the bundled broken signup fixture and write a full report | `demo` |

## Finding semantics

- **detected**: static evidence in the source (for example an image with no alt attribute).
- **review**: a pattern that needs a human (for example a clickable div).
- Severity is a rule-level heuristic. The report says so. Real impact depends on the task and the person.

## Non-functional requirements

Offline by default; deterministic output for the same input; no telemetry; Node.js 22 or newer on Windows, macOS and Linux; zero runtime dependencies; hostile input must never crash the scanner beyond documented limit errors.

## Out of scope

Certification, legal conclusions, scanning external sites, submitting forms, screen reader automation, scoring pages.
