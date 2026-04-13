# Skies of the Great War — Roadmap

Built solo with AI assistance. Phases are chunky — each one is a design + implement + verify
cycle completable in one or two sessions. Visual identity is baked into each phase, not deferred.
Each phase assumes: roadmap phase → `/design` produces a design doc → `/writing-plans` → implement → verify.

Foundation documents: `game-design-document.md` (vision + spec), `session-handoff.md` (architecture + rationale), `CLAUDE.md` (constraints).

**Starting point:** M1 scaffolding is complete — Vite+React+TS, Zustand store with 4 slices,
layer shell components, shared constants/helpers extracted from prototype, typography selected
(EB Garamond, Barlow Condensed, Special Elite), touch target standards defined (44pt/48pt).

---

## Phase 1: Theatre Map

**Goal:** A playable theatre layer where the player manages the war across sectors — allocating
resources, choosing where to fight, and watching the rest auto-resolve with narrative results.

**Build:**
- `theatre-map.json` — 8 sectors with names, SVG polygon coords, resource generators, adjacency, starting control, capital flags
- `TheatreMap.tsx` — SVG sector map with parchment cartographic style (feTurbulence + feDisplacementMap for hand-drawn borders, parchment tile fill, ink-line strokes, wooden block tokens with bevel/shadow)
- `ResourceAllocation.tsx` — baseline + surplus display, tap to redistribute, scarcity-through-resistance (controls dim to faded-ink `#B8A890` when empty), surplus-to-baseline ratio starting at 30%
- `TurnFlow.tsx` — phase progression: Review → Allocate → Select → Resolve → Update. Tap sector to fight, others marked for auto-resolve
- `auto-resolve.ts` — weighted roll per unattended sector, narrative hook generation ("Ypres held by a thread"), 3-5 templates per outcome type
- `TurnResults.tsx` — animated map update with ink-stroke front redraws (stroke-dasharray animation, 800ms), dispatch summary, resource windfall on capital capture
- `win-conditions.ts` — capital capture check, industrial strangulation threshold, provisional capital dice roll, victory/defeat screen
- Theatre state save/load to localStorage — auto-save after each turn, load on app start

**Test checkpoint:** Start the dev server. Play 5 theatre turns. Allocate resources — verify
controls disable when surplus is empty. Auto-resolve produces narrative text. Front lines
redraw with animation. Time allocation + auto-resolve phases — target under 3 minutes combined.
Run `npm run build` — zero errors.

---

## Phase 2: Campaign Integration

**Goal:** The validated campaign prototype is ported into the React app and wired to the theatre
layer. A player can zoom from theatre into a campaign, fight a 3-minute battle, and return with
results updating the theatre map.

**Build:**
- Decompose `frontline-v7.jsx` (632 lines) into component tree: `CampaignLayer`, `AllocationPhase`, `BattlePhase`, `SegmentCard`, `ReservesPanel`, `AirActionPanel`, `DispatchLog`, `CampaignResults`
- Migrate all `useState` to Zustand `campaignSlice` reads/writes
- `pulse-engine.ts` + `usePulseTimer` hook — move `handlePulse` to store action, functional setState preserved
- Theatre-to-campaign data flow: sector resource levels set the campaign's total pool, player distributes across 6 segments
- Campaign-to-theatre results flow: score → front movement (with diminishing returns cap), capital capture → resource windfall
- War correspondent dispatch on return to theatre ("The lines at Verdun held despite fierce bombardment")
- Apply campaign visual direction: segment cards as field dispatch papers (`#E8DFD0` card stock, pencil-grey borders, stencil headers), Major Push purple timer (`#6B4C7A`)
- Basic front-line animation: segment colour intensity reflects combat pressure

**Test checkpoint:** Full loop — theatre allocate → select sector → campaign allocate → 6 pulses
→ score → return to theatre → map updates with front movement. Time a full theatre turn
including campaign — target under 6 minutes. Run `npm run build` — zero errors.

---

## Phase 3: Zoom Transitions

**Goal:** Seamless animated zoom between layers — no menus, no loading screens, just scale.
The parchment-to-tabletop-to-newsreel shift is the game's signature interaction.

**Build:**
- `LayerTransition.tsx` — wraps layers, manages transition states (idle, zooming-in, zooming-out)
- Theatre-to-campaign: selected sector scales up while others fade, texture cross-fade from parchment to earth, camera origin at sector center, ~800ms total
- Campaign-to-theatre: reverse zoom, 200ms "here you are" highlight on the sector just fought
- Campaign-to-action: placeholder zoom with campaign timer pause (not an exploit — intentional design, but add brief animation-lock to prevent rapid toggling)
- Action-to-campaign: player can leave at any time, AI takes over at disadvantage, campaign timer resumes
- Palette temperature shifts during transitions (warm sepia → neutral earth → cool desaturated)

