# Skies of the Great War — Development Roadmap

> Exported from chainlink issue tracker, 2026-04-04 (post-review revision)
> 13 milestones, 81 issues

## Design Decisions

- **Session model:** The theatre layer persists between sessions. A full theatre campaign (30-40 turns) spans multiple play sessions of 30-60 minutes each. The atomic session unit is 1-3 theatre turns.
- **Campaign pauses during action:** When the player zooms into the action layer, the campaign timer pauses. This is intentional — the player should not be punished for engaging with dogfights, bombing runs, or recon.
- **Visual identity is structural:** The three-layer aesthetic (parchment/tabletop/newsreel) is not polish — it's a core feature. Font selection, touch targets, and basic animation happen early (M1-M3), not at the end.

---

## M1: App Scaffolding (0/8)
*Running React app with Vite+TS, Zustand store, layer shells, shared constants, typography, touch standards*

- [ ] **#1** Initialize Vite + React + TypeScript project
  - `npm create vite`, configure directory structure (`src/layers/theatre/`, `campaign/`, `action/`, `store/`, `shared/`, `types/`), verify dev server runs
- [ ] **#2** Define TypeScript types from prototype
  - Extract interfaces from prototype state shapes: `Segment`, `Resources`, `AircraftPool`, `AirActionType`, `PulseResult`, `DispatchEntry`. Placeholder types for theatre and action layers.
- [ ] **#3** Set up Zustand store with slices
  - Combined store with `gameSlice` (currentLayer, gamePhase), `campaignSlice` (mirrors prototype useState), `theatreSlice` (sectors, turn), `rosterSlice` (pilots). Each slice in own file.
- [ ] **#4** Create layer shell components and layer switcher
  - `TheatreLayer`, `CampaignLayer`, `ActionLayer` placeholder components. `App.tsx` reads `currentLayer` from store, renders appropriate layer. Hard switch, no animation yet.
- [ ] **#5** Extract shared constants and helpers from prototype
  - Move constants (`TIMING`, `RESOURCES`, `FRONT`, `AIRCRAFT`) and pure functions (`segStr`, `decidingFactor`, `resLevel`, `rollSegment`) from `frontline-v7.jsx` into `src/shared/`
- [ ] **#63** Select period typography stack
  - Choose web fonts before any UI is built. Theatre: period serif (EB Garamond or Libre Caslon). Campaign: condensed stencil (Barlow Condensed or Oswald). Action: typewriter (IBM Plex Mono or Special Elite). Define as shared constants. Must happen before M2.
- [ ] **#64** Establish 44pt minimum touch target standard
  - Define shared CSS/constants for minimum touch target sizing (44pt general, 48pt for time-pressure controls). Create shared component wrapper or CSS class. Enforce from first interactive element.
- [ ] **#76** Define GameConfig type for tuning knobs
  - `src/types/config.ts`: single `GameConfig` interface holding all tuning surfaces — pulse timing, attrition rates, air bonuses, resource weights, surplus-to-baseline ratio. Injectable into systems so theatre-level modifiers can adjust campaign constants.

---

## M2: Theatre Map Prototype (0/10)
*Playable theatre layer with sector map, resource allocation, auto-resolution, win conditions, session persistence*

- [ ] **#65** Create theatre layer UI mockups
  - Low-fidelity mockups of: sector map layout, resource allocation panel, turn flow screens, results display. Spatially accurate for iPad dimensions. Inform component sizing and touch target placement.
- [ ] **#6** Design theatre map data structure `blocked by #1`
  - Create `theatre-map.json` with 8 sectors: names, polygon coords, resource generators, adjacency, starting control, capital flags. Define full `Sector` type.
- [ ] **#7** Render SVG theatre map with sector polygons
  - `TheatreMap.tsx`: SVG paths with parchment fills, color-coded by control, clickable sectors, front line as thick ink stroke, wooden block indicators.
- [ ] **#8** Theatre resource allocation UI
  - `ResourceAllocation.tsx`: show baseline + surplus, drag/tap to redistribute, scarcity-through-resistance (controls disable when empty), summary panel. Surplus-to-baseline ratio (~30%) is the critical knob.
- [ ] **#9** Sector selection and turn flow
  - `TurnFlow.tsx`: phases (Review → Allocate → Select → Resolve → Update), tap sector to fight, others marked for auto-resolve, Begin Turn button. Theatre persists between sessions — atomic unit is 1-3 turns.
- [ ] **#10** Auto-resolution system
  - `auto-resolve.ts`: weighted roll per unattended sector based on resources vs enemy strength. Front movement, summary text per sector.
