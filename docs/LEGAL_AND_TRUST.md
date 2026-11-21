# Legal and trust

**Not legal advice.** AccessSutra AI is a software tool. Nothing it prints, and nothing in this repository, is legal advice, a compliance opinion, an ADA/EN 301 549/Section 508/EAA determination, a VPAT/ACR, or a WCAG conformance claim. Whether a site meets a legal duty is decided by qualified people with the facts of the case.

## What the tool will and will not say

- It reports **candidates** with evidence (file, line, selector, source SHA-256) and tells the reader what was **not** tested.
- It never outputs a score, grade or badge implying conformance. An empty findings list is worded "accessibility remains unverified".
- Every output (scan, plan, report, Markdown, HTML, assurance report) carries the same disclaimer. Tests assert this.
- Manual checks are only ever set by a named human reviewer. The tool states that observations are reviewer-provided and not independently validated.

## How to read the proof

| Claim | What backs it | What it does not show |
|---|---|---|
| Tests pass | Raw TAP log in `docs/proof/test-run.tap` | Behavior on other OS, Node versions or inputs |
| Precision/recall 100% | 56 labelled cases in `packages/core/corpus.mjs` | Real-world accuracy. Labels are self-authored by the maintainer, so the result is a consistency check |
| Robust to hostile input | 2,213 deterministic fuzz inputs, 0 unexpected exceptions | Absence of all bugs |
| Agrees with axe-core on two fixtures | `docs/proof/browser-*.json` (Chromium 131) | General agreement with axe; the two tools intentionally differ on placeholder-only fields |
| Report not edited | SHA-256 seal, `accesssutra verify` | Authorship or time. Not a signature |

An independent human or third-party accessibility audit has **not** been performed. The `audit` command is automated self-assurance and says so in its output.

## Privacy

No telemetry, no network calls in the core, no API keys. Scan output excludes form values and placeholders. Reviewer notes are limited to 500 characters and credential-like text is rejected, but do not put personal data in them. The optional browser adapter blocks every origin except `file:` and loopback and never submits forms or takes screenshots.

## Licensing and third-party material

Apache-2.0 (see `LICENSE`, `NOTICE`). No third-party code is bundled; the core has zero runtime dependencies. Playwright and `@axe-core/playwright` are optional, installed by the user under their own licenses (Apache-2.0 / MPL-2.0 for axe-core: review before use). WCAG, W3C, Deque/axe, Microsoft/Playwright, NVDA, JAWS, VoiceOver, TalkBack, Claude, Cursor, Codex, Gemini, Copilot, Windsurf, Cline, Roo Code and Continue are names of their owners, used only to describe compatibility or mapping. WCAG criterion numbers are cited by number only; no W3C text is reproduced. No affiliation or endorsement is implied.

## Fixtures

Everything under `fixtures/` and `examples/` is synthetic. No real person, company, site or customer data.

## Reporting a problem

Security issues: GitHub private security advisory on the repository (see `SECURITY.md`). Wrong or misleading claims: open an issue; they are treated as bugs.
