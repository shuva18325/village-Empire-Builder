# 08 — Colonization & Expansion

> The outer loop. This document defines the pipeline that turns a fogged tile into a productive
> part of your civilization: **explore → claim → colonize → develop → connect → defend**.

**Related:** [World & Tiles](01-world-and-tiles.md) · [City Building](07-city-building.md) ·
[Population](05-population-and-happiness.md) · [Military](09-military-and-combat.md) · [AI](10-ai-nations-and-diplomacy.md)

---

## 1. The expansion pipeline

```
  ┌──────────┐   ┌────────┐   ┌───────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐
  │ EXPLORE  │──▶│ CLAIM  │──▶│ COLONIZE  │──▶│ DEVELOP │──▶│ CONNECT │──▶│ DEFEND │
  │ (scout,  │   │ (plant │   │ (found a  │   │ (raise  │   │ (roads/ │   │ (garri-│
  │  fog)    │   │  flag) │   │ settlement)│  │  DL)    │   │ supply) │   │ son)   │
  └──────────┘   └────────┘   └───────────┘   └─────────┘   └─────────┘   └────────┘
       │              │             │              │             │            │
   costs time     costs         costs pop +     buildings    roads link   troops +
   + risk         influence     resources +     over time    tiles,       supply
   (01 fog)       + stability    tech + stability             enable trade  keep it
```

