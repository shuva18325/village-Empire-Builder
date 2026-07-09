# 14 — Formulas & Data Appendix

> Every formula and balance constant in one place, plus progression charts and a worked sample
> playthrough. **All numbers are tunable** — this file is the single source of truth for balance
> so designers change values here (and in [`/data/game-data.json`](../data/game-data.json)),
> not scattered through the docs.

**Related:** referenced by every system doc. This is the math behind them.

---

## 1. Global constants

| Constant | Value | Meaning |
|----------|:-----:|---------|
| `TICKS_PER_DAY` | 20 | Sim steps per day |
| `DAYS_PER_SEASON` | 15 | Season length |
| `SEASONS_PER_YEAR` | 4 | Spring/Summer/Autumn/Winter |
| `MAP_SIZE` | 10×10 | Default tile count (~100) |
| `RESERVE_UNIT.surface` | 500 | Base reserve per abundance for surface nodes (regenerating) |
| `RESERVE_UNIT.shallow` | 800 | Shallow ore reserve unit |
| `RESERVE_UNIT.deep` | 1500 | Deep ore reserve unit |
| `RESERVE_UNIT.core` | 300 | Core (adamantite) reserve unit — small & precious |
| `BASE_FOOD_PER_POP` | 1.0 / day | Food consumed per adult per day |
| `DEPENDENT_FOOD` | 0.5 / day | Food per child/elder |
| `HAPPINESS_BASELINE` | 50 | Neutral happiness |

---

## 2. World generation {#worldgen}

```
grid            = MAP_SIZE
elevation(t)    = perlin(t) ∈ [0,1]  → bands: <0.2 water, <0.5 low, <0.8 hill, ≥0.8 mountain
temperature(t)  = lat_band(row) + noise → cold (top/bottom rows) … temperate (middle)
moisture(t)     = perlin2(t) → high near water → forest/swamp; low → desert
volcano_clusters = 1–2, placed toward an edge; ring tiles = volcanic_slope
terrain(t)      = classify(elevation, temperature, moisture, volcano)
danger(t)       = terrain_base_danger + hazard_intensity + wildlife_density − 0(start region)
legendary_count = randInt(3,6), placed on the difficulty gradient (rarer = farther/hotter)
start_tile      = pick temperate, low-danger, resource-adequate tile; DL=8, capital
fog             = all tiles fogged except start + its neighbors (silhouette)
```

Tunables: `MAP_SIZE`, `volcano_clusters`, `legendary_count`, rare-ore weighting
(`RARE_ORE_EDGE_BIAS = 0.7`), start-region safety radius (`SAFE_RADIUS = 1`).

### 2.1 Capital name generator {#name-generator}

