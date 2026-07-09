# 09 — Military & Combat

> Armies defend your realm, take contested tiles, cull dangerous wildlife/bandits, and enforce
> your will on rival nations. Military power is **downstream of everything**: it needs population
> (soldiers), materials (weapons/armor), buildings (barracks/armory), tech, and supply lines.

**Related:** [Weapons & Crafting](04-weapons-and-crafting.md) · [Population](05-population-and-happiness.md) ·
[Colonization](08-colonization-and-expansion.md) · [AI Nations](10-ai-nations-and-diplomacy.md)

---

## 1. From civilian to soldier

- **Recruit** in the **Barracks**: converts `pop` (any group) into **Soldiers**. Recruiting
  removes them from the workforce (a real economic cost — Pillar P4).
- **Equip** at the **Armory**: assigns a weapon + armor grade from your stockpile
  ([04](04-weapons-and-crafting.md)). An un-equipped soldier is little better than a militiaman.
- **Train:** soldiers gain `combat_skill` over time and through battles (veterans matter).
- **Disband:** soldiers return to the civilian workforce (minus a re-skill dip).

```
   pop ──Barracks──▶ Soldier ──Armory equips──▶ equipped unit ──assigned to──▶ Detachment/Army
                                    │                                              │
                       weapon+armor grade (04)                          garrison a tile OR march
```

---

## 2. Unit types

Units combine a **role** with an **equipment grade**. Roles come from buildings/tech; grade
comes from your crafting tier.

| Unit | id | Role | Building/Tech | Strength | Weak to |
|------|----|------|---------------|----------|---------|
| **Militia** | `u_militia` | Cheap emergency levy | Barracks | Numbers, cheap | Everything (low grade) |
| **Spearmen** | `u_spearmen` | Anti-cavalry line infantry | Barracks | Holds lines, +vs cavalry | Archers, flanking |
| **Archers** | `u_archers` | Ranged skirmisher | Barracks + archery | Ranged first-strike, terrain | Cavalry closing in |
| **Cavalry** | `u_cavalry` | Fast flankers/raiders | Stables + animal_husbandry | Speed, flanking, chase | Spearmen, rough terrain |
| **Heavy Infantry** | `u_heavy_inf` | Armored shock troops | Barracks + metallurgy | High DEF/HP, breaks lines | Slow; kited by archers |
| **Crossbowmen** | `u_crossbow` | Armor-piercing ranged | Fletcher + engineering | Punches heavy armor | Slow reload, melee |
| **Siege engines** | `u_siege` | Break walls/forts | Siege Workshop + engineering | vs fortifications | Vulnerable in open field |
| **Elite Guard** | `u_elite` | Adamantite-tier shock | Adamantite Forge + adamantite_refinement | Best in game | Expensive; still needs support |

**Composition matters** (rock-paper-scissors): spears beat cavalry, cavalry beats archers,
archers beat spears/infantry at range; heavy infantry anchors; siege for forts. No single unit
wins alone → armies are **combined-arms** (Pillar P3 depth without micro overload).

---

## 3. Detachments & armies

- Soldiers are organized into **Detachments** (a stack of units with a size cap that scales with
  tech: `logistics` raises army size).
- A **General/Leader** can be attached to an army, granting **leadership** bonuses (morale,
  tactics, a special ability). Leaders gain renown from victories.
