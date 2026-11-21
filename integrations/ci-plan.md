# CI / PR Integration

Current GitHub Actions template runs Node tests on three OS families when activated in a real repository; hosted runs are not verified. Future PR check attaches machine-readable findings and a separate manual-review gate. A green CI result is never a WCAG conformance statement. No auto-comment or auto-merge without repository owner approval.
