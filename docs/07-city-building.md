# 07 — City Building

> Buildings are how you turn labor + materials into everything else: food, goods, research,
> happiness, defense, and **Development Level**. This document is the building catalog, the
> district system, upgrade chains, and material-gated construction.

**Related:** [Resources & Mining](03-resources-mining-and-gear.md) · [Population](05-population-and-happiness.md) ·
[Technology](06-technology.md) · [World & Tiles §7 DL](01-world-and-tiles.md#7-development-level-0100)

---

## 1. Construction basics

- Buildings are placed on **owned tiles** in **build slots** (slot count scales with the tile's
  [Development Level](01-world-and-tiles.md#7-development-level-0100)).
- Each building has a **material cost**, a **build time** (reduced by more/skilled **Builders**),
  an **upkeep** (materials and/or workers), and it grants **DL points** on completion.
- **Material-gated construction (your brief):** early buildings need **wood**; advanced ones
  need **stone/brick**; military ones need **metals**; elite ones need **rare minerals**.
  This makes your building options a direct readout of your economy's maturity.

```
build_time = base_time[building] / (1 + builders_assigned × craft_skill × machinery_bonus)
on complete: tile.development_level += DL_gain[building]  (up to 100)
```

---

## 2. Material-gate summary (your brief)

| Construction tier | Primary materials | Example buildings |
|-------------------|-------------------|-------------------|
| **Early** | wood, thatch | House, Tent, Hunter's Lodge, Palisade |
| **Mid** | stone, clay/**brick**, timber | Market, Granary, Walls, Smithy, Aqueduct |
| **Military** | metals (copper/iron/steel) | Barracks, Armory, Watchtower, Fort |
| **Advanced/Elite** | steel + **rare minerals** (magma glass, lapis, adamantite) | University, Foundry, Volcanic Mine, Wonders, Grand Plaza |

---

## 3. Building catalog

Grouped by function. `Cost` is representative; `Tech` is the unlocking tech; `Effect` is the
headline output. Full numbers live in [`/data/game-data.json`](../data/game-data.json).

### 3.1 Housing & population
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Tent | `house_tent` | wood×5 | — | +tiny pop cap (starter) |
| House | `house` | wood×20 | — | +pop cap, +shelter (happiness) |
| Brick House | `house_brick` | brick×20, timber×10 | architecture | ++pop cap, +shelter |
| Housing District | `housing_district` | brick×60, stone×40 | architecture | Big pop cap, dense living |
| Nursery / Family Hall ("breeding hub") | `nursery` | wood×30, cloth×10 | farming | +birth rate, +child survival |
| Manor / Grand Residence | `manor` | stone×80, lapis×5 | education | High-happiness elite housing |

### 3.2 Food
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Hunter's Lodge | `hunters_lodge` | wood×15 | primitive_tools | +hunt efficiency, stores game |
| Farm | `farm` | wood×20 | farming | Produces grain (season-dependent) |
| Fishery / Docks | `fishery` | timber×25 | boats | Fish (season-stable food) |
| Pasture | `pasture` | wood×25, stone×10 | animal_husbandry | Livestock: meat, leather, milk |
| Granary | `granary` | wood×25, clay×15 | pottery | Food storage, −spoilage → Well-Fed |
| Windmill / Mill | `mill` | timber×30, stone×20 | machinery | +food processing, flour, efficiency |

### 3.3 Extraction & refining
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Lumber Camp | `lumber_camp` | wood×10 | — | Harvest wood/timber from forest |
| Quarry | `quarry` | wood×20, stone×10 | masonry | Stone/limestone extraction |
| Mine | `mine` | timber×25, stone×20 | mining | Ore/mineral extraction (tool-gated) |
| Deep Mine | `deep_mine` | timber×40, iron×15 | engineering | Reach `deep` nodes, shoring |
| **Volcanic Mine** | `volcanic_mine` | steel×30, magma_glass×10 | volcanic_extraction | Core mining; heat/shoring built in |
| Smithy | `smithy` | wood×25, stone×20 | mining | Copper/bronze crafting |
| Kiln | `kiln` | clay×20, stone×15 | pottery | Brick, mortar (needs fuel) |
| Smelter | `smelter` | stone×30, clay×20 | smelting | Refine ore → metal |
| Forge | `forge` | stone×40, iron×20 | metallurgy | Iron goods, gear |
| Foundry | `foundry` | brick×50, iron×40 | advanced_forging | **Steel** |
| **Adamantite Forge** | `adamantite_forge` | steel×40, magma_glass×20 | adamantite_refinement | **Adamantite** goods |
| Sawmill | `sawmill` | wood×20 | roads_&_wheels | wood→timber |
| Alchemy Lab | `alchemy_lab` | brick×30, quartz×10 | chemistry | Reagents, medicine (sulfur) |

### 3.4 Culture, research & faith
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Shrine | `shrine` | wood×15, stone×10 | — | +faith, +happiness |
| Temple | `temple` | brick×40, lapis×5 | philosophy | ++faith, festivals, stability |
| Library | `library` | brick×30, timber×20 | literature | +research (scholars) |
| University | `university` | brick×70, quartz×15 | education | ++research, scholar cap |
| Theater / Amphitheater | `theater` | stone×40, timber×20 | literature | +culture → Inspired |
| Baths | `baths` | brick×40, stone×30 | engineering | +happiness, −disease |
| Monument | `monument` | stone×60, lapis×10 | mathematics | +culture, +civic pride (area happiness) |

### 3.5 Commerce & storage
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Market | `market` | wood×30, clay×20 | architecture | Trade, food variety, +gold |
| Warehouse | `warehouse` | timber×40, stone×20 | roads_&_wheels | Goods storage cap |
| Vault | `vault` | stone×50, iron×20 | metallurgy | Precious/rare storage, security |
| Trade Post | `trade_post` | timber×30, stone×20 | roads_&_wheels | Trade with AI nations, caravans |

### 3.6 Military & defense
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Palisade | `palisade` | wood×30 | — | Basic wall, +defense/safety |
| Stone Walls | `walls` | stone×80 | masonry | Strong defense, +safety |
| Watchtower | `watchtower` | wood×25, stone×15 | — | +vision, −tile danger, early warning |
| Barracks | `barracks` | wood×40, stone×30 | architecture | Recruit & house soldiers |
| Armory | `armory` | stone×40, iron×20 | architecture | Store/equip weapons+armor, +garrison (T3 gate) |
| Fort | `fort` | stone×100, iron×40 | engineering | Frontier stronghold, big garrison, supply hub |
| Stables | `stables` | timber×40, wood×30 | animal_husbandry | Cavalry units |
| Siege Workshop | `siege_workshop` | timber×50, iron×30 | engineering | Siege engines (attack forts/walls) |

### 3.7 Infrastructure
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| Road | `road` | stone×10 (per tile-link) | roads_&_wheels | **Connects tiles** (supply, vision, movement, flag banner) |
| Bridge | `bridge` | timber×30, stone×20 | roads_&_wheels | Cross water/ravine tiles |
| Aqueduct | `aqueduct` | brick×50, stone×40 | engineering | +health/happiness, enables dense cities |
| Supply Depot | `supply_depot` | timber×30, stone×20 | logistics | Extends supply range to distant tiles/armies |

### 3.8 Grand / Wonder tier (endgame, T4–T5)
| Building | id | Cost | Tech | Effect |
|----------|----|------|------|--------|
| **Grand Plaza** | `grand_plaza` | brick×200, lapis×30, steel×20 | grand_culture | Capital centerpiece; big happiness/culture (T5 gate) |
| **Wonder (various)** | `wonder_*` | huge, rare mats | grand_culture | Unique civilization-defining bonuses (victory-relevant) |
| Great Forge (Wonder) | `wonder_great_forge` | adamantite×20, steel×80 | adamantite_refinement | Empire-wide crafting speed & quality |
| Great Library (Wonder) | `wonder_great_library` | brick×200, quartz×40 | education | Empire-wide research surge |
| Colossus/Beacon (Wonder) | `wonder_beacon` | stone×300, lapis×50 | grand_culture | Vision + morale across the map |

---

## 4. Districts & adjacency

At higher DL, tiles support **districts** — clusters of related buildings that get **adjacency
bonuses** for being grouped (encourages thoughtful city layout, Pillar P1/P4).

| District | Anchor + members | Adjacency bonus |
|----------|------------------|-----------------|
| **Residential** | Housing + Nursery + Baths | +happiness, +birth rate |
| **Industrial** | Mine/Forge/Foundry + Warehouse | +production, −happiness (pollution) → put away from homes |
| **Academic** | Library + University + Monument | +research, +culture |
| **Military** | Barracks + Armory + Stables + Walls | +garrison, +unit quality |
| **Market** | Market + Trade Post + Warehouse | +gold, +food variety |
| **Sacred** | Temple + Shrine + Monument | +faith, +festival potency |

**Layout tension:** the Industrial district boosts output but lowers nearby happiness → you
naturally separate "work" tiles from "home" tiles, which reinforces the colonization loop
(specialize different tiles for different roles — see [08](08-colonization-and-expansion.md)).

---

## 5. Upgrade chains

Most buildings upgrade through levels, each raising output and DL for more materials:

```
  Tent ─▶ House ─▶ Brick House ─▶ Housing District ─▶ Manor
  Shrine ─▶ Temple ─▶ Grand Temple
  Library ─▶ University ─▶ Great Library(Wonder)
  Palisade ─▶ Stone Walls ─▶ Fortifications
  Mine ─▶ Deep Mine ─▶ Volcanic Mine
  Smithy ─▶ Forge ─▶ Foundry ─▶ Adamantite Forge
  Village center ─▶ Town Hall ─▶ City Hall ─▶ Grand Plaza   (this drives the capital tier look)
```

Upgrading is usually **cheaper than rebuilding** and preserves the building's assigned workers.

---

## 6. Settlement-type buildings (colonies)

Colonized tiles specialize via a **core building** that defines their role (details in
[Colonization](08-colonization-and-expansion.md)):

| Settlement type | Core building | Focus |
|-----------------|---------------|-------|
| Outpost | `outpost_post` | Vision/claim only, tiny |
| Village | `village_center` | Balanced small production |
| Town | `town_hall` | Growth + trade |
| City Center | `city_hall` | Dense, high output, culture |
| Industrial Hub | `industrial_core` | Max extraction/refining |
| Military Fort | `fort` | Defense & staging for armies |

---

## 7. The city-building gameplay loop

```
  survey needs (food? happiness? defense? research?) ─▶ pick building ─▶
  ─▶ pay materials + assign builders ─▶ wait build_time ─▶ DL rises, output flows ─▶
  ─▶ new slots unlock at higher DL ─▶ specialize into districts ─▶ upgrade ─▶ (repeat)
        │
        ▼ every few buildings, the tile visibly grows (Pillar P1); the capital tier evolves
```

---

### Cross-references
- Materials each building needs → [03 Resources & Mining](03-resources-mining-and-gear.md)
- Who builds & works them → [05 Population](05-population-and-happiness.md)
- Which tech unlocks them → [06 Technology](06-technology.md)
- How DL & pop cap grow from buildings → [01 World & Tiles](01-world-and-tiles.md)
- Military buildings in action → [09 Military](09-military-and-combat.md)
