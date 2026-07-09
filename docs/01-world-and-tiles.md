# 01 — World & Tiles

> The world is the game board. Everything else — mining, colonization, war, hazards — is a
> verb applied to a **tile**. This document defines what a tile *is*, how the ~100-tile world
> is generated, and every property a tile can carry.

**Related:** [Colonization](08-colonization-and-expansion.md) ·
[Resources & Mining](03-resources-mining-and-gear.md) ·
[Extra Mechanics](12-extra-mechanics.md) · [Data appendix](14-formulas-and-data-appendix.md)

---

## 1. World shape & size

> **Campaign note:** the shipped **Mediterranean Campaign** replaces this generic worldgen
> with a staged, authored map — 60-tile Peloponnese → 100-tile Greece → 300–400-tile
> Mediterranean. See **[doc 15](15-mediterranean-campaign.md)**. Everything below still
> defines the *tile model itself* (used by both) and the random-map **Skirmish** mode.

- The world is a grid of **~100 tiles** (default **10 × 10**, configurable 8×8 … 12×12).
- Default topology: **square grid with 8-neighbor adjacency** (orthogonal + diagonal).
  A **hex option** is on the [roadmap](13-future-roadmap.md); the data model is
  topology-agnostic (tiles store a neighbor list, not fixed coordinates-only logic).
- Coordinates: `(col, row)`, `0`-indexed from the top-left. Tile IDs: `t_{col}_{row}`.
- The map has an implicit **difficulty gradient**: your start is in a temperate, low-danger
  region; the richest & most dangerous tiles (volcanoes, deep tundra, toxic swamps) cluster
  toward the map edges/corners, so "reaching them" is a journey.

```
        col→ 0    1    2    3    4    5    6    7    8    9
   row ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
    0  │ ▓▓ │ ▓▓ │ ~~ │ ~~ │ ▲▲ │ ▲▲ │ ?? │ ?? │ ?? │ ?? │   ▓ = tundra   ~ = water
       ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤   ▲ = mountain
    1  │ ▓▓ │ ,, │ ,, │ ~~ │ ▲▲ │ ?? │ ?? │ 🌋 │ ?? │ ?? │   , = plains    ♣ = forest
       ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤   ░ = desert
    2  │ ,, │ ,, │[HOME]│ ,, │ ♣♣ │ ?? │ ?? │ ?? │ ?? │ ?? │  🌋 = volcano
       ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤   ?? = fogged (unknown)
    3  │ ,, │ ♣♣ │ ,, │ ,, │ ♣♣ │ ?? │ ?? │ ?? │ ?? │ ?? │  [HOME] = your capital
       └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘   (only ~explored tiles shown;
                    … rows 4–9 fogged at start …               rest is dark)
```

---

## 2. Anatomy of a tile (the data model)

Every tile is a record with the following fields. This maps directly to the schema in
[`/data/game-data.json`](../data/game-data.json) and is the contract the whole game reads.

```jsonc
{
  "id": "t_2_2",
  "coord": {"col": 2, "row": 2},
  "terrain": "plains",              // see §3
  "biome_temp": "temperate",        // temperate | arid | cold | volcanic
  "elevation": 1,                   // 0 water .. 4 peak (affects movement/vision)
  "explored": true,                 // fog-of-war state (see §6)
  "visibility": "clear",            // clear | ash_dimmed | smoke_dimmed | fogged
  "owner": "player",                // player | ai_<id> | neutral | contested
  "development_level": 12,          // 0..100 (see §7)
  "settlement_type": "capital",     // none|outpost|village|town|city_center|industrial|fort|capital
  "population_capacity": 60,        // max pop this tile can host at current DL (see §8)
  "population": 41,
  "danger_level": 1,                // 0..5 (see §9)
  "exploration_difficulty": 1,      // 0..5 — cost/risk to scout (see §6)
  "colonization_req": { ... },      // gate to colonize (see §08 doc)
  "resources": [ {"type":"wood","abundance":3,"depth":"surface"}, ... ], // §4
  "animals": [ {"species":"deer","density":3}, ... ],                    // §10
  "hazards": [ {"type":"heat","intensity":0}, ... ],                     // §11
  "buildings": [ "house_lvl1", "granary" ],
  "roads": ["t_2_1","t_2_3"],       // connected neighbors (supply/vision)
  "tags": ["starting_region"],      // legendary, sacred, ruins, etc. (§12)
  "unlock_tech": null               // tech required to even claim (mountain/desert/…) (§5)
}
```

---

## 3. Terrain types

