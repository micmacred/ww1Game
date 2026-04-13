# Roadmap Review — Game Design Expert Panel

> Review of milestones M1-M10 against the GDD, session handoff, and balance/strategy references.
> Panel members speak where their expertise applies. Not every voice weighs in on every milestone.

---

## M1: App Scaffolding (#1-#5)

**Systems Architect:** Structurally sound. One concern: #2 defines placeholder types for theatre and action layers before those layers are designed in detail. Premature type definitions become constraints that the code will route around rather than refactor. Consider making theatre and action types explicitly provisional (e.g., `TheatreSectorDraft`) so future sessions know they're meant to be replaced, not extended.

**Strategy:** #5 extracts pure functions from the prototype, which is good, but `rollSegment` currently uses a simple threshold formula. When the theatre layer feeds sector-level modifiers into campaign rolls (#16), that function signature will need to accept context it doesn't currently know about. Design the extraction with an options parameter now or accept a breaking refactor at M3.

**Playability opportunity:** Define a `GameConfig` type early that holds all the tuning knobs (pulse timing, attrition rates, air bonuses, resource weights) as a single injectable object. This pays off immediately in M2 when theatre-level modifiers need to adjust campaign constants.

---

## M2: Theatre Map Prototype (#6-#12)

**Systems Architect:** This is the highest-risk milestone in the roadmap because it introduces the most unvalidated design surface area. The GDD defers exact sector count, inter-sector resource flow, turn pacing, and auto-resolution display. That means #6-#12 are building against incomplete spec. The risk: you build a functional theatre layer that feels like bookkeeping rather than command.

**Pacing:** The biggest danger is turn duration. A theatre turn wraps around a 3-minute campaign, but it also includes: review map, allocate resources, choose sector, auto-resolve others, view results. If the non-campaign portions take 3+ minutes each, a theatre turn balloons to 10+ minutes. With 6-8 sectors and multiple turns per sector, a full theatre campaign could hit 3-4 hours. That exceeds the 1-2 hour target in the GDD session structure table. Define a time budget per phase early: allocation should take under 60 seconds, auto-resolution display under 30 seconds. Test this in the prototype.

**Balance:** #10 auto-resolution uses "weighted roll per sector based on resources vs enemy strength" but doesn't specify whether the player's bench pilots or green recruits affect that roll. The GDD says bench pilots die in sector collapses and green recruits drain the replacement pipeline, but the auto-resolve formula doesn't account for pilot quality. This creates a disconnect: the roster system has consequences in unattended sectors, but the roll that determines those consequences ignores roster composition. Either the auto-resolve formula needs a pilot-quality modifier, or the collapse-death mechanic needs to be decoupled from combat performance.

**Strategy:** #8 resource allocation is where the theatre layer lives or dies. The GDD says sectors generate baseline plus surplus. If the surplus is small relative to baseline, the allocation decision is trivial (marginal shuffling). If it's large, it becomes the entire game. The ratio of surplus-to-baseline is your most important knob here. Start at 30% surplus and test both directions.

