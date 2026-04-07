# Theatre Layer UI Mockups — Design Spec

> Issue: roadmap.md #65 (M2 — Theatre Map Prototype)
> Date: 2026-04-07
> Status: Approved by Michael, ready for implementation planning

## Purpose

Produce static HTML/CSS mockups of the theatre layer at iPad landscape dimensions
(1024×768pt), spatially accurate, that resolve the layout, interaction model, and
visual treatment for every distinct phase of a theatre turn before any production
component code is written. The mockups inform the sizing, layout, and visual style
for issues #6, #7, #8, #9, #10, #11, and #81 in the M2 milestone.

This spec also supersedes several earlier directional notes that were written
before the M2 brainstorming session — see **§9 Downstream cleanup** for the list of
existing files that need updating to match.

## Scope

In scope:

- Five static HTML/CSS mockup files representing the five distinct visual states
  of the theatre screen (Examen, Allocation, Sélection, Résolution mid-frame, Bilan
  with critical dispatch).
- A small shared CSS file for parchment textures, palette, typography, and table-
  edge primitives that the five mockups share.
- A README in the mockup directory describing what each file shows and what design
  decision it validates.

Out of scope:

- Functional behaviour. Mockups are visual artefacts, not interactive prototypes.
  No state, no event handlers beyond CSS hover for the README's benefit.
- Production component code (`TheatreMap.tsx`, `ResourceAllocation.tsx`, etc.) —
  those are downstream issues #7 and #8.