Terrain sets a tile's **baseline**: what it can grow, how hard it is to build on, its default
danger, and which tech (if any) is required to claim it.

| Terrain | Symbol | Move cost | Build ease | Food base | Notable resources | Claim tech req | Default danger |
|---------|:------:|:---------:|:----------:|:---------:|-------------------|----------------|:--------------:|
| **Plains** | `,,` | 1 | High | ●●● | clay, berries, game | — | 0–1 |
| **Grassland/Meadow** | `''` | 1 | High | ●●● | berries, game, wild grain | — | 0–1 |
| **Forest** | `♣♣` | 2 | Med | ●● | **wood**, timber, game, mushrooms | — | 1–2 |
| **Hills** | `∩∩` | 2 | Med | ● | stone, copper, clay | — | 1 |
| **Mountain** | `▲▲` | 3 | Low | ○ | **iron, tin, coal, quartz, silver** | `masonry`/`mountaineering` | 1–2 |
| **Desert** | `░░` | 2 | Low | ○ | **salt, obsidian(some), glass sand**, quartz | `arid_survival` | 1–2 |
| **Swamp/Marsh** | `≈≈` | 3 | Low | ●● (fish) | clay, peat, reeds, **rare herbs** | `drainage` | 2–3 (disease) |
| **Tundra** | `▓▓` | 3 | Low | ○ | furs (game), iron, **lapis(some)** | `cold_survival` | 2–3 |
| **Water (lake/coast)** | `~~` | — (boat) | — | ●●● (fish) | fish, salt, pearls, reeds | `boats` to use | 0–1 |
| **Volcanic slope** | `▒▒` | 3 | V.Low | ○ | **obsidian, magma glass, lapis, sulfur** | `volcanic_extraction` | 3–4 |
| **Volcano (core)** | `🌋` | 4 | V.Low | ○ | **adamantine ore**, obsidian, magma glass, lapis | `volcanic_extraction` (+gear) | 4–5 |

**Locked terrains** (`unlock_tech ≠ null`) show as claimable-but-greyed with a padlock and a
tooltip naming the required tech. This is a core **Pillar P3** gate: the map visibly promises
reward you can't yet take. See [Technology](06-technology.md).

---

## 4. Resources on tiles

Each tile carries a list of resource nodes. A node has a **type**, an **abundance** (1–5 dots),
and a **depth**:

| Depth | Meaning | Extraction requirement |
|-------|---------|------------------------|
| `surface` | Foraged/gathered | Any worker; no mine needed (berries, wood on forest, salt flats) |
| `shallow` | Shallow dig | Basic mine + wooden/stone pickaxe |
| `deep` | Deep vein | Mine + iron pickaxe, sometimes shoring/tech |
| `core` | Volcanic core | Volcanic mine + adamantine pickaxe + hazard gear |

Full material taxonomy (metals, minerals, building materials, food) and the mining rules that
consume these nodes live in **[Resources, Mining & Gear](03-resources-mining-and-gear.md)**.
Quick reference of what appears where:

| Category | Members | Typical terrains |
|----------|---------|------------------|
| **Metals** | copper, tin, iron, (bronze*, steel*, adamantine) | hills, mountains, volcano core |
| **Minerals** | clay, limestone, obsidian, salt, coal, lapis, quartz, sulfur, magma glass | plains/hills (clay), desert (salt/obsidian), mountain (coal/quartz), volcano (obsidian/lapis/magma glass) |
| **Building** | wood, stone, brick*, timber | forest (wood/timber), hills/mountain (stone) |
| **Food** | berries, fish, game meat, wild grain, mushrooms | everywhere per terrain |

`*` bronze, steel, brick are **crafted/refined**, not mined — see [Crafting](04-weapons-and-crafting.md).

**Abundance & depletion:** each node has a finite `reserve` (abundance × constant). Mining
draws it down; **`surface` food nodes regenerate seasonally**, ore nodes do **not** (they can
run dry — a real strategic pressure that pushes expansion, Pillar P2/P5).

---

## 5. Tech-locked tiles

Harsh terrains cannot even be **claimed** until you research the enabling tech. This is how the
map's difficulty gradient is enforced.

| Terrain | Unlock tech | Era | Why it's gated |
|---------|-------------|-----|----------------|
| Mountain | `mountaineering` (needs `masonry`) | Bronze | Need roads/mines to work steep rock |
| Desert | `arid_survival` | Bronze | Water logistics & heat |
| Swamp | `drainage` | Iron | Disease control & foundations |
| Tundra | `cold_survival` | Iron | Insulation & winter food storage |
| Water use | `boats` → later `shipbuilding` | Bronze/Iron | Fishing fleets, coastal claims |
| Volcanic slope / core | `volcanic_extraction` (needs `metallurgy`+`engineering`) | Late Iron | Heat/ash/eruption survival |

