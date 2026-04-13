# Roadmap Review — Visual Design Perspective

> Reviewed 2026-04-04 against the established visual identity in CLAUDE.md, SKILL.md, and the GDD.

---

## 1. M10 Scope Concerns

Seven issues for the entire visual identity of three distinct layers is dangerously compressed. The real problem is that #56, #57, and #58 are each full-milestone efforts, not single issues. Theatre parchment alone requires: custom SVG texturing, hand-drawn line generation, wooden block rendering with bevel/shadow, and a period typography stack. Campaign needs animated front-line churning, devastation trail rendering, and segment card restyling. Action needs a full post-processing pipeline (grain, vignette, flicker, desaturation + selective hand-tint).

**What is missing entirely from M10:**

- Resource colour cross-layer consistency pass (the SKILL.md requires adapted versions of each resource colour per layer)
- Colour-blind accessibility for segment cards (the GDD calls for colour + non-colour encoding on mini bars)
- Contrast ratio verification against WCAG AA (4.5:1 minimum, critical on parchment backgrounds where `#2C1810` on `#F5E6D3` only hits ~8:1 but lighter ink washes will fail)
- Film grain performance profiling on iPad (CSS grain overlays with animation can tank frame rate)

**Recommendation:** Split M10 into M10a (theatre visual), M10b (campaign visual), M10c (action visual + post-processing), M10d (cross-layer consistency + iPad verification). Budget 3-4 issues per sub-milestone.

---

## 2. Visual Decisions That Should Happen Earlier

Several visual choices deferred to M10 will be painful to retrofit because they affect layout, component sizing, and data flow.