- Armies **march** across tiles (cost = terrain move cost from [01 §3](01-world-and-tiles.md#3-terrain-types));
  roads speed them up. They can **garrison** a tile or **engage** on it.

---

## 4. Supply lines {#supply-lines}

Armies live and die by logistics (your brief: "armies need supply lines").

```
army_supply = within_range(nearest supply source: capital / Fort / Supply Depot)
if OUT of supply:
    attrition each day (units lose HP/strength), morale falls, no reinforcement/repair
if IN supply:
    reinforcement, equipment repair, sustained morale
```

- Supply range grows with `logistics` tech and **Supply Depots**/**Forts** pushed toward the front.
- **Cutting the enemy's supply** (raiding their roads/depots with cavalry) is a valid strategy —
  a besieging army that's itself unsupplied will wither.
- This makes **deep invasions costly** and **border defense strong** — you fight best near home.

---

## 5. Combat resolution

Combat is **auto-resolved per engagement** with a transparent model (no twitch micro), tunable
and readable. When two forces meet on a tile, resolution runs in short **rounds** until one side
routs or is destroyed.

### 5.1 Per-unit effective power
```
unit_power = (weapon_ATK + role_bonus) × equipment_grade_mult × skill_mult
unit_defense = (armor_DEF + role_bonus) × terrain_def_mult × fortification_mult
```

### 5.2 Round resolution
```
For each round:
  attacker_damage = Σ attacker unit_power
                  × morale_factor(att)
                  × leadership_factor(att)
                  × composition_bonus(att vs def)     // rock-paper-scissors
                  × terrain_factor(att)               // attacker often penalized on rough/defended ground
                  × flanking/surprise                 // from cavalry speed, scouting
  defender takes damage → distributed across defender units (front line first)
  … symmetric for defender_damage …
  update morale (losses, leader, Heroic/Fearful status)
  a side ROUTS when morale < rout_threshold  → retreats (takes extra losses) 
  battle ends on rout or annihilation
```

### 5.3 Modifiers table
| Modifier | Effect |
|----------|--------|
| **Terrain** | Defenders gain on hills/forest/walls; attackers slowed on mountain/swamp; open plains favor cavalry |
| **Fortification** | Walls/Fort multiply defender defense; need siege to reduce it |
| **Morale** | Driven by supply, recent victories (*Heroic*), losses, leader, happiness back home (war weariness) |
| **Leadership** | A general adds tactics/morale and may enable a special (ambush, rally, charge) |
| **Composition** | Correct counter-units multiply damage; being hard-countered divides it |
| **Equipment grade** | Bronze < iron < steel < adamantite is a large multiplier — **why the mining/crafting ladder matters** |
| **Numbers** | More units = more total power, but supply/terrain can cap effective frontage |
| **Surprise/flanking** | Cavalry speed + good scouting → first-strike/flank bonus |

### 5.4 Outcomes
- **Decisive victory:** enemy annihilated/routed with light losses → *Heroic* status, renown.
- **Pyrrhic victory:** you win but bleed → war weariness, *Fearful* back home.
- **Defeat/rout:** your army retreats with losses; the tile may fall.
- **Siege:** attacking a walled tile without siege engines is slow and bloody; siege engines +
  cutting supply force a surrender over time.

Full combat constants (round count, rout thresholds, all multipliers):
[Appendix §Combat](14-formulas-and-data-appendix.md#combat).

---

## 6. Non-nation combat (PvE)

Armies aren't only for rival nations:
- **Wildlife culls:** clear wolf packs/bears to lower a tile's `danger_level` and gain premium
  furs ([01 §10](01-world-and-tiles.md#10-animals--hunting)).
- **Bandit camps:** raze camps that raise danger and raid your supply; yields loot.
- **Rival tribes (pre-nation):** small hostile groups on the early map — combat training wheels.

---

## 7. War & the home front

War is not free (Pillar P4/P5):
- **Conscription** and casualties drain the workforce and spike **war weariness** (−happiness).
- **Equipment upkeep** and army supply consume materials continuously.
- **Victories** grant *Heroic* morale, loot, renown, and leverage in [diplomacy](10-ai-nations-and-diplomacy.md).
- A long, losing war can cause **unrest** at home even if the front holds → the game punishes
  reckless militarism and rewards decisive, well-supplied campaigns.

---

## 8. The military gameplay loop

```
  THREAT/OPPORTUNITY (raid, contested tile, rival war)
        │
        ▼
  build Barracks/Armory ─▶ recruit (pop→soldiers) ─▶ equip (best tier you can craft) ─▶
  ─▶ form combined-arms army + leader ─▶ extend supply (roads/depots/forts) ─▶
  ─▶ march & engage (combat model) ─▶ win: take tile/loot/Heroic  |  lose: regroup, re-arm ─▶
  ─▶ garrison & fortify held tiles ─▶ (economy funds the next, better army)
```

---

### Cross-references
- Weapons/armor that grade units → [04 Weapons & Crafting](04-weapons-and-crafting.md)
- Soldiers come from & cost population → [05 Population](05-population-and-happiness.md)
- Supply lines, forts, contested tiles → [08 Colonization](08-colonization-and-expansion.md)
- Who you fight & why → [10 AI Nations & Diplomacy](10-ai-nations-and-diplomacy.md)
- Combat math → [14 Appendix](14-formulas-and-data-appendix.md#combat)