- [ ] **#77** Auto-resolve narrative hooks
  - Auto-resolved sectors generate brief narrative: "Ypres held by a thread", "unexpected breakthrough at Alsace". Gives player motivation to fight there next turn. Template-based: 3-5 templates per outcome type.
- [ ] **#11** Theatre turn results display
  - `TurnResults.tsx`: animated map update showing outcomes, front redraws, dispatch summary, resource windfall on capital capture, Continue/Next Turn buttons.
- [ ] **#12** Win condition checks
  - `win-conditions.ts`: capital capture check, industrial strangulation threshold, provisional capital dice roll, victory/defeat screen.
- [ ] **#81** Implement theatre save/load state
  - Save full theatre state (sectors, resources, front positions, turn count, roster, AI combo) to localStorage or IndexedDB. Auto-save after each theatre turn. Load on app start.

---

## M3: Campaign Layer Integration (0/9)
*Port validated prototype into app, wired to Zustand, connected to theatre layer*

- [ ] **#66** Create campaign layer UI mockups
  - Mockup final segment card layout at iPad dimensions. Must resolve: 180pt card height, 6 cards fitting on screen (scrolling or two-row?), field-report styling with padding, air bonus badge placement.
- [ ] **#13** Decompose prototype into component tree `blocked by #3`
  - Break 631-line `FrontlineV5` into: `CampaignLayer`, `AllocationPhase`, `BattlePhase`, `SegmentCard`, `ReservesPanel`, `AirActionPanel`, `DispatchLog`, `CampaignResults`.
- [ ] **#14** Move campaign state to Zustand store
  - Replace all `useState` calls (segments, reserves, aircraft, pulseCount, pulseTimer, score, log, phase, etc.) with store reads/writes.
- [ ] **#15** Port pulse engine to store action
  - Move `handlePulse` into store action or dedicated `pulse-engine.ts`. Timer logic becomes `usePulseTimer` hook. All functional setState updates preserved.
- [ ] **#16** Wire theatre-to-campaign data flow `blocked by #9`
  - On zoom in: populate campaign slice from selected sector resources and enemy strength. Map sector levels to segment allocations. Theatre allocation sets the total pool; player distributes across segments.
- [ ] **#17** Wire campaign-to-theatre results flow
  - On campaign end: compute margin of victory, translate to front movement (with diminishing returns cap), check local capital capture, compute resource windfall, return to theatre.
- [ ] **#78** War correspondent dispatch on campaign return
  - Brief narrative summary on return to theatre. "The lines at Verdun held despite fierce bombardment." Template-based, referencing actual campaign events. Creates the peak-end moment.
- [ ] **#67** Prototype basic front-line animation
  - Segment colour intensity reflects combat pressure (darker = more). Pulse result arrows animate with slide, not fade. Validates core feedback loop early.
- [ ] **#18** Campaign layer full-flow smoke test
  - Verify: theatre allocate → select sector → zoom campaign → allocate resources → 6 pulses → score → return theatre → map updates. Time a full loop — target under 6 min per theatre turn.

---

## M4: Zoom Transitions (0/5)
*Seamless animated zoom between layers — no menus, just scale*

- [ ] **#19** Add animation library and transition wrapper `blocked by #13`
  - Install Framer Motion (or pure CSS). `LayerTransition.tsx` wraps both layers, manages cross-fade. Transition states: idle, zooming-in, zooming-out.
- [ ] **#20** Theatre-to-campaign zoom animation `blocked by #11`
  - Selected sector scales up while others fade, cross-fade to campaign. Camera origin at sector center. ~800ms total. Add 200ms "here you are" highlight on re-entry.
- [ ] **#21** Campaign-to-theatre zoom-out animation
  - Reverse of zoom-in: campaign scales down, cross-fades to theatre map centered on sector. Triggered by completion or zoom-out button.
- [ ] **#22** Campaign-to-action zoom placeholder
  - Zoom from campaign to action layer when air action clicked. **Campaign timer PAUSES** — intentional design, not an exploit. Action layer still placeholder.
- [ ] **#23** Action-to-campaign zoom-out
  - Player can leave action at any time, AI takes over (at disadvantage). Campaign timer resumes. Air bonus persists on segment. No time penalty for participating.

---

## M5: Dogfight God-Mode (0/8) ⚠️ VALIDATION MILESTONE
*Playable dogfight with tactical orders and autonomous pilots. Most novel mechanic — needs validation.*

