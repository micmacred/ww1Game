# Skies of the Great War - Project Instructions

## Overview

A three-layer WWI air strategy game for iPad. Abstract over simulate. Inspired by *Ancient Art of War in the Skies* (Evryware, 1992).

## Documentation Structure

The authoritative design documents are:
- **`game-design-document.md`** — Full game design document (post-prototype revision)
- **`session-handoff.md`** — Design rationale, UI/UX lessons learned, prototype architecture, next steps

## Game Architecture

Three layers connected by zoom transitions:
1. **Theatre** (turn-based) — sector map, resource allocation, war management
2. **Campaign** (real-time with pulse) — 3-minute sector battles, front line mechanics
3. **Action** (real-time, optional) — dogfight god-mode, bombing runs, recon

## Prototype Status

- **Campaign layer:** Validated. Canonical prototype is `frontline-v7.jsx`.
- **Theatre layer:** Not yet prototyped.
- **Action layer:** Not yet prototyped.

## Development

Tech stack TBD — current prototype is React JSX. All prototyping files use versioned filenames (e.g., `frontline-v7.jsx`) to avoid caching issues.

## Code Style

- No stubs or TODOs in committed code
- Always read a file before editing it
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` prefixes

## Mandatory Adversarial Review

Every deliverable — design specs, implementation plans, and code — MUST pass an adversarial review before presenting to the user. This is separate from and in addition to any standard review step in a skill workflow.

**What makes it adversarial:** The reviewer is explicitly instructed to try to break the deliverable — find contradictions, ambiguities, missing edge cases, and data flow gaps.

**When to run it:**
- After writing a design spec: check completeness, contradictions, ambiguity
- After writing an implementation plan: check for bugs, pattern divergences, missing requirements
- After implementing code: check for runtime errors, visual inconsistencies, spec compliance

**Process:**
1. Dispatch an adversarial reviewer subagent with the deliverable + all relevant context
2. Classify findings as CRITICAL / SIGNIFICANT / MINOR
3. Fix all CRITICAL and SIGNIFICANT issues
4. Re-run the adversarial review to verify fixes (max 3 iterations)
5. Report what was found and fixed as part of the deliverable summary

## UI/UX Principles (from prototyping)

- No redundant panels — if it looks like it should do something, it must
- Scarcity through resistance (disabled controls), not counters
- Defaults should demonstrate the mechanic (never start at 0)
- Visual feedback before moving on — show what actions are doing
