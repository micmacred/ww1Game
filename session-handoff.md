# Session Handoff Document
## Project: *Skies of the Great War*
### Status: Campaign layer prototyped and validated. Ready for next layer.

---

## How to Use This Document

This document is written for a new Claude session picking up this project cold. Read it fully before responding to anything. It contains: the full design conversation history distilled into decisions, the reasoning behind every major choice, the current state of all prototype code, UI/UX lessons learned, and a prioritised next steps list. The game design document (game-design-document.md) is a companion — this document explains the *why* behind it.

The user is **Michael**. He thinks in layers, works iteratively, catches UI confusion quickly, and has strong instincts for what feels right. He prefers to be asked questions one at a time. When something doesn't work he says so plainly ("Still no reserves", "I don't think there's enough feedback"). Trust his instincts — he's usually right.

---

## Project Overview

A WWI strategy game for iPad inspired by *Ancient Art of War in the Skies* (Evryware/MicroProse, 1992). That game's key innovation was two fused layers: a real-time strategic map and a twitch action zoom. This project extends that to three layers and modernises the interaction model.

**Platform:** iPad primary. Bluetooth keyboard supported for action layer. Touch-first for everything else.

**Setting:** WWI, 1914–1918. Biplanes, open cockpits, jamming guns, drifting bombs, ace culture. Deliberately abstract — not a simulation.

**Core philosophy:** Abstract over simulate. The feel of systems matters more than their accuracy. Scarcity is communicated through resistance (disabled controls), not counters.

---

## The Three-Layer Architecture

This is the game's defining structural decision. Everything else flows from it.

```
LAYER 1: THEATRE        Turn-based. You are a commander.
                        Hand-drawn period map, wooden blocks.
         ↕ zoom
LAYER 2: CAMPAIGN       Real-time with pulse. You are a general.
                        Tabletop terrain model aesthetic.
         ↕ zoom
LAYER 3: ACTION         Real-time, optional. You are a squadron commander.
                        Colorized period newsreel aesthetic.
```

**Zoom transitions:** Pushing in zooms from theatre → campaign → action. Pulling out reverses. No menus, no loading screens — just scale. The hand-drawn map dissolves into tabletop terrain which dissolves into newsreel sky.

**The player can be at any layer and zoom out at any time.** Action sequences (dogfights, bombing runs) continue without the player if they leave. The AI resolves them at a disadvantage.

---

## Layer 1: The Theatre (NOT YET PROTOTYPED)

### What it is
A large strategic map divided into sectors. The player manages the whole war, personally fighting in one campaign per turn. All other sectors auto-resolve via weighted dice rolls.

### Key decisions made
- **Resources:** Three types — Manpower (population), Equipment (factories), Food (farmland). Same three resources at both theatre and campaign levels. Player learns the model once, uses it everywhere.
- **Turn structure:** Review map → allocate resources → choose sector to fight → auto-resolve others → play campaign → theatre map updates
- **Win conditions:** Capital capture OR industrial strangulation (destroy enough enemy productive capacity). Provisional capital rule: if a capital falls, a dice roll determines whether the enemy re-establishes one elsewhere. War may not be over.
- **Campaign → Theatre translation:** Margin of victory moves the front in that sector. Capturing the local capital gives a resource windfall for next turn.
- **Solo to start, multiplayer fork later:** Architecture should allow a human to slot into the AI theatre commander role. Design AI with clean interfaces.

### Visual style
Hand-drawn period cartographic map. WWI-era staff map illustration style. Parchment tones, ink lines, period typography. Wooden blocks for force concentrations and front lines. Feels like a war room table in a French château.

### NOT yet designed in detail
- Exact sector count and map size
- How auto-resolution is shown to player
- Turn time/pacing
- How resources flow between sectors

---

## Layer 2: The Campaign (PROTOTYPED AND VALIDATED)

### What it is
A 3-minute sector battle. The player allocates resources along a 6-segment front, holds reserves, deploys air actions, and watches the front move on a regular pulse. This is the mechanical heart of the game.

