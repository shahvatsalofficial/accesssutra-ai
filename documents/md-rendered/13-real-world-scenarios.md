# Real-world scenarios

> Seven situations teams actually face, each as a step-by-step flowchart with the real commands and the real output. Every output shown was produced by the tool.

## How to read these

Green steps are good outcomes, amber steps need attention, red steps are where a problem appears. Findings are **candidates** that need confirmation. A clean scan is never the end of the story.

## Scenario 1: Two days before launch

A team has a sign-up form ready. Design signed off, tests green, nobody has tried it without a mouse.


The scan on the bundled broken sign-up page (a synthetic fixture):

```text
$ accesssutra scan --input fixtures/signup-broken.html --out scan.json
Limited scan: 5 findings (2 human-review); no conformance claim
```


| Finding | Rule | Severity | Kind | Line |
|---|---|---|---|---|
| Email field has only a placeholder | `AS-FORM-001` | serious | detected | 4 |
| Icon-only button has no name | `AS-BTN-001` | serious | detected | 5 |
| Logo image has no alt attribute | `AS-IMG-001` | serious | detected | 6 |
| Invalid field has no error association | `AS-FORM-002` | moderate | review | 4 |
| Clickable div needs keyboard review | `AS-KEY-001` | moderate | review | 6 |

> **Tip** The point of this scenario is the last two steps. The scan is quick and cheap. The keyboard trap in the date picker is found only because a person tried to leave it.

## Scenario 2: The icon button that slipped through

A refactor turns a text button into an icon.



```text
$ accesssutra scan --input fixtures/signup-broken.html --out scan.json --fail-on serious
Limited scan: 5 findings (2 human-review); no conformance claim
Gate failed: finding(s) at serious or above
[exit 3]
```

```yaml
# .github/workflows/a11y.yml (excerpt)
- run: npx accesssutra-ai scan --input dist/index.html --out scan.json --fail-on serious
```

## Scenario 3: Placeholder is not a label

A search box shows "Search" inside the field. It looks fine, and axe-core accepts a placeholder as a name.


Recorded on the bundled broken page with Chromium 131 and axe-core 4.10:

| Tool | Result on the placeholder-only email field |
|---|---|
| axe-core | no violation |
| AccessSutra | `AS-FORM-001` serious |

> **Note** Neither tool is wrong. They apply different policies. When tools disagree, the tie-breaker is a person using the page.

## Scenario 4: The tidy phone layout that blocks zoom


```html
<meta name="viewport" content="width=device-width, user-scalable=no">
```

Rule `AS-VIEW-001` fires on `user-scalable=no`, `user-scalable=0`, and any `maximum-scale` below 2. Candidate WCAG reference: 1.4.4.

## Scenario 5: Are you WCAG compliant?

A customer asks in a security questionnaire.


```text
$ accesssutra audit --out ./evidence
ASSURANCE_CHECKS_PASSED_HUMAN_REVIEW_STILL_REQUIRED: 20/21 passed, 0 failed, 1 skipped
$ accesssutra verify --report ./evidence/assurance-report.json
{"valid":true,"sha256":"...","note":"Seal detects edits; it is not a digital signature."}
```

> **Important** The assurance report is about the tool, not about your site. Send it with the evidence report for your pages, and be clear that no third-party audit has been done.

## Scenario 6: An AI assistant helps, with guardrails


```text
$ accesssutra install-ide --target ../shop --host claude --dry-run
{ "host": "claude", "dryRun": true, "wouldCopy": ["skills", "agents", "rules", "workflows", "schemas", ...] }
```

Dry-run writes nothing. Review the files, then install without `--dry-run`.

## Scenario 7: Someone edits the report


```text
$ accesssutra verify --report assessment.json
{"valid":false,"reason":"Content does not match sealed digest"}
[exit 2]
```

## Which scenario is yours?

| You are... | Start with |
|---|---|
| About to launch | Scenario 1, then the [user guide](05-user-guide.md) |
| Adding a CI check | Scenario 2 and the exit codes in the [technical reference](04-technical-reference.md) |
| Debating tools | Scenario 3 and the [evidence model](07-rules-and-evidence.md) |
| Answering a customer | Scenario 5 and [legal and governance](10-legal-and-governance.md) |