Until unlocked, the tile is visible (once explored) but **not interactable** beyond scouting.

---

## 6. Fog-of-War & exploration

Three visibility states drive the map's sense of discovery (Pillar P1):

```
   ████████  UNEXPLORED (fogged)     — solid dark; terrain unknown, shows only "??"
   ▒▒▒▒▒▒▒▒  EXPLORED, UNOWNED       — dimmed; terrain + rough danger known, details hidden
   ────────  REVEALED / OWNED        — full color; all fields visible & interactable
```

- **What lifts fog:** an adjacent **owned tile** reveals neighbors at *silhouette* level
  (terrain guessed). To fully **explore** a tile you send a **Scout** or **Hunter** party.
- **Exploration action:** costs time proportional to `exploration_difficulty` (0–5) and
  incurs a **risk roll** against the tile's `danger_level` (ambush by wildlife/bandits — see
  §9). A failed roll can wound/kill the party; a great roll can reveal a **legendary tile** or
  a bonus resource. Formula in the [appendix](14-formulas-and-data-appendix.md#exploration).
- **Vision decays:** hazard zones re-fog partially — **ash zones** and **smoke zones** drop a
  tile to a `*_dimmed` visibility even after exploration until the hazard clears (§11).
- **Line of sight & elevation:** higher `elevation` tiles (mountains, volcano) grant vision of
  more distant neighbors when owned — good scouting perches.

```
  Exploration outcome table (roll d100 + scout_skill − danger×10):
  ┌─────────────┬──────────────────────────────────────────────┐
  │  < 10       │  Ambush! party wounded, tile stays fogged     │
  │  10 – 39    │  Partial: terrain revealed, resources hidden  │
  │  40 – 84    │  Success: tile fully revealed                 │
  │  85 – 97    │  Bonus: reveal + hidden resource node found   │
  │  ≥ 98       │  Discovery: reveal + LEGENDARY tag if present │
  └─────────────┴──────────────────────────────────────────────┘
```

---

## 7. Development Level (0–100)

Every tile tracks a **Development Level (DL)** — its build-up score. DL is not a single
building; it's the **aggregate** of infrastructure, and it unlocks capacity in bands:

| DL band | Name | Unlocks on the tile |
|---------|------|---------------------|
| 0–9 | **Wild / Outpost** | Basic gathering, tent housing; tiny pop cap |
| 10–24 | **Village** | Houses, farm, first workshop; roads out |
| 25–44 | **Town** | Markets, granary, walls; specialization begins |
| 45–64 | **Developed** | Districts, advanced production, mid-tier buildings |
| 65–84 | **City** | Elite buildings, dense housing, high output |
| 85–100 | **Metropolis** | Wonders, max capacity, civilization-tier structures |

- **Raising DL:** constructing/upgrading buildings, roads, and completing tile projects each
  grant DL points (see [City Building](07-city-building.md)). DL also passively rises a little
  when a tile is **happy, fed, and connected**.
- **DL can fall:** disasters, unrest, siege damage, or losing a supply line can *reduce* DL.
- DL directly scales **population_capacity** (§8) and the tile's output multiplier.

---

## 8. Population capacity

How many people a tile can host:

```
population_capacity = floor( base_capacity[terrain]
                           × (1 + development_level / 50)     // DL doubles cap at DL=50, triples at 100
                           × housing_multiplier               // from housing buildings
                           × happiness_factor )               // unhappy tiles shed people
```

| Terrain | base_capacity |
|---------|:-------------:|
| Plains / Grassland | 20 |
| Forest / Hills | 14 |
| Mountain / Desert / Tundra | 8 |
| Swamp | 10 |
| Volcanic slope / core | 5 |
| Water (coastal settlement) | 12 |

Population beyond capacity triggers **emigration** or forces expansion — a key pressure that
feeds the outer loop. See [Population](05-population-and-happiness.md).

---

## 9. Danger level (0–5)

`danger_level` is a per-tile threat rating that affects **exploration risk**, **worker safety**,
and the **frequency/strength of hostile events** on that tile.

| Level | Label | Sources | Effects |
|:-----:|-------|---------|---------|
| 0 | Safe | Home region plains | No hostile events |
| 1 | Low | Light wildlife | Rare rabbit/deer skittishness; trivial |
| 2 | Moderate | Boar, wolves, minor bandits | Occasional worker injury; garrison advised |
| 3 | High | Wolf packs, bandit camps, rival scouts | Raids on undefended tiles; supply loss |
| 4 | Severe | Elk-herd stampedes, organized bandits, volcanic slope | Frequent attacks; needs a fort/garrison |
| 5 | Deadly | Rival army range, volcano core, apex predators | Constant threat; only elite ops survive |

**Danger is dynamic:** it rises with nearby AI hostility, wildlife density, and hazard
intensity; it falls when you build **watchtowers/forts**, clear **bandit camps**, or cull
wildlife (§10). See [Military](09-military-and-combat.md) and [AI](10-ai-nations-and-diplomacy.md).

---

## 10. Animals & hunting

Tiles host wildlife that hunters can harvest for **food, furs, bone, and leather** — the
earliest and most important resource in the Survival phase.

| Species | Symbol | Terrains | Yield | Difficulty | Danger to hunter | Notes |
|---------|:------:|----------|-------|:----------:|:----------------:|-------|
| **Rabbit** | `r` | plains, meadow, forest | Small meat, fur | 1 | 0 | Fast-breeding; reliable early food |
| **Deer** | `d` | forest, meadow, hills | Med meat, leather | 2 | 0 | Skittish; needs bows for efficiency |
| **Boar** | `b` | forest, swamp | Med meat, hide, bone | 3 | 2 | **Fights back** — can wound hunters |
| **Elk** | `e` | tundra, forest, hills | Large meat, big hide | 3 | 2 | Seasonal migration; big payoff |
| **Wolf** | `w` | forest, tundra, mountain | Fur, fang | 3 | 3 | **Predator** — raises tile danger; hunts your game & lone workers |
| **Bear** | `B` | forest, mountain | Large meat, pelt, fat | 4 | 4 | Apex; needs a hunting party + spears |
| **Fish (school)** | `≈` | water, coast | Steady food | 1 | 0 | Needs `boats`; season-stable food |
| **Wild fowl** | `^` | meadow, swamp | Small meat, feathers | 2 | 0 | Feathers → arrows/fletching |

**Hunting mechanics (summary):**
- Assign **Hunters** (pop group) to a tile; they auto-harvest available species up to a
  **sustainable rate** (over-hunting depletes density → the species can locally go extinct and
  won't regenerate for several seasons).
- **Tools matter:** bare hands < wooden spear < stone-tipped spear < bow. Bows enable safe
  ranged hunting of dangerous species (boar/bear) with far lower injury risk.
- **Predators (wolf/bear)** raise a tile's `danger_level` and *reduce* prey density; culling
  them is a mini-objective that **lowers danger** and yields premium furs.
- Full yield & sustainability formulas: [appendix](14-formulas-and-data-appendix.md#hunting).

---

## 11. Environmental hazards

Some tiles carry **hazard zones** that damage workers or degrade the tile. Hazards have an
**intensity (0–5)** and specific effects. They are the flavor and the friction of the
high-reward regions (Pillar P2).

| Hazard | Symbol | Where | Intensity effect | Counter |
|--------|:------:|-------|------------------|---------|
| **Heat zone** | `≋` | volcano slope/core, deep desert | Workers take **health damage/tick** without heat-resistant gear; efficiency −% | Heat-resistant clothing; work in shifts; cooling tech |
| **Ash zone** | `∴` | active volcano, post-eruption | **Vision −** (tile dims, re-fogs); farms lose yield; *Ash-Choked* status | Breathing masks; wind/season clears it |
| **Smoke zone** | `☁` | volcano, large fires | **Morale −** (fear/discomfort); *Ash-Choked*/*Fearful* | Breathing masks; distance; smoke does clear |
| **Toxic fumes** | `☠` | sulfur vents, toxic swamp | Health damage + sickness chance; can spread to neighbors | Masks + `alchemy/ventilation` tech; avoid |
| **Unstable ground** | `※` | volcano core, deep mines | Cave-in/collapse risk during mining; workers trapped | Shoring tech, reinforced supports, lower crew size |
| **Flood plain** | `∽` | river/coast/swamp | Seasonal flooding damages buildings, boosts soil after | Levees/`drainage`; plant for the post-flood fertility |
| **Cold snap** | `❆` | tundra, winter anywhere | Exposure health loss; food spoilage slows but production stalls | Insulated housing, stored food, hearths |

### 11.1 Volcanic tiles (the marquee hazard system)

Volcano tiles are the game's **risk-reward crescendo**. A volcano `core` tile can hold **all**
of: heat, ash, smoke, toxic fumes, and unstable ground — plus the **eruption** event — and it
is the **only** source of **adamantine ore**.

```
        A VOLCANO TILE (core)
   ┌───────────────────────────────┐
   │  ≋≋≋   heat zone (dmg)         │   Resources present:
   │  ∴∴∴   ash zone (−vision)      │     • obsidian      (shallow)
   │  ☁☁☁   smoke zone (−morale)   │     • magma glass   (deep)
   │  ☠☠     sulfur/toxic vents     │     • lapis veins   (deep)
   │  ※※※   unstable ground        │     • ADAMANTINE ORE(core, ultra-rare)
   │        + ERUPTION risk event   │
   └───────────────────────────────┘
   Mining here needs: volcanic mine + adamantine-tier tools +
   heat gear + breathing masks + shoring — and nerves.
```

**Eruption event:** an occasional risk event on active volcano tiles (chance rises with
mining intensity and certain seasons). Telegraphed by **tremor warnings** (1–2 days notice).
On eruption:
- Workers in the core without top gear/evac take heavy casualties.
- Buildings on the tile take damage; DL can drop.
- **New resource nodes** can be exposed (fresh obsidian/adamantine) — the volcano *gives back*.
- Ash/smoke zones spike and spread to neighbors for a season.

Full eruption tables, tremor mechanics, and adamantine yield curves are in
[Resources & Mining §Volcanic](03-resources-mining-and-gear.md#volcanic-mining) and the
[Extra Mechanics disasters](12-extra-mechanics.md#disasters) section.

---

## 12. Legendary & special tiles

Sprinkled across the fog are **rare special tiles** that reward bold exploration (Pillar P1/P2).
They carry a `tags` entry and a one-off bonus. Suggested set (a world rolls **3–6** of these):

| Tag | Name | Effect | Catch |
|-----|------|--------|-------|
| `ancient_ruins` | Ancient Ruins | One-time tech boost / free building blueprint | May be trapped or guarded |
| `sacred_grove` | Sacred Grove | +Faith & +Happiness aura to owning + adjacent tiles | Can't be strip-mined (culture penalty) |
| `crystal_cavern` | Crystal Cavern | Rich **quartz/lapis**, +research when worked | Deep; needs iron+ tools |
| `great_herd` | Great Herd Grounds | Massive renewable game (food engine) | Attracts predators (danger↑) |
| `obsidian_fields` | Obsidian Fields | Surface obsidian without a volcano | In hostile terrain (desert edge) |
| `adamantine_heart` | The Adamantine Heart | The single richest adamantine node in the world | Inside the deadliest volcano; endgame prize |
| `fertile_delta` | Fertile Delta | +50% food base, huge pop cap | Flood-prone (needs levees) |
| `world_wonder_site` | Wonder Site | Enables a unique **Wonder** building (victory-relevant) | Contested by AI who also wants it |

Legendary tiles are **hand-authorable** (fixed in a scenario) or **procedurally placed**
respecting the difficulty gradient. Their bonuses are strong enough to reshape a strategy —
finding one should feel like a story beat.

---

## 13. World generation summary (for the future build)

Generation pipeline the implementation will follow:

```
1. Lay grid (NxN).                        5. Place resource nodes per terrain rules (§4),
2. Assign elevation via noise.               weighting rares toward high-danger tiles.
3. Derive terrain from elevation + temp    6. Seed animals per terrain (§10).
   bands + moisture (water near lows).     7. Compute danger & exploration_difficulty
4. Carve 1–2 volcano clusters toward         from terrain + hazards + wildlife.
   an edge; ring them with volcanic slope. 8. Place 3–6 legendary tiles on the gradient.
                                           9. Pick a temperate, safe start tile → capital.
                                          10. Fog everything except start + neighbors.
```

Tunable generation constants (map size, volcano count, rare-ore rarity, legendary count) live
in the [Formulas & Data Appendix](14-formulas-and-data-appendix.md#worldgen) and
[`/data/game-data.json`](../data/game-data.json).

---

### Cross-references
- Claiming/colonizing these tiles → [08 Colonization](08-colonization-and-expansion.md)
- Mining the resources & surviving hazards → [03 Resources & Mining](03-resources-mining-and-gear.md)
- Who else is on the map → [10 AI Nations](10-ai-nations-and-diplomacy.md)
- Seasons & disasters acting on tiles → [12 Extra Mechanics](12-extra-mechanics.md)
