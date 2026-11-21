# Workflow 04: Evaluate labels, errors and recovery

**Owner:** AccessSutra Prime · **Creator:** Vatsal Shah

## Entry criteria
Explicit scope and safe local fixture or approved test environment. Record whether the task is blocking, advisory or not yet tested.

## Procedure
1. Inspect labeling and invalid state; test only with synthetic data in approved test environment.
2. Validate source provenance and task context; check privacy and authorization.
3. Run only supported deterministic steps; record the exact command, version, OS and result if executed.
4. Request qualified human review for unautomatable behavior and affected-user task completion.
5. Produce the evidence below and pass it to the independent reviewer.

## Required evidence
form-findings.json; error reproduction; human review

## Exit gate
No fabricated result, no untested item marked passed, no automated score presented as WCAG conformance, and any remaining blocker has an owner.
