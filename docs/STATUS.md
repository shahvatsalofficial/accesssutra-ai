# Implementation status — v0.2.0 (2026-11-22)

## Verified by automated tests and recorded proof (`docs/proof/`)

- Offline CLI: 18-rule static HTML scan, manual plan and observation validation, JSON/Markdown/HTML evidence reports with SHA-256 seal, `audit` assurance report, `verify`, `--fail-on` gate, hash-chained ledger, loopback read-only API, project-local IDE copier with `--dry-run`.
- 74 tests: 73 passed, 1 skipped (symlink creation needs privilege on Windows), 0 failed. 56-case gold corpus 100%/100% (self-authored). 2,213 fuzz inputs, 0 unexpected exceptions.
- Real Chromium 131 + axe-core 4.10 run through the optional adapter on both fixtures (recorded once).
- 21 agent definitions, 26 SKILL.md, 8 workflows, 10 governance rules, 9 IDE instruction packs (files exist and are copied; see below for what is not verified).

## v0.2.0 fixes over v0.1.0

Windows path bug in the installer containment check; `select`/`textarea` wrongly counted as named by their own text; `<button><img alt>` false positive; unclosed `<li>`/`<p>` hit the nesting limit; unclosed `<script>` was parsed as markup; quadratic parse time on 2 MiB of `<`; O(n^2) selector/label lookup; CLI silently did nothing when launched through an npm bin symlink; duplicate finding ids; Markdown link injection through file names; no `Host` header check on the API; tests assumed POSIX paths.

## Not verified

- Native loading of agents/skills in Claude Code, Cursor, Codex, Gemini CLI, Copilot, Windsurf, Cline, Roo Code, Continue.
- The browser adapter in CI on every OS (CI runs it on Linux only, when dependencies are installed).
- Any real assistive-technology session, keyboard-trap confirmation, live contrast, cognitive research.

## Not implemented

Full task runner, dashboard, multi-user server, signed attestations, MCP server, batch directory scan. No independent third-party audit has been done.

**No score or empty findings list establishes accessibility.**
