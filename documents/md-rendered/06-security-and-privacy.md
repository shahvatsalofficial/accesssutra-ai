# Security and privacy

> Threats, controls and the checks that test each control, plus the residual risks.

## Principles

Local first, least privilege, no telemetry, evidence over claims.

{{svg:trust}}

## Controls and where they are tested

| Threat | Control | Check |
|---|---|---|
| Hostile or huge HTML | 2 MiB, 30,000 element and depth-128 limits; linear-time parsing | AS-A08, AS-F01, AS-F02 |
| Symlink or non-regular input | `lstat` refusal | AS-A09 |
| Secrets or personal data in output | Field values and placeholders never copied; observation notes limited and credential-like text rejected | AS-A04, AS-A10 |
| XSS or link injection through file names or content | HTML escaping, strict CSP meta, Markdown escaping | AS-A05 |
| Tampered reports or ledger | SHA-256 seal; hash chain | AS-A06, AS-A07 |
| SSRF or scanning third parties | Browser adapter allows only `file:` and loopback, blocks every other request, no credentials in URL | AS-A12 |
| Accidental form submission | Adapter only presses Tab; no clicks or typing | code review, docs |
| Local API abuse | Loopback peers only, Host check, bearer token (24+ chars, constant-time compare), GET only, no CORS, rate limit, fixed file names | AS-A13, AS-A14 |
| Overwriting user files | Installer refuses the source repo, symlinks and existing destinations without `--force` | AS-A15 |
| Misleading claims | Same disclaimer in every output; no scores | AS-A02, AS-A03, AS-A11 |
| Supply chain | Zero runtime dependencies; npm provenance via trusted publishing; SHA-pinned release process | CI |

## Residual risks

- The tokenizer is heuristic; a crafted page can hide or fake findings.
- Seals and the ledger are not signatures; anyone able to rewrite both can forge them.
- Optional Playwright and axe-core code is third-party and not audited here.
- Reviewer notes can still contain personal data in forms the pattern check cannot recognise.
- Do not expose the API beyond loopback or behind a proxy that forwards remote clients.

## Reporting vulnerabilities

Use a private GitHub security advisory on the repository. Do not post exploits or tokens publicly.
