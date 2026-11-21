# Executive summary

AccessSutra AI is a local-first command-line tool and agent kit that helps teams **test accessibility tasks with evidence**, not just run a scanner. Version 0.2.1.

## The problem

Automated scanners find only a minority of accessibility barriers, and a green scan is routinely misread as "accessible". Teams need cheap, repeatable first-pass checks **and** a disciplined way to record the human testing that scanners cannot do (keyboard journeys, screen readers, zoom, contrast, cognitive clarity).

## What AccessSutra does

- Scans a local HTML file offline with 18 transparent rules and reports candidate issues with line, selector, candidate WCAG 2.2 references and the SHA-256 of the scanned source.
- Generates a 10-item **human** test plan per task. Only a named reviewer can change a check from not-run, and the tool never marks one passed on its own.
- Optionally observes a real browser through Playwright and axe-core (file and loopback URLs only).
- Produces sealed reports in **JSON, Markdown and HTML**, and a self-assurance **audit report** with the same three formats.
- Ships 21 agent roles and 26 portable skills for nine AI coding hosts.

## Why trust it (and how far)

| Evidence | Recorded result |
|---|---|
| Automated tests | 74 run, 73 passed, 0 failed, 1 skipped |
| Assurance checks | 20 of 21 passed, 0 failed, 1 skipped |
| Gold corpus | 56 hand-labelled cases, precision 100.0%, recall 100.0% (self-authored) |
| Fuzzing | 2213 hostile inputs, 0 unexpected exceptions |
| Runtime dependencies | 0 |

Recorded 2026-11-21T20:13:16.345Z on Node v24.15.0, win32/x64. All raw artifacts are linked from the documentation index.

## What it is not

Not a WCAG certification, VPAT, legal opinion, or replacement for testing with disabled users. No independent third-party audit has been performed. See [Legal and governance](10-legal-and-governance).

## Who it is for

Front-end developers (CI gate), QA (repeatable manual plans and evidence), designers and accessibility specialists (structured test scripts), and teams using AI coding assistants that should follow an evidence-first accessibility method.