**Test checkpoint:** Navigate all four transitions. Verify campaign timer pauses during action
zoom and resumes on return. Verify re-entry highlight. Verify transition feels physical (~800ms,
not sluggish or jarring). Run `npm run build` — zero errors.

**Research needed:** Framer Motion vs pure CSS transitions for React — evaluate which is lighter
for this use case.

---

## Phase 4: Dogfight God-Mode

**Goal:** Playable dogfight where the player issues tactical orders and watches their squadron
execute. This is the game's most novel mechanic — it must feel powerful, not like pressing
buttons on a screensaver. **Validation milestone.**

**Build:**
- `DogfightCanvas.tsx` — Canvas 2D top-down view, camera follows squadron center of mass, newsreel aesthetic (desaturated base + hand-tinted accents via CSS filter pipeline), cloud layer, ground reference at edges in desaturated campaign earth palette
- `Aircraft.ts` — position, heading, speed, health, type, side. Constant forward motion with turn rate. Near-black silhouettes (`#1A1A1A`) with sepia trails (`#8B7355`). Allied blue tint (`#6B7F99`), enemy feldgrau (`#4D5D53`)
- Order system UI — start with 3-4 core orders (Flank, Dive, Protect, Disengage). 48pt touch targets under time pressure. Semi-transparent overlay panel (`rgba(20,16,12,0.7)`). Validate each feels distinct before expanding. Keyboard shortcuts + touch
- `PilotAI.ts` — state machine per pilot, skill-modified execution (`0.4 + (medals/6)*0.6`). Order commitment: 5-10s lockout. Green recruits fumble visibly, aces execute crisply
- `EnemySquadronAI.ts` — issues orders on 5-10s timer, random-weighted by situation
- `Combat.ts` — auto-fire within range/arc, hit probability from range + deflection + skill. 2-3 hits to down. Minimum 30s engagement before any plane downed. Damage trails, kill attribution
- Dogfight outcome → campaign air bonus (scaled for partial), aircraft losses deducted from pool
- Film grain overlay (static tiled texture with CSS opacity animation, NOT per-frame noise)

**Test checkpoint:** Zoom into dogfight from campaign. Issue a Flank order — verify squadron
visibly changes formation. Issue Protect — verify different behavior. Watch a 60-second
engagement. Verify at least one order-to-execution moment feels powerful. Verify air bonus
applies on zoom-out. Profile on target device — must sustain 60fps with grain overlay.
Run `npm run build` — zero errors.

**Research needed:** Canvas 2D game loop patterns in React (requestAnimationFrame + component
lifecycle). CSS filter pipeline for newsreel desaturation + selective colour.

---

## Phase 5: Bombing & Recon

**Goal:** All three action types are playable with distinct strategic niches. The recon-to-bomb
pipeline must outperform double-dogfight over two turns, or recon has no reason to exist.

**Build:**
- `BombingCanvas.tsx` — reuses Phase 4 canvas infra, scrolling terrain with target markers from theatre map data
- Approach angle selection — pre-run mini-map showing flak concentrations (more detail if reconned), angle determines flak exposure. Must feel like threading a needle
- `Flak.ts` — batteries fire at approaching bombers, visual puffs + screen shake, damage probability from range + enemy Equipment level
- Bomb drop mechanic — player triggers release, accuracy from recon intel + altitude + bomber damage, partial destruction tracked (50% factory = 50% output)
- Fighter escort — simplified first pass: assigned fighters reduce interception probability by flat percentage (full dogfight sim deferred)
- Recon route planning — plot waypoints on mini-map, more waypoints = more intel + more exposure
- Recon flight execution — planes follow route, camera shake from near-miss flak, no weapons
- `intelligence.ts` — waypoint intel with 5-turn freshness counter, visual as yellowing photos (sepia filter 20% to 90%), reveals enemy resource allocation as secondary payoff
- Enemy interception risk — enemy fighters may scramble, recon planes can only evade
- Results integration: bombing +1.2 bonus + persistent theatre damage, recon +0.8 bonus + intel stored

**Test checkpoint:** Run recon over a target. Next turn, bomb the same target — verify accuracy
bonus from intel. Compare: recon+bomb over 2 turns vs dogfight+dogfight. Recon pipeline must
yield more total value. Verify target damage persists across theatre turns with gradual repair.
Run `npm run build` — zero errors.

---

## Phase 6: Named Pilots & Roster

**Goal:** Abstract aircraft pools become named individuals. The first pilot death should
interrupt flow and make the player feel it.

**Build:**
- `pilot.ts` — pilot data model, curated name pools (British, French, German, American), generation function. Starting roster: 15 green pilots
- `RosterPanel.tsx` — list all 15 with name/medals/kills/status. Assign active (10) vs bench (5). Highlight bench risk. Default to "same roster" with quick-swap
- Pre-campaign pilot selection — choose 10, show sector risk for bench. Assign to aircraft types
- `progression.ts` — 5 kills = 1 medal (up to 6). Medal award shown post-campaign
- Permadeath — active: die in action. Bench: collapse exposure roll (medal-modified survival). Death notification interrupts flow: "Lt. Beaumont. 3 medals. Shot down over Verdun."
- Pilot identity in action layer — replace anonymous aircraft with named pilots. Name near aircraft, kill attribution, named loss notifications
- Replacement system — finite recruit pool, 0-medal replacements, pool depletes over campaign
- Pilot personality quirks from combat history ("steady under fire", "reckless") — string templates

