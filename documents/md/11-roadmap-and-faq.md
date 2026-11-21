# Roadmap and FAQ

## Roadmap (not promises)

| Next | Why |
|---|---|
| Independent labelled corpus and third-party review | Replace self-authored accuracy with outside evidence |
| Directory and sitemap batch scan | Real projects have many pages |
| Consented task runner on top of the browser adapter | Reproducible keyboard journeys |
| MCP server (read-only, root allowlist) | Let agents call the scanner safely |
| Signed attestations | Move from edit detection to authenticity |
| Accessible dashboard | Review findings and observations together |

## FAQ

**Does it make my site WCAG compliant?** No. It finds some candidates and organises human testing.

**Why does it flag placeholder-only inputs when axe-core does not?** Placeholders vanish on input and are weakly supported as names. It is a deliberate rule; confirm with a human check.

**Is it safe to run on a production site?** It never scans remote sites. The browser adapter only opens `file:` and loopback URLs and never submits forms.

**Does it send my HTML anywhere?** No. There is no network code in the core.

**Why is the benchmark 100%?** Because the corpus is small and written to the tool's own specification. It is a regression guard, not an accuracy claim.

**Can an AI agent mark a manual check as passed?** No. The software requires a named reviewer, environment and note, and states the observation is not independently validated.

**How do I cite it?** See `CITATION.cff`.