- [ ] **#80** Create dogfight UI mockups
  - Mockup top-down view at iPad dimensions, order panel layout. **Start with 3-4 orders, not 7.** Validate touch targets (48pt minimum under time pressure). Resolve button overflow concern.
- [ ] **#24** Dogfight canvas and camera setup `blocked by #22`
  - `DogfightCanvas.tsx`: Canvas 2D top-down view, camera follows squadron center of mass, cloud layer background, ground reference at edges. iPad landscape 1024x768.
- [ ] **#25** Aircraft entity system
  - `Aircraft.ts`: position, heading, speed, health, type, side. Constant forward motion with turn rate. Top-down silhouettes with trails.
- [ ] **#26** Order system UI
  - Start with 3-4 core orders (Flank, Dive, Protect, Disengage). Validate each feels distinct before expanding to 7. Apply "why would I ever NOT" test. Touch buttons + keyboard shortcuts.
- [ ] **#27** Pilot AI behavior — order execution
  - `PilotAI.ts`: state machine per pilot. Skill-modified accuracy: `executionQuality = 0.4 + (medals/6)*0.6`. Consider order commitment (5-10s lockout before new order). Green recruits fumble, aces execute crisply.
- [ ] **#28** Enemy AI for dogfight
  - `EnemySquadronAI.ts`: issues orders on 5-10s timer, random-weighted by situation. Placeholder for archetype-driven behavior in M9.
- [ ] **#29** Combat resolution system
  - `Combat.ts`: auto-fire within range/arc, hit probability from range + deflection + skill + jamming. 2-3 hits to down. Damage trails. Kill attribution. Consider minimum 30s engagement before any plane downed.
- [ ] **#30** Dogfight outcome and campaign integration
  - Compute result on end, translate to air bonus (scaled for partial), deduct aircraft losses from campaign pool, zoom-out return. Note: +1.5 on ~1.4 weighted segment = 107% increase — test whether this makes action mandatory.

---

## M6: Bombing Run (0/6)
*Approach angle selection, flak, bomb targeting with recon-modified accuracy*

- [ ] **#31** Bombing canvas and ground targets `blocked by #24`
  - `BombingCanvas.tsx`: reuses M5 canvas infra. Scrolling terrain with target markers (factories, rail yards, supply dumps) from theatre map data.
- [ ] **#32** Approach angle selection
  - Pre-run mini-map for approach vector. Flak concentrations shown (more detail if reconned). Angle determines flak exposure. This is the unique decision — must feel like threading a needle.
- [ ] **#33** Flak system
  - `Flak.ts`: batteries fire at approaching bombers. Visual puffs + screen shake. Damage probability from range + enemy Equipment level.
- [ ] **#34** Bomb drop mechanic
  - Player triggers release over target. Accuracy from recon intel, altitude, bomber damage. Partial destruction tracked (50% factory = 50% output).
- [ ] **#35** Fighter escort integration
  - Assigned fighters fly alongside. Enemy interceptors engage escort. Without escort: bombers vulnerable. Reuses dogfight combat system. Consider simplified first pass (flat interception reduction).
- [ ] **#36** Bombing results and campaign integration
  - +1.2 air bonus, aircraft losses deducted, target damage persists across theatre turns with gradual repair. Balance: if persistent damage is too strong, bombing dominates dogfight long-term.

---

## M7: Reconnaissance (0/5)
*Intel-gathering flights with no offensive capability, 5-turn persistence*

- [ ] **#37** Recon route planning `blocked by #24`
  - Pre-run: plot waypoints over enemy territory on mini-map. More waypoints = more intel but more exposure. Known flak shown if previously reconned.
- [ ] **#38** Recon flight execution
  - Planes follow route automatically. Player can adjust mid-flight. Camera shake from near-miss flak. No weapons — pilots cannot fight back.
- [ ] **#39** Intelligence gathering system
  - `intelligence.ts`: each waypoint generates intel, stored with 5-turn freshness counter. Visual: recon photos that yellow and fade. Bombing accuracy bonus. Secondary payoff: reveal enemy resource allocation for next campaign.
- [ ] **#40** Enemy interception risk
  - Enemy fighters may scramble. Recon planes can only evade. Evasion success from pilot skill + route planning (edge of territory = safer).
- [ ] **#41** Recon results and campaign integration
  - +0.8 air bonus, aircraft losses from recon pool, intel stored in theatre state, post-run photo review. The recon→bomb pipeline must outperform double-dogfight or recon is a trap.

---

## M8: Named Pilots & Roster (0/7)
*15-pilot roster with medals, permadeath, bench decisions, replacement system*