**Test checkpoint:** Play 3 theatre turns with action layer engagement. Verify a pilot earns
a medal after 5 kills. Force a sector collapse — verify a bench pilot can die. Verify recruit
pool depletes. Check that death notification is not a dismissable toast — it must pause.
Run `npm run build` — zero errors.

---

## Phase 7: AI Opponent

**Goal:** The AI feels like a person with a strategy, not a random number generator. Three
archetypes combine into one opponent that the player can learn to read.

**Build:**
- `AIOpponent.ts` — composes three archetype instances, clean strategy pattern interfaces (multiplayer-ready)
- Theatre Commander archetypes (4): Aggressive, Conservative, Opportunist, Attritional — resource allocation + sector targeting logic
- Campaign General archetypes (4): Flanker, Hammer, Defender, Blitzer — front allocation + pulse response
- Ace archetypes (4): Aggressive, Defensive, Escort-focused, Hunter — dogfight order selection
- `difficulty.ts` — Easy = contradictory combos, Medium = neutral (competent, not synergistic), Hard = complementary (coherent pressure)
- `opponent-quotes.ts` — 3-5 quoted philosophies per archetype. Pre-campaign briefing. Post-turn reactions ("You think holding Verdun matters? I'll take your factories while you celebrate.")
- Archetype visibility toggle — shown = names in briefing, hidden = quote only, hidden + hard = hardest mode

**Test checkpoint:** Play on Easy — verify AI visibly works against itself (e.g., aggressive
commander starves the sectors his defender general needs). Play on Hard — verify coherent
pressure. Verify opponent quotes display before campaigns and react to outcomes.
Run `npm run build` — zero errors.

**Note:** Theatre Commander and Campaign General interfaces can be designed alongside Phase 2.
Only Ace AI depends on Phase 4 being complete.

---

## Phase 8: Cross-Layer Polish & iPad

**Goal:** The game is shippable on iPad. Visual identities are consistent, accessible,
and performant.

**Build:**
- Resource colour cross-layer consistency — per-layer adaptations as shared constants: Manpower `#A0522D` / `#8B5E5E` / `#7A6060`, same for Equipment and Food
- Typography and iconography final pass — SVG icons replace all emoji placeholders
- Zoom transition texture refinement — parchment dissolves into earth dissolves into grain
- Colour-blind accessibility — all colour-coded info has non-colour redundant encoding (shape/pattern on mini bars). Test with simulated deuteranopia and protanopia
- `audio.ts` — event hooks for pulse tick, Major Push, aircraft launch, combat. Prioritize Major Push audio cue if any sound ships
- iPad touch refinements — verify 44pt throughout, pinch-to-zoom gestures, drag for allocation, Safari testing
- Performance profiling — canvas + grain + vignette in action, SVG filters in theatre, CSS animations in campaign. Target: 60fps sustained on base iPad

**Test checkpoint:** Run a full theatre campaign (5+ turns with campaign and action engagement)
on iPad. Verify 60fps sustained in all layers. Verify all touch targets meet 44pt minimum. Run
colour-blind simulation — verify all information readable without colour alone.
Run `npm run build` — zero errors.

---

## Dependency Map

```
Phase 1 (Theatre)      → Phase 2 (Campaign Integration)
Phase 2                → Phase 3 (Zoom Transitions)
Phase 3                → Phase 4 (Dogfight) ← VALIDATION
Phase 4                → Phase 5 (Bombing & Recon)
Phase 4                → Phase 6 (Named Pilots)
Phase 4 (partial)      → Phase 7 (AI) — theatre/campaign AI can start during Phase 2
Phase 1-7              → Phase 8 (Polish & iPad)
```

Phases 6 and 7 can run in parallel after Phase 4.

---

## Balance Questions (Track During Development)

These are knobs, not phase deliverables. Test and tune as each phase lands:

- **Surplus-to-baseline ratio** (Phase 1): Start at 30%. Too small = trivial, too large = entire game
- **Campaign score → front movement** (Phase 2): Needs diminishing returns cap to prevent snowballing
- **Air bonus magnitude** (Phase 4): +1.5 on ~1.4 weighted = 107% increase — may make action mandatory
- **Recon viability** (Phase 5): recon+bomb must outperform dogfight+dogfight over two turns
- **Recruit pool size** (Phase 6): Too large = losses trivial, too small = unrecoverable spirals
- **Theatre turn duration** (Phase 2): Target under 6 min including campaign