### Prototype files
All files are React JSX artifacts. The current canonical version is **frontline-v7.jsx**. Previous versions (v1–v6) represent the iteration history and can be ignored.

### The pulse system (key mechanic)
Two rhythms running simultaneously:

| Pulse Type | Interval | Movement | Air Bonus Reset |
|------------|----------|----------|-----------------|
| Sub-pulse | 30 seconds | ±1 max | No — persists |
| ⚡ Major Push | Every 3rd (90s) | ±1–3 | Yes — clears |

6 sub-pulses total = 3 minute campaign. Major Pushes at pulses 3 and 6. Timer turns purple and shows "⚡ MAJOR PUSH NEXT" when one is imminent. A dot tracker shows pulse history.

**Why this rhythm:** Sub-pulses create the probing skirmish feel. Major Pushes create dramatic decisive moments. The 90-second window between Major Pushes is intentionally matched to the time needed to play out a dogfight or bombing run in the action layer — the player has time to zoom in, fight, and zoom back before the big roll.

### The front line
6 named segments: Nord, Ypres, Somme, Verdun, Alsace, Rhine. Each segment rolls independently. Position ranges from -8 (full retreat) to +8 (full advance).

**Roll formula:**
```javascript
playerWeight = manpower * 0.4 + equipment * 0.3 + food * 0.3 + airBonus
threshold = playerWeight / (playerWeight + enemyStrength)
// roll < threshold = advance, roll > threshold = retreat
```

Enemy strength is randomised per segment at campaign start (2.8 + rand * 1.4).

### Resource system
**One resource pool. No separate counter.** This was a hard-learned UI lesson (see below). Scarcity is felt through resistance — +/- buttons stop working when pool is empty.

Starting values (validated):
- Total per resource: 18
- Default per segment: 2 (× 6 = 12)
- Default reserves: 6
- Remaining free to redistribute: 0

Resources: Manpower (40% weight), Equipment (30%), Food (30%).

Reserves are set during allocation phase. During battle, clicking a segment reveals deploy buttons in the reserves panel. Reserves persist until spent — they don't auto-deploy.

### Air actions (active during battle phase)
Three types, each drawing from a finite aircraft pool:

| Type | Bonus | Pool | Attrition/sub | Attrition/major |
|------|-------|------|---------------|-----------------|
| ✈ Dogfight | +1.5 | 4 fighters | 22% | 38% |
| 💣 Bombing | +1.2 | 3 bombers | 15% | 28% |
| 📷 Recon | +0.8 | 3 recon | 10% | 20% |

**Air bonuses persist until Major Push.** This was a deliberate design decision — originally bonuses cleared after each sub-pulse, but that didn't give the player time to actually play the action layer. Now the bonus remains active across all sub-pulses until the Major Push fires, then resets.

Aircraft attrition rolls happen per-segment per-pulse where an air action is active. Losses are shown in red in dispatch log. When a pool hits 0, that action type's button is greyed and disabled.

### Feedback systems (all implemented in v7)
On each segment card:
- Strength % bar (green > 55%, amber 45-55%, red < 45%) vs enemy
- Per-resource mini bars (green/amber/red by level)
- Last result indicator (▲1, ▼2, ●)
- Deciding factor in italic ("superior firepower" / "outmanned on the line")
- Air bonus badge ("✈ +1.5 active")

In dispatch log after each pulse:
- Summary (X adv · Y hold · Z ret)
- Two most dramatic segment outcomes with deciding factor
- Air action outcome per segment ("✈ Dogfight supported the advance" / "💣 Bombing active — still lost ground")
- Aircraft losses in red with ✕

### Campaign scoring
At timer end:
- Net position × 12 points per unit
- 8 bonus points per segment in positive territory
- Local capital bonus (TBD exact value)

Score feeds theatre translation: margin → front movement, capital capture → resource windfall.

