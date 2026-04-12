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

## Visual Identity

Each layer has a distinct aesthetic. These are non-negotiable art directions:

| Layer | Style | Feel |
|-------|-------|------|
| **Theatre** | Hand-drawn period cartographic map | War room table in a French château — parchment, ink lines, period typography, wooden blocks |
| **Campaign** | Tabletop terrain scale model | Physical, textured ground, front lines that churn with combat intensity, scorched earth behind movement |
| **Action** | Colorized period newsreel | Desaturated base with hand-tinted colours, film grain, vignette — history as it was *remembered* |

Zoom transitions between layers are seamless — no menus, no loading screens, just scale.

## UI/UX Principles (from prototyping)

**Interaction design:**
- iPad-first, touch-native for theatre and campaign layers; Bluetooth keyboard primary for action layer with touch fallback
- God-mode squadron command — the player issues orders, never flies a plane directly
- Variable game speed, pause in action layer, time-stop during resource allocation
- Zoom in/out is always player-initiated

**Information design:**
- No redundant panels — if it looks like it should do something, it must (learned the hard way: see session-handoff.md §1)
- Scarcity through resistance (disabled controls), not counters — no resource pool panel
- Defaults should demonstrate the mechanic (never start at 0 — reserves default to 6)
- Visual feedback before moving on — show what air actions are doing, not just that they're running
- Segment cards show per-resource mini bars + composite strength meter; dispatch log shows dramatic outcomes with deciding factors

**Lessons from prototyping (do not repeat these mistakes):**
- Removed a standalone "Resource Pool" panel that confused players — looked like a theatre layer sitting above the campaign
- Reserves must have their own full-width panel with large controls, not buried as small text
- Air bonuses persist until Major Push (90s), not per sub-pulse — gives time to play the action layer and return
- Always use versioned filenames for prototypes (`v1`, `v2`, etc.) — React artifacts cache aggressively

## Workflow Skill Boundaries (nklisch/skills plugin)

The following nklisch/skills are approved for use in this project as specialist
analysis and design tools. Their outputs feed into superpowers' writing-plans,
NOT into nklisch's own implement/implement-orchestrator.

**Approved nklisch skills:**
- **bold-refactor** — architectural reconception via conceptual lenses
- **cruft-cleaner** — systematic AI debris removal
- **perf-design** — profiling-driven performance optimization design
- **research** — library/API investigation with reference skill output
- **roadmap** — multi-phase project decomposition

**Handoff rule:** When an nklisch skill produces a design document, do NOT
invoke nklisch's `implement` or `implement-orchestrator`. Instead, use the
design document as input to superpowers' `writing-plans` skill.

**Roadmap adaptation:** This project does not use VISION.md / SPEC.md /
ARCHITECTURE.md. When the `roadmap` skill requests foundation documents,
use these instead:
- `game-design-document.md` — serves as VISION + SPEC
- `session-handoff.md` — serves as ARCHITECTURE + current state
- `CLAUDE.md` — serves as constraints and principles

**Do NOT use** these nklisch skills (superpowers handles these concerns):
design, implement, implement-orchestrator, ideate, expand, feature, release,
extract-patterns, refactor-design, e2e-test-design, test-quality,
update-documentation, security-review.
