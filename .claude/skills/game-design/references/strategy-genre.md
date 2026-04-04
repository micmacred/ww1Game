# Strategy & Wargame Design Reference

## Table of Contents
1. What Strategy Players Want
2. Multi-Layer Game Design
3. AI Opponent Design
4. The Wargame Tradition
5. iPad/Touch Strategy Design

---

## 1. What Strategy Players Want

### Mastery Through Understanding
Strategy players want to win because they *understood the situation better*, not because they clicked faster or memorised a build order. Every system should reward comprehension: "I saw that his left flank was weak because he'd overcommitted equipment to the centre, so I pushed there with reserves."

### Readable Complexity
Strategy games can be complex, but the complexity must be *readable* — the player should be able to look at the game state and form a theory about what's happening and why. If they can't, the complexity is noise rather than depth.

**Test:** Can a player explain why they lost? If the answer is "I don't know, it just happened," the system is too opaque. If the answer is "I spread my resources too thin and got punched through at Verdun," the system is communicating well.

### Consequential Decisions
Decisions should have visible, lasting consequences. "I chose to fight here instead of there" should echo forward. Strategy players tolerate — even enjoy — being punished for bad decisions, as long as the punishment is *legible* (they can trace it back to the choice that caused it).

### Strategic Identity
Players want to develop a personal playstyle that feels distinct. The system should support multiple viable approaches: aggressive, defensive, economy-focused, military-focused. If every game plays out the same way regardless of player intent, the strategic space is too narrow.

---

## 2. Multi-Layer Game Design

### The Zoom Problem
Games with multiple layers of abstraction (theatre → campaign → action) face a fundamental design challenge: each layer must be interesting on its own AND connected to the others. A layer that can be ignored is dead weight. A layer that dominates makes the others feel vestigial.

**Solutions that work:**
- **Each layer affects the others through clear channels.** Your design does this: theatre allocations set campaign starting conditions; campaign outcomes feed theatre front movement; action bonuses affect campaign rolls.
- **The player chooses their level of engagement.** Your optional action layer handles this: zoom in for a bonus, or let the AI handle it at a penalty. The player's time is the scarce resource.
- **Each layer has its own decision vocabulary.** Theatre is about allocation and prioritisation. Campaign is about timing and reserves. Action is about tactical orders. Different *kinds* of thinking at each scale.

**Anti-patterns to avoid:**
- **Micromanagement trap** — if optimal play requires zooming into every action sequence, the theatre and campaign layers become waiting rooms. Your AI-handles-it-at-a-disadvantage design prevents this, but the penalty for not zooming in needs to be calibrated: big enough to matter, small enough that skipping is viable.
- **Strategic irrelevance** — if theatre-level decisions don't meaningfully change campaign outcomes, the top layer is busywork. The resource allocation → segment strength pipeline needs to produce *noticeable* differences.
- **Layer disconnect** — if zooming between layers feels like switching between separate games, the unity breaks. Shared resources, persistent consequences, and seamless zoom transitions all help.

### Information Flow Between Layers
What information travels up and down the layer stack?

**Downward (theatre → campaign → action):**
- Resource allocation (numbers)
- Strategic context (which sectors are critical)
- Intelligence (recon data persisting across turns)

**Upward (action → campaign → theatre):**
- Air bonuses (immediate mechanical effect)
- Aircraft losses (permanent campaign impact)
- Campaign score → front movement → theatre state

The key: information travelling *down* should feel like strategic context ("here are the resources I gave you — make them count"). Information travelling *up* should feel like consequences ("here's what happened on the ground — deal with it").

---

## 3. AI Opponent Design

### Archetype Systems
Your three-archetype system (Theatre Commander × Campaign General × Ace) is a well-established pattern. The key insight: personality is more memorable than difficulty.

**What makes archetypes work:**
- Each archetype implies a *theory of victory*. "I go for the throat" is a strategy the player can identify and counter.
- Combinations create emergent behaviour. An Aggressive commander + Defender general creates an opponent who overcommits resources to sectors they then defend stubbornly.
- Contradictory combinations (for Easy difficulty) model realistic dysfunction — real organisations have internal friction.

