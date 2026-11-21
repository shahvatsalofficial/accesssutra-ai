# Threat Model

Assets: authorized page content, test account boundaries, user observation notes, source evidence, report integrity, server token and optional IDE permissions.

Trust boundaries: local HTML input → tokenizer; browser test target → Playwright process; reviewer notes → reports; reports → localhost API; external IDE/MCP plugin → project files; future server → multi-tenant data.

Controls implemented: 2 MiB local HTML limit; symlink refusal; no input values in scanner output; HTML escaping; browser origin allowlist and off-scope request blocking; no browser form submission; localhost GET-only token API with no CORS; audit chain tamper detection.

Residual risks: heuristic parser false negatives; HTML with embedded prompt injection seen by LLM agent; local browser JS side effects despite no clicks; file: resource access; reviewer-entered PII; audit ledger whole-file rewrite; dependency supply chain; no authenticated browser runtime test yet; no multi-user isolation. Require human review and explicit permission.
