# 12 — Extra Mechanics

> The systems that make the world feel alive and each playthrough different (Pillar P5):
> seasons, disasters, cultural traits, religion/belief, migration, and festivals. These act
> *across* all the other systems rather than being a subsystem of their own.

**Related:** [Population & Happiness](05-population-and-happiness.md) · [World & Tiles](01-world-and-tiles.md) ·
[AI Nations](10-ai-nations-and-diplomacy.md) · [Future Roadmap](13-future-roadmap.md)

---

## 1. Seasonal cycles {#seasonal-cycles}

The calendar (see [master GDD §7](GAME_DESIGN_DOCUMENT.md#7-time-turns--tick-model)) runs
**Spring → Summer → Autumn → Winter**, each ~15 days. Seasons modulate food, hazards, movement,
and mood — the steady heartbeat the player plans around.

| Season | Food / Farming | Hazards & world | Mood | Player focus |
|--------|----------------|-----------------|------|--------------|
| **Spring** | Planting; +birth rate; foraging returns | Floods (snowmelt) on flood plains | +happiness (renewal) | Plant, expand, explore |
| **Summer** | **Peak farming** (+food); hunting good | Droughts, wildfires; volcano eruption chance ↑ | High (festivals) | Grow the surplus, campaign |
| **Autumn** | **Harvest** (stock up!); game migrates (elk) | Storms | Harvest festival (+happy) | Store food & salt for winter |
| **Winter** | **Farming stalls**; food drain; spoilage slows | Cold snaps `❆`, blizzards; tundra worsens | −happiness (hardship) | Survive on stores; craft/research indoors |

```
   THE YEARLY RHYTHM
   Spring ▁▂▃  plant & grow      →  Summer ▇▇▇  surplus & war
      ▲                                            │
      │                                            ▼
   Winter ▃▂▁  ration & endure   ←  Autumn ▅▆▅  harvest & store
   (food buffer must carry you through winter — food_preservation/salt is vital)
```

**Winter is the recurring test:** if you didn't store enough food (Granaries, salt curing,
fisheries for season-stable fish), winter causes shortage → *Cold-Bitten* + starvation. Surviving
winters comfortably is a sign of a healthy economy.

---

## 2. Disasters {#disasters}

Random (but telegraphed) events that stress your systems. Frequency/severity scale with world
danger and are tunable. Each has **warning → impact → recovery**, and often a **silver lining**.

| Disaster | Trigger/where | Impact | Mitigation | Silver lining |
|----------|---------------|--------|------------|---------------|
| **Volcanic eruption** | Active volcano (mining ↑, summer ↑) | Core casualties, building damage, ash/smoke spread | Heed tremors, evac, exosuits, repair | **New rare nodes exposed** (adamantine/obsidian) |
| **Flood** | Flood plains/rivers (spring) | Damages buildings, drowns crops | Levees, `drainage` | **+soil fertility** after → bumper crop |
| **Drought** | Arid/summer | Food & water down, wildfire risk | Aqueducts, food stores, wells | Reveals dry-lakebed resources (salt) |
| **Wildfire** | Forest/drought | Destroys forest (wood), spreads | Firebreaks, clear brush | Cleared land, ash-fertilized soil |
| **Plague/Disease** | Overcrowding, swamp, toxic | *Sick* status spreads, deaths | Baths, Hospital, `medicine`, quarantine | Survivors gain resistance |
| **Earthquake** | Mountain/volcanic regions | Building/mine damage, cave-ins | `engineering`, shoring | May open new veins |
| **Blizzard / Cold snap** | Winter/tundra | Production stall, *Cold-Bitten* | Insulated housing, stores, hearths | — |
| **Bandit surge** | High-danger tiles | Raids on supply & undefended tiles | Watchtowers, forts, patrols | Loot from razing camps |

**Design intent:** disasters are **pressure, not punishment** — each teaches a system (store
food, build levees, heed tremors) and most **give something back** so recovery is a comeback
story, not just a loss.

---

## 3. Cultural traits {#cultural-traits}

Your civilization (and each AI) has a **cultural identity** that flavors bonuses and how the AI
behaves. The player's culture emerges from **choices** (buildings, decrees, flag, playstyle) and
can be nudged; AI cultures are assigned.

| Trait | Bonuses | Tensions | Fits playstyle |
|-------|---------|----------|----------------|
| **Aggressive / Martial** | +unit stats, +recruit speed, casus belli cheaper | −trade opinion, +war weariness threshold needed | Conquest |
| **Peaceful / Diplomatic** | +opinion gain, +trade income, cheaper alliances | −raw military | Alliances, culture, tall |
| **Industrious** | +production, +build/craft speed, +mining | −culture unless invested | Economy, wide, volcano-rush |
| **Scholarly** | +research, +culture | −early military | Tech/culture victory |
| **Devout** | +faith, +happiness stability, potent festivals | belief clashes with others | Faith/culture |
| **Nomadic / Mercantile** | +movement, +trade range, opportunistic | −tall city bonuses | Wide, trade, tile-grabbing |

The **flag** you pick carries a `culture_tag` ([02 §7](02-capital-and-flags.md#7-flag-data-model-what-each-flag-holds))
that resonates with a trait — a small, thematic tie between identity and mechanics. Traits also
shape **AI personalities** ([10 §2](10-ai-nations-and-diplomacy.md#2-ai-personalities)).

---

## 4. Religion / belief system {#religion}

A light belief system that primarily feeds **happiness stability** and **culture**, with social
flavor — deliberately non-preachy and mechanics-first.

- **Founding a belief:** unlocked via `philosophy`; build a **Temple** and choose a **belief
  focus** (a pantheon/philosophy theme) that grants a passive.

| Belief focus | Passive | Festival theme |
|--------------|---------|----------------|
| **Hearth & Harvest** | +food-related happiness, −winter penalty | Harvest feast |
| **Forge & Stone** | +crafting/mining happiness, −hazard morale hit | Founder's day |
| **Sky & Storm** | +movement/exploration, disaster warnings earlier | Storm rites |
| **Ancestors & War** | +combat morale, +*Heroic* duration | Victory rites |
| **Knowledge & Light** | +research, +*Inspired* chance | Festival of lamps |

- **Faith** accumulates from Temples/Shrines and is spent on **festivals**, **stability**, and
  **belief-specific decrees**. Neglecting faith in a devout population lowers happiness.
- **Belief & diplomacy:** shared belief improves opinion (esp. with **Zealot** AIs); clashing
  belief can strain relations. Heresy/schism events (roadmap) can add drama.
- **Tone:** abstract and cultural (like Civ's religion), focused on community/morale — easily
  reskinnable per setting.

---

## 5. Migration {#migration}

People move in response to conditions (Pillar P4/P5), tying happiness and expansion together.

| Migration type | Trigger | Effect |
|----------------|---------|--------|
| **Internal drift** | Unhappy/overcrowded tile vs. happy/spacious tile | Pop flows to better tiles automatically |
| **Emigration (loss)** | Sustained low happiness / starvation / danger | People **leave your civilization** (to AI or wilds) |
| **Immigration (gain)** | You're **Prosperous** while neighbors suffer; *Invite Migrants* decree | Migration waves arrive seeking a home |
| **Refugees** | An AI collapses or a disaster hits a neighbor | Refugee wave arrives (accept for pop, or turn away) |
| **Settler flows** | Your colonization ([08](08-colonization-and-expansion.md)) | Directed pop movement you control |

**Migration waves** are events: a cluster of pop appears at your border wanting entry. Accepting
grows you fast but strains food/housing/happiness (and may import unrest or disease); refusing
keeps stability but forgoes growth and may cost opinion. A meaningful choice, not free candy.

---

## 6. Festivals & events {#festivals}

Festivals are scheduled or triggered **happiness/culture spikes** — the pressure-release valve
and the seed of the **holiday** ideas you raised (see [Roadmap §Holidays](13-future-roadmap.md#holidays--special-days)).

| Festival | When | Effect |
|----------|------|--------|
| **Harvest Festival** | Autumn | +happiness, +food-variety mood, *Inspired* chance |
| **Founding Day** | Anniversary of your capital's founding | +happiness, +culture, small growth pop |
| **Victory Rites** | After a major battle win | Extends *Heroic*, +morale |
| **Belief festivals** | Per belief focus (§4) | Themed happiness/culture/faith bump |
| **Tier-up celebration** | Reaching a new capital tier | Big temporary happiness + growth buff |
| **Player-decreed festival** | Any time via *Festival Decree* | Immediate spike (gold + food cost) |

**Festival mechanics:** cost **food + gold** (and sometimes faith), pause some production
briefly, then pay back in happiness/culture/growth. Spamming them is checked by cost, cooldown,
and diminishing returns — they're a tool, not a cheat.

This system is intentionally **built to be extended** with the special **Holidays** you
described (a Day of Love → big population boost, a Gift Day → happiness surge, etc.). Those
concrete designs live in the [Future Roadmap](13-future-roadmap.md#holidays--special-days),
ready to slot in as data-driven festival entries.

---

## 7. How these interact (the living-world web)

```
   SEASONS ── set the baseline (food, hazards, mood) each quarter
      │
      ▼
   DISASTERS ── punctuate seasons with crises (+silver linings)
      │                                   │
      ▼                                   ▼
   MIGRATION ◀── driven by ── HAPPINESS ──▶ FESTIVALS/RELIGION lift it back
      │                          ▲
      ▼                          │
   CULTURAL TRAITS ── color every bonus, your & AI behavior, & diplomacy
```

None of these is a "screen you visit" — they **wash over** the core loop, so every year feels
different and the player is always adapting. That adaptive pressure is the point of Pillar P5.

---

### Cross-references
- Happiness & status effects they drive → [05 Population](05-population-and-happiness.md)
- Hazards/eruptions on tiles → [01 World & Tiles](01-world-and-tiles.md) & [03 Mining](03-resources-mining-and-gear.md)
- Traits shaping the AI → [10 AI Nations](10-ai-nations-and-diplomacy.md)
- Holiday/festival expansion ideas → [13 Future Roadmap](13-future-roadmap.md)
- Season/disaster constants → [14 Appendix](14-formulas-and-data-appendix.md)
