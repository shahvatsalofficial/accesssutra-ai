# Test matrix and capability evidence

| Area | Tested in Node.js 22/Linux | Not verified |
| --- | --- | --- |
| Static HTML hints | Synthetic broken/good fixtures, labels, alt, IDs, ARIA, form error reference | Full DOM/HTML5/JS rendered behavior |
| Human test plan | Ten-item template, attribution validation, blocked observation recording | Real AT or user session |
| Reports | JSON/Markdown/HTML, escaping, no conformance claims | Real-world external content corpus |
| Audit | Append/verify/tamper detection | Cryptographic signatures and immutable storage |
| Server | Auth, GET-only, no CORS, rate limit | Internet-facing/multi-user production |
| Browser adapter | URL allowlist unit tests | Actual Playwright/axe runtime, Chromium, keyboard trap |
| IDE | Local copier unit test and nine templates | Native host activation and all host versions |
| OS | Linux | Windows/macOS CI matrix not executed |

A passing test means only that the named behavior was exercised under the recorded environment.
