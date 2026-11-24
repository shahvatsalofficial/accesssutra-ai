# AccessSutra AI — Scoped Accessibility Evidence

Source: signup-broken.html · SHA-256: `c015642297fabb98e69db5f895f4ef2b14251f673d991bb8d83b9fb288ee16f8` · Tool 0.2.1

Limited findings: **5** (3 detected, 2 requiring review). Serious: 3, moderate: 2, minor: 0, critical: 0.

**Not a certification:** AccessSutra reports limited checks and human testing tasks; they do not establish WCAG conformance, certification, legal compliance, or usability for every person.

## Findings

### AS-e64c04a03ff33335 — Form control lacks a detectable accessible name
- Rule: AS-FORM-001; kind: detected; severity: serious; candidate WCAG references: 3.3.2, 4.1.2
- Source: signup-broken.html:4 — `html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > input:nth-of-type(2)`
- Reproduce: Inspect signup-broken.html line 4, html:nth-of-type\(1\) &gt; body:nth-of-type\(1\) &gt; main:nth-of-type\(1\) &gt; form:nth-of-type\(1\) &gt; input:nth-of-type\(2\); confirm in a rendered browser and with affected users.
- Recommendation: Use an associated visible &lt;label&gt;, or an appropriate accessible name where necessary.

### AS-b156d446278dc6ea — Button lacks a detectable accessible name
- Rule: AS-BTN-001; kind: detected; severity: serious; candidate WCAG references: 4.1.2
- Source: signup-broken.html:5 — `html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > button:nth-of-type(1)`
- Reproduce: Inspect signup-broken.html line 5, html:nth-of-type\(1\) &gt; body:nth-of-type\(1\) &gt; main:nth-of-type\(1\) &gt; form:nth-of-type\(1\) &gt; button:nth-of-type\(1\); confirm in a rendered browser and with affected users.
- Recommendation: Add visible button text or an appropriate accessible name.

### AS-f314b8a7f4d16d95 — Image is missing alt attribute
- Rule: AS-IMG-001; kind: detected; severity: serious; candidate WCAG references: 1.1.1
- Source: signup-broken.html:6 — `html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > img:nth-of-type(1)`
- Reproduce: Inspect signup-broken.html line 6, html:nth-of-type\(1\) &gt; body:nth-of-type\(1\) &gt; main:nth-of-type\(1\) &gt; form:nth-of-type\(1\) &gt; img:nth-of-type\(1\); confirm in a rendered browser and with affected users.
- Recommendation: Provide an appropriate alt text, or alt="" for genuinely decorative imagery.

### AS-1d61cb74598eca62 — Invalid form control lacks a detectable error association
- Rule: AS-FORM-002; kind: review; severity: moderate; candidate WCAG references: 3.3.1, 3.3.3
- Source: signup-broken.html:4 — `html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > input:nth-of-type(2)`
- Reproduce: Inspect signup-broken.html line 4, html:nth-of-type\(1\) &gt; body:nth-of-type\(1\) &gt; main:nth-of-type\(1\) &gt; form:nth-of-type\(1\) &gt; input:nth-of-type\(2\); confirm in a rendered browser and with affected users.
- Recommendation: Associate clear error text using aria-describedby or aria-errormessage and verify the message is announced.

### AS-acbabe3ef7821995 — Clickable nonsemantic element needs keyboard review
- Rule: AS-KEY-001; kind: review; severity: moderate; candidate WCAG references: 2.1.1
- Source: signup-broken.html:6 — `html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > div:nth-of-type(1)`
- Reproduce: Inspect signup-broken.html line 6, html:nth-of-type\(1\) &gt; body:nth-of-type\(1\) &gt; main:nth-of-type\(1\) &gt; form:nth-of-type\(1\) &gt; div:nth-of-type\(1\); confirm in a rendered browser and with affected users.
- Recommendation: Use a native button or link; manually verify keyboard activation and focus.

## Manual review
Status: not-tested

- Keyboard-only journey: **not-run**
- No keyboard trap: **not-run**
- Focus visibility: **not-run**
- Control activation: **not-run**
- Field names and instructions: **not-run**
- Error identification and recovery: **not-run**
- Screen reader journey: **not-run**
- Zoom and reflow: **not-run**
- Visual contrast: **not-run**
- Comprehension and completion: **not-run**

## Browser checks
Status: not-run

## Checks not covered
- JavaScript-rendered states
- Actual keyboard focus and traps
- Visible focus and focus obscuration
- Screen reader output
- Contrast and zoom/reflow
- Cognitive and language usability
- Mobile/TV remote interactions
- Real error handling after submission

## Limitations
- Heuristic tokenizer, not full HTML5 DOM parsing or axe-core
- A reported finding is a candidate requiring browser/human verification
- No pass score or WCAG conformance claim

## Integrity
Seal (SHA-256 of canonical JSON): `d38b79d3515f66aae730b721de76e915775a4ff0a0fd3586aa0f9a8f3e17c5f4`. Detects edits; not a digital signature.
