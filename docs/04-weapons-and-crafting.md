# 04 — Weapons & Crafting

> From a sharpened stick to an adamantine blade. This document defines the weapon/armor
> progression, the crafting buildings, and the exact recipes that turn mined materials
> (doc 03) into military power (doc 09).

**Related:** [Resources & Mining](03-resources-mining-and-gear.md) · [Military](09-military-and-combat.md) ·
[City Building](07-city-building.md) · [Technology](06-technology.md)

---

## 1. The weapon progression ladder

Weapons advance in **tiers**, each gated by a **material**, a **tech**, and a **crafting
building** (Pillar P3). Every tier is a meaningful power jump but also a meaningful cost jump.

```
 TRIBAL         COPPER        BRONZE        IRON              STEEL          ADAMANTINE
 ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐        ┌────────┐     ┌────────────┐
 │ wooden │    │ copper │    │ bronze │    │ iron   │        │ steel  │     │ ADAMANTINE │
 │ spear  │─▶  │ spear  │─▶  │ spear  │─▶  │ spear/ │  ─▶    │ sword  │ ─▶  │   sword    │
 │ stone  │    │        │    │        │    │ sword  │        │        │     │  (elite)   │
 │ tips,  │    │        │    │        │    │        │        │        │     │            │
 │ bone   │    │        │    │        │    │        │        │        │     │            │
 │ knives │    │        │    │        │    │        │        │        │     │            │
 └────────┘    └────────┘    └────────┘    └────────┘        └────────┘     └────────────┘
  survival      first metal   stronger      advanced armies   pro armies     elite guard
  hunting       militia       spearmen      + iron armor      + steel armor  + adamantine armor
```

### 1.1 Weapon stat table

`ATK` = attack power, `DUR` = durability, `TIER` matches the era. Numbers are tunable baselines.

| Weapon | id | Tier | ATK | DUR | Material | Tech | Building |
|--------|----|:----:|:---:|:---:|----------|------|----------|
| Wooden spear | `wpn_wood_spear` | Tribal | 3 | Low | wood | — | (hand-crafted) |
| Stone-tipped spear | `wpn_stone_spear` | Tribal | 5 | Low | wood + stone/obsidian | `primitive_tools` | Toolmaker's Hut |
| Bone knife | `wpn_bone_knife` | Tribal | 4 | Low | bone (game) | `primitive_tools` | Toolmaker's Hut |
| Bow (ranged) | `wpn_bow` | Tribal | 6* | Med | wood + sinew + feathers | `archery` | Toolmaker's Hut |
| **Copper spear** | `wpn_copper_spear` | Copper | 8 | Med | copper + wood | `mining` | Smithy |
| Copper axe | `wpn_copper_axe` | Copper | 9 | Med | copper + timber | `mining` | Smithy |
| **Bronze spear** | `wpn_bronze_spear` | Bronze | 12 | Med | **bronze** + timber | `bronze_working` | Smithy |
| Bronze sword | `wpn_bronze_sword` | Bronze | 14 | Med | bronze | `bronze_working` | Smithy |
| **Iron spear** | `wpn_iron_spear` | Iron | 17 | High | iron + timber | `metallurgy` | Forge |
| **Iron sword** | `wpn_iron_sword` | Iron | 20 | High | iron | `metallurgy` | Forge |
| Crossbow | `wpn_crossbow` | Iron | 22* | High | iron + timber | `engineering` | Forge |
| **Steel sword** | `wpn_steel_sword` | Steel | 28 | V.High | **steel** | `advanced_forging` | Foundry |
| Steel halberd | `wpn_steel_halberd` | Steel | 30 | V.High | steel + timber | `advanced_forging` | Foundry |
| **Adamantine sword** | `wpn_adamantine_sword` | Adamantine | **42** | Extreme | **adamantine bars** + steel | `adamantine_refinement` | Adamantine Forge |
| Adamantine maul | `wpn_adamantine_maul` | Adamantine | 46 | Extreme | adamantine + magma glass | `adamantine_refinement` | Adamantine Forge |