### Visual style
Tabletop terrain recreation — physical scale model aesthetic. The front leaves devastation as it moves. Animation intensity reflects combat pressure. NOT yet visually implemented — prototype uses functional placeholder UI only.

---

## Layer 3: The Action (NOT YET PROTOTYPED)

### Key decisions made

**God-mode squadron command** — the player does NOT fly a plane. They issue tactical orders; pilots execute autonomously. This solved the iPad touch control problem (direct flight control on touch is bad) and keeps the player in a consistent command role across all three layers.

**Three action types:**

1. **Dogfight** — issue orders (Flank left, Dive on them, Protect the bombers, Focus fire, Break and scatter, Disengage). Pilot skill (medals) determines execution quality. A six-medal ace executes crisply and adds initiative. A recruit may fumble.

2. **Bombing run** — direct bombers over target, choose approach angle to avoid flak, select targets from recon photo intel. Flak causes damage and shakes the camera. Partial destruction is meaningful (50% factory = 50% output).

3. **Reconnaissance** — fighters fly a route, gather intel persisting 5 turns, no offensive capability. Pilots exposed, can't fight back. Highest risk/reward tension of the three.

**Visual style:** Colorized period newsreel. Slightly desaturated base with hand-tinted colors, film grain, vignette. Planes look like archival footage. Not photorealistic.

### NOT yet designed in detail
- Exact order UI (buttons? gesture? keyboard shortcuts?)
- How pilot medals translate to numerical execution quality
- Flak damage model
- How recon intel is displayed (fading photo overlay?)
- Exact camera/view system for dogfight

---

## Pilots & Progression

### Roster system
- 15 total followed pilots (named, tracked)
- Up to 10 can be taken into any campaign
- 5 on bench — safe but not progressing while you're away
- Green recruits fill unattended sector rosters

### Permadeath rules
- Active 10: die through direct campaign action only (fair, player-caused)
- Bench 5: exposed to sector collapse losses — any of the 15, regardless of medals
- Green recruits: lost in sector collapses, draining replacement pipeline
- Aircraft pools in the campaign layer currently abstract pilot identity — named pilots and individual visual indicators are planned but deferred