- Theatre map data structure (issue #6). Sector names and counts are referenced
  here, but the JSON schema is the next issue's deliverable.
- Animation pre-rendering. Animations described in this spec (front-line ink redraw,
  pencil-mark write-on, dispatch slide) are documented in prose for implementation
  but are not produced as animated artefacts in the mockup deliverable.

## Design constraints (from prior decisions)

These constraints come from CLAUDE.md, the visual-design skill, the GDD, the M2
brainstorming session, and Michael's explicit feedback. They are not negotiable
within this spec; if any of them needs to change, that is a separate decision.

- **Theatre is a parchment cartographic map.** Hand-drawn period staff-map style.
  Parchment base with ink, watercolour washes, period typography, wooden blocks
  placed on top. NOT sculpted terrain — that is the campaign layer's medium.
- **Diegetic interaction points.** Every interactive element must look like a
  physical object that exists within the war-room fiction (a brass dial, a wax
  seal, a leather-bound ledger). Generic UI controls (buttons, panels, modals)
  are forbidden.
- **WWI pace.** The map underneath is real Western Front geography. Front
  movement honours historical pace — kilometres per turn, not provinces. No
  blitzkrieg-style territorial swings even on dominant campaign victories.
- **No time pressure at the theatre level.** Single-player has no turn timers,
  phase budgets, or pacing pressure widgets. The player can take as long as they
  want to plan a turn. (The campaign layer's 3-minute pulse timer is unaffected.)
- **Only manpower has physical tokens on the map.** Wooden blocks on the chart
  represent manpower units only. Equipment and food are tracked on the sector
  folio via brass dials, never as physical objects on the map.
- **No counters or numeric displays anywhere on the table edge.** Quantities are
  communicated by physical fullness (supply tray height, dispatch stack
  thickness, ledger page progression). Numbers may appear on the brass dials of
  the sector folio (engraved 0–6) but nowhere else.
- **44pt minimum touch targets.** Per `src/shared/touch-targets.ts`. Brass dials,
  blocks on the supply tray, and the wax seal all exceed this comfortably (the
  wax seal at 88pt; dials at 56pt).
- **iPad landscape, 1024×768pt.** Mockups are sized exactly to this; no
  responsive behaviour, no other form factors.

## §1 Screen composition

The screen is divided into two horizontal regions with no top bar, no side panel,
no menu. The full width is used at all times.

```
┌──────────────────────────────────────────────────────┐  y=0
│                                                      │
│                                                      │
│                                                      │
│        WESTERN FRONT MAP                            │
│        1024 × ~520pt                                 │
│                                                      │
│        Parchment chart, sector overlay,              │
│        wooden manpower blocks, ink front line        │
│                                                      │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤  y=520
│                                                      │
│        COMMANDER'S TABLE EDGE                        │
│        1024 × ~248pt                                 │
│                                                      │
│        Walnut surface with brass rail along the      │
│        top edge. Five diegetic objects laid out      │
│        left-to-right.                                │
│                                                      │
└──────────────────────────────────────────────────────┘  y=768
```

The boundary between map and table edge is soft: the parchment chart visibly
curls slightly over the brass rail at the top of the table edge, and a faint
shadow falls onto the walnut. The two regions are not separated by a hard line —
they share a transition zone of about 8pt where the parchment overlaps the wood.

The map area is **always visible** during all five turn phases. The table edge
is always visible too — phase changes are communicated by which objects on the
table edge are lit by warm lamp-light versus dimmed, not by hiding regions.

## §2 The map

### Geography

Western Front from Flanders (left/north-west) to Alsace (right/south-east), with
the chart rotated approximately 30° from true north so the front line runs as a
roughly horizontal sweep across the screen. This matches period staff-map
convention (the GQG cartes des opérations used the same rotation).

The Channel coast appears at the top-left edge of the chart. Switzerland is at
the bottom-right edge. **Paris and Berlin are off-map by design** — they sit
beyond the chart edges and are referenced by directional wax-seal markers
("VERS PARIS →" and "VERS BERLIN ←") embedded in the chart margins. This is
consistent with the WWI-pace constraint: capitals are strategic objectives,
not sectors a campaign can capture by territorial advance.

### Sectors

Eight sectors carved out of the front, named after their historical army-group
divisions, ordered west to east:

1. Flandres
2. Artois
3. Picardie
4. Champagne
5. Verdun
6. Lorraine
7. Vosges
8. Alsace

Each sector occupies a polygon on the map, ink-bordered with hand-drawn
irregularity (SVG `feTurbulence` + `feDisplacementMap` filter chain at 1.5–2px
displacement amplitude). Sector names are hand-lettered in EB Garamond small
caps (14pt) along the centre line of each region. Boundaries between sectors
are dashed ink lines, communicating "administrative" rather than "physical."

The exact polygon coordinates are not part of this spec — they belong to issue
#6 (`theatre-map.json`). Mockups use approximate hand-drawn polygon shapes to
demonstrate the visual treatment.

### Base layer (parchment chart)

| Element | Treatment |
|---|---|
| Parchment fill | Tiling SVG `<pattern>` at `#F5E6D3` base, low-frequency turbulence overlay for grain |
| Fold lines / edge wear | `#E8D5B7` linear gradients at chart edges; one or two soft fold creases drawn diagonally as faint lines |
| Iron-gall ink (borders, text) | `#2C1810`, slightly irregular via the same displacement filter |
| Allied territory wash | `#B8C8D8` semi-transparent fill, slight Gaussian blur at edges (~1.5 stdDeviation) |
| German territory wash | `#D8B8B8`, same treatment |
| Contested zone | No wash. Parchment shows through. The front-line stroke does the work. |
| Place names | EB Garamond italic 11pt for water/regions, roman small caps for cities |
| Marginalia | Compass rose (top-right), scale bar (bottom-left), header reading "GRAND QUARTIER GÉNÉRAL — CARTE DES OPÉRATIONS" (top centre, 10pt) |
| Coordinate grid | Faint `rgba(44,24,16,0.08)` lines, ~80pt spacing |
| Vignette | Subtle warm darkening at chart edges via radial gradient |

### Front line

The dominant visual feature of the map. A bold meandering ink stroke running
roughly north–south through the sector strip, with watercolour washes fading
to either side (Allied blue west, German red east). Implemented as a single SVG
`<path>` with stroke-width ~3px and the same `feDisplacementMap` filter as the
sector borders.

When the front line moves between turns, it animates via `stroke-dasharray` +
`stroke-dashoffset` redraw over ~800ms. The new path and old path are both
rendered briefly during the transition, with the old fading out as the new
draws in. **Movements are small** — a few pixels at most, even for dominant
campaign victories — per the WWI pace constraint.

### Wooden manpower blocks

Each sector carries wooden manpower block tokens representing committed army-
group strength. One block per manpower unit allocated to that sector. Blocks
are pure CSS DOM nodes, not SVG, so they can animate independently when
allocated.

| Property | Value |
|---|---|
| Size | ~22 × 22pt |
| Fill | `#7b3f00` (manpower brown, from `src/shared/resources.ts`) |
| Bevel | `linear-gradient(135deg, #8B7355 0%, #7b3f00 50%, #5C2F00 100%)` |
| Drop shadow | `box-shadow: 2px 2px 4px rgba(44,24,16,0.4)` |
| Selected glow | `box-shadow: 0 0 12px rgba(180,140,80,0.6)` (warm lamp-light, never blue) |
| Cluster layout | Blocks within a sector cluster in a small grid near the sector's centroid; clusters never overlap sector borders |

**Equipment and food are NOT rendered as blocks on the map.** They appear only
on the sector folio's brass dials and contribute to the strength meter there.

### Off-map capital markers

Two small wax-seal marginalia markers sit at the chart edges:

- **Top-left margin (toward Channel/Paris):** a small wax seal labelled
  `VERS PARIS →` in EB Garamond italic
- **Right margin (toward Germany/Berlin):** a small wax seal labelled
  `VERS BERLIN ←` in EB Garamond italic

These are visual reminders of the off-map strategic objectives. They do not
animate or interact in the mockups; they are placeholders for whatever long-
term objective state the win-conditions issue (#12) eventually computes.

### Tappable behaviours

Documented for the spec but not interactive in the mockups:

- **Tap empty sector area** → that sector becomes the **active sector**; its
  folio replaces whatever was previously shown on the table edge
- **Tap a wooden block** → highlights the block, opens its sector's folio,
  pre-selects the block for visual reference
- **Long-press a sector** → opens a quick-view tooltip with current strength
  and intel summary, no folio change
- **Drag a manpower block from one sector to an adjacent sector** →
  reallocates one manpower unit (the hybrid model's quick shortcut)
- **Drag a manpower block from the supply tray onto a sector** →
  allocates one manpower unit from reserves (the primary allocation gesture)

## §3 The table edge (commander's working area)

The lower 248pt of the screen is a strip of dark walnut (`#3D2817`) with a thin
brass rail (`#8B7355`) along its top edge where it meets the parchment chart.
Five diegetic objects sit on it, arranged left to right:

```
┌────────┐  ┌──────────┐  ┌──────────────────┐  ┌──────────┐  ┌────────┐
│  TURN  │  │  SUPPLY  │  │   SECTOR FOLIO   │  │ DISPATCH │  │  WAX   │
│ LEDGER │  │   TRAY   │  │ (active sector)  │  │  STACK   │  │  SEAL  │
│ 120pt  │  │  140pt   │  │      416pt       │  │  140pt   │  │ 120pt  │
└────────┘  └──────────┘  └──────────────────┘  └──────────┘  └────────┘
  16pt        16pt              16pt               16pt          16pt    gutters
```

Layout math: 5 objects (120 + 140 + 416 + 140 + 120 = 936pt) + 4 inter-object
gutters of 16pt each (64pt) + 12pt outer margin on each side (24pt) = 1024pt
exactly. The 416pt sector folio is the largest object, the 88pt wax seal sits
comfortably inside its 120pt slot with room for the label below.

### 3.1 Turn Ledger (120pt wide)

A small leather-bound diary lying open, slightly angled. The visible page shows:

- The current turn as a Roman numeral hand-written in brown ink (e.g. `III`),
  rendered in EB Garamond italic 16pt with `#5C3A1D` ink colour
- The current month and year (e.g. `Avril 1916`) in the same hand, 11pt
- The current phase below, as a French staff-officer abbreviation:
  `Examen` / `Allocation` / `Sélection` / `Résolution` / `Bilan`
- A faint pencil tick that advances down the page as the phase progresses
  (Architects Daughter font, 10pt, light grey)

**Interaction (documented, not in mockup):** Tapping the ledger flips back
through previous pages — recent turn history, who held what, casualty counts.

This is the diegetic version of a turn counter, history log, and phase indicator
combined into one object.

### 3.2 Supply Tray (140pt wide)

A shallow wooden tray with `#3D2817` rim, holding three columns of stacked
wooden supply tokens. The columns from left to right represent:

- **Manpower** — brown blocks (`#7b3f00`), same shape as the map blocks
- **Equipment** — blue tokens (`#1a3c5e`), rendered as small flat discs or
  shell-stack silhouettes (visually distinct from the manpower blocks so the
  tray doesn't read as "all blocks")
- **Food** — green tokens (`#2d5a1b`), rendered as small sack icons or paper
  ration tags (also visually distinct)

The visible stack height **is** the reserve count for that resource. No number
is ever shown. When the tray is empty for a resource, that column shows bare
wood. The mockups should show the tray at three different fullness levels
across the five files so this visual language is testable.

**Interaction (documented, not in mockup):**
- Manpower blocks are draggable from the tray onto sectors on the chart above.
- Equipment and food tokens are **not draggable**. They are allocated only via
  brass dials on the sector folio — the tokens in the tray simply represent
  the remaining reserves visually, and shrink/grow as the dials move.

This object embodies the campaign-prototype lesson "scarcity through
resistance, not counters": when a column is empty, the tokens are gone, and
the corresponding allocation gesture (drag for manpower, dial for the others)
physically cannot proceed.

### 3.3 Sector Folio (416pt wide — the largest object)

A field dispatch document for whichever sector is currently the **active
sector**. Visually a piece of foolscap paper laid on a leather blotter
(`#4A3728`). Tapping a different sector on the chart swaps the visible folio
with that sector's contents. Mockups use Verdun as the active sector.

The folio contains, top to bottom:

| Element | Treatment |
|---|---|
| Sector name header | EB Garamond italic 18pt, e.g. `Secteur de Verdun` |
| Intelligence summary | Special Elite (typewriter) 11pt, e.g. `Ennemi: 8e Armée allemande · Effectifs estimés: forts · Dernier rapport: 2 jours` |
| Three brass dials | Side by side, 56pt diameter each, one per resource (manpower / equipment / food). Numbered arc 0–6 engraved into brass (`#8B7355` body, `#5C4A2A` engraving). Needle in `#2C1810` |
| Composite strength meter | Horizontal ink-and-watercolour bar below the dials, ~280pt × 16pt. Coloured by `LEVEL_COL` from `src/shared/resources.ts` — green / amber / red |
| Deciding-factor caption | Special Elite italic 10pt, drawn from `RES_OUTCOME` constants (e.g. `superior firepower`, `outmanned on the line`) |
| Recon photo strip (conditional) | A small yellowing photo strip pasted to the corner if the sector has fresh recon intel — `sepia()` filter, slight rotation. Mockups should include this on at least one folio. |
| "Personally command" line | Bottom of folio: `□ Commander en personne ce tour-ci` with a small empty checkbox in EB Garamond italic 12pt |

**Brass dial interaction (documented, not in mockup):**
- Tap +/- on a dial → moves the needle one click
- Drag the needle in an arc → faster gesture for multi-step allocation
- When the corresponding reserve is empty, the dial physically cannot rotate
  higher: needle hits a stop, brass dims to `#5C5040`, soft "thunk" sound
- Engraved numerals are visual reference; the player rarely needs to read them

**Sector selection:**
- Only one sector may have the `Commander en personne` checkbox ticked per turn
- Ticking it on a different folio unticks the previous one
- The wax seal (object 5) won't accept the orders until exactly one sector is
  ticked; this is enforced in the Sélection phase

### 3.4 Dispatch Stack (140pt wide)

A small stack of unread dispatch papers. New dispatches sit on top with a slight
angle. The stack's *thickness* communicates "how much happened this turn"
without any number — the mockups should show distinctly thin (1 dispatch),
medium (3 dispatches), and thick (8 dispatches, one with a critical wax seal)
states across the five files.

| Element | Treatment |
|---|---|
| Paper | `#F0E8D8` foolscap with subtle texture, slight rotation per sheet |
| Ink | `#2C1810` for headers, Special Elite for body |
| Critical wax seal | `#8B3A3A` semi-circle on the top dispatch when the result is a critical loss |
| Stack offset | Each successive sheet offset by 1.5pt down and 0.5pt right; max visible offset capped at 8 sheets even if the stack is conceptually deeper |

**Interaction (documented, not in mockup):**
- Tap the stack → opens it as a flip-through reader covering the centre of the
  screen
- Each tap turns a page with a brief paper-rustle sound
- Read dispatches slide off into a side tray (not visible — they go away)
- The stack physically shrinks as dispatches are read

**Critical-dispatch lockout rule:** If any dispatch in the stack is a critical
outcome (loss of a key position, disaster), it sits on top with the red wax
seal, and the wax seal on the table edge (object 5) is **disabled** until that
critical dispatch has been opened at least once. This is the only "force the
player to look" rule in the design — it does not force them to act, just to see.

Dispatch templates are described in §5 and pulled from the same `RES_OUTCOME`
constants used for the deciding-factor text.

### 3.5 Wax Seal (120pt wide)

A brass seal stamp resting on a small red wax pool, 88pt diameter (well above
the touch-target minimum), centred in the 120pt slot with the label below it.
This is the **single advance-the-turn action** for the entire layer.

| State | Brass appearance | Wax | Label below |
|---|---|---|---|
| Examen — enabled | Bright `#A8916A` | Bright `#8B3A3A` | `Commencer Allocation` |
| Examen — locked (critical dispatch unread) | Dim `#5C5040` | Dull `#5C2828` | `Lire les Dépêches` |
| Allocation — enabled | Bright `#A8916A` | Bright | `Sceller les Ordres` |
| Sélection — enabled | Bright `#A8916A` | Bright | `Lancer la Résolution` |
| Sélection — locked (no sector chosen) | Dim | Dull | `Choisir un Secteur` |
| Résolution | Hidden / table edge dimmed | — | (no label, table edge is dim during reveal) |
| Bilan — enabled | Bright | Bright | `Tour Suivant` |
| Bilan — locked (critical dispatch unread) | Dim | Dull | `Lire les Dépêches` |

Pressing the seal plays a heavy thunk sound and a brief stamp-impression
animation (the seal lifts ~6pt, drops, the wax briefly compresses). The
mockups show the static states, not the animation.

## §4 Turn flow & phase transitions

A theatre turn moves through five phases. The phase is shown only on the Turn
Ledger. The table edge **rearranges itself slightly** between phases — relevant
objects are lit by warm lamp-light, irrelevant ones dim. The map is always
visible and never blocked. **There is no time pressure at any phase**: the
player advances when they choose to.

```
Examen → Allocation ↔ Sélection → [zoom into chosen sector]
                                          │
                                          ▼
                                  CAMPAIGN (M3)
                                          │
                                          ▼
                                  Résolution → Bilan → next Examen
```

### Phase 1 — Examen (Review)

Entered automatically at turn start. Ledger shows `Examen`.

| Object | State |
|---|---|
| Turn ledger | Lit |
| Supply tray | Dim |
| Sector folio | Visible (last active sector), not yet allocation-interactive |
| Dispatch stack | **Lit and offset slightly forward** — the focal point |
| Wax seal | Enabled (label `Commencer Allocation`) UNLESS a critical dispatch is unread, in which case dim with label `Lire les Dépêches` |

The dispatch stack is the focal object because it contains everything that
happened in the unattended sectors during the previous turn (and the war
correspondent dispatch from the previous chosen sector). Reading them is the
implicit action of this phase.

Tapping any sector on the chart transitions immediately to Allocation, so an
experienced player can skip Examen by acting — **except** when a critical
dispatch is unread, in which case the sector-tap shortcut is disabled and a
brief "Lire les dépêches d'abord" pencil note appears across the chart and
fades. The critical-dispatch lockout always wins over convenience shortcuts.

### Phase 2 — Allocation

Entered by pressing the wax seal in Examen, or by tapping any sector. Ledger
shows `Allocation`.

| Object | State |
|---|---|
| Turn ledger | Dim |
| Supply tray | **Lit** |
| Sector folio | **Lit** (active sector's brass dials are interactive) |
| Dispatch stack | Dim |
| Wax seal | Enabled (label `Sceller les Ordres`) the moment any allocation is touched |

The player may:

- Drag manpower blocks from the supply tray to sectors on the chart
- Drag manpower blocks between adjacent sectors (quick shortcut)
- Tap a sector to swap its folio in, then use brass dials to allocate
  equipment and food

Sectors with unsaved changes display a faint pencil-mark border (Architects
Daughter, `#5C5040`, ~1.5pt stroke) indicating "this is dirty."

Pressing the wax seal locks the allocation and transitions to **Sélection**.
It does NOT advance the turn or commit anything irreversible.

### Phase 3 — Sélection

Entered by sealing the orders in Allocation. Ledger shows `Sélection`.

| Object | State |
|---|---|
| Turn ledger | Dim |
| Supply tray | Dim |
| Sector folio | **Lit and the only interactive object** |
| Dispatch stack | Dim |
| Wax seal | Locked initially, label `Choisir un Secteur`. Becomes enabled with label `Lancer la Résolution` once exactly one sector is ticked. |

A short instruction appears in italic on the folio's blotter:
`Quel secteur commanderez-vous en personne?`

The player taps a sector on the chart, ticks the `Commander en personne ce
tour-ci` checkbox at the bottom of its folio, and the chosen sector gets the
warm lamp-light glow on the chart. Ticking another sector unticks the previous.

**Allocation ↔ Sélection are reversible.** Tapping the supply tray or dragging
a block while in Sélection drops back to Allocation (ledger reverts the page).
This is a soft toggle, not a hard gate.

Pressing the wax seal in Sélection is the **first commitment point** of the
turn. Once pressed, orders are locked, the chosen sector is locked in, and the
zoom-into-campaign animation begins. No undo.

### [Zoom into campaign — M4]

This is M4 territory and not part of this spec. From the theatre layer's
perspective, control is transferred to the campaign layer, and the campaign
layer will return control later with a result payload that drives the
Résolution phase.

### Phase 4 — Résolution (after campaign returns)

Entered automatically when the campaign returns. Ledger shows `Résolution`.

| Object | State |
|---|---|
| All table edge objects | **Dim** |
| Map | **Lit** — the focus of attention |
| Wax seal | Hidden / inactive during reveal |

The chosen sector's outcome paints onto the chart first:
- Front line in that sector redraws via stroke-dasharray (small movement)
- Wooden blocks update: lost units tip and slide off into the chart margin
- A war correspondent dispatch (per issue #78, M3) slides onto the dispatch
  stack with a more elaborate animation than auto-resolved dispatches —
  larger, slightly angled, with a small handwritten signature

Then the **7 unattended sectors auto-resolve in sequence, north to south**,
each over ~2.5 seconds. See **§5 Auto-resolution feedback** for the per-
sector animation.

After all 8 sectors have resolved, the table edge re-lights and the phase
transitions automatically to **Bilan**.

**Tapping anywhere during the reveal accelerates remaining reveals to 4×
speed.** There is no "skip all" — the reveal is part of the experience.

### Phase 5 — Bilan (Update)

Entered automatically after Résolution completes. Ledger shows `Bilan`.

| Object | State |
|---|---|
| Turn ledger | Dim |
| Supply tray | Dim |
| Sector folio | Visible (chosen sector by default), not allocation-interactive |
| Dispatch stack | **Lit** — typically thick with 8 unread dispatches |
| Wax seal | Enabled (label `Tour Suivant`) UNLESS a critical dispatch is unread, in which case dim with label `Lire les Dépêches` |

The player flips through dispatches at their own pace. There is no countdown,
no auto-advance, no "Continue" prompt. They press the wax seal when ready.

Pressing the wax seal:
- Ledger flips its page (turn `III` → `IV`, month advances)
- Supply tray refills with the next turn's income (income tokens fall in with
  a satisfying clunk animation)
- All previously read dispatches stay gone; all unread dispatches stay in the
  stack (carried into next turn)
- New turn begins at Examen
- Auto-save triggers per issue #81

**This is the second commitment point** of the turn. Saves to disk.

### Reversibility summary

| Transition | Type |
|---|---|
| Examen → Allocation | Free, automatic |
| Allocation ↔ Sélection | Free toggle (any number of times) |
| Sélection → Résolution | **Commitment 1** — orders locked, campaign begins |
| Résolution → Bilan | Automatic |
| Bilan → next Examen | **Commitment 2** — saves to disk |

Two commitment points per turn, both clearly tied to a wax-seal press.

## §5 Auto-resolution feedback

This section details how the seven unattended sectors communicate their
outcomes during the Résolution phase. Constraints: no time pressure, diegetic
only, fog should lift visibly, outcomes legible without numbers.

### Reveal sequence

When the campaign returns, the table edge dims and the chart is lit. The
chosen sector resolves first with the war correspondent dispatch and the
front-line update for that sector. Then the seven unattended sectors resolve
**one at a time, north to south** (Flandres → Alsace), taking ~2.5 seconds
each.

The reveal is paced by animation, not budget. The player is not waiting against
a clock. Tapping anywhere accelerates remaining reveals to 4× speed.

### Per-sector reveal animation timing

```
t=0.00s  Sector glows warm (lamp-light, not blue digital)
t=0.30s  Pencil-mark deciding factor begins writing across the sector in
         Architects Daughter italic, letter-by-letter, ~0.7s draw
         Examples: "outgunned" / "supply lines failing" / "troop weight told"
         (drawn from RES_OUTCOME constants in src/shared/resources.ts)
t=1.00s  Front line update:
           IF the line moves: ink-stroke redraw via stroke-dasharray, ~0.8s,
                              small movement (WWI pace)
           IF the line holds: a brief pencil scuff appears across the
                              contested zone and fades — "fought, no movement"
                              (the WWI default outcome)
t=1.80s  Wooden blocks update if losses occurred — affected blocks tip,
         slide off into chart margin with a soft wood-on-wood sound, fade
t=2.00s  A new dispatch paper slides onto the dispatch stack with a soft
         paper-on-paper rustle. Stack visibly thickens.
t=2.20s  Pencil deciding-factor text fades
t=2.50s  Sector glow fades; next sector begins
```

Total reveal time at normal speed: ~20 seconds for all eight sectors.

### Dispatch templates

Auto-resolved sectors generate a brief narrative dispatch (per issue #77).
Templates use real sector names and the actual outcome category. **Three
outcome categories**, with 3–5 templates each, randomly selected, so players
don't see repetition for at least a turn or two. Implementation note: track
recently-used templates per category and avoid repeats within a 2-turn window.

**Held (no front movement, normal outcome):**
- *"The Champagne sector held under heavy probing. Casualties light."*
- *"Quiet on the Vosges front. Patrols exchanged."*
- *"Artois positions maintained. The mud remains the chief enemy."*
- *"The line at Picardie absorbed the day's shelling. No ground given."*

**Lost ground (small retreat, the painful default for the losing side):**
- *"German pressure forced a small withdrawal east of Picardie. Two trench lines lost."*
- *"The line at Verdun bent but did not break. Reserves committed."*
- *"A salient was pinched off in Flanders. Two companies lost."*
- *"Lorraine yielded a kilometre of ground. The dead were not all collected."*

**Gained ground (rare, dominant local result):**
- *"An unexpected breakthrough at Alsace — German positions north of Mulhouse fell."*
- *"The Lorraine attack made progress. Three trench lines taken at heavy cost."*
- *"Champagne pushed forward. The new line is being consolidated."*

**Critical / collapse (flagged for player attention):**
- *"DISASTER at Ypres: the line broke. The Channel ports are now within reach of enemy artillery."*
- *"Verdun has fallen. The road to Paris is open."*
- *"Catastrophic losses at Alsace. The Vosges sector is exposed."*
- These dispatches sit on top of the stack with a red wax seal already
  applied, and trigger the wax-seal-lockout rule in Examen and Bilan.

Sector name interpolation: every template that mentions a sector name uses
the actual sector that resolved with that outcome. The list above is
illustrative; templates store sector slots like `${sector}` and render at
runtime.

### Channels of information

Even a player who never opens a single dispatch should understand the
strategic picture from the chart alone. The dispatches add narrative colour;
they are not the only channel.

| Channel | Communicates |
|---|---|
| Sector glow + pencil text | *Which* sectors fought and *why* they went the way they did |
| Front-line ink redraw | *Where* the line moved, by how little |
| Block-tip animation | *That* there were losses, roughly *how many* |
| Dispatch stack thickness | *That* the turn was eventful (or quiet) |
| Individual dispatches | *The story* of each sector — what to remember |

The redundancy between the on-map pencil text and the dispatch text is
intentional: it ensures the strategic information survives a player who
ignores the dispatches, while preserving the narrative payoff for players who
read them.

## §6 Visual treatment & assets

### Palette

| Element | Colour | Notes |
|---|---|---|
| Parchment base | `#F5E6D3` | Tiling texture, not flat |
| Aged parchment / fold lines | `#E8D5B7` | Subtle gradients |
| Iron-gall ink | `#2C1810` | Hand-drawn irregularity |
| Faded ink (inactive controls) | `#B8A890` | "Greyed" within parchment palette |
| Allied territory wash | `#B8C8D8` | Pale blue, watercolour translucency |
| German territory wash | `#D8B8B8` | Pale red |
| Manpower block | `#7b3f00` | Brown, from existing constants |
| Equipment token | `#1a3c5e` | Blue |
| Food token | `#2d5a1b` | Green |
| Block bevel highlight | `#8B7355` | Warm wood |
| Block bevel shadow | `rgba(44,24,16,0.4)` | 2px offset |
| Selected block / sector glow | `rgba(180,140,80,0.6)` | Warm lamp-light, never blue |
| Critical dispatch wax seal | `#8B3A3A` | Desaturated Venetian red |
| Table edge — walnut | `#3D2817` | Lower strip surface |
| Table edge — brass rail | `#8B7355` | Warm metal trim |
| Table edge — leather blotter | `#4A3728` | Beneath the sector folio |
| Healthy strength | `#2d6a2d` | From `LEVEL_COL.good` |
| Strained strength | `#b7770d` | From `LEVEL_COL.low` |
| Critical strength | `#c0392b` | From `LEVEL_COL.critical` |
| Brass dial body | `#A8916A` (lit) / `#5C5040` (dim) | |
| Brass dial engraving | `#5C4A2A` | |

### Typography

| Element | Family | Size | Style |
|---|---|---|---|
| Sector names on chart | EB Garamond | 14pt small caps | Hand-lettered feel via slight letter-spacing variation |
| Place names on chart | EB Garamond italic | 11pt | Period staff-map convention |
| Map header / marginalia | EB Garamond small caps | 10pt | "GRAND QUARTIER GÉNÉRAL — CARTE DES OPÉRATIONS" |
| Turn ledger handwriting | EB Garamond italic | 16pt | Brown ink colour |
| Sector folio header | EB Garamond italic | 18pt | "Secteur de Verdun" |
| Field dispatch body | Special Elite | 11pt | Intel, deciding factor, dispatch text |
| Dial numerals (0–6) | EB Garamond | 9pt | Engraved into brass via subtle text-shadow |
| Pencil marks on sectors | **Architects Daughter** | 13pt italic | Letter-by-letter draw, slight rotation per glyph |

EB Garamond and Special Elite are already in the typography stack (#63).
**Architects Daughter is a new font** that needs to be added — Google Fonts,
SIL Open Font License, weight 400 only.

### Texture & filter strategy

- **Parchment tiling:** repeating SVG `<pattern>` with `feTurbulence`
  (baseFrequency 0.9, numOctaves 2) + `feColorMatrix` warmed to the palette.
  Rendered once at app start, not per-frame.
- **Hand-drawn line irregularity:** SVG `feDisplacementMap` driven by a
  low-frequency turbulence on sector borders and the front-line stroke.
  Displacement amplitude 1.5–2px max.
- **Watercolour washes:** semi-transparent `<rect>` clipped to sector polygons
  with `feGaussianBlur` (stdDeviation 1.5) for slight bleed at edges.
- **Wooden blocks:** pure CSS DOM nodes — `linear-gradient` for bevel,
  `box-shadow` for drop shadow. Animate independently when allocated.
- **Lamp-light glow:** CSS `box-shadow: 0 0 12px rgba(180,140,80,0.6)`,
  animated via opacity transition.
- **Front-line ink stroke:** single SVG `<path>` with stroke-dasharray,
  animated via `stroke-dashoffset` for redraws.

### Mockup deliverables

Five static HTML files in `mockups/theatre/`, each at exactly 1024×768pt,
plus a shared CSS file and a README. **No JavaScript** beyond what's needed
for static rendering. **Not interactive** — pure visual artefacts.

#### `01-overview.html` — Examen phase

Full theatre screen during turn start.

- Map: all 8 sectors visible, current allocation as wooden manpower blocks
  (varied counts per sector to look realistic), ink front line meandering
  through the sector strip, watercolour washes for territory control,
  marginalia (compass rose, scale bar, header), off-map capital wax-seal
  markers
- Table edge: ledger reads `Examen · Tour III · Avril 1916`. Supply tray
  shows medium fullness across all three columns. Sector folio shows Verdun
  (most recent active), in dim/non-interactive state. Dispatch stack lit and
  offset forward, 3 unread dispatches visible. Wax seal enabled with label
  `Commencer Allocation`.
- **Demonstrates:** layout, palette, typography, sector names, parchment
  treatment, block style, table edge composition, Examen state lighting

#### `02-allocation.html` — Allocation phase

Same screen mid-allocation.

- Map: same as 01, but two sectors (e.g. Verdun and Champagne) have a faint
  pencil-mark border indicating "dirty" state. One manpower block is shown
  mid-drag from the supply tray to Verdun (rendered as a slight offset and
  drop shadow, with a faint pencil-trail line showing the drag path).
- Table edge: ledger reads `Allocation`. Supply tray and sector folio both
  lit. Folio shows Verdun's brass dials in detailed view — manpower at 4,
  equipment at 3, food at 2. Composite strength meter at amber. Deciding-
  factor caption reads "outgunned". Recon photo strip pasted to the corner.
  Dispatch stack dim. Wax seal enabled with label `Sceller les Ordres`.
- **Demonstrates:** brass dial detail, dirty-state pencil border, drag
  affordance, the two-channel allocation pattern (drag-to-map for manpower,
  dial-only for equipment/food), folio detail layout

#### `03-selection.html` — Sélection phase

Same screen choosing where to fight.

- Map: same as 02, but Verdun glows with warm lamp-light (the chosen sector).
  All other sectors are normal-lit. The pencil-mark dirty borders are gone
  (allocation has been sealed).
- Table edge: ledger reads `Sélection`. Supply tray dim. Sector folio lit
  (only interactive object). Folio shows Verdun with the
  `□ Commander en personne ce tour-ci` line at the bottom — the checkbox is
  now ticked (`☑`). Dispatch stack dim. Wax seal enabled with label
  `Lancer la Résolution`.
- **Demonstrates:** the commitment moment, the chosen-sector glow, the
  Sélection state lighting, the wax seal's enabled state

#### `04-resolution-mid.html` — Résolution phase, frozen mid-frame

A frozen instant during the auto-resolve reveal.

- Map: Verdun has already resolved (front line slightly shifted, blocks
  reduced). Three of the seven auto-resolves have completed (Flandres,
  Artois, Picardie all updated). Champagne is mid-reveal: glowing warm,
  pencil-mark text "supply lines failing" partially written across it
  (showing the letter-by-letter draw at ~50% progress, with a few letters
  still missing — frozen mid-animation in the static mockup), front line
  beginning to redraw with stroke-dasharray visible. The remaining sectors
  (Lorraine, Vosges, Alsace) are unchanged from pre-resolve state, waiting
  their turn.
- Table edge: ALL OBJECTS DIMMED. Wax seal hidden / table edge in muted
  lighting. The map is the only lit thing. The dispatch stack visibly
  contains 5 dispatches (Verdun's war correspondent dispatch on top,
  larger and angled, plus the three auto-resolved sectors' dispatches
  beneath it, plus one in-progress slide animation for Champagne — the
  paper just leaving the chart and arriving at the stack).
- **Demonstrates:** the reveal sequence, dispatch stack thickening, pencil-
  mark style, the resolve-phase dim state of the table edge

#### `05-bilan-with-critical.html` — Bilan phase, critical dispatch unread

End of turn with bad news.

- Map: post-turn state of all sectors. One sector (Vosges, say) shows
  visibly degraded — front line pulled back, fewer blocks, watercolour wash
  encroached. Verdun looks like it weathered its fight (slightly forward
  front line, blocks intact). Other sectors show small variations.
- Table edge: ledger reads `Bilan`. Supply tray dim. Sector folio shows
  Verdun (chosen sector by default) in dim/non-interactive state. Dispatch
  stack lit and **thick** — 8 unread dispatches visible, with the topmost
  bearing a red wax seal (the critical dispatch about Vosges). Wax seal
  on the table edge is **dim and locked** with label `Lire les Dépêches`.
- **Demonstrates:** end-of-turn appearance, the critical dispatch wax seal,
  the wax-seal lockout state, dispatch stack at maximum thickness

#### `mockups/theatre/_shared.css`

Shared CSS file containing:
- All palette variables as CSS custom properties (`--parchment`, `--ink`, etc.)
- Font face declarations (loading EB Garamond, Special Elite, Architects
  Daughter from Google Fonts CDN, with `font-display: swap`)
- Reusable classes for: parchment background, wooden block, brass dial,
  walnut surface, brass rail, leather blotter, dispatch paper, wax seal
- The SVG filter definitions (`feTurbulence`, `feDisplacementMap`,
  `feGaussianBlur`) as a single hidden `<svg>` block to be referenced by URL

#### `mockups/theatre/README.md`

Plain markdown describing:
- What each of the five files shows
- Which design decision each file validates
- Known unknowns (any colour or size that the mockup author should validate
  against the design spec)
- A link back to this spec file
- How to view: open each `.html` file in a browser at iPad landscape size,
  or use the device-emulation mode in browser dev tools at 1024×768

### Cross-layer notes

These are flagged for downstream issues, not actioned in #65:

- **Resource colours** (`#7b3f00` / `#1a3c5e` / `#2d5a1b`) carry forward from
  theatre into campaign per the visual-design review's cross-layer consistency
  requirement (#73). Campaign-layer adaptations (slightly desaturated for the
  tabletop terrain palette) are M3's problem.
- **Sector names** appear in both theatre and campaign — and on the campaign
  layer they label the segment headers. The face used (EB Garamond italic)
  should match across both layers for spatial continuity.
- **War correspondent dispatch hand-off:** the artefact M3 #78 produces is
  what arrives onto the dispatch stack at the start of Résolution. M3's
  implementation needs to know the format and where it lives.
- **Manpower-only token rule:** see the corresponding memory entry. This rule
  also applies to M3 — manpower as physical figures/blocks on the campaign
  terrain, equipment/food on the segment card.

## §7 What this design deliberately avoids

- A modal "Turn Results" screen — the chart updates and the dispatch stack
  thickens; that *is* the screen
- Per-sector popup tooltips during reveal — the pencil-mark text on the
  sector itself is the tooltip
- A casualty counter — block tip animations are the casualty display
- A "Continue" button between reveals — animation pacing is the only sequencer
- Auto-opening any dispatch — the player decides what to read
- A "menu" or "settings" button — pinching out of the theatre layer is the
  only navigation action, and that's a gesture, not an object
- A "save" button — saves are automatic per #81
- Any kind of resource pool counter — the supply tray *is* the resource pool
- An end-turn confirmation modal — the wax seal physical press *is* the
  confirmation
- Equipment and food tokens on the chart — only manpower lives on the map
- Time pressure widgets, turn timers, phase budgets — none of those exist
  in single-player

## §8 Mockup acceptance criteria

The five mockups are considered complete when:

1. Each file renders at exactly 1024×768pt with no scrollbars in a browser at
   that viewport size
2. All palette colours match the table in §6 (verified by spot-checking with
   browser dev tools or a colour picker)
3. All three typefaces (EB Garamond, Special Elite, Architects Daughter) load
   and render correctly
4. The parchment texture and hand-drawn line irregularity are visibly
   present, not flat fills
5. Wooden blocks have a clear bevel and drop shadow and read as physical
   objects on the chart
6. The five table-edge objects are arranged left-to-right in the order
   specified, with correct widths and gutters summing to 1024pt
7. Each of the five state distinctions is clearly different from the others
   (Examen vs Allocation vs Sélection vs Résolution vs Bilan are immediately
   distinguishable by which objects are lit/dim and which states they show)
8. The README in `mockups/theatre/` clearly explains what each file is for
9. No interactive behaviour beyond what HTML/CSS provides for free; no
   JavaScript event handlers
10. A peer (or the spec author re-reading with fresh eyes) can match each
    mockup to a phase in §4 without being told

## §9 Downstream cleanup

This spec resolves several questions that earlier files left open or got
wrong. The following files need updating to be consistent with this design,
either in this same change or in a follow-up commit referenced from the
implementation plan. None of them are blockers for producing the mockups
themselves.

- **`CLAUDE.md` Visual Identity table** — the theatre row is broadly correct
  (parchment, ink lines, period typography, wooden blocks) but does not
  mention the diegetic-interaction rule. Add a note that interaction points
  must be diegetic across all three layers.
- **`roadmap.md` issue #65 description** — currently says "low-fidelity
  mockups". This spec calls for higher-fidelity mockups that look like the
  finished thing. Update the issue description to reference this spec.
- **`roadmap.md` issue #6 description** — should reference the 8 historical
  army-group sectors named in §2.
- **`roadmap.md` issue #7 description** — should reference the SVG
  filter strategy in §6 (`feTurbulence` + `feDisplacementMap`).
- **`roadmap.md` issue #8 description** — should reference the brass-dial
  interaction model in §3.3 and the supply-tray pattern in §3.2.
- **`roadmap.md` issue #9 description** — should reference the five-phase
  flow in §4, including the resolve-after-campaign ordering.
- **`roadmap.md` issue #11 description** — should reference the per-sector
  reveal animation in §5.
- **`roadmap.md` issue #12 (win conditions)** — should be revisited when
  scoped, given the WWI-pace constraint and off-map capitals: capital
  capture by territorial advance is implausible. Industrial strangulation
  becomes the natural primary win condition.
- **`roadmap.md` issue #17 (M3, campaign→theatre translation)** — the
  front-movement function needs a hard cap that respects WWI pace. The
  roadmap already flags "diminishing returns cap" — make it severe.
- **`.claude/skills/visual-design/SKILL.md`** — theatre section is broadly
  correct but does not mention the diegetic interaction rule or the
  manpower-only token rule. Add both.
- **`roadmap-review-visual-design.md`** — review notes about parchment-
  specific recommendations are still valid for theatre (it's still parchment).
  No changes needed to this file.
- **`src/shared/typography.ts`** — needs to add Architects Daughter to the
  font stack as a fourth face (used only on the theatre layer for pencil
  marks). Should be loaded with `font-display: swap` and the same fallback
  pattern as the others.

## §10 Out of scope, will be done later

These are real things that need to happen but are not part of issue #65 and
should not be implemented as part of producing the mockups:

- Production component code for any theatre layer feature
- The `theatre-map.json` data file (issue #6)
- The `auto-resolve.ts` logic (issue #10)
- The `win-conditions.ts` logic (issue #12)
- Save/load to localStorage or IndexedDB (issue #81)
- The animation library choice for transitions (M4, issue #19)
- The actual sector polygon coordinates and front-line geometry — mockups use
  approximate hand-drawn shapes

## References

- `roadmap.md` — issue #65 (this spec's parent), and the M2 milestone broadly
- `CLAUDE.md` — visual identity table and game architecture
- `game-design-document.md` — theatre layer overview, win conditions, turn structure
- `session-handoff.md` — UI/UX lessons from the campaign prototype that informed
  several constraints (no redundant panels, scarcity through resistance, defaults
  must demonstrate the mechanic)
- `.claude/skills/visual-design/SKILL.md` and `references/period-aesthetics.md` —
  parchment cartographic style guidance, period colour vocabulary
- `.claude/skills/game-design/SKILL.md` — multi-front problem framing, peak-end
  rule, meaningful choice criteria
- `roadmap-review-game-design.md` — M2 review notes, especially the auto-resolve
  narrative hook and the surplus-to-baseline ratio knob
- `roadmap-review-visual-design.md` — typography pull-forward, resource colour
  cross-layer consistency
- `src/shared/resources.ts` — `RES_COL`, `RES_OUTCOME`, `LEVEL_COL` constants
- `src/shared/typography.ts` — existing font stack
- `src/shared/touch-targets.ts` — 44pt minimum
- Memory entries: `feedback_diegetic_ui.md`, `project_wwi_pace.md`,
  `feedback_no_theatre_time_pressure.md`, `project_resource_visualisation.md`
