# Technical reference

> Commands, exit codes, file formats, the report API and the seal algorithm.

## Commands and exit codes

```text
accesssutra version | doctor | rules
accesssutra scan --input <file.html> --out <scan.json> [--fail-on minor|moderate|serious|critical]
accesssutra manual --task <task.json> --out <manual.json> [--observations <obs.json>]
accesssutra report --scan <scan.json> [--manual <m.json>] [--browser <b.json>] --out <dir>
accesssutra browser --url <file-or-loopback-url> --out <b.json> [--tabs 15] [--no-axe]
accesssutra audit --out <dir> [--quiet] [--mutations 600]
accesssutra verify --report <json>
accesssutra audit append --file <f.jsonl> --type <t> | audit verify --file <f.jsonl>
accesssutra install-ide --target <dir> --host <host> [--force] [--dry-run]
accesssutra serve --dir <reports> [--port 8787]
accesssutra demo [--out <dir>]
```

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Error or refusal (bad input, unsafe target, external URL) |
| 2 | Assurance failed, seal invalid, or ledger broken |
| 3 | `--fail-on` gate tripped |

## Task file

```json
{ "name": "Create account", "steps": ["Open sign-up", "Fill the form", "Submit on a test instance"], "environment": "Firefox 130 / NVDA 2025.1 / Windows 11" }
```

1 to 30 steps, each at most 300 characters.

## Observation file

```json
[ { "id": "keyboard-trap", "status": "failed", "reviewer": "A. Tester", "environment": "Chrome 131 / macOS", "observation": "Focus cannot leave the date picker." } ]
```

Statuses: `passed`, `failed`, `blocked`, `not-run`, `inconclusive`. Check ids: `keyboard-navigation`, `keyboard-trap`, `focus-visibility`, `keyboard-activation`, `form-labels`, `form-errors`, `screen-reader`, `zoom-reflow`, `contrast`, `cognitive`.

## Report anatomy

{{svg:anatomy}}

## Finding shape (abridged)

```json
{ "id": "AS-<16 hex>", "ruleId": "AS-IMG-001", "severity": "serious", "kind": "detected",
  "wcagCandidateRefs": ["1.1.1"], "source": { "file": "page.html", "line": 7, "selector": "html:nth-of-type(1) > body:nth-of-type(1) > img:nth-of-type(1)" },
  "confidence": "limited-static-evidence", "remediation": "..." }
```

The id is a hash of file name, rule and selector, so it is stable across runs.

## Report API

Start: set `ACCESS_SUTRA_TOKEN` (24+ characters), run `serve`. Endpoints: `GET /health`, `GET /reports` (JSON), `GET /reports/markdown`, `GET /reports/html`. Requires `Authorization: Bearer <token>`; rejects non-loopback peers, unexpected `Host` headers, non-GET methods; 100 requests per minute per address; no CORS.

## Programmatic use

`import { scanHtml } from 'accesssutra-ai/packages/core/checks.mjs'` (ES modules). The package does not define a stable public API yet; the CLI is the supported interface.

## Seal

`sha256( canonicalJSON(report without seal) )` where canonical JSON sorts object keys recursively. Stored in `seal.sha256`.