At T1 the capital is auto-named `{Prefix}{Root}{Suffix}`, seeded by the start tile's terrain so
the name feels rooted in place (see [02 §3](02-capital-and-flags.md#3-auto-generated-capital-name--renaming)).
The player may rename from T3 onward.

```
name = pick(PREFIX[terrain]) + pick(ROOT) + pick(SUFFIX)     // reroll if it collides / reads badly
```

| Slot | Word bank (extend freely) |
|------|---------------------------|
| `PREFIX.plains/grassland` | Stone-, Green-, Wheat-, Fair-, Mead-, Ox- |
| `PREFIX.forest` | Elm-, Oak-, Thorn-, Wolf-, Deer-, Fern- |
| `PREFIX.hills/mountain` | Cliff-, Crag-, Iron-, Grey-, High-, Stone- |
| `PREFIX.water/coast` | River-, Lake-, Salt-, Reed-, Mist- |
| `PREFIX.cold/tundra` | Frost-, Snow-, White-, North-, Pale- |
| `PREFIX.volcanic` | Ash-, Ember-, Cinder-, Smoke-, Char- |
| `ROOT` | -haven, -wold, -mark, -ford, -hearth, -hollow, -reach, -stead, -mere, -crest, -vale, -moor |
| `SUFFIX` (optional) | "", " Hold", " Cross", " Landing", " Rest" |

Examples: *Stonehearth*, *Cliffwold*, *Ashford*, *Frostmere*, *Oakhollow Cross*, *Rivermark Landing*.
The generator avoids repeats within a session and filters an obvious-typo/blocklist. All banks
live in [`/data/game-data.json`](../data/game-data.json) (add a `name_banks` object when building).

---

## 3. Exploration {#exploration}

```
explore_time_days = 1 + exploration_difficulty            // 1..6 days
risk_roll         = d100 + scout_skill − danger_level×10
```
Outcome bands (also in [01 §6](01-world-and-tiles.md#6-fog-of-war--exploration)):

| Roll | Result |
|------|--------|
| < 10 | Ambush: party wounded, tile stays fogged |
| 10–39 | Partial reveal (terrain only) |
| 40–84 | Full reveal |
| 85–97 | Full reveal + bonus hidden node |
| ≥ 98 | Full reveal + legendary tag surfaced (if present) |

`scout_skill` = hunter/scout `hunt_skill × 5` (0..~50). Bringing a bigger/armed party adds a
flat `+partysize` and reduces wound severity.

---

## 4. Hunting {#hunting}

```
hunt_yield/day   = Σ_species [ density × base_yield[species] × tool_mult
                             × hunter_effectiveness × season_mult ]
sustainable_cap  = density × regen_rate[species]        // harvest above this depletes density
density_next     = density + regen_rate×(1 − density/max_density) − harvested
tool_mult:       hands 0.5 · wood spear 1.0 · stone spear 1.3 · bow 1.7
injury_chance    = species_danger × (1 − tool_safety) × (1 − party_size_factor)
```
- Over-harvest (`harvested > sustainable_cap`) drives `density` down; at 0 the species is locally
  extinct for `EXTINCT_RECOVERY = 4` seasons.
- Predators (wolf/bear) reduce nearby prey `density` each season and add to tile `danger_level`.

| Species | base_yield (food) | regen_rate | danger |
|---------|:-----------------:|:----------:|:------:|
| Rabbit | 2 | 0.30 | 0 |
| Deer | 5 | 0.15 | 0 |
| Boar | 6 | 0.12 | 2 |
| Elk | 9 | 0.10 | 2 |
| Wolf | 3 (fur-focused) | 0.10 | 3 |
| Bear | 12 | 0.06 | 4 |
| Fish (school) | 4 | 0.25 | 0 |
| Wild fowl | 2 | 0.28 | 0 |

---

## 5. Mining yield {#mining-yield}

```
yield/day = base_rate[material]
          × (miners × mining_skill_mult × tool_mult)      // effective labor
          × richness(abundance)                            // abundance 1..5 → 0.6..1.8
          × (1 − depth_penalty[depth])                     // surface 0, shallow .1, deep .3, core .5
          × hazard_modifier                                // 1 − Σ(active hazard slows)
          × happiness_factor

tool_mult:  wood 1.0 · stone 1.4 · lapis 1.9 · iron 2.5 · adamantite 3.5
mining_skill_mult: novice 0.7 · skilled 1.0 · expert 1.4 · master 1.8
happiness_factor = 0.5 + happiness/100          // 0.5..1.5
reserve -= yield/day (until depleted; surface food/wood regen per §4-style)
```

**Mining safety** (from [03 §4](03-resources-mining-and-gear.md#4-mining-difficulty--safety)):
```
accident_chance/worker/day = clamp( 0.01
   + heat_unprotected(0..0.15) + instability(0..0.12) + danger_level×0.02
   − gear_mitigation(0..0.25) , 0 , 0.5 )
heat_health_loss/tick = max(0, heat_intensity − heat_gear_rating) × HEAT_DMG(0.5)
```

---

## 6. Population {#population}

```
Δpop/day = births − deaths + migration_in − migration_out

base_birth_rate = 0.02 × adult_pop                         // 2%/day ceiling before modifiers
births = base_birth_rate × food_factor × housing_factor
                          × happiness_factor × policy_mult × season_factor
  food_factor     = clamp(food_buffer_days / 5, 0, 1.5)    // 5-day buffer = full; surplus → 1.5
  housing_factor  = clamp(free_capacity / needed, 0, 1.2)  // overcrowding → toward 0
  happiness_factor= 0.4 + happiness/100 × 1.0              // 0.4..1.4
  policy_mult     = Π(active family decrees & nursery buildings)   // e.g. 1.3, 1.8 (holiday)
  season_factor   = spring 1.15 · summer 1.0 · autumn 1.0 · winter 0.8

base_death_rate = 0.008 × pop
deaths = base_death_rate × (1 + starvation×3 + disease×2 + cold×1.5 + combat_losses)
```
- `food_buffer_days = stored_food / daily_consumption`.
- Growth is **S-curved** by `housing_factor` approaching a tile's
  [pop cap](01-world-and-tiles.md#8-population-capacity).

---

## 7. Happiness {#happiness-formula}

```
happiness = clamp( 50
  + food_variety(0..+12)          // # distinct food types available, capped
  + shelter(0..+10)               // housing quality vs. pop
  + safety(0..+10)                // low danger + garrison + walls
  + culture(0..+15)               // culture buildings & output
  + festival(0..+15, decays)      // recent festivals/holidays
  + faith(0..+8)                  // temples + aligned belief
  + decree_sum(−10..+10)          // net of enacted decrees
  + flag_morale(0..+6)            // flag bonus (02 §8)
  − overcrowding(0..−15)
  − hazard(0..−20)                // heat/ash/smoke/toxic exposure
  − war_weariness(0..−15)
  − unmet_needs(0..−15)           // food/shelter shortfalls
  − recent_disaster(0..−12, decays)
  , 0, 100)
```
Productivity multiplier from happiness: `prod_mult = 0.6 + happiness/100 × 0.8` (0.6..1.4).

---

## 8. Status effects (thresholds) {#status-effects}

| Status | Applies when | Magnitude | Decay |
|--------|--------------|-----------|-------|
| Well-Fed | food_buffer ≥ 8 days AND ≥3 food types, 3+ days | +8 happy, +10% births | ends when unmet |
| Overworked | assigned_load/worker > 1.25 for 2+ days | −8 happy, −10% health, +accident | eases when load ≤1 |
| Inspired | new culture bld / festival | +20% culture, +5 happy | 2–3 days |
| Fearful | attack/eruption/cave-in within 2 tiles | −10 morale, −15% prod, −births | 3–5 days |
| Prosperous | happiness ≥ 75 AND net surplus, 5+ days | +10% growth, +migration_in | while held |
| Heat-Stressed | heat_intensity > heat_gear on tile | −health/tick, −20% mining | until gear/leave |
| Ash-Choked | in ash/smoke, no mask | −vision, −6 morale, −health | until mask/clear |
| Heroic | battle victory | +15% combat morale, +5 happy | 4–6 days |
| Sick/Plagued | disease exposure | −health, contagious, −20% prod | until cured |
| Faithful | temple + aligned belief | +6 happy stability | while held |
| Cold-Bitten | winter/tundra, no insulation | −health, −15% prod | until warmed |

---

## 9. Combat {#combat}

```
unit_power   = (weapon_ATK + role_bonus) × grade_mult × skill_mult
unit_defense = (armor_DEF + role_bonus) × terrain_def_mult × fort_mult

grade_mult:  tribal 1.0 · copper 1.3 · bronze 1.6 · iron 2.0 · steel 2.6 · adamantite 3.6
skill_mult:  green 0.8 · trained 1.0 · veteran 1.3 · elite 1.6

round_damage(A→D) = Σ A.unit_power × morale_A × leadership_A × comp_bonus(A,D)
                                   × terrain_A × flank_A
comp_bonus: hard-counter 1.5 · neutral 1.0 · countered 0.66
morale = clamp(base + leader + heroic − losses_frac×k − war_weariness, 0, 1.5)
rout when morale < 0.35  → retreat with +25% casualties
battle length: up to COMBAT_ROUNDS_MAX = 8 rounds or until rout/annihilation

supply: out_of_supply → attrition 3%/day strength, morale −0.05/day, no repair/reinforce
```

Terrain defense multipliers: plains 1.0 · forest 1.2 · hills 1.3 · mountain 1.4 · walls ×1.5–2.5
(by wall tier). Attacker penalties mirror on rough/fortified ground.

---

## 10. Eruptions {#eruptions}

```
eruption_chance/day = base(0.002)
                    + mining_intensity×0.01           // more crews = more risk
                    + season(summer +0.003)
                    + pressure_buildup(rises since last eruption)
tremor_warning = 1–2 days before (telegraph)
on_eruption:
  core_crew_casualties = crew × (1 − evac_fraction) × (1 − exosuit_rating) × SEVERITY
  building_damage      = DL_loss 5–20 on the tile + damage to volcanic_mine
  ash/smoke spread     = +2 intensity on tile & neighbors for 1 season
  payback              = expose new nodes: obsidian(always), adamantite(chance 30%)
```

---

## 11. Research, building, colonization costs (reference)

```
RP/day        = Σ(scholars × research_skill_mult × building_mult) × happiness_factor × culture_bonus
build_time    = base_time[bld] / (1 + builders×craft_skill×machinery_bonus)
claim_cost    = INFLUENCE_BASE(10) + distance_from_capital×3 + tile_value_bonus + rare_premium
colonize_cost = settlers(8–15 pop) + starter_kit{wood,stone,food} + stability_draw
over_extension_penalty = Σ(underdeveloped_claimed_tiles) × STAB_DRAIN(2)   // to stability/happiness
```

Capital tier gates are enumerated in [02 §2](02-capital-and-flags.md#2-tier-requirement-tables);
tech costs in [06 §4](06-technology.md#4-tech-node-table-costs--unlocks); building costs in
[07 §3](07-city-building.md#3-building-catalog).

---

## 12. Progression charts

### 12.1 Population vs. game phase (illustrative pacing target)
```
 pop
 1500 ┤                                              ╭──── GRAND CAPITAL (T5)
 1000 ┤                                        ╭─────╯   victory-range
  700 ┤                                ╭───────╯          DEVELOPED (T4)
  400 ┤                        ╭───────╯                  EARLY CAPITAL (T3)
  120 ┤              ╭─────────╯                          ORGANIZED (T2)
   25 ┤     ╭────────╯                                    (flag unlock)
    5 ┤─────╯  PRIMITIVE (T1)
      └────┬────────┬────────┬────────┬────────┬────────┬──▶ time
         survival  stability      ambition        dominance
```

### 12.2 Tech era vs. weapon & material tier (they advance together)
```
 Era:      Stone → Copper → Bronze → Iron → Steel → Adamantite
 Weapon:   spear   copper   bronze   iron   steel   ADAMANTITE
 Pickaxe:  wood    stone    lapis    iron   iron    ADAMANTITE
 Capital:  T1      T2       T2/T3    T3     T4       T5
 Danger    safe    low      low      med    high     DEADLY (volcano core)
 you brave:region  hills    hills    mtn    volcano  volcano CORE
```

### 12.3 The reward-vs-danger curve (Pillar P2, quantified)
```
 material value
   ▲                                              ● adamantite (danger 5)
   │                                    ● magma glass (danger 4)
   │                          ● lapis / obsidian (danger 3)
   │                ● iron/coal (danger 2)
   │      ● copper/tin (danger 1)
   │ ● wood/stone/food (danger 0)
   └──────────────────────────────────────────────▶ tile danger level
   (the best materials are ALWAYS the most dangerous to obtain)
```

---

## 13. Worked sample — the first two hours

A concrete playthrough tracing the systems (illustrative, at default balance):

| Time | State | Player does | System response |
|------|-------|-------------|-----------------|
| Yr1 Spring | Primitive Village, pop 8, auto-named "Cliffwold" | Assign 4 hunters + 2 foragers; build Hunter's Lodge | Food stabilizes; *Well-Fed* soon |
| Yr1 Summer | pop 14 | Research `primitive_tools`→`farming`; build a Farm | Food surplus; births rise |
| Yr1 Autumn | pop 22 | Build Granary; salt-cure via `food_preservation`; scout 2 tiles | Winter buffer secured; find copper hill |
| Yr1 Winter | pop 24 | Survive on stores; research `pottery`→`mining` | Slight −happy (winter), no starvation |
| Yr2 Spring | **pop 26 → T2!** | **Reach Organized Settlement → choose FLAG** ("Ember Crown"); claim copper hill | Flag flies; banners on roads; +morale |
| Yr2 | pop ~40 | Build Smithy; make stone→lapis pickaxe; mine copper→bronze | Bronze spears; danger tiles now reachable |
| Yr3–4 | pop ~120 → **T3** | `metallurgy`; Forge + Armory; **rename capital** "Ashford"; first colony | Iron age; first real army; diplomacy opens |
| Yr5–7 | pop ~400 → **T4** | `engineering`+`volcanic_extraction`; claim volcanic slope; Fort + Industrial Hub + supply line | Steel; mining obsidian/lapis under heat gear; AI gets nervous |
| Yr8–10 | pop ~1000 → **T5** | `adamantite_refinement`; brave the core (exosuits, evac on tremors); Grand Plaza + Wonder | **Adamantite army**; survive an eruption (new nodes!); **Grand Capital — victory range** |

This is the intended **10-ish-year** arc through the four emotional phases — pacing is a knob;
the *shape* is the design.

---

## 14. Where these live in data

All of the above is mirrored, machine-readable, in [`/data/game-data.json`](../data/game-data.json)
(`constants`, `terrain`, `resources`, `tech`, `buildings`, `units`, `status_effects`,
`animals`, and a `holidays` stub) and [`/data/flags.json`](../data/flags.json). Change balance
there + here; the docs describe intent, the data drives the game.

---

### Cross-references
- Every system doc points here for its math. Start from the [Master GDD](GAME_DESIGN_DOCUMENT.md).
