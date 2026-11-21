# ADR-0001: Offline-first evidence core with optional browser adapter

**Status:** Accepted for starter · **Date:** 2026-11-22 · **Owner:** Vatsal Shah

## Context

The product must deliver useful reproducible checks without mandatory cloud keys while not presenting automated findings as complete accessibility evidence. Browser and screen reader environments introduce dependencies, permissions and uncertainty.

## Decision

Keep a small deterministic local CLI, bounded static hints, explicit human review plans and reports as the core. Add Playwright/axe only behind an opt-in adapter. Keep all outputs scoped, source-hashed and clear about untested states. Keep localhost API read-only.

## Consequences

The starter cannot certify WCAG conformance or prove real task completion. The static parser has limited coverage; actual browser and AT tests require additional approved environments. Future enterprise server and dashboard are independent milestones.
