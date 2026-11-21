# AccessSutra AI — Assurance Report

**Verdict:** `ASSURANCE_CHECKS_PASSED_HUMAN_REVIEW_STILL_REQUIRED`

> Automated self-assurance run by the tool on its own code. It is NOT a third-party audit, WCAG conformance assessment, or legal opinion.

Tool 0.2.1 · rules 2.0.0 · 2026-11-21T20:13:28.664Z · Node v24.15.0 · win32/x64

## Summary

- Checks: **21** — 20 passed, 0 failed, 1 skipped
- Gold corpus: 56 cases, exact match 56/56, precision 100.0%, recall 100.0% (self-authored by the maintainer; not an independent benchmark)
- Fuzzing: 813 hostile inputs (seed 20261122), 0 unexpected exceptions, slowest 394 ms

## Checks

| ID | Area | Check | Result | Evidence |
|---|---|---|---|---|
| AS-A01 | determinism | Same input yields byte-identical scan JSON | **pass** | 4993 bytes compared |
| AS-A02 | honesty | Clean fixture reports no findings yet still lists untested areas | **pass** | findings=0, untested=8 |
| AS-A03 | honesty | Disclaimer present in scan, manual plan, report, Markdown and HTML | **pass** | all five outputs |
| AS-A04 | privacy | Form field values are never copied into output | **pass** | value and placeholder absent |
| AS-A05 | injection | HTML report escapes hostile file name and Markdown report neutralises links | **pass** | payload inert in both formats |
| AS-A06 | integrity | Report seal verifies and detects a one-character edit | **pass** | seal valid; tampered copy rejected |
| AS-A07 | integrity | Audit ledger detects edits, reordering and truncation of the middle | **pass** | valid chain accepted; edit, swap, gap rejected |
| AS-A08 | limits | Oversize and over-nested HTML refused with a clear error | **pass** | 2/2 refused |
| AS-A09 | filesystem | Symlink input refused | **skipped** | host cannot create symlinks without privilege |
| AS-A10 | manual-evidence | Observations need reviewer, environment and note; credentials are rejected; duplicates and unknown ids refused | **pass** | 5/5 rejected |
| AS-A11 | manual-evidence | A fresh manual plan is "not-tested"; software never marks a check passed by itself | **pass** | 10 checks all not-run |
| AS-A12 | scope | Browser adapter URL allowlist blocks external, credentialed and non-http schemes | **pass** | 9 blocked, 3 allowed |
| AS-A13 | server | Report server: auth, read-only, no CORS, bad Host rejected, rate limit, path confined | **pass** | statuses 401/401/200/405/404, host=403, rateLimited=true |
| AS-A14 | server | Server refuses to start with a short token | **pass** | refused |
| AS-A15 | installer | IDE copier refuses the source repo, unknown hosts, path-like hosts, overwrite without --force; dry-run writes nothing | **pass** | 3 refusals, dry-run wrote nothing, overwrite refused |
| AS-A16 | rules | Every rule has WCAG refs array, severity, title and remediation | **pass** | 18 rules, version 2.0.0 |
| AS-B01 | accuracy | Gold corpus: no false positives on clean pages | **pass** | fp=0 of 56 cases |
| AS-B02 | accuracy | Gold corpus: every labelled defect found | **pass** | fn=0 |
| AS-B03 | accuracy | Gold corpus: exact-match rate 100% | **pass** | 56/56 |
| AS-F01 | robustness | Fuzzing: no unexpected exception or invalid output | **pass** | 813 inputs, 811 scanned, 2 documented-limit refusals, 0 unexpected |
| AS-F02 | robustness | Fuzzing: slowest input under 5 s | **pass** | max 394 ms |

## Per-rule accuracy on the gold corpus

| Rule | TP | FP | FN | Precision | Recall |
|---|---|---|---|---|---|
| AS-DOC-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-DOC-002 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-DOC-003 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-FORM-001 | 6 | 0 | 0 | 100.0% | 100.0% |
| AS-FORM-002 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-FORM-003 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-IMG-001 | 3 | 0 | 0 | 100.0% | 100.0% |
| AS-BTN-001 | 5 | 0 | 0 | 100.0% | 100.0% |
| AS-LINK-001 | 2 | 0 | 0 | 100.0% | 100.0% |
| AS-FRAME-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-ID-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-ARIA-001 | 2 | 0 | 0 | 100.0% | 100.0% |
| AS-ARIA-002 | 2 | 0 | 0 | 100.0% | 100.0% |
| AS-FOCUS-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-KEY-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-VIEW-001 | 2 | 0 | 0 | 100.0% | 100.0% |
| AS-MEDIA-001 | 1 | 0 | 0 | 100.0% | 100.0% |
| AS-REFRESH-001 | 1 | 0 | 0 | 100.0% | 100.0% |

## Limitations

- Self-authored gold corpus: results show consistency with the maintainer's labels, not real-world accuracy.
- Static heuristics only: no rendering, CSS, JavaScript, focus, contrast, zoom, screen reader or task testing.
- Optional Playwright/axe adapter is exercised only for its URL guard here; browser execution is reported separately when run.
- The seal detects edits; it is not a digital signature or timestamp proof.
- A passing run does not mean any page is accessible.

## Integrity

Seal SHA-256 (canonical JSON): `58462e848a193c88f5613512dd227d2106e1ec29e1d6129a90ec63d2b0151882`. Verify with `accesssutra verify --report assurance-report.json`. Detects edits; not a digital signature.
