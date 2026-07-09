# 05 — Population & Happiness

> People are the engine. They are typed workers with skills, needs, happiness, and **status
> effects** — not an abstract counter (Pillar P4). This document defines how population grows,
> how it's assigned to jobs, and how happiness gates everything.

**Related:** [City Building](07-city-building.md) · [Resources & Mining](03-resources-mining-and-gear.md) ·
[Extra Mechanics](12-extra-mechanics.md) · [Formulas Appendix](14-formulas-and-data-appendix.md)

---

## 1. Population model

Total population is the sum of all **pop** across your tiles. Each person belongs to a **job
group** and carries a **skill level** that rises with experience.

```
total_population = Σ (pop on each owned tile)
pop is partitioned into JOB GROUPS + dependents (children/elderly who don't work but consume)
```

### 1.1 The six job groups (your brief)

| Group | id | Produces | Works in | Key stat |
|-------|----|----------|----------|----------|
| **Farmers** | `farmer` | Food (grain, fished, tended herds) | Farms, fisheries, pastures | `farming_skill` |
| **Miners** | `miner` | Metals, minerals, stone | Mines, quarries | `mining_skill` |
| **Builders** | `builder` | Construction & crafting labor | Build sites, workshops | `craft_skill` |
| **Soldiers** | `soldier` | Military power (don't produce goods) | Barracks, forts, armies | `combat_skill` |
| **Hunters** | `hunter` | Food, furs, leather, bone | Wild tiles (assign to hunt) | `hunt_skill` |
| **Scholars** | `scholar` | Research, culture, admin | Libraries, universities, temples | `research_skill` |

Plus **dependents** (children + elderly): they **consume food & housing** and **don't work**,
but children **mature** into workers (your future workforce) and drive long-term growth.

### 1.2 Assigning population

- The player sets **target allocations** per tile or globally (e.g. "40% farmers, 20% miners…")
  **or** manually assigns headcount to specific buildings/tiles.
- **Idle pop** (unassigned) is flagged in the HUD — a nudge to put people to work (idle people
  are slightly *less* happy: boredom).
- **Skill growth:** doing a job raises that skill (diminishing returns); reassigning a veteran
  farmer to mining resets them toward novice in the new skill — so specialization has value.
- **Re-skilling** is allowed but costs time & a small happiness dip ("upheaval").

```
   POPULATION ALLOCATION PANEL (concept)
   Total: 412   Idle: 6 ⚠
   ┌─────────────┬────────┬───────────────┬─────────┐
   │ Group       │ Count  │ Bar           │ Skill◑  │
   ├─────────────┼────────┼───────────────┼─────────┤
   │ Farmers     │  150   │ ████████░░░░░ │  ●●●○   │
   │ Miners      │   70   │ ████░░░░░░░░░ │  ●●○○   │
   │ Builders    │   60   │ ███░░░░░░░░░░ │  ●●●○   │
   │ Hunters     │   40   │ ██░░░░░░░░░░░ │  ●●●●   │
   │ Soldiers    │   50   │ ███░░░░░░░░░░ │  ●●○○   │
   │ Scholars    │   36   │ ██░░░░░░░░░░░ │  ●●○○   │
   └─────────────┴────────┴───────────────┴─────────┘
                   [ Auto-balance ]  [ Priorities… ]
```

---

## 2. Population growth

Growth is driven by a **birth rate** modulated by food, housing, happiness, and policy, minus
**deaths** (age, war, disease, disaster) and **migration**.

```
Δpop_per_day = births − deaths + migration_in − migration_out

births   = base_birth_rate
         × food_factor          // ≥1 buffer → up to +; shortage → 0
         × housing_factor       // free capacity needed; overcrowding → penalty
         × happiness_factor     // happy people have more children
         × policy_multiplier    // decrees & buildings (see §5, §6)
         × season_factor        // winter dampens; harvest/spring boosts

deaths   = base_death_rate × (1 + starvation + disease + cold + combat_losses)
```

- **Food buffer** matters more than instantaneous food: a stockpile signals security → births.
- **Housing** must have free capacity ([tile pop cap](01-world-and-tiles.md#8-population-capacity));
  overcrowding halts growth and hurts happiness.
- **S-curve:** growth is fastest in the mid-range and slows near a tile's cap → expansion is
  the way to keep growing (feeds the outer loop).
- Full constants: [Appendix §Population](14-formulas-and-data-appendix.md#population).

### 2.1 Ways to grow population (your brief)

| Method | Type | Effect |
|--------|------|--------|
| **Natural growth** | passive | The baseline birth/death model above |
| **Decree: "Encourage Families"** | policy | +birth rate for a period (happiness cost/upkeep) |
| **Decree: "Boost Birth Rate"** | policy | Stronger +birth, higher cost, risk of overcrowding |
| **Decree: "Invite Migrants"** | policy | Spawns migration waves toward you (needs food/housing to hold them) |
| **Building: Housing District** | building | Raises pop cap; dense living |
| **Building: Breeding Hub / Nursery** | building | Directly boosts local birth rate & child survival |
| **Festivals / Holidays** | event | Temporary large birth/happiness spikes (see [roadmap](13-future-roadmap.md)) |
| **Migration waves** | world event | Refugees/settlers arrive (esp. if you're prosperous & they aren't) |

> **Note on tone:** "breeding hub" is kept as an abstract **population-growth building**
> (nursery/housing/family-support district). We can rename to *Family Hall / Nursery /
> Longhouse* for flavor — mechanically it raises birth rate & child survival.

---

## 3. Happiness (the master social stat)

**Happiness** is a 0–100% value per tile (and a weighted **civilization average**). It gates
**productivity, birth rate, and stability** (your brief). It is the pressure valve of the game.

```
happiness = clamp( 50    // neutral baseline
   + food_variety_bonus + shelter_bonus + safety_bonus
   + culture_bonus + festival_bonus + faith_bonus + decree_bonus
   + flag_morale_bonus
   − overcrowding − hazard_penalty − war_weariness − unmet_needs
   − overwork − recent_disaster , 0 , 100 )
```

### 3.1 What happiness does

| Happiness band | Label | Effects |
|:--------------:|-------|---------|
| 80–100 | **Thriving** | +productivity, +birth rate, +migration_in, unlocks *Inspired/Prosperous* |
| 60–79 | Content | Small positive modifiers |
| 40–59 | Neutral | No modifiers (baseline) |
| 20–39 | Discontent | −productivity, −birth rate, occasional protests, some emigration |
| 0–19 | **Unrest** | Strikes, riots, desertion, rapid emigration; can **downgrade** a tile/capital |

### 3.2 Inputs to happiness (your brief, enumerated)

| Input | Raises happiness | Lowers happiness |
|-------|------------------|-------------------|
| **Food supply** | Surplus + **variety** (many food types) | Shortage, monotony (only one food) |
| **Shelter quality** | Enough good housing | Overcrowding, tents in winter |
| **Safety** | Garrisons, low danger, walls | Raids, high danger, recent attacks |
| **Culture buildings** | Shrines, theaters, monuments, baths | Absence in a large city |
| **Festivals** | Seasonal & holiday events | — (their *absence* over time is a slow malus) |
| **Leadership decrees** | Popular decrees (bread & games) | Harsh decrees (conscription, heavy labor) |
| **Environmental hazards** | — | Heat/ash/smoke/toxic exposure, disasters |
| **Faith/religion** | Temples, aligned belief | Neglected faith, heresy events |

---

## 4. Status effects

Status effects are **timed modifiers** on a tile's population (or a specific group). They make
happiness *legible* — the player sees *why* a place is thriving or suffering. Multiple can stack.

| Status | Icon | Trigger | Effect | Duration |
|--------|:----:|---------|--------|----------|
| **Well-Fed** | 🍖 | Food surplus + variety for several days | +happiness, +birth rate | While maintained |
| **Overworked** | 😓 | Too few workers for the assigned load; no rest | −happiness, −health, +accident | Until load eases |
| **Inspired** | ✨ | New culture building, festival, or great event | +culture output, +happiness | Temporary |
| **Fearful** | 😨 | Nearby attack, eruption, disaster, cave-in | −morale, −productivity, −birth | Temporary, fades |
| **Prosperous** | 💰 | High happiness + surplus economy sustained | +growth, +migration_in, +trade | While sustained |
| **Heat-Stressed** | 🥵 | Working heat zones without heat gear | −health (damage/tick), −efficiency | Until gear/leave heat |
| **Ash-Choked** | 😷 | In ash/smoke without a mask | −vision, −morale, −health | Until mask/zone clears |
| **Heroic** | 🎖 | After a battle victory | +combat morale, +happiness | Temporary (fades) |
| **Sick/Plagued** | 🤢 | Disease (swamp, toxic, overcrowding) | −health, contagious, −productivity | Until cured/quarantined |
| **Faithful** | 🙏 | Temple + aligned belief | +happiness stability, festival potency | While maintained |
| **Cold-Bitten** | 🥶 | Winter/tundra without heat/insulation | −health, −productivity | Until warmed |

Status effects are the **feedback layer**: they turn abstract numbers into a story ("my miners
are *Heat-Stressed* and *Fearful* after the cave-in — I need masks and a festival").

Full status trigger thresholds & magnitudes: [Appendix §Status](14-formulas-and-data-appendix.md#status-effects).

---

## 5. Decrees (leadership policy)

Decrees are toggled/enacted policies with **costs, upkeep, and cooldowns**. The number of
**active decree slots** scales with capital tier (1 at T1 → 5 at T5, see [02](02-capital-and-flags.md)).

| Decree | Effect | Cost / downside |
|--------|--------|-----------------|
| **Encourage Families** | +birth rate | Small happiness upkeep; needs housing/food |
| **Boost Birth Rate** | ++birth rate | Higher upkeep; overcrowding risk |
| **Invite Migrants** | migration_in waves | Must feed/house arrivals or happiness drops |
| **Rationing** | Stretch food in shortage | −happiness while active (fair but unpopular) |
| **Festival Decree** | Immediate happiness/culture spike | Gold + food cost |
| **Conscription** | Convert workers → soldiers fast | −happiness, −production |
| **Labor Drive** | +production temporarily | +Overworked risk, −happiness after |
| **Curfew / Martial Law** | −crime/unrest, +safety during war | −happiness, −trade |
| **Patronage of the Arts** | +culture, +Inspired chance | Gold upkeep |
| **Tax policy (low/med/high)** | Gold income vs. happiness trade | Higher tax = more gold, less happiness |

Decrees are the **player's leadership voice** — the lever between short-term push and long-term
morale. Civilization-tier decrees (T5) are bigger (empire-wide campaigns, golden ages).

---

## 6. Buildings that touch population (quick map)

(Full stats in [City Building](07-city-building.md).)

| Building | Population effect |
|----------|-------------------|
| House / Housing District | +pop cap, +shelter (happiness) |
| Nursery / Family Hall ("breeding hub") | +birth rate, +child survival |
| Granary / Market | Food storage & variety → Well-Fed |
| Shrine / Temple | +faith, +happiness stability |
| Theater / Baths / Monument | +culture → Inspired, happiness |
| Barracks | Converts pop → soldiers, houses garrison |
| Hospital / Healer's Hut | Cures Sick, reduces death rate |
| Watchtower / Walls / Fort | +safety → happiness, −fear |

---

## 7. The population gameplay loop

```
  FEED (food+variety) ─▶ HOUSE (cap+shelter) ─▶ SECURE (safety) ─▶ DELIGHT (culture/festivals)
        ▲                                                                    │
        │                    happiness ↑ → births ↑ → more workers           │
        └──── assign new workers to farms/mines/etc. ◀───────────────────────┘
                    │
                    ▼  (if you neglect any step)
        shortage / overcrowding / raids / boredom → status effects → happiness ↓ → emigration
```

**The core tension:** every new worker is a mouth to feed and a body to house. Growth is only
good if you can **sustain** it — otherwise happiness collapses and people leave. Managing that
balance *is* the population game.

---

### Cross-references
- Where people work & live → [07 City Building](07-city-building.md)
- Hazards that inflict status effects → [03 Mining](03-resources-mining-and-gear.md) & [01 Tiles](01-world-and-tiles.md)
- Seasons/disasters/religion driving happiness → [12 Extra Mechanics](12-extra-mechanics.md)
- Soldiers & morale in battle → [09 Military](09-military-and-combat.md)
- Growth/happiness formulas → [14 Appendix](14-formulas-and-data-appendix.md)