Each stage has a **gate** — you can't skip ahead. This paces expansion so it always trails your
economy slightly (you're always *reaching*, Pillar P2/P3).

---

## 2. Stage 1 — Explore

Covered in [World & Tiles §6](01-world-and-tiles.md#6-fog-of-war--exploration). Summary:
send a **Scout/Hunter** party; time & risk scale with `exploration_difficulty` and
`danger_level`; success reveals the tile's terrain, resources, hazards, and animals — the intel
you need to decide whether to claim it.

---

## 3. Stage 2 — Claim

Claiming asserts ownership (plants your **flag**) and is the prerequisite to colonizing.

**Claim requirements:**
| Requirement | Detail |
|-------------|--------|
| Tile explored | Must have full intel (Stage 1) |
| Adjacency | Must be adjacent to an owned tile **or** within supply range of one (no random far claims early) |
| **Influence cost** | Scales with distance from capital & tile value; rares/legendary cost more |
| **Stability** | Your civilization must have spare stability (over-claiming spreads you thin) |
| Terrain tech | Locked terrains need their unlock tech ([01 §5](01-world-and-tiles.md#5-tech-locked-tiles)) |
| Not owned by AI | If AI-owned/contested → this is a **diplomatic or military** action, not a peaceful claim |

**Over-extension:** each claimed-but-underdeveloped tile applies a small **stability/admin
drain**. Claim faster than you can develop and happiness/stability sag empire-wide — a natural
brake that rewards consolidation.

---

## 4. Stage 3 — Colonize

Colonizing founds an actual settlement, turning the claimed tile productive. This is the "found
a village" moment.

**Colonization requirements (your brief):**
| Requirement | Detail |
|-------------|--------|
| **Population** | Send **settlers** (a chunk of pop, e.g. 8–15) from a source tile |
| **Resources** | A starter kit (wood/stone/food) to bootstrap the settlement |
| **Tech** | `architecture` for real settlements; terrain techs as needed |
| **Stability** | Enough spare stability to absorb a new settlement |
| A supply link or local food | New colony must be fed (road link or its own food tile) |

On founding, choose the **settlement type** (its core building & focus):

| Settlement type | Best for | Core building |
|-----------------|----------|---------------|
| **Outpost** | Cheap vision/border claim | `outpost_post` |
| **Village** | Balanced small production, food | `village_center` |
| **Town** | Growth + trade node | `town_hall` |
| **City Center** | Dense high-output hub | `city_hall` |
| **Industrial Hub** | Max mining/refining (put on ore/volcano tiles) | `industrial_core` |
| **Military Fort** | Defense & army staging (frontier/volcano) | `fort` |

Settlements can be **upgraded** later (Outpost→Village→Town→City) as their DL and pop grow —
this is the tile-level echo of the capital's tier evolution.

```
   COLONIZE PROMPT (concept)
   ┌────────────── FOUND SETTLEMENT: t_5_2 (Volcanic Slope) ──────────────┐
   │ Terrain: volcanic slope   Danger: 4 ☠   Resources: obsidian, lapis   │
   │ Settlers to send: [ 12 ]   from: Capital (pop 402)                    │
   │ Starter kit: wood×40 stone×30 food×60   ✔ affordable                  │
   │ Recommended type:  ◉ Industrial Hub   ○ Military Fort   ○ Outpost     │
   │ ⚠ Needs heat gear for miners · ⚠ Danger 4 → send a garrison next      │
   │                                        [ Cancel ]   [ Found Colony ]  │
   └──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Stage 4 — Develop

Raise the tile's **Development Level (0–100)** by building on it (see
[City Building](07-city-building.md) & [World §7](01-world-and-tiles.md#7-development-level-0100)).
Higher DL = more build slots, higher pop cap, higher output multiplier, and unlocks the next
settlement upgrade. A colony climbs the same **Wild→Village→Town→…→Metropolis** DL bands as any
tile.

---

## 6. Stage 5 — Connect (roads & supply lines)

Connection is where the map **lights up** (Pillar P1). Roads/supply lines are not just movement
— they are the circulatory system.

**What a road/supply line does:**
| Effect | Detail |
|--------|--------|
| **Supply** | Ships materials between the tile and the capital; feeds distant colonies & armies |
| **Vision** | Connected tiles share vision; the network resists re-fogging |
| **Movement** | Units & settlers move faster along roads |
| **Trade** | Enables caravans, market variety, and trade with AI |
| **Flag banners** | Connected owned tiles fly your **flag banner** — the visible web of your realm |
| **Happiness** | Connected, supplied tiles are happier (not isolated) |

**Supply range:** a tile/army must be within **supply range** of a supply source (capital,
Fort, or Supply Depot). Beyond range, tiles stockpile locally (raid-vulnerable) and armies
suffer **attrition** (see [Military §Supply](09-military-and-combat.md#supply-lines)). `logistics`
tech and Supply Depots extend range.

```
   THE NETWORK LIGHTS UP as roads complete:
     before                         after roads
   ┌───┬───┬───┐                 ┌───┬───┬───┐
   │Cap│ · │col│  (isolated,     │Cap│═══│col│  (connected: supply,
   ├───┼───┼───┤   dim, own      ├───┼───┼───┤   vision, banners ⚑,
   │ · │ · │ · │   food only)    ║   │   │   │   trade, happiness)
   └───┴───┴───┘                 └───┴───┴───┘
```

---

## 7. Stage 6 — Defend

A colony you can't hold is a gift to the AI or wildlife. Defense scales with the tile's
`danger_level` and proximity to hostile nations.

| Defense measure | Effect |
|-----------------|--------|
| **Garrison** | Station soldiers on the tile (from [Military](09-military-and-combat.md)) |
| **Walls / Palisade** | +defense multiplier vs. attacks |
| **Watchtower** | Early warning, −danger, +vision |
| **Fort** | Frontier stronghold: big garrison + supply hub + staging point |
| **Supply line** | An unsupplied garrison weakens (attrition) |

Frontier tiles near volcanoes or AI borders should usually be **Military Forts** or well-garrisoned
Industrial Hubs.

---

## 8. Expansion strategy layer (emergent decisions)

The pipeline creates rich decisions without extra rules:

- **Tall vs. wide:** develop few tiles deeply (tall) or claim many shallowly (wide)? Over-claim
  → stability drain; over-tall → you cede the map & rares to the AI.
- **Specialization:** designate tiles by role — a food delta, a mining hub, a research city, a
  frontier fort — connected by roads. Districts ([07 §4](07-city-building.md#4-districts--adjacency))
  reward this.
- **The volcano march:** reaching and holding a volcano tile is a multi-stage campaign — explore
  the dangerous route, claim slope tiles, colonize an Industrial Hub + a Fort, connect a supply
  line for gear & evac, then mine. It's a mid/late-game *project*, exactly the AMBITION-phase beat.
- **Contested expansion:** the AI wants the same rich/legendary tiles. Racing them, or taking a
  tile by force, ties expansion into [diplomacy & war](10-ai-nations-and-diplomacy.md).

---

## 9. Losing tiles

Tiles can revert or be lost:
- **Conquest:** an AI army captures the tile (ownership flips; buildings partly damaged).
- **Abandonment:** a starving/isolated/deeply unhappy colony can be abandoned (pop emigrates,
  tile → neutral, DL decays).
- **Disaster:** eruption/flood can wreck a tile enough to force abandonment.

Re-taking a lost tile is possible (re-claim/re-colonize or reconquer) — the map is dynamic.

---

### Cross-references
- The tiles you're expanding onto → [01 World & Tiles](01-world-and-tiles.md)
- What to build on them → [07 City Building](07-city-building.md)
- Settlers come from population → [05 Population](05-population-and-happiness.md)
- Armies to defend/take tiles → [09 Military](09-military-and-combat.md)
- Racing/fighting the AI for tiles → [10 AI Nations](10-ai-nations-and-diplomacy.md)
