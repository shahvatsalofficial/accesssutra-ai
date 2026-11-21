# Rules and evidence model

18 rules. Full table with severity, candidate WCAG criteria and remediation: see `docs/RULES.md` in the repository.

## Rule families

| Family | Rules | Question |
|---|---|---|
| Document | AS-DOC-001, 002, 003 | Does the page have a title and a valid language? |
| Forms | AS-FORM-001, 002, 003 | Do fields have names, error association and valid label targets? |
| Names | AS-IMG-001, AS-BTN-001, AS-LINK-001, AS-FRAME-001 | Do images, buttons, links and frames expose a name? |
| References | AS-ID-001, AS-ARIA-001, AS-ARIA-002 | Are ids unique, ARIA references resolvable, focusable items not hidden? |
| Keyboard | AS-FOCUS-001, AS-KEY-001 | Positive tabindex? Click handlers on non-interactive elements? |
| Zoom and timing | AS-VIEW-001, AS-MEDIA-001, AS-REFRESH-001 | Zoom blocked? Autoplay? Timed refresh? |

## Evidence model

| Source | Strength | Statement allowed |
|---|---|---|
| Static scan | Limited | "Candidate found in source at line N" |
| Browser run (axe-core, Tab samples) | Moderate for what axe covers | "axe-core reported rule X on N nodes" |
| Human observation | Depends on reviewer and environment | "Reviewer R recorded status S in environment E" |
| Nothing | None | "Not tested" |

The tool never converts weaker evidence into a stronger statement. Empty findings produce "accessibility remains unverified".

## Where tools disagree

A placeholder-only input is flagged by AccessSutra (AS-FORM-001) but accepted as a name by axe-core. The two are intentionally different: placeholders disappear on input and are poorly supported as names. Decide with a human check.
