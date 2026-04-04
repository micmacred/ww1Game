# Balance Patterns & Anti-Patterns

## Table of Contents
1. Feedback Loop Archetypes
2. Resource Economy Patterns
3. Common Anti-Patterns
4. Tuning Heuristics

---

## 1. Feedback Loop Archetypes

### Positive (Snowball) Loops
Winning makes winning easier. Creates decisive outcomes but can feel unfair.

**When to use:** Mid-to-late game momentum, rewarding good play, creating narrative arcs ("the tide turned").

**When to limit:** Early game (prevents comeback), competitive multiplayer (feels hopeless for the losing side).

**Pattern: Gated Snowball** — the positive loop exists but is capped. Example: capturing territory gives resources, but each territory has diminishing returns. The snowball slows naturally.

**Pattern: Delayed Snowball** — the advantage accumulates but doesn't pay off until a specific trigger. Example: air superiority builds across sub-pulses but only matters at the Major Push.

### Negative (Rubber Band) Loops
Losing triggers compensating advantages. Creates closer contests but can feel like the game is playing itself.

**When to use:** When player investment is high (long campaigns), when comeback stories matter, when the losing position should still feel playable.

**When to limit:** When decisive victories should be possible, when strategic errors should have real consequences.

**Pattern: Scarcity Advantage** — the side with fewer resources gets efficiency bonuses. Fewer pilots means each one is more experienced. Fewer sectors means shorter supply lines.

**Pattern: Desperation Mechanic** — losing unlocks options that winning doesn't. Example: a collapsing sector triggers emergency reinforcement that wouldn't otherwise be available.

### Mixed Loops
Most good games use both. The question is which dominates at which timescale.

**Pattern: Short-term negative, long-term positive** — individual battles have comeback mechanics, but the overall campaign rewards sustained advantage. This is common in strategy games and feels fair: you can lose a battle and recover, but you can't lose the war and recover.

---

## 2. Resource Economy Patterns

### Three-Resource Triangle
Three resources that each counter or complement different strategies. Creates a rock-paper-scissors dynamic at the allocation level. Your game's Manpower/Equipment/Food follows this pattern with weighted influence (40/30/30).

**Key design question:** Are the resources *substitutable* (you can compensate for low food with high manpower) or *complementary* (you need all three above a threshold)? Your weighted-sum formula makes them partially substitutable. Consider whether any resource should have a minimum threshold below which the others can't compensate.

### Scarcity Curves
How resource scarcity changes over time shapes the feel of the game:
- **Front-loaded abundance** — start rich, get poorer. Creates "manage decline" feeling. Good for defensive/survival games.
- **Back-loaded abundance** — start poor, get richer. Creates "build up" feeling. Good for expansion games.
- **Oscillating** — abundance and scarcity alternate. Creates rhythm. Good for campaign-length games where each cycle is a session.

### The Allocation Problem
When players distribute limited resources across multiple targets (your segment allocation), the interesting question is whether *concentration* or *distribution* is favoured.

- If concentration always wins → the game reduces to "pick one segment and dump everything"
- If distribution always wins → the allocation decision is trivial (spread evenly)
- If it depends on context → you have a real decision

Your enemy-strength randomisation per segment creates context dependency, which is good. Players need to read the situation and allocate accordingly.

---

## 3. Common Anti-Patterns

### The Trap of False Choice
Options that look different but are functionally identical. "Do you want +10% attack or +10% defence?" when both result in the same win probability. Real choice requires different *strategies*, not just different numbers.

### The Dominant Strategy Problem
One approach that beats all others regardless of opponent. In your game, watch for:
- Is there ever a reason NOT to run a dogfight action? (If the +1.5 bonus always outweighs the attrition risk, dogfight dominates)
- Is there a segment allocation pattern that always wins? (If dumping everything on 3 segments and ignoring 3 always beats spreading evenly, the allocation is solved)

### The Solved Game Problem
When optimal play is discoverable and repeatable, the game becomes an execution test rather than a decision test. Randomness in enemy strength and the AI archetype system help here — different opponents require different responses.

### The Arithmetic Problem
When the player can calculate the optimal move, the decision becomes math homework rather than strategy. Your weighted-sum roll formula is transparent enough to reason about but includes enough randomness (the roll itself) that calculation doesn't guarantee outcomes.

---

## 4. Tuning Heuristics

### The 70/30 Rule
In randomised contests, the favoured side should win about 70% of the time. Less than 60% and investment feels pointless. More than 80% and outcomes feel predetermined. Your roll threshold formula (weight / (weight + enemy)) naturally produces this range when resource differences are moderate.

### The Three-Attempt Rule
A player should be able to try a strategy at least three times before the game ends. If a campaign is 6 pulses and a strategy takes 2 pulses to evaluate, the player gets 3 attempts — enough to learn and adapt.

### The Noticeable Difference Threshold
A change in resource allocation should be *noticeable* in outcomes. If moving 2 manpower to a segment doesn't visibly change its results, the allocation granularity is too fine. Players should feel the impact of their decisions within 1-2 pulses.

### The Recovery Window
After a setback, the player should have at least one decision point before the next outcome is locked in. In your pulse system, the 30-second sub-pulse window is the recovery interval. The question: is 30 seconds enough time to notice a problem, decide on a response (deploy reserves, redirect air support), and execute it?
