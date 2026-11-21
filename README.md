# AccessSutra AI

**Beyond the Scan. Test the Journey. Prove What Works.**

[![CI](https://github.com/shahvatsalofficial/accesssutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/accesssutra-ai/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/accesssutra-ai)](https://www.npmjs.com/package/accesssutra-ai)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933)
![Dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)

AccessSutra AI is a **local-first, evidence-based accessibility (a11y) task-testing CLI** for developers, QA and design teams. It runs an offline static HTML scan (18 transparent rules mapped to candidate WCAG 2.2 criteria), generates structured **human** test plans for keyboard, screen reader, zoom, contrast and cognitive review, optionally observes a real browser through Playwright + axe-core, and writes **sealed reports in JSON, Markdown and HTML**. It also ships 21 agent roles and 26 portable skills for Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo Code and Continue.

> **Honest scope.** A scanner result, an empty findings list, a keyboard Tab trace or an agent response is **not** an accessibility certification, a WCAG conformance statement, legal advice, or a substitute for testing essential tasks with people who use assistive technology. AccessSutra never marks a manual check "passed" by itself.

## Try it in 30 seconds (Node.js 22+, no API key, no network)

```bash
npx accesssutra-ai demo --out ./accesssutra-demo      # writes JSON + Markdown + HTML evidence report
npx accesssutra-ai scan --input page.html --out scan.json --fail-on serious
npx accesssutra-ai audit --out ./assurance            # self-assurance report: tests, accuracy, fuzzing (MD + HTML + JSON)
npx accesssutra-ai verify --report ./assurance/assurance-report.json
```

Open `accesssutra-demo/assessment.html`. Sample outputs are committed in [`examples/`](examples/) and [`docs/proof/`](docs/proof/).

## What you get

| Capability | Status | Evidence |
|---|---|---|
| Static HTML scan, 18 rules, line + selector + SHA-256 of the source | Implemented | [`docs/RULES.md`](docs/RULES.md), tests |
| Manual test plan (10 human checks), reviewer-attributed observations, credential-like text rejected | Implemented | tests |
| Reports: JSON, Markdown, accessible HTML (light/dark, print), SHA-256 seal | Implemented | [`examples/reports/demo`](examples/reports/demo) |
| `audit`: sealed assurance report (21 checks, 56-case gold corpus, fuzzing) in MD + HTML + JSON | Implemented | [`docs/proof/assurance-sample`](docs/proof/assurance-sample) |
| CI gate `scan --fail-on <severity>` (exit code 3) | Implemented | [`docs/proof/cli-scan-fail-on-serious.txt`](docs/proof/cli-scan-fail-on-serious.txt) |
| Optional Playwright + axe-core adapter (file/loopback only, no form submission) | Implemented, **run once for real** on both fixtures | [`docs/proof/browser-signup-broken.json`](docs/proof/browser-signup-broken.json) |
| Read-only authenticated loopback report API | Implemented, tested | [`docs/SECURE_SERVER.md`](docs/SECURE_SERVER.md) |
| Hash-chained local audit ledger | Implemented, tested | `accesssutra audit append|verify` |
| IDE instruction packs (9 hosts), `install-ide --dry-run` | Implemented; native activation per host **not verified** | [`docs/IDE_COMPATIBILITY.md`](docs/IDE_COMPATIBILITY.md) |

## Proof, not promises (recorded run, v0.2.0, Node 24, Windows 11)

| Measure | Result | Where |
|---|---|---|
| Automated tests | 74 run, 73 passed, 0 failed, 1 skipped (symlink test needs privilege on Windows) | [`docs/proof/test-run.tap`](docs/proof/test-run.tap) |
| Assurance checks | 21 total, 20 passed, 0 failed, 1 skipped | [`docs/proof/assurance-sample`](docs/proof/assurance-sample) |
| Gold corpus (56 hand-labelled HTML cases) | precision 100%, recall 100% — **self-authored labels, not an independent benchmark** | [`docs/proof/benchmark.json`](docs/proof/benchmark.json) |
| Fuzzing (2,213 hostile inputs, fixed seed) | 0 unexpected exceptions, slowest 776 ms | [`docs/proof/fuzz-results.json`](docs/proof/fuzz-results.json) |
| Real browser cross-check (Chromium 131 + axe-core 4.10) | axe flagged `button-name` and `image-alt` on the broken fixture and nothing on the good one; the static scanner flagged the same two plus a placeholder-only field that axe accepts | [`docs/proof/axe-crosscheck.json`](docs/proof/axe-crosscheck.json) |
| Runtime dependencies | 0 | `package.json` |

Every proof file is machine output with a SHA-256 list ([`SHA256SUMS.txt`](docs/proof/SHA256SUMS.txt)). A hash list detects edits; it is not a digital signature. See [`docs/LEGAL_AND_TRUST.md`](docs/LEGAL_AND_TRUST.md) for what these numbers do and do not mean.

## Commands

```text
version | doctor | rules
scan --input <local.html> --out <scan.json> [--fail-on minor|moderate|serious|critical]
manual --task <task.json> --out <manual.json> [--observations <reviewer.json>]
report --scan <scan.json> [--manual <manual.json>] [--browser <browser.json>] --out <dir>
browser --url <file-or-loopback-url> --out <browser.json> [--tabs 15] [--no-axe]
audit --out <dir> [--quiet] [--mutations 600]        verify --report <report.json>
audit append|verify --file <audit.jsonl>
install-ide --target <project> --host <claude|cursor|codex|gemini|copilot|windsurf|cline|roo|continue> [--force] [--dry-run]
serve --dir <report-dir> [--port 8787]               demo [--out <dir>]
```

Exit codes: `0` ok · `1` error or refusal · `2` assurance failed / seal invalid / ledger broken · `3` `--fail-on` gate tripped.

## The 18 rules (candidates, not verdicts)

`AS-DOC-001..003` title and language · `AS-FORM-001..003` field names, error association, label targets · `AS-IMG-001` alt · `AS-BTN-001`, `AS-LINK-001` names · `AS-FRAME-001` frame titles · `AS-ID-001`, `AS-ARIA-001`, `AS-ARIA-002` ids, ARIA references, focusable-in-hidden · `AS-FOCUS-001`, `AS-KEY-001` focus and keyboard review · `AS-VIEW-001` zoom-blocking viewport · `AS-MEDIA-001` autoplay · `AS-REFRESH-001` timed refresh. Details, WCAG candidates and remediation: [`docs/RULES.md`](docs/RULES.md).

## Limits you should know before relying on it

- The tokenizer is **not** a browser DOM. No CSS, JavaScript-rendered states, contrast, focus visibility, keyboard traps, screen reader output, zoom or cognitive testing is performed by the static scan.
- A placeholder is deliberately **not** treated as an accessible name (axe-core treats it as one); expect that disagreement.
- The gold corpus is small and written by the maintainer. High scores show internal consistency, not real-world accuracy.
- Seals and the audit ledger detect edits; they are not signatures or timestamps.
- Agent and skill files are instructions. Whether a given IDE loads them is **not** verified here.

## Documentation

Full set in [`documents/`](documents/) (Markdown + HTML site, built for GitHub Pages): executive summary, functional spec, architecture, technical reference, user guide, security, rules, test report, operations, legal, roadmap/FAQ, glossary, assurance. Also [`docs/`](docs/), [`llms.txt`](llms.txt) (for LLM crawlers), [`CITATION.cff`](CITATION.cff).

## Contributing, security, license

[CONTRIBUTING](CONTRIBUTING.md) · [SECURITY](SECURITY.md) · [CODE OF CONDUCT](CODE_OF_CONDUCT.md) · [GOVERNANCE](GOVERNANCE.md) · [SUPPORT](SUPPORT.md) · Apache-2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)). Created by **Vatsal Shah**. WCAG is a trademark/work of the W3C; axe-core is by Deque; Playwright by Microsoft; all other names belong to their owners. No affiliation or endorsement is implied.