**Typography:** Must be chosen before M2 (#7). Period serif faces like EB Garamond or Libre Caslon for theatre map labels, and a stencil/condensed sans like Barlow Condensed or Oswald for campaign data, affect text bounding boxes, line heights, and card layouts. Building all of M2-M9 with system fonts then swapping in decorative faces at M10 (#59) will break layouts everywhere. **Pull font selection into M1 (#5) as a shared constant.**

**Layout:** Segment card dimensions in M3 (#13) need to account for final visual treatment — the tabletop field-report style described in the SKILL.md needs padding for borders, texture overlays, and the air bonus badge. Building tight cards now means rework later.

**Animation:** The campaign front-line churning (#57) is not decorative — it communicates combat intensity, which is a core feedback system. Building the campaign layer in M3 with static front lines, then adding animation in M10, means the feedback system is untested for 7 milestones. **Pull basic front-line animation into M3 (#18) smoke test.**

**iPad:** Touch target sizing (44pt minimum) must be enforced from M1. Retrofitting touch targets at M10 (#62) will require reflowing every panel.

---

## 3. Cross-Layer Visual Consistency Risks

The zoom transitions (#60) are the highest-risk visual element in the entire project. The SKILL.md specifies that parchment texture must dissolve into earth texture must dissolve into film grain — three completely different rendering approaches need to cross-fade convincingly.

**Palette:** The three layers use fundamentally different colour temperatures: warm sepia (theatre), neutral earth (campaign), cool desaturated (action). Resource colours must shift across these temperatures while remaining identifiable. Manpower as warm brown `#8B6B4A` (theatre) to earth-red `#8B5E5E` (campaign) to muted rust `#7A6060` (action) — these mappings need to be defined as shared constants, not ad-hoc per-layer choices.

**Typography:** The transition from period serif (theatre) to stencil/condensed (campaign) to typewriter (action) will feel jarring if applied globally at layer switch. Segment names should use a single face across theatre and campaign to maintain the player's spatial mental map. Only the action layer should shift typeface fully.

**Animation:** The campaign-to-action transition (#22-#23) is built as a placeholder in M4 but visually refined in M10. That is a 6-milestone gap during which the most identity-breaking moment in the game goes untested. The desaturation + grain fade-in needs to be prototyped alongside the placeholder zoom, not 30+ issues later.

---

## 4. iPad-Specific Concerns

**Touch targets:** The order panel (#26) lists 7 dogfight orders. Seven 44pt buttons in a row on iPad landscape (1024pt width) is 308pt + spacing — feasible, but only if the layout is planned for it. If the panel also shows aircraft status, it will overflow. This needs to be designed as a two-row layout from the start, not corrected at #62.

**Readability:** Campaign segment cards (#13) show per-resource mini bars, composite strength, last result indicator, deciding factor text, and air bonus badge. On iPad at arm's length, the deciding factor italic text ("superior firepower") will be unreadable below 12pt. At the SKILL.md minimum of 11pt body / 14pt time-pressure data, the card needs approximately 180pt height. Six of those in portrait orientation is 1080pt — exceeding iPad screen height (1024pt landscape). This forces a scrolling or two-row segment layout that should be resolved in M3, not M10.

**Performance:** The action layer stacks Canvas 2D rendering (#24), CSS film grain animation (#58), vignette overlay, and flicker effect. On iPad Air / base iPad, this combination risks dropping below 30fps. Grain should use a static tiled texture with CSS `opacity` animation rather than per-frame noise generation. This architectural choice affects #24 and #58 — they cannot be independent issues.

---

## 5. Layer-Specific Suggestions

### Theatre Layer (M2)

- **#7 (SVG map):** Use SVG `feTurbulence` + `feDisplacementMap` filters on sector borders for hand-drawn line irregularity. Parchment fill should be a tiling texture at `#F5E6D3` base with `#E8D5B7` fold lines, not a flat colour. Wooden blocks: use `box-shadow: 2px 2px 4px rgba(44,24,16,0.4)` with a subtle `linear-gradient` for bevel. Selected block glow: `box-shadow: 0 0 12px rgba(180,140,80,0.6)` — warm lamplight, not blue digital highlight.
- **#8 (resource allocation):** Disable buttons should dim to `#B8A890` (faded ink) rather than grey, staying within the parchment palette. Active controls in `#2C1810` (iron-gall ink).
- **#11 (turn results):** Front line redraws should animate as an ink stroke being drawn — `stroke-dasharray` + `stroke-dashoffset` animation over 800ms. Not a snap redraw.

### Campaign Layer (M3)

- **#13 (component tree):** Segment cards should use `#4A3728` (faded ink) border with 1px inset, `#F0E8D8` card background — a field dispatch paper feel. Resource mini bars: Manpower `#8B5E5E`, Equipment `#6B7F6B`, Food `#9B8B5E`. These are the campaign-palette adaptations of the cross-layer resource colours.
- **#15 (pulse engine):** The Major Push purple timer (#59 typography pass is too late) should use `#6B4C7A` — muted purple that reads as urgent without clashing with the earth palette. Timer text at 18pt minimum for 30-second readability under pressure.
- **#18 (smoke test):** Include a basic front-line position indicator that uses segment colour intensity (darker = more pressure) rather than just a number. This validates the visual feedback loop early.

### Action Layer (M5-M7)

- **#24 (dogfight canvas):** Ground reference at edges should use the campaign's earth palette (`#7B6B5A` Flanders mud) desaturated 30% further, tying the two layers visually. Cloud layer: `#B8B8B8` with 15% opacity, drifting slowly.
- **#25 (aircraft entities):** Top-down silhouettes should be near-black (`#1A1A1A`) against the desaturated background — high contrast. Trails in a warm sepia `#8B7355` that fades, evoking period photography of aerial trails. Allied aircraft get a subtle blue tint (`#6B7F99`, French horizon blue); enemy gets feldgrau (`#4D5D53`).
- **#26 (order panel):** Overlay style per SKILL.md — semi-transparent (`rgba(20,16,12,0.7)`) with a 1px `#8B7355` border. Feels projected onto a briefing screen. Text in `#E8D5B7` (aged paper) using a typewriter face (IBM Plex Mono or Special Elite). Touch targets: 48pt minimum here, not 44pt, because orders are issued under time pressure.
- **#38 (recon flight):** The recon photo output (#39) — yellowing and fading over 5 turns — should use a CSS `sepia()` filter that increases from `sepia(20%)` (fresh) to `sepia(90%)` (stale), plus decreasing `opacity` from 1.0 to 0.5. This is a cross-layer visual element (appears in theatre) that needs to be defined before M7, not at M10.

---

*Review complete. The central recommendation is: do not treat visual identity as a polish pass. The three-layer aesthetic is a structural feature of this game. Visual decisions that affect layout, feedback legibility, and transition architecture must be made alongside the mechanical milestones, not after them.*
