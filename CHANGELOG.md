# Changelog

## 0.2.1 — 2026-11-22

- Release via npm trusted publishing (OIDC, provenance). No scanner behavior change.
- CI real-browser job now uses current Playwright 1.65.1 and @axe-core/playwright 4.14.0 (recorded proof in docs/proof was made with 1.49.1 and says so).
- Regenerated proof, examples and documents for 0.2.1.

## 0.2.0 — 2026-11-22

Added
- `audit` command: sealed assurance report in JSON, Markdown and HTML (21 checks, 56-case gold corpus with precision/recall, deterministic fuzzing); `verify` command for report seals.
- Evidence reports redesigned (summary cards, per-finding cards, light/dark, print, CSP meta) and sealed with SHA-256.
- 7 new rules (18 total): AS-DOC-003, AS-FORM-003, AS-FRAME-001, AS-ARIA-002, AS-VIEW-001, AS-MEDIA-001, AS-REFRESH-001.
- `scan --fail-on <severity>` CI gate (exit 3), `version`, `rules`, `install-ide --dry-run`, `demo --out`, API endpoints `/reports/markdown` and `/reports/html`.
- Real Playwright + axe-core run recorded in docs/proof; optional browser tests; proof script; documents/ site; llms.txt, CITATION.cff, NOTICE.
- Published to npm as `accesssutra-ai`.

Fixed
- Installer containment check failed on Windows paths; tests assumed POSIX paths.
- `select`/`textarea` counted as named by their own text; `<button><img alt>` false positive; hidden content now excluded from naming rules.
- Unclosed `li`/`p`/`option` etc. no longer hit the nesting limit; unclosed `script` no longer parsed as markup; stray quote no longer swallows the page.
- O(n^2) parse and lookup paths on large inputs; fuzzing found and fixed a multi-minute hang on 2 MiB of `<`.
- CLI did nothing when started through an npm bin symlink.
- Duplicate finding ids; Markdown link injection through file names; missing `Host` header check on the API.

## 0.1.0 — 2026-11-22

- Initial offline starter.