- [ ] **#42** Pilot data model and name pools
  - `pilot.ts` interface. Curated name pools (British, French, German, American). Pilot generation function. Starting roster: 15 green pilots.
- [ ] **#43** Roster management UI
  - `RosterPanel.tsx`: list all 15 with name/medals/kills/status. Assign active (10) vs bench (5). Highlight bench risk. Default to "same roster" with quick-swap to avoid per-turn slog.
- [ ] **#44** Pre-campaign pilot selection
  - Choose which 10 to bring. Show sector risk for bench pilots. Assign pilots to aircraft types.
- [ ] **#45** Medal progression system
  - `progression.ts`: 5 kills = 1 medal (up to 6). Medal award shown post-campaign. Feeds into dogfight execution quality.
- [ ] **#46** Permadeath and loss system
  - Active: die in action. Bench: collapse exposure roll (medal-modified survival). Recruits: lost in collapses. Death notification must interrupt flow — "Lt. Beaumont. 3 medals. Shot down over Verdun." Pilot personality quirks from combat history ("steady under fire", "reckless").
- [ ] **#47** Pilot identity in action layer `blocked by #29`
  - Replace anonymous aircraft with named pilots. Name shown near aircraft. Kill attribution to specific pilot. Named loss notifications.
- [ ] **#48** Replacement pilot system
  - Finite recruit pool provides 0-medal replacements. Pool depletes over theatre campaign — losses compound. Pool size is a critical knob: too large = losses don't matter, too small = unrecoverable death spirals.

---

## M9: AI Opponent System (0/8)
*Three-archetype AI with difficulty-weighted combinations and character voice*

- [ ] **#79** Define theatre and campaign AI interfaces early
  - Split from #49: `TheatreCommanderAI` and `CampaignGeneralAI` interfaces can be built without waiting for dogfight. Only `AceAI` depends on M5. Unblocks AI testing during M2-M3.
- [ ] **#49** AI architecture and interfaces
  - `AIOpponent.ts` composes three archetype instances into one opponent. Clean strategy pattern interfaces for multiplayer fork.
- [ ] **#50** Theatre Commander archetypes
  - 4 types: Aggressive (overcommits), Conservative (spreads evenly), Opportunist (targets weakest), Attritional (targets factories). Resource allocation + sector targeting.
- [ ] **#51** Campaign General archetypes
  - 4 types: Flanker (loads flanks), Hammer (center), Defender (even + reserves), Blitzer (all-in early, fades). Front allocation + pulse response.
- [ ] **#52** Ace archetypes `blocked by #30`
  - 4 types: Aggressive, Defensive, Escort-focused, Hunter (ignores bombers, targets fighters/recon). Dogfight order selection logic.
- [ ] **#53** Difficulty combination logic
  - `difficulty.ts`: Easy = contradictory (AI undermines itself), Medium = neutral (competent, not synergistic), Hard = complementary (coherent pressure). Weighted random selection.
- [ ] **#54** Opponent character voice
  - `opponent-quotes.ts`: 3-5 quoted philosophies per archetype. Pre-campaign briefing. Post-turn reactions: "You think holding Verdun matters? I'll take your factories." Opponents feel alive.
- [ ] **#55** Archetype visibility toggle
  - Settings: show/hide opponent archetypes. Shown = names in briefing. Hidden = quote only, infer from play. Hidden + Hard = hardest mode.

---

## M10a: Theatre Visual Identity (0/2)
*Apply parchment cartographic style to theatre layer*

- [ ] **#56** Theatre layer: parchment cartographic style `blocked by #11`
  - Parchment texture, ink-line borders with hand-drawn irregularity, period serif typography, wooden block tokens, warm sepia palette. Selected block glow: warm lamplight, not blue digital highlight.
- [ ] **#68** SVG parchment texture and hand-drawn line generation
  - SVG `feTurbulence` + `feDisplacementMap` for border irregularity. Parchment tiling at `#F5E6D3` base with `#E8D5B7` fold lines. Wooden block bevel/shadow. Front line redraws as ink stroke animation (stroke-dasharray).

---

## M10b: Campaign Visual Identity (0/3)
*Apply tabletop terrain model aesthetic to campaign layer*

- [ ] **#57** Campaign layer: tabletop terrain model `blocked by #18`
  - Earth/grass/mud textures, scorched earth behind movement, Major Push purple timer (`#6B4C7A`).
- [ ] **#69** Front-line churning animation system
  - Animate intensity based on combat pressure. Dust, small flashes on active segments. Scorched earth trail. CSS animation intensity tied to segment strength differential.
