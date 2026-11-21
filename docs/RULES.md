# Rules (v2.0.0)

Generated from packages/core/checks.mjs. Each rule yields a **candidate** finding needing browser or human confirmation. WCAG numbers are candidate references by number only, not conformance statements. Kind is detected (static evidence) or review (needs a human).

| Rule | Severity | Candidate WCAG | Title | Remediation |
|---|---|---|---|---|
| `AS-DOC-001` | moderate | 2.4.2 | Page title is missing | Add a concise, descriptive <title> in <head>. |
| `AS-DOC-002` | moderate | 3.1.1 | Document language is missing | Set an appropriate nonempty lang attribute on <html>. |
| `AS-DOC-003` | moderate | 3.1.1 | Document language code looks malformed | Use a valid BCP 47 language tag such as "en" or "pt-BR". |
| `AS-FORM-001` | serious | 3.3.2, 4.1.2 | Form control lacks a detectable accessible name | Use an associated visible <label>, or an appropriate accessible name where necessary. |
| `AS-FORM-002` | moderate | 3.3.1, 3.3.3 | Invalid form control lacks a detectable error association | Associate clear error text using aria-describedby or aria-errormessage and verify the message is announced. |
| `AS-FORM-003` | moderate | 1.3.1, 3.3.2 | Label "for" does not point to an existing element | Point label for= at the id of the control it describes, or wrap the control in the label. |
| `AS-IMG-001` | serious | 1.1.1 | Image is missing alt attribute | Provide an appropriate alt text, or alt="" for genuinely decorative imagery. |
| `AS-BTN-001` | serious | 4.1.2 | Button lacks a detectable accessible name | Add visible button text or an appropriate accessible name. |
| `AS-LINK-001` | serious | 2.4.4, 4.1.2 | Link lacks a detectable accessible name | Give the link descriptive text or an appropriate accessible name. |
| `AS-FRAME-001` | moderate | 2.4.1, 4.1.2 | Frame lacks a title | Give each iframe a short, descriptive title attribute. |
| `AS-ID-001` | moderate | - | Duplicate id may break references | Give each element a unique id and retest labels and ARIA relationships. |
| `AS-ARIA-001` | moderate | 4.1.2 | ARIA reference does not resolve to an element | Point ARIA ID references to existing elements and verify accessible name/description. |
| `AS-ARIA-002` | serious | 4.1.2, 2.4.3 | Focusable element is inside aria-hidden or hidden content | Remove focusable controls from hidden subtrees, or stop hiding them; verify with a keyboard. |
| `AS-FOCUS-001` | moderate | 2.4.3 | Positive tabindex may disrupt focus order | Prefer DOM order and tabindex="0" where needed; verify real keyboard navigation. |
| `AS-KEY-001` | moderate | 2.1.1 | Clickable nonsemantic element needs keyboard review | Use a native button or link; manually verify keyboard activation and focus. |
| `AS-VIEW-001` | serious | 1.4.4 | Viewport meta may block zoom | Remove user-scalable=no and any maximum-scale below 2; verify text resize and pinch zoom. |
| `AS-MEDIA-001` | moderate | 1.4.2, 2.2.2 | Autoplaying media without controls needs review | Avoid autoplay, or provide visible controls to pause, stop or mute; verify with people. |
| `AS-REFRESH-001` | moderate | 2.2.1, 3.2.5 | Meta refresh may remove user control of timing | Remove timed refresh/redirect or give users a way to turn off, adjust or extend it. |

Design notes: a placeholder is not an accessible name (axe-core accepts it; this tool does not). Elements inside hidden or aria-hidden subtrees are skipped by naming rules and checked by AS-ARIA-002 when focusable. Name detection checks presence, not quality.