**Pitfalls:**
- **Archetypes that only differ numerically.** "Aggressive = higher numbers" isn't a personality. Aggressive should mean *different behaviour*: overcommitting, ignoring flanks, taking risks the player wouldn't.
- **Unreadable AI.** The player should be able to infer the archetype from behaviour within 1-2 turns, unless it's deliberately hidden. Hidden archetypes on Hard mode work because the player *expects* to discover the strategy through play.
- **Perfect information AI.** AI should make decisions based on what it *could* know, not what it actually knows. An AI that perfectly counters the player's hidden allocation feels like cheating.

### Difficulty Without Cheating
The best difficulty scaling changes AI *behaviour*, not AI *numbers*.

**Good scaling:**
- Easy: AI archetypes conflict with each other (realistic dysfunction)
- Medium: AI archetypes are neutral (competent but not synergistic)
- Hard: AI archetypes complement each other (coherent strategy)

**Avoid:**
- Giving the AI more resources at higher difficulty (players notice and resent it)
- Making the AI omniscient (seeing the player's hidden allocations)
- Removing randomness for the AI (always rolling well)

---

## 4. The Wargame Tradition

### Hex-and-Counter Heritage
Traditional wargames used hexagonal grids and cardboard counters. Modern digital wargames have moved beyond this, but the *thinking* behind hex-and-counter design is valuable:
- **Zone of control** — units influence adjacent space, creating front lines and flanking opportunities
- **Combat results table** — outcomes determined by odds ratio + die roll, producing a range from "attacker eliminated" to "defender routed"
- **Supply lines** — units cut off from supply degrade over time

Your segment-based front line is a clean abstraction of the zone-of-control concept. The roll formula is a modern CRT. Supply is abstracted into the food resource.

### The Grognard Spectrum
Strategy/wargame players range from "casual strategist" (wants interesting decisions, not homework) to "grognard" (wants to model every calibre of shell). Your design sits firmly on the casual-strategist end, which is the right call for iPad. But be aware that strategy players will test your systems harder than casual players — they'll find the dominant strategy, exploit the edge cases, and push the randomness to its limits.

### Historical Texture
WWI as a setting provides specific constraints that double as design features:
- **Static fronts** — movement is hard-won and measured in meters, not miles. Your ±8 position range captures this.
- **Attrition warfare** — winning by wearing down the enemy rather than dramatic breakthroughs. Your resource depletion and aircraft loss mechanics model this.
- **Air power as emerging doctrine** — in WWI, air power was new and its role was being invented. Reconnaissance, dogfighting, and bombing were all experimental. This gives you design freedom: historical accuracy is inherently loose because the real history was improvisational.
- **Named aces and squadron culture** — the ace phenomenon was a WWI invention. Pilots were celebrities. This supports your named-pilot system emotionally and historically.

---

## 5. iPad/Touch Strategy Design

### The Finger Problem
Fingers are imprecise. Strategy games on touch need larger touch targets, clearer selection states, and more forgiving input than mouse-and-keyboard games.

**Implications for your design:**
- Segment cards need to be large enough to tap reliably, especially during battle when time pressure exists
- Drag-to-allocate needs clear visual feedback about what's being dragged and where it's going
- Air action buttons need to be far enough apart that fat-finger errors are rare

### The Attention Problem
On iPad, players are often in environments with interruptions (couch, commute, bed). Design for interruptibility:
- Pause should be instant and obvious
- Game state should be readable at a glance after resuming
- The 3-minute campaign is naturally interruption-friendly (short enough to finish)

### The Information Density Problem
Touch screens can display less simultaneously-readable information than desktop monitors. Your design already handles this well (segment cards with visual bars instead of numbers, dispatch log instead of spreadsheets), but watch for:
- Theatre map with many sectors could become unreadable on iPad
- Nested information (expand a segment to see details) works better than simultaneous display
- Visual encoding (colour, size, position) communicates faster than text on touch screens