**Playability opportunity:** Auto-resolved sectors (#10) should occasionally generate narrative hooks: "Ypres held by a thread" or "unexpected breakthrough at Alsace." This gives the player a reason to fight there next turn. Without narrative hooks, unattended sectors are just numbers changing.

---

## M3: Campaign Layer Integration (#13-#18)

**Systems Architect:** #16 (theatre-to-campaign data flow) is the critical joint. "Map sector levels to segment allocations" hides significant design work. A theatre sector has one resource level per type; a campaign has 6 segments each needing per-resource allocation. Who decides the default distribution? If the AI distributes for the player, you lose the allocation phase. If the player always starts from scratch, the theatre allocation feels disconnected. Consider: theatre allocation sets the *total pool* for the campaign, and the player distributes across segments as before. This preserves both layers' decision spaces.

**Balance:** #17 translates campaign score to front movement, but the scoring formula (position x 12, +8 per positive segment, capital bonus) was designed before the theatre layer existed. A dominant campaign victory could move the front so far that it trivializes the next theatre turn. The front-movement-from-score function needs a cap or diminishing returns. Without it, one good campaign snowballs into theatre-level dominance.

**Pacing:** #18 smoke test should explicitly time a full loop. If theatre-allocate through return-to-theatre takes more than 6 minutes, the pacing is off.

**Playability opportunity:** When returning from campaign to theatre (#17), show a brief "war correspondent" dispatch summarizing what happened. This creates the peak-end moment the psychology framework calls for and transitions the player's mental model back to commander scale.

---

## M4: Zoom Transitions (#19-#23)

**Systems Architect:** #22 pauses the campaign timer when zooming to action. This is correct but creates an exploit: the player can repeatedly zoom in and out to freeze the campaign clock, gaining infinite time to think. Either the pause should have a brief animation-locked delay (preventing rapid toggling), or the campaign clock should keep running with a grace period.

**Psychology:** The zoom is the game's signature interaction. If it feels sluggish (over 1 second) or jarring (instant cut), the three-layer unity breaks. 800ms (#20) is in the right range. But the *re-entry* experience matters more than the transition itself: when the player zooms back from action to campaign, they need to immediately re-orient. Consider a 200ms "here you are" highlight on the segment they just fought over.

**Playability opportunity:** Make the zoom gesture itself feel physical. A slight parallax shift during transition (background moves slower than foreground) reinforces the sense of scale change without adding complexity.

---

## M5: Dogfight God-Mode (#24-#30) -- VALIDATION MILESTONE

**Systems Architect:** This is the highest-risk mechanic in the game. The GDD describes it as "the most novel part of the design." Three things could go wrong simultaneously:

First, **order legibility**. Seven orders (#26) is a lot for a real-time context. If the player can't distinguish "Flank Left" from "Dive on them" in terms of outcome, several orders will be dead choices. Prototype with 3-4 orders first, validate they feel distinct, then expand. The "why would I ever NOT do X" test applies to every order.

Second, **pilot responsiveness**. #27 uses `executionQuality = 0.4 + (medals/6)*0.6`, meaning a zero-medal recruit executes at 40% quality. If 40% quality means "often ignores orders," the player will feel they have no agency. If it means "executes sloppily but still tries," it works. The *failure mode* of low execution quality is the design decision, not the number.

Third, **pacing within the 90-second window**. The dogfight needs to feel complete within one Major Push cycle. If it takes 30 seconds to read the situation, 30 seconds to issue orders and see results, and 30 seconds of resolution, that's exactly 90 seconds with zero margin. Consider whether the dogfight auto-resolves after 60-75 seconds with a "disengage" prompt, giving the player time to zoom out before the Major Push.

**Balance:** #29 combat resolution (2-3 hits to down, hit probability from range + deflection + skill + jamming) has a lot of variables. With 4 fighters per side and a 22% attrition rate per sub-pulse, you expect to lose roughly one fighter per dogfight. If combat resolves faster than expected (good dice), the dogfight ends before the player has time to issue meaningful orders. If slower, the player is stuck watching planes circle. The variance here needs tight testing. Consider a minimum engagement duration (30 seconds before any plane can be downed) to guarantee a decision window.

**Strategy:** #28 enemy AI issues orders on a 5-10 second timer. If the player's orders resolve on a similar timescale, dogfights become simultaneous-action games where the last order wins. Consider whether orders should have commitment — once issued, they play out for 5-10 seconds before a new order can be given. This creates the "read and commit" pattern that strategy players find satisfying.

**Playability opportunity:** The first time the player issues an order and watches their squadron execute it, that moment needs to feel powerful. Invest in the visual feedback of order execution: formation changes, audible engine sounds, visible trailing. If the order-to-execution link is unclear, the whole mechanic feels like pressing buttons on a screensaver.

---

## M6: Bombing Run (#31-#36)

**Systems Architect:** #35 fighter escort reuses the dogfight combat system, which means M6 has a hard dependency on M5's combat feeling right. If dogfight combat is still being tuned, escort integration will inherit all its problems plus new ones (bomber survivability, split attention between escort and bombing). Consider a simplified escort model for first pass: escort fighters reduce interception probability by a flat percentage, without running full dogfight simulation.

**Balance:** Bombing's +1.2 bonus is 80% of dogfight's +1.5, but bombing also does persistent theatre-level damage (factory destruction). If factory damage is significant, bombing dominates dogfighting in long campaigns because it compounds. The balance between immediate air bonus and long-term strategic damage is the key knob. If both are strong, the player never dogfights. If strategic damage is weak, why bomb?

**Playability opportunity:** The approach angle selection (#32) is the bombing run's unique decision. Make flak concentrations visually dramatic and the angle choice feel like threading a needle. This is where the bombing run earns its existence as a separate action type rather than "dogfight but with bombs."

---

## M7: Reconnaissance (#37-#41)

**Pacing:** Recon is the lowest-excitement action type by design (no weapons, no combat, just exposure). The 5-turn intel persistence means recon's payoff is delayed — the player invests now for a bombing bonus later. This is strategically interesting but emotionally flat in the moment. The GDD acknowledges this ("risk without reward... the cruelest loss"), but the question is whether players will *voluntarily choose* an action that provides +0.8 bonus, no combat engagement, and deferred benefit, when dogfight gives +1.5 and immediate drama.

**Balance:** If reconned targets receive a "bombing effectiveness bonus" (#39) but the bonus isn't large enough to make bombing-after-recon clearly better than two dogfights, recon is a trap option. The recon-to-bombing pipeline needs to outperform double-dogfight over two turns, or recon has no niche. Quantify this: if recon turn + bombing turn yields more total value than dogfight + dogfight, recon is viable. If not, nobody will fly recon voluntarily.

**Playability opportunity:** Give recon flights a secondary payoff: revealing enemy resource allocation or troop disposition for the next campaign. This makes recon feel like spycraft rather than just a bombing prerequisite, and creates information the player can act on immediately at the campaign layer.

---

## M8: Named Pilots & Roster (#42-#48)

**Psychology:** This milestone converts abstract aircraft pools into named individuals. The emotional weight of the entire game hinges on this working. #46 permadeath needs careful attention: the first time a named pilot dies, the player should feel it. The notification must interrupt flow briefly — not a toast that disappears, but a moment of silence. "Lt. Beaumont. 3 medals. Shot down over Verdun." If deaths become routine notifications, the permadeath system loses its power.

**Systems Architect:** #44 pre-campaign pilot selection (choose 10 of 15) interacts with the theatre turn pacing concern from M2. If the player must make 10 roster decisions plus 6-segment resource allocation plus sector selection every theatre turn, the non-combat phase becomes a slog. Consider defaulting to "same roster as last time" with a quick-swap interface, rather than forcing full selection each turn.

**Balance:** #48 finite recruit pool is the game's long-term scarcity engine. If the pool is too large, losses don't matter. If too small, mid-campaign pilot death spirals become unrecoverable. The recruit pool size is a critical knob that should be tested across full theatre campaigns, not just single campaigns. A theatre campaign that becomes unwinnable by turn 4 because you lost too many pilots in turns 1-3 is a pacing failure.

**Playability opportunity:** Let pilots develop minor personality quirks tied to their combat history. A pilot who survived three dogfights might be described as "steady under fire." A pilot who lost a wingman might be "reckless." These cost almost nothing to implement (string templates) but massively increase the IKEA effect.

---

## M9: AI Opponent System (#49-#55)

**Strategy:** The three-archetype combination system is the right approach, but #53 difficulty logic needs a middle tier. The roadmap describes Easy (contradictory) and Hard (complementary) but the GDD doesn't specify Medium. If Medium is just "random combination," some Medium games will accidentally be Easy and others Hard. Define Medium as "neutral — archetypes don't conflict but don't synergize" for consistent difficulty.

**Systems Architect:** #49 depends on #30 (dogfight outcome), which means the AI system can't be tested at theatre or campaign level until dogfight is complete. This is a bottleneck. Consider splitting #49: define theatre and campaign AI interfaces early (they don't depend on dogfight), and defer only the Ace AI interface to post-M5. This would allow theatre AI testing during M2-M3 development.

**Psychology:** #54 opponent character voice is flagged as a single issue but carries outsized emotional weight. The quoted philosophies need to feel like a real person with a worldview, not a difficulty label with flavor text. "I go for the throat and damn the flanks" works because it implies a personality the player can imagine sitting across from. Budget time for writing quality here — bad quotes are worse than no quotes.

**Playability opportunity:** After each theatre turn, show the opponent's "reaction" — a brief quote that responds to what happened. "You think holding Verdun matters? I'll take your factories while you celebrate." This makes the opponent feel alive between turns and gives the player an information channel for inferring archetype.

---

## M10: Visual Polish Pass (#56-#62)

**Pacing:** This milestone is positioned last, but visual identity affects feel at every stage. The concern: by the time M10 lands, all playtesting and tuning has been done against placeholder visuals. The tabletop terrain aesthetic (#57) changes how segment cards read, which could invalidate feedback assumptions. Consider pulling one "vertical slice" visual pass into M3 — even just one segment card in final style — to validate that the visual direction works with the mechanical feedback systems.

**Systems Architect:** #61 sound design hooks are architecture-only, no assets. This is fine for the roadmap, but sound is a feel-multiplier that changes pacing perception dramatically. The Major Push "moment" described in the GDD will feel flat without audio. If any sound work happens before M10, prioritize the Major Push audio cue and aircraft launch confirmation.

**Psychology:** #62 iPad touch refinements at the end is risky. Touch target size and gesture feel are foundational — discovering that the dogfight order panel (#26) doesn't work with 44pt touch targets after M5 is validated on desktop means re-validating M5. Test on-device early, even with placeholder visuals.

**Playability opportunity:** The three visual identities (parchment, tabletop, newsreel) are the game's strongest aesthetic hook. When they land, they should land together — the first time a player zooms from parchment through tabletop into newsreel grain should feel like a reveal. Consider a brief "first zoom" tutorial moment that deliberately showcases all three in sequence.

---

## Cross-Layer Concerns

**Systems Architect:** The dependency map shows clean downward flow (theatre feeds campaign feeds action) and upward results flow (action results feed campaign score feeds theatre front movement). But there's a missing lateral flow: **what happens in unattended sectors during the campaign's 3 minutes?** The theatre auto-resolves them before or after the player's campaign, but narratively, those battles are happening simultaneously. If the player fights Verdun and wins big, but three other sectors collapsed during that same turn, the theatre state could shift dramatically in ways the player couldn't anticipate or prevent. This is potentially the game's richest strategic tension (the multi-front problem from the strategy reference) or its most frustrating surprise, depending on how much warning the player gets.

**Balance:** The air bonus values (+1.5 dogfight, +1.2 bombing, +0.8 recon) are additive on top of resource weights that sum to about 6 per segment (2 manpower at 0.4 + 2 equipment at 0.3 + 2 food at 0.3 = 1.4 weighted). A +1.5 dogfight bonus on a 1.4-weight segment is a 107% increase in effective strength. That's enormous. Either the base segment weight needs to be higher, the air bonus needs to be lower, or the current values are intentionally making air power decisive — which fits WWI doctrine but means the action layer isn't truly optional. A player who always zooms in for dogfights will have a massive advantage over one who lets the AI handle it. The "AI resolves at a disadvantage" penalty stacks on top of this. Quantify the total swing between "player fights every dogfight" and "player never zooms in" across a full campaign.

**Pacing:** A full theatre campaign at 6-8 sectors with ~5 turns each is 30-40 theatre turns. Each turn includes allocation + sector selection + campaign (3 min) + results. Even at 5 minutes per turn, that's 2.5-3.5 hours. At 7 minutes per turn (with roster management from M8), it's 3.5-4.5 hours. The 1-2 hour session target in the GDD may require either fewer sectors, fewer turns per campaign, or a "quick resolution" option where the player can auto-resolve their chosen sector too (at a penalty) for faster turns. Consider a "blitz mode" that compresses theatre campaigns to 3-4 turns.

---

*Review conducted 2026-04-04. All issue numbers reference the development roadmap.*