### Medals and progression
0–6 medals per pilot. More medals = better order execution in dogfight layer. Every 5 kills = 1 medal (original game's system). Medal level also affects survival in difficult situations.

### Bench strategy
Choosing which 5 to leave behind is a *risk* decision, not storage. If that sector collapses badly, those pilots — medals and all — can die. The player can rotate pilots between campaigns to develop bench depth, or rest wounded veterans.

### Named aircraft
Bombers also have names (period-appropriate). Not just pilots.

---

## AI Opponents

### Three archetype pools — randomly combined per theatre campaign

**Theatre Commander** (ground strategy):
- Aggressive — overcommits to breakthrough sectors
- Conservative — spreads evenly, rarely gambles
- Opportunist — targets your weakest sector
- Attritional — focuses on your industrial base

**Campaign General** (front allocation and response):
- Flanker
- Hammer (straight through center)
- Defender
- Blitzer (hard early, fades late)

**Ace** (air tactical behavior):
- Aggressive
- Defensive
- Escort-focused
- Hunter (ignores bombers, targets fighters and recon)

### Difficulty logic
- **Easy:** Combinations weighted toward contradictory archetypes (AI works against itself)
- **Hard:** Combinations weighted toward complementary archetypes (systematic pressure)
- **Visibility toggle:** Player can see or hide opponent archetypes. Hidden + Hard = hardest mode

### Character voice
Each archetype has a quoted philosophy before the campaign. "I go for the throat and damn the flanks." Opponents feel like adversaries, not settings.

---

## UI/UX Lessons Learned (Critical)

These are hard-won from prototyping sessions. Do not repeat these mistakes.

### 1. The redundant resource panel problem
Early prototypes had a "Resource Pool" panel showing how many resources were left unallocated. This panel:
- Looked like it should do something but didn't
- Confused the player ("What is this for?")
- Created a false impression that it was the theatre layer sitting above the campaign

**Resolution:** Removed entirely. One resource pool at campaign level, expressed only through segment cards + reserves panel. Scarcity felt through resistance (buttons stop working), not counters.

### 2. Reserves visibility
Early versions had reserves buried inside the resource pool card as small text with tiny buttons. Players consistently couldn't find them.

**Resolution:** Reserves get their own full-width panel with large controls. During battle, clicking a segment reveals deploy buttons inside the reserves panel. The deploy target is always explicit ("deploying → Ypres").

### 3. Default values matter
Prototypes that started with 0 reserves were confusing — the mechanic was invisible. Default reserves of 6 per type mean the mechanic is demonstrated on first play without explanation.

### 4. Air bonus persistence
Original: air bonuses cleared after each sub-pulse. Problem: player couldn't zoom in for a dogfight (30 seconds), fight it out, and return before the bonus expired.

**Resolution:** Air bonuses persist until Major Push (90 seconds). This matches the natural window for an action sequence. The 90-second cycle is the "action window."

### 5. Prototype caching
React JSX artifacts can serve cached versions even after file edits. When iterating, always copy to a new filename (frontline-v2.jsx, v3.jsx, etc.) rather than editing in place.

---

## What Has and Hasn't Been Decided

### Decided and validated
- Three-layer architecture
- WWI setting
- iPad-first, Bluetooth keyboard for action layer
- God-mode squadron command (no direct flight)
- Abstract over simulate
- Solo first, multiplayer fork later
- 3-minute campaign, 6 sub-pulses, Major Push every 3rd
- Resource system (3 types, same model at both layers)
- Resource weights (40/30/30)
- Aircraft pools and attrition rates
- Air bonus persistence until Major Push
- Pilot roster (15 total, 10 active, 5 bench)
- Bench exposure to sector collapse
- AI three-archetype system with difficulty weighting
- Zoom transition between layers (in/out, no menus)
- Visual styles for each layer (hand-drawn / tabletop / newsreel)

### Deliberately deferred
- Exact sector count on theatre map
- Campaign editor (post-launch consideration)
- Named pilot visual indicators (pool numbers suffice for now)
- Exact multiplayer implementation
- Intelligence degradation curve (linear vs stepped)
- Exact recruit pool size per sector
- Local capital bonus exact point value

### Not yet designed
- Theatre map turn UI in detail
- Zoom transition implementation
- Dogfight order UI specifics
- Bombing run camera/interaction model
- Recon intel display system
- Any visual implementation (prototype is functional placeholder only)

---

## File Inventory

All files in `/mnt/user-data/outputs/`:

| File | Status | Notes |
|------|--------|-------|
| `game-design-document.md` | ✅ Current | Full GDD, post-prototype |
| `session-handoff.md` | ✅ This file | |
| `frontline-v7.jsx` | ✅ Current prototype | Campaign layer, all features |
| `frontline-v1.jsx` through `v6.jsx` | 🗄 Archive | Iteration history, not needed |
| `design-notes.md` | 🗄 Archive | Original question list, superseded by GDD |

---

## Prototype Code Architecture (frontline-v7.jsx)

Key constants to know when building the real implementation:

```javascript
// Timing
SUB_PULSE_SEC = 30      // seconds per sub-pulse
NUM_PULSES = 6          // total sub-pulses per campaign
MAJOR_EVERY = 3         // sub-pulse interval for Major Push

// Resources
TOTAL_RES = { manpower: 18, equipment: 18, food: 18 }
DEFAULT_RES = { manpower: 6, equipment: 6, food: 6 }   // reserves
RES_WEIGHT = { manpower: 0.4, equipment: 0.3, food: 0.3 }

// Front
NUM_SEGMENTS = 6
MAX_POS = 8             // ±8 position range
SEG_NAMES = ["Nord", "Ypres", "Somme", "Verdun", "Alsace", "Rhine"]

// Aircraft
AIRCRAFT_START = { dogfight: 4, bombing: 3, recon: 3 }
ATTRITION_RISK = {
  dogfight: { sub: 0.22, major: 0.38 },
  bombing:  { sub: 0.15, major: 0.28 },
  recon:    { sub: 0.10, major: 0.20 },
}

// Air bonuses
AIR_BONUS = { dogfight: 1.5, bombing: 1.2, recon: 0.8 }
```

Key state shape:
```javascript
// Segment
{
  id, name,
  position,           // -8 to +8
  resources: { manpower, equipment, food },
  enemyStrength,      // randomised at start
  airBonus,           // additive strength modifier, clears on Major Push
  airType,            // which action type is active ("dogfight"|"bombing"|"recon"|null)
  lastResult,         // "advance"|"hold"|"retreat"
  lastAmount,         // 0-3
  lastFactor,         // { res, reason } — deciding resource
  lastAirNote,        // string shown in dispatch
  flash               // boolean for pulse animation
}

// Aircraft pool
{ dogfight: N, bombing: N, recon: N }

// Reserves
{ manpower: N, equipment: N, food: N }
```

Timer implementation (important — avoids stale closure issues):
```javascript
// Use a local variable inside the effect, not state
useEffect(() => {
  if (phase !== "battle") return;
  let t = SUB_PULSE_SEC;
  setPulseTimer(SUB_PULSE_SEC);
  const iv = setInterval(() => {
    t -= 1;
    if (t <= 0) { handlePulse(); t = SUB_PULSE_SEC; }
    setPulseTimer(t);
  }, 1000);
  return () => clearInterval(iv);
}, [phase, handlePulse]);

// handlePulse uses only functional setState updates (no captured state)
// so it can have empty deps in useCallback
```

---

## Suggested Next Steps (in priority order)

### 1. Theatre map prototype
The campaign layer is validated. The natural next prototype is the theatre layer — a turn-based sector map where resources are allocated and the player chooses which campaign to fight. Even a rough version will reveal whether the layer feels meaningful or redundant.

Key questions to answer through prototyping:
- How many sectors feels right? (Suggest starting with 6–8)
- How does auto-resolution of unattended sectors feel? Is the feedback satisfying?
- Does the resource allocation decision feel strategic or just busywork?

### 2. Zoom transition
A quick prototype of the zoom animation between layers will answer whether the three-layer structure *feels* coherent or fragmented. Even a simple CSS transition from a flat map to a grid of segments would validate the concept.

### 3. Dogfight god-mode UI
The action layer is the most novel part of the design — no direct flight, only orders. Needs to be prototyped to know if it's actually fun. Start with a simple 2D battlefield and 4–5 order types.

### 4. Visual pass on campaign layer
The v7 prototype is fully functional but visually placeholder. Before moving to real implementation, one visual pass applying the tabletop terrain aesthetic would help validate the art direction.

### 5. Named pilot system
Once the mechanical layers are validated, pilot identity becomes the emotional layer. Roster management UI, campaign selection UI, bench decisions, medal progression.

---

## Things Michael Cares About

Based on the conversation, these instincts come up consistently:

- **Abstraction is good.** When offered simulate vs abstract, he always chooses abstract.
- **Redundant UI is bad.** He spots it immediately and calls it out.
- **Defaults should demonstrate the mechanic.** He noticed when reserves were 0 and invisible.
- **The three layers need to feel like one game.** The resource model being the same at theatre and campaign level was his idea — and it's the right one.
- **Named things matter.** Pilots, aircraft, opponents all need names and voices.
- **Timing is tunable.** He asked for the pulse to be longer (20s → 30s) and the campaign to be longer (6 pulses → still 6 but bigger). Get it into playable shape and let him feel it.
- **Visual feedback before moving on.** He wants to see what air actions are doing, not just trust that they're running.

---

*Handoff prepared: April 2026. Campaign layer validated. Ready for theatre layer or action layer prototype.*
