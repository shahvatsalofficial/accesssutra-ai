---
name: tv-remote-navigation
description: Prepare remote/D-pad focus test plans. AccessSutra AI skill with reproducible evidence and human verification boundaries.
---
# Tv Remote Navigation

**Creator:** Vatsal Shah · **Product:** AccessSutra AI

## When to use
Prepare remote/D-pad focus test plans. Use only on an authorized local fixture or user-approved test system.

## Inputs
- Task identifier, scoped source and expected user outcome
- Scan findings or reviewer observations with source hash, browser/OS/AT metadata when applicable
- Explicit permission for any optional browser or external operation

## Procedure
1. Confirm scope and data-minimization policy.
2. Separate executable local checks from human-only tasks; never infer untested outcomes.
3. Run approved local deterministic commands where relevant (`node packages/cli/accesssutra.mjs help`).
4. Collect stable finding IDs, source locations, reproducible steps, severity rationale and candidate WCAG references.
5. Return recommendations and a retest plan; mark unknown or not-run items explicitly.

## Output contract
`{"skill":"tv-remote-navigation","status":"detected|browser-observed|human-reported|needs-human-review|not-run|unknown","evidence":[],"limitations":[],"actions":[]}`

## Guardrails
No certification or legal compliance claims. Do not submit production forms, access external URLs without approval, expose credentials or claim to have operated a screen reader. Human sign-off remains human.
