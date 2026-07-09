# 03 — Resources, Mining & Gear

> This is the economic backbone. It defines every material, the tool-gated mining ladder, how
> danger and gear interact, and the loop of "earn the right to dig the good stuff."

**Related:** [World & Tiles](01-world-and-tiles.md) · [Weapons & Crafting](04-weapons-and-crafting.md) ·
[Technology](06-technology.md) · [Population](05-population-and-happiness.md) ·
[Formulas Appendix](14-formulas-and-data-appendix.md)

---

## 1. The full material taxonomy

Materials group into the five economy layers from the [master GDD](GAME_DESIGN_DOCUMENT.md#6-the-five-resource-layers-economy-overview).
Each material has: an **id**, a **tier** (how advanced), a **source**, the **tool** needed to
extract it, and its **main uses**.

### 1.1 Building materials (L2)

| Material | id | Source | Tool | Main uses |
|----------|----|--------|------|-----------|
| Wood | `wood` | Forest (surface) | axe (any) | Early houses, tools, fuel, palisades |
| Timber | `timber` | Forest + Sawmill (refine wood) | — (crafted) | Sturdier buildings, bridges, scaffolds |
| Stone | `stone` | Hills/Mountain (shallow) | wooden+ pickaxe | Walls, mid buildings, roads |
| Clay | `clay` | Plains/riverbank (surface/shallow) | shovel/pickaxe | Bricks, pottery, kilns |
| Limestone | `limestone` | Hills, mountain (shallow) | stone+ pickaxe | **Mortar/cement**, brick binding, flux for smelting |
| Brick | `brick` | Kiln (refine clay + fuel) | — (crafted) | Mid-tier buildings, aqueducts |

### 1.2 Metals & ores (L3)

| Material | id | Source | Tool | Main uses |
|----------|----|--------|------|-----------|
| Copper | `copper` | Hills, mountain (shallow) | stone+ pickaxe | First metal tools/weapons, wiring, decor |
| Tin | `tin` | Mountain, hills (shallow/deep) | stone+ pickaxe | Alloy for **bronze** |
| Iron | `iron` | Mountain, tundra (deep) | iron pickaxe* / lapis pickaxe | Iron tools/weapons/armor, steel input |
| Coal | `coal` | Mountain (deep) | stone+ pickaxe | **Fuel** for smelting/forging; steel |
| Silver/Gold | `silver`,`gold` | Mountain, crystal cavern (deep) | iron pickaxe | Currency, luxury, decree cost sink |
| **Adamantite ore** | `adamantite_ore` | **Volcano core only** | **adamantite pickaxe** | The apex weapons/armor/buildings |

`*` iron is the classic chicken-and-egg: you first mine iron with a **lapis pickaxe** (see §3),
then craft iron pickaxes to mine it faster and reach deeper veins.

### 1.3 Special minerals (L4)

| Material | id | Source | Tool | Main uses |
|----------|----|--------|------|-----------|
| Obsidian | `obsidian` | Volcanic slope/desert (shallow) | stone+ pickaxe | Sharp blades (early elite), tools, decor |
| Magma glass | `magma_glass` | Volcano (deep) | iron+ pickaxe (heat gear) | Advanced lenses, elite building trim, alchemy |
| Lapis | `lapis` | Tundra/volcano/crystal cavern (deep) | **lapis pickaxe** to mine efficiently | The **lapis pickaxe** itself, dye, culture buildings |
| Quartz | `quartz` | Mountain, desert, crystal cavern | iron pickaxe | Precision tools, research instruments, glass |
| Salt | `salt` | Desert flats, coast (surface) | shovel | **Food preservation** (huge for winter), trade |
| Sulfur | `sulfur` | Volcano vents (surface, toxic) | mask + shovel | Alchemy, later gunpowder (roadmap), medicine |

### 1.4 Sustenance (L1) & soft resources (L5)

- **L1 Food:** `berries`, `fish`, `game_meat`, `wild_grain`, `grain` (farmed), `mushrooms`.
  Tracked as a single **Food** pool for consumption but sourced from many places (variety
  gives happiness — see [Population](05-population-and-happiness.md)). `salt` preserves food.
- **L5 Soft:** `population`, `happiness`, `culture`, `influence`, `research`, `faith`, `gold`.
  These are produced by buildings, decrees, and festivals, not mined. Detailed in
  [Population](05-population-and-happiness.md), [Technology](06-technology.md), and
  [Extra Mechanics](12-extra-mechanics.md).

---

## 2. Resource nodes, reserves & depletion

Each material sits in a **node** on a tile (see [tile model](01-world-and-tiles.md#2-anatomy-of-a-tile-the-data-model)):

```
node = { type, abundance (1..5), depth (surface|shallow|deep|core), reserve }
reserve = abundance × RESERVE_UNIT[depth]      // deeper = bigger but slower
```

- **Extraction** each tick removes yield from `reserve`. When `reserve` hits 0 the node is
  **depleted** (ore/mineral nodes do **not** regenerate; food/wood **do** regenerate seasonally).
- Depletion is a **strategic clock**: your best copper hill *will* run out, pushing you to
  expand or move up-tier. This is intentional pressure (Pillar P2/P5).
- **Yield per tick** (simplified; full form in [appendix](14-formulas-and-data-appendix.md#mining-yield)):

```
yield = base_rate[material]
      × miners_assigned_effectiveness      // headcount × skill × tool_multiplier
      × tile_richness(abundance)
      × (1 − depth_penalty[depth])
      × hazard_modifier                    // heat/instability slow you down
      × happiness_factor
```

---

## 3. The mining tool (pickaxe) ladder

Mining is **hard-gated by your pickaxe tier**. A tool both **unlocks** which materials you can
touch and **multiplies** yield. This is the cleanest expression of Pillar P3.

| Pickaxe | id | Crafted from | Unlocks (can mine) | Yield mult | Notes |
|---------|----|--------------|--------------------|:----------:|-------|
| **Wooden pickaxe** | `pick_wood` | wood | clay, stone, surface minerals | ×1.0 | Starter; wears out fast |
| **Stone pickaxe** | `pick_stone` | wood + stone | + copper, tin, coal, obsidian, limestone | ×1.4 | The workhorse of the early game |
| **Lapis pickaxe** | `pick_lapis` | wood + lapis + copper | + **iron**, quartz, lapis, deep commons | ×1.9 | The key that opens the **iron age**; lapis is itself semi-rare |
| **Iron pickaxe** | `pick_iron` | timber + iron | + deep iron, silver/gold, magma glass* | ×2.5 | Faster & reaches deep veins; needs `metallurgy` |
| **Adamantite pickaxe** | `pick_adamantite` | steel + adamantite_ore | + **adamantite ore**, volcanic core mats | ×3.5 | End-tier; the only way to mine the volcano's heart |

`*` magma glass also needs **heat gear** regardless of pickaxe.

```
   TOOL GATE FLOW
   wood ─▶ pick_wood ─┐
                      ├─▶ mine stone/clay ─▶ pick_stone ─▶ mine copper/tin/coal/obsidian
   stone ─────────────┘                                        │
                                                               ▼
                     mine some lapis (slow, w/ stone) ──▶ pick_lapis ─▶ mine IRON
                                                                          │
                            metallurgy tech + iron ──▶ pick_iron ─▶ deep iron, magma glass
                                                                          │
                       steel + adamantite_ore ──▶ pick_adamantite ─▶ VOLCANO CORE
```

> **The bootstrap moment:** to make an iron pickaxe you need iron, but efficient iron mining
> wants an iron pickaxe. The **lapis pickaxe** breaks the loop — it's the deliberate mid-game
> key. Finding your first lapis (tundra/volcanic slope/crystal cavern) is a milestone.

Tool **durability:** pickaxes wear down with use and must be re-crafted/repaired (a light wood/
metal upkeep). Higher tiers last longer. Durability is tunable and can be disabled for a
"relaxed" difficulty.

---

## 4. Mining difficulty & safety

How hard (and dangerous) it is to mine a given node depends on four factors from your brief:

```
mining_difficulty = f( heat_level, danger_level, worker_gear, tile_stability )

effective_speed   = base_speed × tool_mult × gear_fit × (1 − heat_penalty)
                                × (1 − instability_penalty) × happiness_factor

accident_chance   = clamp( base_accident
                          + heat_unprotected + instability + danger_level×0.02
                          − gear_mitigation , 0 , 0.5 )   // per worker per day
```

| Factor | Raises difficulty when… | Mitigated by |
|--------|-------------------------|--------------|
| **Heat level** | Volcano/deep desert; higher hazard intensity | Heat-resistant clothing, cooling tech, shift rotation |
| **Danger level** | Wildlife/bandits/rivals near the mine | Watchtower/fort garrison, clearing threats |
| **Worker gear** | Miners lack proper equipment | Craft & equip gear (§5) |
| **Tile stability** | Unstable ground, deep cores | Shoring/support beams (timber), `engineering` tech, smaller crews |

**Accidents** range from minor (a wounded miner, *Overworked* status) to severe (**cave-in**:
several miners trapped/killed, node temporarily sealed until dug out). Accidents tank happiness
and can trigger a *Fearful* status wave — so **safety is an economic choice, not just flavor**.

---

## 5. Worker gear

Gear is **crafted equipment** that miners (and other workers) wear to survive hazards and mine
faster. Gear is stored in an **equipment pool** and auto-assigned to workers on hazardous tiles
(you craft enough sets for the crew size).

| Gear | id | Crafted from | Protects against | Effect |
|------|----|--------------|-------------------|--------|
| **Basic work clothes** | `gear_workclothes` | leather/cloth | — | +5% mining speed baseline |
| **Reinforced boots** | `gear_boots` | leather + iron | unstable ground | −40% trip/injury on `※` tiles; +move on rough terrain |
| **Heat-resistant clothing** | `gear_heatsuit` | leather + obsidian/magma glass + salt | **heat zones** `≋` | Negates heat health damage up to intensity 4; −heat_penalty |
| **Breathing mask** | `gear_mask` | cloth + charcoal + quartz | **ash / smoke / toxic** `∴☁☠` | Negates *Ash-Choked*; lets workers stay in ash/smoke |
| **Miner's helm (lamp)** | `gear_helm` | iron + oil/fat | darkness/deep | +vision in deep mines; small accident reduction |
| **Reinforced exosuit** | `gear_exosuit` | steel + magma glass | heat + instability (core) | End-tier: survive volcano **core** mining; big safety + speed |

**Gear rules:**
- A worker on a hazard tile **without** the matching gear takes the full penalty (health loss,
  efficiency loss, morale hit). With gear, the penalty is reduced/negated per the table.
- Gear has durability and is consumed/repaired over time (upkeep).
- Crafting gear needs the right **buildings** (Tailor, Workshop, Forge) — see
  [City Building](07-city-building.md) & [Crafting](04-weapons-and-crafting.md).

```
   Miner on a VOLCANO CORE tile — the full gear check:
   ┌───────────────────────────────────────────────────────────┐
   │ needs: pick_adamantite ✔  heat clothing/exosuit ✔          │
   │        breathing mask ✔    shoring(engineering) ✔          │
   │ if any ✘ → heavy health loss, high accident_chance,        │
   │           Heat-Stressed + Ash-Choked statuses, morale drop │
   └───────────────────────────────────────────────────────────┘
```

---

## 6. The mining gameplay loop

```
  ┌─ SCOUT a tile, learn its nodes (01 fog) ───────────────────────────┐
  │                                                                    │
  ▼                                                                    │
  CLAIM & build a MINE ─▶ assign MINERS ─▶ ensure TOOL tier ─▶         │
  ─▶ ensure GEAR for hazards ─▶ EXTRACT (yield/tick) ─▶ stockpile ─▶    │
  ─▶ refine/craft (04) ─▶ better tools & gear ─▶ reach DEEPER/HOTTER ──┘
        │                                            │
        ▼                                            ▼
   node depletes → move on / expand         accident/eruption → recover, adapt
```

**Rare-ore risk/reward (your brief, crystallized):** mining rare ores (lapis, magma glass,
adamantite) **raises danger and accident risk** but is the **only** path to advanced weapons,
elite buildings, and the Grand Capital. The game constantly poses: *"Push deeper now, or
consolidate first?"*

---

## 7. Volcanic mining (the marquee) {#volcanic-mining}

Working a volcano is a whole mini-game layered on normal mining.

### 7.1 Requirements to mine a volcano core
| Requirement | Why |
|-------------|-----|
| Tech `volcanic_extraction` | To even claim/build here (see [01 §5](01-world-and-tiles.md#5-tech-locked-tiles)) |
| **Volcanic Mine** building | Special reinforced mine (steel + magma glass) |
| `pick_adamantite` (for adamantite) | Tool gate for core materials |
| Heat gear + masks + (ideally) exosuits | Survive heat/ash/smoke/toxic |
| Shoring / `engineering` | Manage unstable ground |
| A garrison (danger 4–5) | Wildlife/rivals covet the volcano too |

### 7.2 Adamantite yield curve
Adamantite is **deliberately scarce**. A core node might hold only a handful of units, mined
**slowly**:

```
adamantite_yield/day ≈ 0.2 … 1.0  (per fully-equipped elite crew, before eruptions)
```

Refining ore → bars is a further step at the **Adamantite Forge** (needs `adamantite_refinement`).
Getting your first adamantite **bar** should take real investment — it's the endgame material.

### 7.3 Eruptions (risk event)
Telegraphed by **tremors** (1–2 day warning; a shaking icon + alert). On eruption:

| Effect | Detail |
|--------|--------|
| Casualties | Unevacuated core crews take heavy losses (mitigated by exosuits/evac decree) |
| Building damage | Volcanic mine & nearby buildings damaged; tile DL drops |
| Ash/smoke spike | Zones spread to neighboring tiles for ~1 season (−vision, −morale) |
| **Payback** | New nodes exposed — often **fresh adamantite/obsidian** (the volcano gives back) |

**Managing eruptions** = watch tremors, pull crews on warning (or gamble for one more haul),
keep evac routes (roads) clear, and repair fast. Full tables:
[Extra Mechanics §Disasters](12-extra-mechanics.md#disasters) &
[Appendix](14-formulas-and-data-appendix.md#eruptions).

---

## 8. Refining chains (mining → usable goods)

Some materials must be **refined** before use. Refining happens in dedicated buildings
([07](07-city-building.md)) and consumes fuel (coal/charcoal):

```
  wood ──(Sawmill)──▶ timber
  clay + fuel ──(Kiln)──▶ brick
  copper + tin ──(Smelter)──▶ BRONZE
  iron + coal ──(Smelter)──▶ (wrought iron) ──(Foundry)──▶ STEEL
  limestone + fuel ──(Kiln)──▶ mortar/cement
  adamantite_ore + steel + magma glass ──(Adamantite Forge)──▶ ADAMANTITE (bars)
  sulfur + charcoal + quartz ──(Alchemy Lab)──▶ reagents (medicine / roadmap: gunpowder)
```

These chains are the bridge from **this document (raw materials)** to
**[04 Weapons & Crafting](04-weapons-and-crafting.md)** (finished goods) and
**[07 City Building](07-city-building.md)** (structures).

---

## 9. Storage, logistics & spoilage

- Materials accumulate in **stockpiles**, capped by **storage buildings** (Granary for food,
  Warehouse for goods, Vault for precious). Over-cap production is wasted → build storage.
- **Food spoils** without preservation; **salt** and cold storage extend shelf life (critical
  before winter — see [Seasons](12-extra-mechanics.md#seasonal-cycles)).
- Distant tiles need **supply lines** (roads) to ship materials to the capital, or they
  stockpile locally and risk raids. See [Colonization](08-colonization-and-expansion.md).

---

### Cross-references
- What the materials become → [04 Weapons & Crafting](04-weapons-and-crafting.md)
- Which buildings mine/refine → [07 City Building](07-city-building.md)
- Who mines (miners) & their happiness → [05 Population](05-population-and-happiness.md)
- Tech that unlocks tiers → [06 Technology](06-technology.md)
- All formulas & constants → [14 Appendix](14-formulas-and-data-appendix.md)
