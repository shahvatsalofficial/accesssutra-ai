# Legal and governance

## Not legal advice

AccessSutra AI is software. Its output is not legal advice, a compliance determination, a VPAT or Accessibility Conformance Report, or a WCAG conformance claim under any law or standard (for example ADA, Section 508, EN 301 549, European Accessibility Act). Obligations depend on jurisdiction and facts; consult qualified counsel and accessibility specialists.

## Claims the project will not make

- That a page, product or organisation is accessible or conformant.
- That an empty findings list means no barriers.
- That agent definitions run natively in any IDE.
- That the self-authored benchmark measures real-world accuracy.
- That a third party audited the tool. None has.

## License and notices

Apache-2.0. Copyright 2026 Vatsal Shah. No third-party code is bundled. Optional Playwright (Apache-2.0) and @axe-core/playwright (MPL-2.0) are installed by the user under their own licenses. WCAG and other names belong to their owners; criteria are cited by number only and no standard text is reproduced. No affiliation or endorsement is implied.

## Privacy

No telemetry or network calls in the core. Output excludes form values and placeholders. See the security chapter.

## Governance

Maintainer: Vatsal Shah. An agent may propose but never approve its own assurance claim. Changes to rules, methodology, privacy or server boundaries need a changelog entry and review. Misleading claims are treated as bugs.

## Contributing

Use synthetic fixtures only. Each rule change needs a regression test and a gold-corpus case. Run `npm test` and `npm run proof` before a pull request.
