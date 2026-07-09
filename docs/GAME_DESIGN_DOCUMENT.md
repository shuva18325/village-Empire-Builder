# Empire Builder — Master Game Design Document

**Document version:** 0.2 (Mediterranean campaign + integrated flags)
**Last updated:** 2026-07-09
**Status:** Living document. Everything is tunable. Sections may grow independently.

> This is the master index. Each subsystem has its own file (see the table below).
> Read this file top-to-bottom first to understand the vision, the pillars, and the
> **core gameplay loop**; then dive into the numbered section that interests you.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Pillars](#2-design-pillars)
3. [Player Fantasy & Emotional Arc](#3-player-fantasy--emotional-arc)
4. [The Core Gameplay Loop](#4-the-core-gameplay-loop)
5. [Macro Progression — Village to Civilization](#5-macro-progression--village-to-civilization)
6. [The Five Resource Layers (Economy Overview)](#6-the-five-resource-layers-economy-overview)
7. [Time, Turns & Tick Model](#7-time-turns--tick-model)
8. [Win / Loss / Endgame](#8-win--loss--endgame)
9. [System Map — How Everything Connects](#9-system-map--how-everything-connects)
10. [Section Index](#10-section-index)
11. [Glossary](#11-glossary)
12. [Design Conventions & Notation](#12-design-conventions--notation)
13. [Changelog](#13-changelog)

---

## 1. Executive Summary

**Empire Builder** is a single-player strategy game about growing **one settlement into a
civilization**. The shipped **Mediterranean Campaign** ([doc 15](15-mediterranean-campaign.md))
plays on a staged, authored world that grows from a **60-tile Peloponnese** start to a
**300–400-tile Mediterranean**; a compact ~100-tile random world remains as the Skirmish
default. You begin with a **Primitive Village** on a single tile with an auto-generated name. You explore through **fog-of-war**, **claim** and
**colonize** neighboring tiles, **mine** ever-deeper and more dangerous materials, **research**
technology, **craft** weapons from wooden spears to **adamantine swords**, manage a **living
population** with jobs and happiness, field **armies** with supply lines, and contend with
**rival AI nations** through diplomacy or war.

The central tension is **risk vs. reward on the tile map**: the best materials
(obsidian, lapis, magma glass, and the ultra-rare **adamantine ore**) sit inside the most
**dangerous tiles** — volcanoes with heat, ash, smoke, and eruptions. To exploit them you
must first climb the **tech, gear, and logistics** ladders. Every advance you make is
visible on the map: fog lifts, roads connect tiles into a glowing network, your **flag**
spreads across the land, and your capital visually evolves through five tiers to a
**Grand Capital**.

**One-line pitch:** *Turn a shivering village into a flag-flying civilization by daring the
volcano for the ore that forges empires.*

### Reference titles (for tone, not cloning)
- The tile-claim / tech-race / rival-AI structure of **Civilization**.
- The population-as-workforce and hazard-mining feel of **Rimworld / Dwarf Fortress**.
- The city-tier evolution and cozy-to-grand progression of **Kingdoms & Castles / Banished**.
- The material-gated crafting ladder of survival-crafting games (**wood → stone → metal → rare**).

---

## 2. Design Pillars

These five pillars are the tie-breakers for every design decision. If a proposed feature
does not serve at least one pillar, it is cut or shelved to the [roadmap](13-future-roadmap.md).

| # | Pillar | What it means | The player should feel… |
|---|--------|---------------|-------------------------|
| P1 | **The map tells your story** | Every advance is *visible*: fog lifting, roads linking tiles, banners spreading, the capital's sprite evolving. | "I can see how far I've come." |
| P2 | **Risk lives where reward lives** | The best materials are guarded by the worst hazards. Progress = earning the right to mine danger. | "Dare I dig here yet?" |
| P3 | **Layered ladders, one climb** | Tech, gear, weapons, buildings, and population all gate each other. You never max one in isolation. | "Everything I build unlocks the next thing." |
| P4 | **A population that is alive** | People are typed workers with happiness, status effects, and needs — not an abstract number. | "My people are counting on me." |
| P5 | **A world that pushes back** | Seasons, disasters, wildlife, and rival nations act on their own. The world is not a static sandbox. | "I am not alone out here." |

---

## 3. Player Fantasy & Emotional Arc

The game is paced as a deliberate **survival → stability → ambition → dominance** arc:

```
   EARLY GAME            MID GAME               LATE GAME             ENDGAME
 ┌────────────┐       ┌────────────┐        ┌────────────┐        ┌────────────┐
 │  SURVIVAL  │  ──▶  │ STABILITY  │  ──▶   │  AMBITION  │  ──▶   │ DOMINANCE  │
 │ "Don't     │       │ "We have   │        │ "We can    │        │ "We are    │
 │  starve or │       │  a real    │        │  take the  │        │  the       │
 │  freeze."  │       │  town."    │        │  volcano." │        │  Grand     │
 │            │       │            │        │            │        │  Capital." │
 └────────────┘       └────────────┘        └────────────┘        └────────────┘
   Hunt, forage,        Farms, roads,          Metallurgy,           Adamantine army,
   first mine,          barracks, first        volcanic mining,      subjugate/ally
   claim 2-3 tiles.     colony, a flag.        elite weapons.        all AI nations.
```

Each phase introduces exactly one **new headline system** so the player is never
overwhelmed:

| Phase | New headline system | Emotional beat |
|-------|--------------------|----------------|
| Survival | Hunting & foraging, fog exploration | "We might not make it." |
| Stability | Colonization, the **flag**, seasons | "This is *ours* now." |
| Ambition | Metallurgy, volcanic extraction, armies | "We're strong enough to reach for more." |
| Dominance | Adamantine tier, diplomacy endgame | "History will remember us." |

---

## 4. The Core Gameplay Loop

Everything funnels through one repeating loop. The **inner loop** (seconds-to-minutes) feeds
the **outer loop** (minutes-to-hours), which feeds the **macro loop** (a whole playthrough).

### 4.1 Inner loop — "Read → Decide → Act → React"

```
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐ │
  │  1. READ  │──▶│ 2. DECIDE │──▶│  3. ACT   │──▶│ 4. REACT │─┘
  │ the map & │   │ what to   │   │ assign,   │   │ world &  │
  │ dashboards│   │ improve   │   │ build,    │   │ pop      │
  │ (needs,   │   │ next      │   │ research, │   │ respond; │
  │  threats) │   │           │   │ send army │   │ new needs│
  └───────────┘   └───────────┘   └───────────┘   └──────────┘
```

1. **Read** — Scan the HUD: food/happiness/danger alerts, idle workers, fog edges,
   incoming season, AI movements. (See [UI](11-visual-and-ui.md).)
2. **Decide** — Pick the highest-leverage move: assign idle pop, queue a building, start a
   tech, mine a new vein, send a detachment.
3. **Act** — Commit resources/labor. Most actions have a **cost + a lead time**.
4. **React** — The world resolves: pop grows or grumbles, the mine yields or a worker gets
   Heat-Stressed, the AI counter-expands. New information → back to Read.

### 4.2 Outer loop — the expansion engine

```
        EXPLORE  ──▶  CLAIM  ──▶  COLONIZE  ──▶  DEVELOP  ──▶  DEFEND
          ▲                                                      │
          │                                                      ▼
          └───────────────  more pop, tech, & materials  ◀───────┘
```

- **Explore** a fogged tile (send a scout / hunter; costs time & risk).
- **Claim** it (flag it; costs influence/stability).
- **Colonize** it (found a settlement; costs population + resources + tech).
- **Develop** it (raise its 0–100 development level with buildings & roads).
- **Defend** it (garrison + supply line; AI & wildlife will test you).
- The rewards — more people, more materials, more tech — **fund the next loop** and let
  you reach tiles that were previously locked (mountains, deserts, swamps, tundra,
  volcanoes). See [Colonization](08-colonization-and-expansion.md).

### 4.3 Macro loop — a full playthrough

```
 Primitive Village ─▶ Organized Settlement ─▶ Early Capital ─▶ Developed Capital ─▶ GRAND CAPITAL
        │                     │                     │                  │                  │
   hunt & survive       claim & flag         metallurgy &        volcanic core      civilization
                                              first army          & elite army         victory
```

A full game is the climb up the **five capital tiers**, gated by population, buildings,
tech, and territory. See §5 and [Capital & Flags](02-capital-and-flags.md).

---

## 5. Macro Progression — Village to Civilization

The capital advances through **five named tiers**. Each tier is a *gate* that requires
you to have grown across multiple systems at once (Pillar P3). Full requirement tables live
in [Capital & Flags](02-capital-and-flags.md#capital-evolution); the summary:

| Tier | Name | Headline unlock | Rough gate (see §-02 for exact) |
|------|------|-----------------|--------------------------------|
| T1 | **Primitive Village** | Start state; hunting, foraging, wooden tools | — (you begin here) |
| T2 | **Organized Settlement** | **Choose your flag**, first colony, roads, seasons matter | Pop ≥ 25, 3 building types, Farming tech, 2 tiles claimed |
| T3 | **Early Capital** | Metallurgy, barracks & armies, brick buildings, rename capital | Pop ≥ 120, Metallurgy, 1 colony, an Armory |
| T4 | **Developed Capital** | Volcanic extraction, iron/steel, forts, advanced diplomacy | Pop ≥ 400, Engineering, a claimed volcano tile, 3 colonies |
| T5 | **Grand Capital** | Adamantine refinement, elite army, civilization-tier decrees | Pop ≥ 1000, Adamantine Refinement, Grand Plaza, 6 developed tiles |

> **Flag timing:** the player may choose their flag once they reach **Organized Settlement
> (T2)**, and may re-affirm/redesign it at **Early Capital (T3)**. **Renaming the capital**
> unlocks at **Early Capital (T3)** — before that it uses an auto-generated name.

---

## 6. The Five Resource Layers (Economy Overview)

The economy is deliberately **layered** so that no single resource dominates. Detailed
tables live in [Resources](03-resources-mining-and-gear.md); this is the mental model.

| Layer | Examples | Primary use | Where it comes from |
|-------|----------|-------------|---------------------|
| **L1 — Sustenance** | Food (berries, fish, game meat), Water | Keeps pop alive & growing | Hunting, foraging, farms, fishing |
| **L2 — Building materials** | Wood, Stone, Clay, Brick, Timber, Limestone | Construction | Lumber camps, quarries, kilns |
| **L3 — Metals & ores** | Copper, Tin, Iron, Bronze, Steel, Adamantine | Weapons, armor, elite buildings | Mines (tool-gated) |
| **L4 — Special minerals** | Obsidian, Salt, Coal, Lapis, Quartz, Magma glass | Advanced recipes, luxury, fuel | Hazard tiles, deep mines |
| **L5 — Soft/abstract** | Population, Happiness, Culture, Influence, Research, Faith | Everything social & political | Buildings, decrees, festivals |

**The golden rule of the economy:** *L3/L4 (the good stuff) is gated behind L1/L2 stability
and L5 (tech/pop/happiness).* You cannot rush adamantine; you must first feed, house, and
teach your people, then earn the gear to survive the volcano.

```
   L1 Food/Water  ──feeds──▶  L5 Population  ──works──▶  L2 Materials
        ▲                          │                         │
        │                          │ researches              │ builds
        │                          ▼                         ▼
        └───────  L5 Happiness ◀── Culture/Faith        L3/L4 Metals & Minerals
                                    (buildings/festivals)      │
                                                               ▼
                                                        Weapons / Armies / Grand Capital
```

---

## 7. Time, Turns & Tick Model

Empire Builder uses a **real-time-with-speed-control** clock (pausable), overlaid on a
**seasonal calendar**. (An optional pure turn-based mode is on the [roadmap](13-future-roadmap.md).)

| Unit | Length | Meaning |
|------|--------|---------|
| **Tick** | 1 simulation step (~1s at 1× speed) | Base resolution for production, movement, combat |
| **Day** | 20 ticks | Smallest calendar unit shown to player |
| **Season** | 15 days (300 ticks) | Spring / Summer / Autumn / Winter — drives farming, food, hazards |
| **Year** | 4 seasons (60 days) | Aging, AI planning cadence, festival calendar |

**Speed controls:** Pause · 1× · 2× · 3×. Major events (eruption, invasion, disaster,
tier-up) **auto-pause** and raise a modal. Full model in
[Extra Mechanics §Seasons](12-extra-mechanics.md#seasonal-cycles) and the
[Formulas Appendix](14-formulas-and-data-appendix.md).

---

## 8. Win / Loss / Endgame

### 8.1 Victory conditions (any one ends the game as a win)

| Victory | How | Flavor |
|---------|-----|--------|
| **Grand Capital (Domination-lite)** | Reach Tier 5 **and** hold 6+ developed tiles | Your seat of power is unmatched |
| **Conquest** | Eliminate or vassalize all AI nations | The last flag standing |
| **Cultural Ascendancy** | Reach Culture/Faith thresholds + build all Wonder-tier buildings | Your way of life defines the age |
| **Adamantine Age** | Field a full elite (adamantine) army + refine 100 adamantine | Master the volcano's heart |

### 8.2 Loss conditions

| Loss | Trigger |
|------|---------|
| **Collapse** | Capital population hits 0 (starvation, plague, or slaughter) |
| **Conquest** | An AI nation captures your capital tile |
| **Abandonment (soft)** | Happiness stays at 0 for a full year → mass emigration, capital downgrades and can be lost |

### 8.3 Endless mode
After any victory, the player may continue in **Legacy Mode** (all systems unlocked, AI
keeps playing) — good for sandbox and for testing future content.

---

## 9. System Map — How Everything Connects

This is the single most important diagram in the GDD. It shows the **dependency web**: an
arrow `A ──▶ B` means "A feeds / unlocks / constrains B."

```
                         ┌─────────────────┐
                         │   TECHNOLOGY    │  (06)
                         │   (research)    │
                         └────────┬────────┘
             unlocks buildings,   │   unlocks gear, weapons,
             tiles, units, gear   │   colonization, extraction
              ┌───────────────────┼───────────────────────┐
              ▼                    ▼                       ▼
      ┌───────────────┐   ┌────────────────┐     ┌─────────────────┐
      │ CITY BUILDING │   │  MINING & GEAR │     │  MILITARY       │
      │     (07)      │   │      (03)      │     │     (09)        │
      └───────┬───────┘   └───────┬────────┘     └────────┬────────┘
              │ houses/farms      │ ores/minerals         │ needs weapons(04),
              │ produce & store   │ + gear                │ supply lines(08),
              ▼                    ▼                       ▼   pop(05)
      ┌─────────────────────────────────────────────────────────────┐
      │                    POPULATION & HAPPINESS (05)              │
      │        farmers · miners · builders · soldiers ·            │
      │              hunters · scholars  (+ status effects)         │
      └───────┬───────────────────────┬───────────────────┬─────────┘
              │ workers               │ happiness          │ soldiers
              ▼                       ▼                    ▼
      ┌───────────────┐      ┌────────────────┐   ┌─────────────────┐
      │  WORLD/TILES  │◀────▶│  COLONIZATION  │   │ AI NATIONS &    │
      │     (01)      │claim │      (08)      │◀─▶│ DIPLOMACY (10)  │
      └───────┬───────┘      └────────────────┘   └─────────────────┘
              │ terrain, resources, hazards, animals, legendary tiles
              ▼
      ┌─────────────────────────────────────────────────────────────┐
      │   EXTRA MECHANICS (12): seasons · disasters · culture ·      │
      │   religion · migration · festivals  — act on ALL of above    │
      └─────────────────────────────────────────────────────────────┘

   The CAPITAL (02) + FLAG sit on top of the World layer and evolve T1→T5
   as thresholds across ALL systems are met. The UI (11) renders everything.
```

**Read it as:** Tech is the master key. It opens Buildings, Mining/Gear, and Military.
Those three feed Population, which is the beating heart — people do all the work and their
Happiness gates growth. Population + Tiles drive Colonization, which expands the World,
which (with the AI) creates the pressures the whole engine responds to. Seasons, disasters,
culture, and religion perturb the entire web. The Capital tier and your Flag are the
scoreboard sitting on top.

---

## 10. Section Index

| # | Document | One-liner |
|---|----------|-----------|
| 01 | [World & Tiles](01-world-and-tiles.md) | The ~100-tile world: terrain, resources, fog, hazards, animals, legendary tiles |
| 02 | [Capital & Flags](02-capital-and-flags.md) | 5-tier capital evolution, renaming, and the full flag system (your PNGs) |
| 03 | [Resources, Mining & Gear](03-resources-mining-and-gear.md) | Material taxonomy, pickaxe tiers, hazard mining, worker gear |
| 04 | [Weapons & Crafting](04-weapons-and-crafting.md) | Tribal → adamantine weapon tree, crafting buildings, recipes |
| 05 | [Population & Happiness](05-population-and-happiness.md) | Job classes, growth, status effects, decrees |
| 06 | [Technology](06-technology.md) | Full tech tree, eras, costs, unlocks |
| 07 | [City Building](07-city-building.md) | Building catalog, districts, upgrade chains, costs |
| 08 | [Colonization & Expansion](08-colonization-and-expansion.md) | Claim → colonize → develop, roads & supply lines |
| 09 | [Military & Combat](09-military-and-combat.md) | Units, armies, supply, combat resolution |
| 10 | [AI Nations & Diplomacy](10-ai-nations-and-diplomacy.md) | Rival AI, personalities, trade, war, reputation |
| 11 | [Visual & UI](11-visual-and-ui.md) | Screen inventory, ASCII mockups, HUD, iconography |
| 12 | [Extra Mechanics](12-extra-mechanics.md) | Seasons, disasters, culture, religion, migration, festivals |
| 13 | [Future Roadmap](13-future-roadmap.md) | Holiday/festival ideas, backlog, phased build plan |
| 14 | [Formulas & Data Appendix](14-formulas-and-data-appendix.md) | Every formula, balance constants, progression charts, sample run |
| 15 | [The Mediterranean Campaign](15-mediterranean-campaign.md) | The shipped campaign: Peloponnese→Empire acts, tile counts, naval ages, the Iron Pantheon, 8 rival empires |

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Tile** | One of the ~100 hex/square cells of the world map; the atomic unit of territory. |
| **Development Level (DL)** | A tile's 0–100 build-up score; higher DL = more slots, output, capacity. |
| **Fog-of-War (FoW)** | Unexplored tiles are shadowed; you see terrain only after scouting. |
| **Claim** | Assert ownership of a tile (plants your flag) — prerequisite to colonizing. |
| **Colonize** | Found a settlement on a claimed tile, turning it productive. |
| **Supply Line** | A road/logistics link that keeps a distant tile or army functioning. |
| **Pop group** | A typed portion of population (farmer, miner, builder, soldier, hunter, scholar). |
| **Status effect** | A timed modifier on pop (e.g. *Well-Fed*, *Heat-Stressed*). |
| **Decree** | A leader-issued policy (e.g. *Encourage Families*) with cost & effect. |
| **Hazard zone** | A sub-region of a tile inflicting damage/penalties (heat, ash, smoke, toxic). |
| **Legendary tile** | A rare special tile with a unique bonus/challenge. |
| **Influence** | Soft resource spent to claim tiles and act in diplomacy. |
| **Tier** | The capital's evolution stage T1–T5. |
| **Tick / Day / Season / Year** | The nested time units (see §7). |

---

## 12. Design Conventions & Notation

- **Numbers are tunable.** Every constant appears in the
  [Formulas & Data Appendix](14-formulas-and-data-appendix.md) so balance lives in one place.
- **Formulas** use plain notation: `output = base × modifier`, `clamp(x, lo, hi)`,
  `max(...)`, `min(...)`, `floor(...)`.
- **Costs** are written `{wood:20, stone:10}` (a resource bundle).
- **Gates/requirements** are written as bullet checklists.
- **IDs**: lower_snake_case (`volcano_core`, `adamantine_sword`) — these match the
  machine-readable seeds in [`/data`](../data).
- **"TBD"** marks a deliberately open decision; **"(roadmap)"** marks deferred scope.

---

## 13. Changelog

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-07-09 | First complete pass: all 14 sections, flag pipeline, seed data. |
| 0.2 | 2026-07-09 | **Mediterranean Campaign** (doc 15 + `campaign-mediterranean.json`): staged 60→100→300–400-tile world, naval ages, the Iron Pantheon metal ladder, 8 rival empires. Six user flags integrated as PNG+SVG (incl. reworked Imperial Eagle with globus cruciger). `adamantite` renamed **`adamantine`** everywhere. Naval techs/buildings added to core data. |

> Add a row here every time the GDD changes materially. Keep the newest on top of §13's list
> or bottom — pick one and stay consistent (currently: append).
