# 13 — Future Roadmap & Idea Backlog

> The GDD is a **living document** — "we can add stuff later." This file is the parking lot for
> future systems and the **phased plan** for actually building the game in follow-up sessions.
> Nothing here is committed scope; it's a prioritized menu.

**Related:** [Master GDD](GAME_DESIGN_DOCUMENT.md) · [Extra Mechanics](12-extra-mechanics.md) ·
[Data seeds](../data/game-data.json)

---

## 1. Holidays & Special Days {#holidays--special-days}

Your idea: recurring **holidays** that boost stats — e.g. a *Day of Love* → big population
boost, a *Gift Day* → happiness surge. These extend the [festival system](12-extra-mechanics.md#festivals)
and are **fully data-driven** (add an entry, get a holiday). Below is a ready-to-implement set,
themed to fit the world (renamed from real-world holidays so they feel native to the setting).

### 1.1 Holiday design template
```jsonc
{
  "id": "day_of_hearts",
  "name": "Day of Hearts",             // in-world name (your 'Valentine's Day of Love')
  "trigger": "annual:spring:day5",     // annual date | season | event-triggered
  "duration_days": 2,
  "effects": {
    "birth_rate_mult": 1.8,            // +80% population growth (your example)
    "happiness_add": 10
  },
  "cost": { "food": 40, "gold": 30 },
  "cooldown": "1 year",
  "flavor": "Couples wed and families are celebrated; the cradle-song fills every street.",
  "requires": { "tier": "T2", "belief": null }
}
```

### 1.2 Proposed holiday roster

| Holiday (in-world name) | Inspired by | Trigger | Headline effect | Flavor |
|-------------------------|-------------|---------|-----------------|--------|
| **Day of Hearts** | Valentine's "Day of Love" | Annual (Spring) | **+80% birth rate** (2 days) | Weddings & families celebrated |
| **Gift Day** | Gift-giving day | Annual (Winter) | **+50% happiness** (spike) | Everyone exchanges gifts |
| **Harvest Feast** | Thanksgiving/Harvest | Autumn | +happiness + **food variety** mood, *Well-Fed* | The great table of plenty |
| **Founders' Day** | National day | Capital founding anniversary | +culture, +happiness, small pop influx | Honoring the first settlers |
| **Festival of Lamps** | Festival of lights | Annual (Winter) | +culture, +*Inspired*, −winter gloom | Lights against the dark |
| **Forge Day** | Labor/industry day | Annual (Summer) | **+production & craft speed** (1 day) | Smiths & builders honored |
| **Day of Ancestors** | Remembrance | Annual (Autumn) | +faith, +combat morale (*Heroic* boost) | Remember the fallen |
| **Bounty Fair** | Market fair | Triggered by trade milestone | **+trade income & gold**, +opinion with AI | Merchants gather; deals flow |
| **Victory Jubilee** | Triumph | Triggered after a great war win | Empire-wide +morale, +happiness | Parade of the victorious army |
| **First Ore Day** | (native) | Triggered on first adamantine refined | +happiness + a permanent mining morale perk | The age of the black metal begins |
| **Long Night's Vigil** | Winter solstice | Deep Winter | Reduces winter penalties, +stability | Enduring the longest night together |
| **Green Rites** | Spring festival | Spring | +farm yield this season, +birth rate | Blessing the fields |

### 1.3 Holiday design rules (so they stay fun, not exploity)
- **One headline effect** per holiday (a clear identity), plus a small secondary at most.
- **Costs & cooldowns** prevent spam; **diminishing returns** if stacked.
- **Themed to the world** — reskin freely (no real-world religious specificity required).
- **Belief/tier gating** optional: some holidays unlock with a belief focus or capital tier.
- **Stackable with festivals** but shares the festival cooldown budget.
- Data lives alongside festivals; the calendar UI shows upcoming holidays so players **plan
  around them** (e.g. time *Invite Migrants* + *Day of Hearts* for a population boom).

> These twelve are ready to drop into `/data/game-data.json` under a `holidays` array whenever
> we build the festival system.

---

## 2. Phased build plan (how we make the actual game)

You said the game could be built in **1–3 prompts or more**. Realistically, a project this
deep is best built in **vertical slices** — each phase is playable and testable before the next.
Suggested tech stack: a web build (TypeScript + Canvas/WebGL, or a lightweight engine like
Phaser) so it runs anywhere and reads the `/data` seeds directly. (Engine choice is open.)

| Phase | Deliverable (playable) | Systems included | Rough scope |
|:-----:|------------------------|------------------|-------------|
| **P0 — Skeleton** ✅ | ~~Renders the map, fog, tile select, top bar~~ **Built in [`/game`](../game/README.md)** on the Peloponnese campaign map | World data, tile model, HUD shell | done |
| **P1 — Survival core** ✅ | ~~Hunt, forage, food, pop grows/starves, buildings~~ **Built**: pop/jobs, happiness+statuses, seasons, 13 buildings incl. Breeding Hub, decrees | Population, food loop, buildings, seasons v1 | done |
| **P2 — Expansion** ✅ | ~~Explore→claim→colonize→develop→roads~~ **Built** + tribes, raids, tile warfare, T2 flags, Act I victory | Colonization pipeline, roads, fog, combat-lite | done |
| **P3 — Economy & mining** ✅ | ~~Mines, tool ladder, materials, refining, gear, hazards~~ **Built** + weapon/armor tiers, trade economy, mid-game navy & 162-tile map expansion (Greece/Balkans/Asia Minor/Italy/Iberia) | Resources, mining, gear, storage, naval | done |
| **P4 — Tech & crafting** ✅ | **Built**: 24-tech tree (8 branches), acts I–III w/ Greece-unification gate, capital T1–T3 incl. Porphyrogennetos, dynastic flags, culture & festivals | Technology, crafting, tiers, flags | done |
| **P5 — Military, AI & empires** ✅ | **Built**: 8 expanding rival empires (each a dynasty) with expansion/invasion/siege AI, full diplomacy suite (gift/exchange/trade/NAP/pact/alliance/threaten/war/peace), **stability replaces food**, five map modes (Normal/Political/Population/Resource/Naval), empire economy (tolls/tribute/blockades), acts IV **Mineral Age** & V **Empire Age** → "Master of the Middle Sea" | Military, combat, empire AI, diplomacy, map modes | done |
| **P6 — Volcano & the 400-tile finale** | Full 400-tile Mediterranean, volcanic extraction, adamantine & advanced minerals, eruptions, distant empires (Kemet/Gaul/Mesopotamia), T4–T5, final victory | Hazard crescendo, elite tier, win/loss | next (`P6_HOOKS` stubbed) |
| **P7 — Living world** | Disasters, festivals/holidays, religion, culture, migration | Extra Mechanics, polish, balance | 2+ sessions |
| **P8 — Polish** | Art pass, audio, onboarding, save/load, options | UX, accessibility, tuning | ongoing |

**Guiding rule:** every phase ends with a **playable, testable build** — we never go dark for
long. Balance constants stay in [`/data/game-data.json`](../data/game-data.json) &
[the appendix](14-formulas-and-data-appendix.md) so tuning is data, not code.

---

## 3. System-expansion backlog (post-core ideas)

Grouped by area. Priority: ⭐ high / ◐ medium / ○ nice-to-have.

### World & tiles
- ○ **Hex grid** option (data model already supports neighbor lists).
- ◐ **Rivers & navigable waterways** as first-class features (trade/movement).
- ◐ **Weather over tiles** (local rain/snow affecting yields) beyond global seasons.
- ○ **Day/night** cosmetic + minor stealth/raid effects.
- ⭐ **More legendary tiles** & scripted "site" quests.

### Economy & production
- ◐ **Supply/demand market prices** for trade (dynamic economy).
- ◐ **Pollution/sustainability** meter for heavy industry (industrious tension).
- ○ **Artisan luxury goods** chain (jewelry from gold/lapis) for happiness/trade.
- ⭐ **Gunpowder era** (sulfur → cannons) as an era beyond adamantine.

### Population & society
- ⭐ **Named notable citizens / heroes** (generals, master smiths, sages) with traits.
- ◐ **Social classes / unrest factions** (nobles vs. commoners) for deeper politics.
- ◐ **Education levels** affecting skill ceilings.
- ○ **Health/epidemiology** depth (quarantine mini-game).

### Military
- ◐ **Naval units & sea combat** (with boats/shipbuilding).
- ◐ **Formations & tactics presets** (shield wall, envelop) for pre-battle choices.
- ○ **Mercenary companies** hireable with gold.
- ⭐ **Sieges** as a fuller mini-system (supply starvation, walls breach states).

### AI & diplomacy
- ⭐ **City-states / minor factions** to court.
- ◐ **Espionage** (spies, sabotage, steal tech).
- ◐ **Deeper treaties** (open borders, defensive pacts, trade embargoes).
- ○ **AI memory & grudges** persisting across a game.

### Meta & replayability
- ⭐ **Scenarios & map presets** (e.g. "The Ashlands" — volcano-heavy start).
- ◐ **Difficulty & game-length settings**.
- ◐ **Civilization traits picked at start** (draft your culture).
- ○ **Achievements & post-game statistics/timeline** ("the story of your civilization").
- ○ **Mod support** via the `/data` JSON (community tiles/flags/holidays).

---

## 4. Open design questions (to decide together later)

| # | Question | Options |
|---|----------|---------|
| Q1 | Real-time-with-pause vs. optional pure turn-based? | RTwP default; TB as a mode |
| Q2 | How punishing should winters/disasters be? | Difficulty-scaled |
| Q3 | Single continuous map vs. scenario maps? | Both (random + authored) |
| Q4 | How deep should religion go? | Keep light (morale/culture) vs. full faith system |
| Q5 | Multiplayer someday? | Out of scope for v1; data model shouldn't preclude it |
| Q6 | Art: pixel vs. vector vs. illustrated? | Lean readable semi-stylized; decide at P8 |

---

## 5. How to extend this GDD

When adding a system later:
1. Add/expand the relevant **section doc** (or create `15-*.md`, `16-*.md`, …).
2. Add any new **data** (buildings/tech/units/holidays) to [`/data/game-data.json`](../data/game-data.json).
3. Add new **flags** via the [flag pipeline](../assets/flags/README.md).
4. Record the change in the [master changelog](GAME_DESIGN_DOCUMENT.md#13-changelog).
5. Keep constants in the [appendix](14-formulas-and-data-appendix.md) so balance stays in one place.

---

### Cross-references
- The festival/holiday base system → [12 Extra Mechanics](12-extra-mechanics.md#festivals)
- Where holiday data will live → [`/data/game-data.json`](../data/game-data.json)
- Balance constants to tune each phase → [14 Appendix](14-formulas-and-data-appendix.md)
