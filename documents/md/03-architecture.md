# Architecture

> How the CLI, tokenizer, rules, reports, assurance engine and optional adapters fit together, and why each design decision was made.

## Layers

```text
CLI (packages/cli/accesssutra.mjs)
 ├─ core/html.mjs        limited tokenizer -> nodes with line, nth-of-type, hidden state
 ├─ core/checks.mjs      RULES + scanHtml -> findings (stable ids)
 ├─ core/manual.mjs      10-check plan, observation validation
 ├─ core/report.mjs      compose, canonical JSON seal, Markdown, HTML
 ├─ core/assure.mjs      gold corpus, fuzzing, 16 behavior checks, assurance renderers
 ├─ core/audit.mjs       hash-chained JSONL ledger
 ├─ core/installer.mjs   project-local instruction copier
 ├─ browser/runner.mjs   optional Playwright + axe-core adapter (URL allowlist)
 └─ server/server.mjs    loopback read-only report API
```

{{svg:arch}}

## Data flow

{{svg:pipeline}}

1. `scan`: file (regular, non-symlink, 2 MiB max) -> tokenizer -> rules -> `scan.json` (no field values).
2. `manual`: task JSON -> plan with 10 not-run checks -> optional human observations -> `manual.json`.
3. `report`: scan + optional manual + optional browser JSON -> `assessment.json|md|html`, each carrying the disclaimer and a SHA-256 seal.
4. `audit`: runs checks against fixtures and temporary directories, benchmarks the corpus, fuzzes, then writes the assurance report with its own seal.

{{svg:seal}}

## Key decisions

| Decision | Reason |
|---|---|
| Zero runtime dependencies | Smaller supply-chain surface; runs anywhere Node 22 runs |
| Own tokenizer instead of a DOM library | Keeps the core offline and dependency-free; trade-off documented as "not a browser DOM" |
| Findings are candidates | A static view cannot prove a barrier exists or is absent |
| Seal over canonical (sorted-key) JSON | Stable under property order; detects edits |
| Browser adapter optional and allowlisted | Keeps the default tool offline; prevents scanning third parties |
| Human checks never auto-pass | Prevents manufactured assurance |

## Parser guarantees

Max 2 MiB, 30,000 elements, depth 128. Attributes use a state machine (quotes only open at a value). `script` and `style` content is skipped; `title` and `textarea` content is kept as text. Optional end tags for `li`, `p`, `option`, `tr`, `td`, `th`, `dt`, `dd` close implicitly. Parsing and lookups are linear-time (verified on 2 MiB inputs).

## Agent kit

`agents/` and `.claude/agents/` hold 21 role files; `skills/` holds 26 `SKILL.md`; `adapters/ide/` holds nine host packs. They are instructions only. The tool does not run agents.
