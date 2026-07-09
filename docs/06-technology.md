# 06 — Technology Progression

> Technology is the master key (see the [system map](GAME_DESIGN_DOCUMENT.md#9-system-map--how-everything-connects)).
> Research unlocks buildings, exploration, colonization, armies, mining gear, and weapon tiers.
> This document is the full tech tree.

**Related:** every other doc — tech gates all of them. Especially
[Crafting](04-weapons-and-crafting.md), [Mining](03-resources-mining-and-gear.md),
[City Building](07-city-building.md), [World/Tiles](01-world-and-tiles.md).

---

## 1. How research works

- **Scholars** (pop group) working in **Library → University** produce **Research points (RP)**.
- The player selects a **current research** from the available (prerequisites-met) techs; RP
  accumulate toward its cost. One active research at a time by default (a "queue" and, later,
  **parallel research** at high tier, are on the [roadmap](13-future-roadmap.md)).
- Some techs also require a **material or building prerequisite** (e.g. you can't research
  `steel` refining without a Forge and some iron), reinforcing Pillar P3.

```
RP_per_day = Σ(scholars × research_skill × building_mult) × happiness_factor × culture_bonus
research_progress += RP_per_day ; unlocked when progress ≥ tech.cost
```

---

## 2. Eras

Techs are grouped into **six eras** that pace the whole game and line up with capital tiers and
weapon tiers.

| Era | Theme | Capital tier reached | Marquee unlock |
|-----|-------|:--------------------:|----------------|
| **E1 Stone/Tribal** | Survival basics | T1 | Farming, archery, primitive tools |
| **E2 Copper/Bronze** | First metals | T2–T3 | Mining, bronze working, architecture |
| **E3 Iron** | Advanced society | T3 | Metallurgy, engineering, literature |
| **E4 Steel** | Industrial dawn | T4 | Advanced forging, volcanic extraction |
| **E5 Adamantine** | Apex age | T5 | Adamantine refinement, elite everything |
| **E6 Civilization** | Endgame/legacy | T5 | Grand wonders, golden-age decrees (roadmap-expandable) |

---

## 3. The tech tree (ASCII)

`→` = prerequisite. Bracketed items are the marquee techs from your brief.

```
E1 STONE/TRIBAL
  [primitive_tools] ─┬─▶ [archery] ─────────────▶ fletching ──▶ (crossbows via engineering)
                     ├─▶ hunting_lore ──▶ [farming] ──┬─▶ animal_husbandry ──▶ pastures
                     │                                 └─▶ food_preservation (salt/storage)
                     └─▶ weaving ──▶ leatherworking (armor, gear cloth)

E2 COPPER/BRONZE
  [farming] ──▶ pottery ──▶ [architecture] ─┬─▶ masonry ──▶ [mountaineering] (mtn tiles)
                                            ├─▶ roads_&_wheels (roads, carts, supply)
                                            └─▶ arid_survival (desert) / boats (water)
  [mining] ──▶ smelting ──▶ [bronze_working] ──▶ alloys
        │
        └─▶ prospecting (reveals ore richness in fog)

E3 IRON
  [bronze_working]+masonry ──▶ [metallurgy] ─┬─▶ iron_tools (iron pickaxe/weapons)
                                             ├─▶ [engineering] ─┬─▶ construction (aqueduct, fort)
                                             │                  ├─▶ drainage (swamp) 
                                             │                  ├─▶ cold_survival (tundra)
                                             │                  └─▶ machinery (mills, cranes)
                                             └─▶ [literature] ──▶ mathematics ──▶ education (university)
                                                        └─▶ philosophy ──▶ (religion/culture branch)

E4 STEEL
  [metallurgy]+[engineering] ──▶ [advanced_forging] ─┬─▶ steelworking (steel weapons/armor)
                                                     └─▶ [volcanic_extraction] ─┬─▶ heat_shielding (heat gear+)
                                                                                ├─▶ shoring (stability)
                                                                                └─▶ ventilation (toxic/ash)
  engineering ──▶ logistics (better supply lines, larger armies)
  literature ──▶ bureaucracy (more decree slots, admin efficiency)

E5 ADAMANTINE
  [advanced_forging]+[volcanic_extraction] ──▶ [adamantine_refinement] ─┬─▶ adamantine_arms (elite weapons)
                                                                        ├─▶ adamantine_armor (exosuit/plate)
                                                                        └─▶ core_engineering (survive core)
  chemistry/alchemy (sulfur) ──▶ medicine (cure plague) ──▶ (roadmap: gunpowder)

E6 CIVILIZATION
  bureaucracy+education ──▶ statecraft (alliances, vassals, hegemony)
  philosophy+education ──▶ grand_culture (wonders, golden ages)
  all E5 ──▶ [legacy techs] (victory-tier, expandable in roadmap)
```

---

## 4. Tech node table (costs & unlocks)

RP costs are tunable baselines. "Unlocks" lists the headline effects.

| Tech id | Era | Prereqs | RP cost | Unlocks |
|---------|:---:|---------|:-------:|---------|
| `primitive_tools` | E1 | — | 20 | Toolmaker's Hut, stone spear, bone knife, wood/stone pickaxe |
| `archery` | E1 | primitive_tools | 40 | Bow, Fletcher, safe ranged hunting |
| `hunting_lore` | E1 | primitive_tools | 40 | +hunt yield, track dangerous game |
| `farming` | E1 | hunting_lore | 70 | **Farms**, grain, (T2 gate) |
| `weaving` | E1 | primitive_tools | 50 | Tailor, cloth, work clothes, masks(cloth) |
| `food_preservation` | E1 | farming | 80 | Salt curing, longer food shelf life (winter) |
| `pottery` | E2 | farming | 90 | Clay working, Kiln, storage jars |
| `architecture` | E2 | pottery | 130 | Brick buildings, Market, Armory, better housing |
| `masonry` | E2 | architecture | 140 | Stone walls, quarry+, limestone/mortar |
| `mountaineering` | E2 | masonry | 160 | **Claim mountain tiles**, mountain mines |
| `roads_&_wheels` | E2 | architecture | 150 | **Roads**, carts, supply lines, faster movement |
| `mining` | E2 | pottery | 120 | Mines, Smithy, Smelter, copper/tin, lapis pickaxe |
| `bronze_working` | E2 | mining+smelting | 200 | **Bronze**, bronze weapons/armor |
| `prospecting` | E2 | mining | 130 | See ore richness through fog; find hidden nodes |
| `metallurgy` | E3 | bronze_working+masonry | 320 | **Iron**, Forge, iron weapons/armor, (T3 gate) |
| `engineering` | E3 | metallurgy | 400 | Construction, Fort, aqueduct, machinery, (T4 gate) |
| `literature` | E3 | architecture | 300 | Library, +research, culture branch |
| `mathematics` | E3 | literature | 340 | +build/research efficiency, crossbows |
| `education` | E3 | mathematics | 420 | **University**, big research boost |
| `drainage` | E3 | engineering | 300 | **Claim swamp tiles**, levees, flood control |
| `cold_survival` | E3 | engineering | 300 | **Claim tundra tiles**, insulated housing |
| `logistics` | E3 | engineering | 360 | Longer supply lines, larger armies |
| `advanced_forging` | E4 | metallurgy+engineering | 600 | **Steel**, Foundry, steel weapons/armor |
| `volcanic_extraction` | E4 | advanced_forging | 700 | **Claim volcano tiles**, Volcanic Mine, heat/shoring/ventilation |
| `bureaucracy` | E4 | literature | 500 | +decree slots, admin efficiency |
| `medicine` | E4 | education | 520 | Hospital, cure plague, −death rate |
| `adamantine_refinement` | E5 | advanced_forging+volcanic_extraction | 1100 | **Adamantine** forge/weapons/armor/pickaxe, exosuit, (T5 gate) |
| `statecraft` | E6 | bureaucracy+education | 900 | Alliances, vassals, hegemony diplomacy |
| `grand_culture` | E6 | education+philosophy | 950 | **Wonders**, golden-age decrees, Grand Plaza |

*(Techs like `smelting`, `alloys`, `philosophy`, `machinery`, `construction`, `steelworking`,
`heat_shielding`, `shoring`, `ventilation`, `core_engineering`, `adamantine_arms/armor` are
minor nodes chained under the marquee ones above; see the tree in §3. Full list mirrored in
[`/data/game-data.json`](../data/game-data.json).)*

---

## 5. What tech unlocks (your brief, categorized)

| Category | Example techs → what they open |
|----------|--------------------------------|
| **New buildings** | architecture→Market/Armory, education→University, engineering→Fort/Aqueduct, volcanic_extraction→Volcanic Mine |
| **Exploration** | prospecting (see ore in fog), mountaineering/boats (reach new terrain), logistics (range) |
| **Colonization** | roads_&_wheels (supply), architecture (settlements), terrain techs (which tiles you can settle) |
| **Armies** | metallurgy (real army), logistics (bigger), advanced_forging/adamantine (elite units) |
| **Mining gear** | volcanic_extraction (heat_shielding, shoring, ventilation), metallurgy (iron pickaxe) |
| **Weapon tiers** | primitive_tools→bronze_working→metallurgy→advanced_forging→adamantine_refinement |

---

## 6. Research pacing & the tech UI

- A full game should traverse **~30–40 techs**. Early techs are cheap (minutes), late techs
  are major investments (many minutes each) — pacing the four emotional phases.
- **Tech tree screen** (see [UI](11-visual-and-ui.md#tech-tree-screen)): eras as columns,
  nodes as cards showing cost, prereqs, and unlock icons; locked nodes greyed with tooltips;
  the current research shows a progress bar and ETA.
- **Overflow RP** rolls into the next selected tech (no waste), encouraging you to keep a
  target queued.

```
  TECH TREE (columns = eras)
  E1 STONE      E2 BRONZE       E3 IRON          E4 STEEL         E5 ADAMANTINE
  ┌─────────┐   ┌───────────┐   ┌────────────┐   ┌─────────────┐  ┌──────────────┐
  │prim_tools│─▶│ mining    │─▶│ metallurgy  │─▶│adv_forging   │─▶│adamantine_ref │◀ current
  │ ✔        │   │ ✔         │   │ ✔          │   │ ▓▓▓▓░ 62%   │  │ 🔒 (locked)  │
  ├─────────┤   ├───────────┤   ├────────────┤   ├─────────────┤  ├──────────────┤
  │ farming ✔│   │bronze_wk ✔│   │ engineering│   │volcanic_extr│  │  …           │
  └─────────┘   └───────────┘   └────────────┘   └─────────────┘  └──────────────┘
```

---

### Cross-references
- Weapon/gear tiers unlocked → [04 Weapons & Crafting](04-weapons-and-crafting.md)
- Buildings unlocked → [07 City Building](07-city-building.md)
- Terrain unlocked for claiming → [01 World & Tiles §5](01-world-and-tiles.md#5-tech-locked-tiles)
- Research (scholars) production → [05 Population](05-population-and-happiness.md)
