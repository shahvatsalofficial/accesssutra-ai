# Audit and evidence reports

AccessSutra produces two kinds of report. Both come as **JSON** (machines), **Markdown** (diffs, PRs) and **HTML** (people: light/dark, responsive, printable, no scripts, strict CSP meta).

## 1. Evidence report — `accesssutra report`

Input: a scan (and optionally a manual plan with reviewer observations and a browser run). Output: `assessment.json|md|html` with summary cards, one card per finding (rule, severity, location, candidate WCAG refs, confidence, reproduce steps, recommended action), manual-review table, browser status, a "not covered" list, limitations and a SHA-256 seal.

## 2. Assurance report — `accesssutra audit --out <dir>`

Automated self-assurance of the tool itself: 16 behavior checks (determinism, honesty wording, privacy, injection escaping, seal and ledger tamper detection, size limits, symlink refusal, manual-evidence rules, URL allowlist, server hardening, installer containment), gold-corpus accuracy (per-rule TP/FP/FN, precision, recall), and deterministic fuzzing. Verdict is `ASSURANCE_CHECKS_PASSED_HUMAN_REVIEW_STILL_REQUIRED` or `ASSURANCE_CHECKS_FAILED` (exit code 2). Skipped checks are shown as skipped, never as passed.

Verify a seal: `accesssutra verify --report assurance-report.json`. The seal is SHA-256 over canonical (sorted-key) JSON; it detects edits and is not a signature.

A recorded sample is in `docs/proof/assurance-sample/` and `examples/audit/`.

## What these reports are not

Not a third-party audit, WCAG conformance assessment, VPAT/ACR or legal opinion. See `LEGAL_AND_TRUST.md`.