`*` ranged weapons apply ATK at range with terrain/positioning bonuses — see [Military](09-military-and-combat.md).

> **Campaign extension:** in the Mediterranean Campaign, the **Iron Pantheon** slots 14 named
> exotic metals (mystic iron, ember-iron, frostbound iron, storm iron, verdant iron, dawn iron,
> runic ferrite, shadowsteel, dragoon steel, lapis steel, aetherium, void-iron, mythril,
> starforged iron, celestium) between the spine tiers above, each with its own grade multiplier
> and signature effect — see [doc 15 §Iron Pantheon](15-mediterranean-campaign.md#iron-pantheon).

### 1.2 Armor progression (parallel ladder)

Armor advances alongside weapons and multiplies unit **defense/HP**.

| Armor | id | Tier | DEF | Material | Tech |
|-------|----|:----:|:---:|----------|------|
| Hide/fur | `arm_hide` | Tribal | 2 | leather/fur (game) | `primitive_tools` |
| Padded/leather | `arm_leather` | Copper | 4 | leather + cloth | `mining` |
| Bronze plate (partial) | `arm_bronze` | Bronze | 7 | bronze + leather | `bronze_working` |
| Iron mail | `arm_iron` | Iron | 11 | iron + leather | `metallurgy` |
| Steel plate | `arm_steel` | Steel | 16 | steel | `advanced_forging` |
| **Adamantine plate** | `arm_adamantine` | Adamantine | **24** | adamantine + steel | `adamantine_refinement` |

Weapon + armor tier together define a **unit's equipment grade**, which combines with the unit
**type** (militia, spearman, etc.) to produce final combat stats in [Military](09-military-and-combat.md).

---

## 2. Crafting buildings (the workshops)

Each tier needs the right building. Building up this chain is a parallel progression to the
weapon ladder.

| Building | id | Makes | Requires (tech) | Consumes fuel? |
|----------|----|-------|-----------------|:--------------:|
| **Toolmaker's Hut** | `bld_toolmaker` | tribal weapons, bows, basic pickaxes, work clothes | `primitive_tools` | no |
| **Smithy** | `bld_smithy` | copper & bronze weapons/tools, boots | `mining` | yes (charcoal) |
| **Forge** | `bld_forge` | iron weapons/tools/armor, iron pickaxe, masks/helms | `metallurgy` | yes (coal) |
| **Foundry** | `bld_foundry` | **steel** refining, steel weapons/armor, exosuit parts | `advanced_forging` | yes (coal, lots) |
| **Adamantine Forge** | `bld_adamantine_forge` | **adamantine** refining, adamantine weapons/armor, exosuits | `adamantine_refinement` | yes (coal + magma glass) |
| **Tailor / Leatherworks** | `bld_tailor` | cloth, leather, work clothes, masks (cloth parts) | `weaving` | no |
| **Fletcher** | `bld_fletcher` | bows, crossbows, arrows | `archery` | no |
| **Armory** (store+equip) | `bld_armory` | *stores* weapons/armor, equips units, +garrison cap | `architecture` | no |

> **Armory vs. workshops:** workshops **make** gear; the **Armory** **stores** it and **equips**
> recruited units. You need both to field an equipped army. The Armory is also a **T3 tier gate**
> (see [Capital & Flags](02-capital-and-flags.md)).

---

## 3. Recipes (material → item)

Recipes are data-driven (`/data/game-data.json`). Format: item = building(inputs) [+ tech].
Representative recipes:

```
  wpn_stone_spear   = Toolmaker( wood×2, stone×1 )                       [primitive_tools]
  wpn_bow           = Fletcher( wood×2, sinew×1, feathers×2 )            [archery]

  copper            = Smelter( copper_ore×2, charcoal×1 )                [mining]
  bronze            = Smelter( copper×2, tin×1, charcoal×1 )             [bronze_working]
  wpn_bronze_sword  = Smithy( bronze×3 )                                 [bronze_working]

  steel             = Foundry( iron×2, coal×2 )                          [advanced_forging]
  wpn_steel_sword   = Foundry( steel×3, charcoal×1 )                     [advanced_forging]

  adamantine        = AdamantineForge( adamantine_ore×3, steel×1,
                                       magma_glass×1, coal×3 )           [adamantine_refinement]
  wpn_adamantine_sword = AdamantineForge( adamantine×4, steel×2 )        [adamantine_refinement]

  gear_heatsuit     = Tailor( leather×2, obsidian×1, salt×1 )            [weaving + mining]
  gear_mask         = Tailor( cloth×2, charcoal×1, quartz×1 )            [weaving]
  gear_exosuit      = AdamantineForge( steel×4, magma_glass×2, leather×2)[advanced_forging]
```

**Batch crafting:** the player queues items in a workshop; each consumes inputs + a craft time
scaled by the assigned **Builder/Smith** count and their skill. Crafting competes with other
production for both **materials** and **labor** — a constant prioritization decision.

---

## 4. Tool crafting (ties back to mining)

The **pickaxes** and **gear** from [doc 03](03-resources-mining-and-gear.md) are crafted here:

| Tool | Building | Recipe |
|------|----------|--------|
| `pick_wood` | Toolmaker | wood×3 |
| `pick_stone` | Toolmaker | wood×2 + stone×2 |
| `pick_lapis` | Smithy | wood×2 + lapis×1 + copper×1 |
| `pick_iron` | Forge | timber×2 + iron×2 |
| `pick_adamantine` | Adamantine Forge | steel×2 + adamantine×2 |

This closes the **mining ↔ crafting loop**: mine to craft better tools → mine faster/deeper →
craft even better tools & weapons.

---

## 5. Upgrade, repair & obsolescence

- **Durability:** weapons/armor/tools degrade with use; the Armory auto-repairs equipped gear
  at a small material upkeep. Higher tiers are more durable and cheaper-per-use long-term.
- **Upgrading units:** an existing unit can be **re-equipped** to a higher tier at the Armory
  (cheaper than disbanding + re-recruiting) once you can craft that tier.
- **Obsolescence is soft:** old weapons still work (great for cheap garrison/militia); you're
  never forced to scrap them, but front-line units want the best you can make.
- **Salvage:** defeated enemy equipment can sometimes be salvaged for a fraction of its
  materials (a small war economy incentive).

---

## 6. Crafting progression chart (what unlocks when)

```
 ERA        BUILDINGS UNLOCKED        WEAPONS/ARMOR AVAILABLE           KEY MATERIAL
 ────────────────────────────────────────────────────────────────────────────────────
 Stone      Toolmaker, (Tailor,       wooden/stone spear, bone knife,   wood, stone,
            Fletcher)                 bow, hide armor                    obsidian
 Copper     Smithy, Smelter           copper spear/axe, leather armor    copper, tin
 Bronze     (Smithy+)                 bronze spear/sword, bronze plate   bronze
 Iron       Forge, Armory             iron spear/sword, crossbow,        iron, coal
                                      iron mail
 Steel      Foundry                   steel sword/halberd, steel plate,  steel
                                      exosuit parts
 Adamantine Adamantine Forge          adamantine sword/maul, adamantine  adamantine,
                                      plate, full exosuit                 magma glass
```

This chart lines up 1:1 with the [tech tree eras](06-technology.md) and the
[capital tiers](02-capital-and-flags.md) — steel is reachable at **Developed Capital (T4)**,
adamantine at **Grand Capital (T5)**.

---

### Cross-references
- Where materials come from → [03 Resources & Mining](03-resources-mining-and-gear.md)
- How equipment becomes battlefield stats → [09 Military & Combat](09-military-and-combat.md)
- Which tech unlocks each tier → [06 Technology](06-technology.md)
- Buildings' full stats/costs → [07 City Building](07-city-building.md)
