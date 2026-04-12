# nklisch/skills Plugin Integration Design

## Context

The project uses the **superpowers** plugin as its primary workflow engine (brainstorming, writing-plans, executing-plans, TDD, code review, debugging, verification). Five skills from the **nklisch/skills** plugin fill gaps that superpowers does not cover: architectural reconception, systematic cruft removal, profiling-driven performance design, library research, and multi-phase roadmap decomposition.

## Decision

Install the nklisch/skills **workflow** plugin wholesale via Claude Code's plugin marketplace. Constrain usage to five approved skills through CLAUDE.md guardrails. Superpowers remains the execution engine; nklisch skills produce design artifacts that feed into superpowers' `writing-plans` pipeline.

## Approved Skills

| Skill | Purpose | Superpowers Equivalent |
|-------|---------|----------------------|
| **bold-refactor** | Architectural reconception via six conceptual lenses (elimination, unification, inversion, algebraic, declarative, domain crystallization) | None — `simplify` does post-hoc cleanup, not reconception |
| **cruft-cleaner** | Systematic AI debris removal with language-aware tooling, confidence tiers, and parallel agent execution | Partial overlap with `simplify`, but far more systematic |
| **perf-design** | Profiling-driven performance optimization following strict hierarchy: algorithmic → I/O → idioms → parallelism | None |
| **research** | Library/API investigation producing research docs and auto-loading reference skills | None |
| **roadmap** | Multi-phase project decomposition into agent-optimized execution phases | Operates above `writing-plans` — roadmap decomposes the project, writing-plans handles single phases |

## Handoff Protocol

All five skills produce design documents as their primary output. The handoff rule:

1. nklisch skill produces a design document (e.g., bold-refactor design, perf-design optimization plan, roadmap phases)
2. Do **not** invoke nklisch's `implement` or `implement-orchestrator`
3. Use the design document as input to superpowers' `writing-plans` skill
4. Proceed through the normal superpowers execution pipeline: writing-plans → executing-plans → verification

For **roadmap** specifically, each phase in the generated ROADMAP.md becomes a separate `writing-plans` → `executing-plans` cycle.

## Foundation Document Mapping

The `roadmap` skill expects VISION.md, SPEC.md, and ARCHITECTURE.md. This project uses different documents that serve equivalent roles:

| nklisch expects | This project uses | Notes |
|-----------------|-------------------|-------|
| VISION.md | `game-design-document.md` | Game vision, target experience, layer descriptions |
| SPEC.md | `game-design-document.md` | Mechanics, rules, resource systems |
| ARCHITECTURE.md | `session-handoff.md` | Prototype architecture, component structure, design rationale |
| (constraints) | `CLAUDE.md` | Visual identity, UI/UX principles, code style, adversarial review |

## Blocked Skills

These nklisch skills must **not** be used — superpowers handles these concerns:

- `design`, `implement`, `implement-orchestrator` — superpowers writing-plans + executing-plans
- `ideate` — superpowers brainstorming
- `expand`, `feature` — superpowers brainstorming (scoped to this project's docs)
- `release` — not applicable yet
- `extract-patterns`, `refactor-design` — use bold-refactor for significant work, simplify for minor
- `e2e-test-design`, `test-quality` — superpowers TDD
- `update-documentation` — manual, driven by session-handoff.md convention
- `security-review` — can be reconsidered later if needed

## Implementation

Two changes required:

1. **Install plugin:** Run `/plugin marketplace add nklisch/skills` then `/plugin install workflow@nklisch-skills` in Claude Code
2. **Update CLAUDE.md:** Add a "Workflow Skill Boundaries" section documenting the approved skills, handoff rule, foundation document mapping, and blocked skills

## Adversarial Review Interaction

The project's mandatory adversarial review applies to design documents produced by nklisch skills, just as it applies to all other deliverables. When bold-refactor or perf-design produces a design doc, it must pass adversarial review before being handed to writing-plans.