- [ ] **#70** Segment card field-report restyling
  - Cards as field dispatch papers: `#E8DFD0` card stock, pencil-grey borders, stencil headers, typewriter deciding-factor text. Brass pin result arrows with slide-in bounce.

---

## M10c: Action Visual Identity (0/3)
*Apply colorized newsreel aesthetic to action layer*

- [ ] **#58** Action layer: colorized newsreel `blocked by #30`
  - Desaturated base + hand-tinted accents, camera shake on hits.
- [ ] **#71** Film grain and post-processing pipeline
  - Static tiled texture with CSS opacity animation (NOT per-frame noise — iPad performance). Vignette via radial gradient. Flicker at 1-2% brightness variation. Must maintain 60fps on base iPad.
- [ ] **#72** Hand-tinted selective colour system
  - Desaturated sepia base with selective colour: sky (pale blue wash), aircraft wings (squadron colours), tracer fire. CSS filter pipeline: grayscale + sepia base, colour overlay on elements.

---

## M10d: Cross-Layer Polish & iPad (0/7)
*Resource colour consistency, transitions, accessibility, performance*

- [ ] **#73** Resource colour cross-layer consistency
  - Per-layer resource colour adaptations as shared constants. Manpower: `#A0522D` (theatre) → `#8B5E5E` (campaign) → `#7A6060` (action). Same pattern for Equipment and Food. Verify identifiability across all palettes.
- [ ] **#59** Typography and iconography pass
  - Period-appropriate font stack finalized across all layers. SVG icons for resources, aircraft, medals replacing all emoji placeholders.
- [ ] **#60** Zoom transition visual refinement
  - Texture crossfades between layers (parchment → terrain → grain), palette temperature shifts, smooth colour cross-fade.
- [ ] **#74** Colour-blind accessibility pass
  - All colour-coded info has non-colour redundant encoding. Mini bars need shape/pattern differentiation. Test with simulated deuteranopia and protanopia.
- [ ] **#61** Sound design hooks
  - `audio.ts`: event system for pulse tick, Major Push, aircraft launch, combat, front movement. Architecture only, no assets yet. Prioritize Major Push audio cue if any sound ships early.
- [ ] **#62** iPad-specific touch refinements
  - Verify 44pt targets throughout, pinch-to-zoom for layer transitions, drag gestures for allocation, Safari/iPad testing.
- [ ] **#75** iPad performance profiling
  - Profile full render pipeline on base iPad and iPad Air. Canvas + grain + vignette in action. SVG filters in theatre. CSS animations in campaign. Target: 60fps sustained.

---

## Dependency Map

```
M1 (#1 Vite init)    ──→ M2 (#6 Map data)
M1 (#3 Zustand)      ──→ M3 (#13 Decompose prototype)
M2 (#9 Turn flow)     ──→ M3 (#16 Theatre→Campaign wiring)
M2 (#11 Results)      ──→ M4 (#20 Zoom animation)
M3 (#13 Decompose)    ──→ M4 (#19 Transition wrapper)
M4 (#22 Action zoom)  ──→ M5 (#24 Dogfight canvas)
M5 (#24 Canvas)       ──→ M6 (#31 Bombing canvas)
M5 (#24 Canvas)       ──→ M7 (#37 Recon route)
M5 (#29 Combat)       ──→ M8 (#47 Pilot identity)
M5 (#30 Outcome)      ──→ M9 (#52 Ace archetypes only)
M2 (#11 Results)      ──→ M10a (#56 Theatre polish)
M3 (#18 Smoke test)   ──→ M10b (#57 Campaign polish)
M5 (#30 Outcome)      ──→ M10c (#58 Action polish)
```

Note: Theatre/Campaign AI interfaces (#79) are NOT blocked by dogfight — they can be built during M2-M3.

---

## Known Balance Questions (Test During Development)

- **Air bonus magnitude:** +1.5 dogfight on ~1.4 weighted segment = 107% increase. May make action layer mandatory, not optional.
- **Surplus-to-baseline ratio:** Start at 30%, test both directions. Too small = trivial allocation. Too large = entire game.
- **Campaign score → front movement:** Needs diminishing returns cap to prevent snowballing.
- **Recon viability:** Recon→bomb pipeline must outperform double-dogfight over two turns.
- **Recruit pool size:** Too large = losses trivial. Too small = unrecoverable death spirals by turn 4.
- **Theatre turn duration:** Target under 6 min including campaign. Time budget: allocation <60s, auto-resolve display <30s.

---

*13 milestones, 81 issues. Reviews incorporated 2026-04-04.*
