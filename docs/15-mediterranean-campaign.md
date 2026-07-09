# 15 — The Mediterranean Campaign

> The shipped campaign of Empire Builder. It takes every system in docs 01–14 and instantiates
> them on a **staged, authored Mediterranean world**: you begin as a tribal chiefdom in the
> **Peloponnese (60 tiles)**, unite **Greece (100 tiles)**, take to the sea, and end ruling a
> **300–400-tile Mediterranean Empire** against eight ancient rival powers.

**Related:** [World & Tiles](01-world-and-tiles.md) (generic worldgen = skirmish mode) ·
[Colonization](08-colonization-and-expansion.md) · [Military](09-military-and-combat.md) ·
[AI Nations](10-ai-nations-and-diplomacy.md) · [Resources & Mining](03-resources-mining-and-gear.md) ·
Campaign data: [`/data/campaign-mediterranean.json`](../data/campaign-mediterranean.json)

---

## 1. The staged world map {#staged-map}

### 1.1 One world, revealed in stages

The campaign world is a single authored map of **~361 tiles** (within the 300–400 target band),
but the player only ever *plays* the part their age can reach. Beyond the normal
[fog-of-war](01-world-and-tiles.md#6-fog-of-war--exploration) there is a fourth visibility
state, **Beyond the Horizon**: tiles that are locked until the campaign **Act** that activates
them. The horizon is pushed outward by *your own progression* (unification, naval tech,
minerals), so the map itself is the reward ladder (Pillar P1/P2).

```
  ████  UNEXPLORED (fog)          — in your act, not yet scouted
  ▒▒▒▒  EXPLORED, UNOWNED         — known, not held
  ────  OWNED / REVEALED          — yours, fully visible
  ≣≣≣≣  BEYOND THE HORIZON        — locked until a later ACT (shown as distant haze
                                     on the map edge, with a "what lies beyond" hint)
```

### 1.2 Tile counts per stage (the headline numbers)

| Stage | Act | Playable tiles | New tiles added | What opens |
|-------|:---:|:--------------:|:---------------:|------------|
| **Peloponnese** | Act I | **60** | 60 | The homeland: unite it |
| **Greece** | Act II | **100** | +40 | Attica, Thessaly, Epirus, Macedonia, Thrace, Cyclades, Crete |
| **Kingdom / Naval Age** | Act III | **~162** | +62 (58 land + 4 sea) | Illyria, Moesia, E. Thrace, W. Anatolia, S. Italy, Sicily + first sea zones |
| **Advanced Mineral Age** | Act IV | **~208** | +46 (43 land + 3 sea) | Central Anatolia, Cappadocian volcanic core, Cilicia, Central Italy, Sardinia, Corsica |
| **Empire Stage** | Act V–VI | **~361** | +153 (146 land + 7 sea) | Gaul, Iberia, N. Italy, Levant, Mesopotamia, Egypt, all North Africa, all seas |

Land tiles: **347** · Sea-zone tiles: **14** · Total: **361** (tunable within 300–400 by
scaling region allocations — see the atlas in §7).

### 1.3 Variable tile resolution (why the homeland has 60 tiles)

The map is **finest-grained where your story is**: the Peloponnese alone is 60 tiles (you will
know every valley by name), Greece is 100, while distant provinces like Gaul are coarser
(a handful of large tiles each). This keeps the early game intimate and the late game
strategic without a 2,000-tile grind. Rule of thumb: **homeland 1 tile ≈ a valley; periphery
1 tile ≈ a province.**

### 1.4 The Mediterranean, schematically

```
                    GAUL (V)                          DACIA (V)
              ┌───────────────┐   N.ITALY(V)      ┌──────────┐      BLACK SEA (V)
   IBERIA (V) │ gaul_n gaul_c │  ┌─────────┐      │  dacia   │    ≈≈≈≈≈≈≈≈≈≈≈≈
  ┌─────────┐ │    gaul_s     │  │cisalpine│ ILLYRIA(III) MOESIA(III) ┌────────┐
  │ iberia_e │ └──────┬───────┘  │ central │  ┌──────┐ ┌──────┐      │ pontus │(V)
  │ iberia_c │  Gulf of Lion(V)  │  italy  │  │illyria│ │moesia│ thrace_e(III)  │
  │ iberia_s │   ≈≈≈≈≈≈≈≈≈      │ (IV)    │  └──┬───┘ └──┬───┘  Marmara(IV)   │
  └────┬────┘  Ligurian(V)      │ magna   │ Adriatic(III) │   ┌───────────────┴──┐
       │      ≈ Balearic(V) ≈   │ graecia │  ≈≈≈≈≈≈  MACEDONIA│  ANATOLIA (III–V) │
   Alboran(V)  Tyrrhenian(IV)   │ (III)   │        THESSALY   │ ionia phrygia     │
   ≈≈≈≈≈≈≈≈   ≈≈≈≈≈≈≈≈≈≈≈      └──┬──────┘  GREECE EPIRUS    │ cappadocia_core🌋 │
       │        SARDINIA(IV)  SICILY🌋(III)  (I–II) ┌────────┐│ armenia/pontus    │
       │        CORSICA(IV)      └────┘   Ionian(III)│ ★PELO- ││                  │
  MAURETANIA(V) ┌──────────┐  Gulf of Gabès(V) ≈≈≈  │ PONNESE││ CILICIA(IV)       │
  NUMIDIA(V)    │ CARTHAGE │   ≈≈≈≈≈≈≈≈≈≈  Aegean(III)(60t) │└───────┬───────────┘
  ┌──────────┐  │ /TUNISIA │      LIBYA(V)   ≈≈≈≈≈  └───┬────┘  SYRIA(V) MESOPOTAMIA(V)
  │mauretania│  │   (V)    │   ┌─────────┐ Sea of Crete(III)   PHOENICIA(V) ┌─────┐
  │ numidia  │  └────┬─────┘   │  sirte  │  ≈≈≈ CRETE(II)      JUDEA(V)     │meso │
  └──────────┘       │         └────┬────┘  CYRENAICA(V)  Levantine Sea(IV) └─────┘
                     └──── AFRICA ──┴── EGYPT/NILE (V) ─────────────┘
   ★ = your start    (roman numerals = Act in which the region becomes playable)
```

---

## 2. Campaign structure — the six Acts {#acts}

### 2.1 Act overview

| Act | Name | Tiles | Core objective | Headline unlock on completion |
|:---:|------|:-----:|----------------|-------------------------------|
| **I** | The Peloponnese | 60 | **Unite the Peloponnese** (claim, build, stabilize, defeat rival tribes, secure mineral zones) | Early naval tech (`boats`, `shipbuilding`), **League** stage |
| **II** | Greece Unification | 100 | Unite the Hellenic world (stronger enemies, richer trade, Thera volcano) | **Kingdom Stage**, naval age II, `naval_warfare` |
| **III** | Kingdom Stage — The Naval Age | ~162 | Project power by sea: colonize & fight overseas (Illyria, W. Anatolia, S. Italy, Sicily) | Warships → advanced ships; foreign minerals sighted |
| **IV** | The Advanced Mineral Age | ~208 | Secure the exotic metals (the **Iron Pantheon**, adamantine core, magma glass, deep crystal) | Elite units, late-game ships (`deep_sea_navigation`) |
| **V** | Empire Stage | ~361 | Expand across the full Mediterranean; build the empire's administration | Full map, empire decrees, multi-front warfare |
| **VI** | The Eight Empires | ~361 | **Become the Mediterranean Empire**: conquer, vassalize, out-trade or out-culture all eight rivals | Victory |

Acts are **gates, not walls**: Act N+1 opens when Act N's objective completes (plus its tech
gate). You can linger — the AI empires keep developing, so lingering has a price (Pillar P5).

### 2.2 Alignment with the core systems

The campaign acts line up with the existing ladders so nothing in docs 01–14 changes shape:

| Act | Player stage & title (§9) | Capital tier ([02](02-capital-and-flags.md)) | Tech era ([06](06-technology.md)) | Metal reach (§6) | Naval age (§5) |
|:---:|---------------------------|:---:|:---:|------------------|:---:|
| I | Chiefdom → **Peloponnesian League** (Archon → Hegemon) | T1–T2 | E1–E2 | copper, bronze, **mystic iron** | 0 (rafts) |
| II | **Kingdom of Hellas** (Basileus) | T3 | E2–E3 | iron, first exotics (Thera ember-iron) | I (early boats) |
| III | Kingdom (Basileus) | T3–T4 | E3 | regional exotic irons | II (warships) |
| IV | **Thalassocracy** (Megas Basileus) | T4 | E4 | steel, lapis steel, high exotics | III (advanced) |
| V | Empire (Autokrator) | T4–T5 | E4–E5 | aetherium → celestium | IV (deep-sea) |
| VI | **Mediterranean Empire** (Autokrator) | T5 | E5–E6 | **adamantine** | IV |

---

## 3. ACT I — The Peloponnese (60 tiles) {#act-1}

### 3.1 The homeland map

The Peloponnese is divided into **10 regions totalling exactly 60 tiles**:

| Region | Tiles | Terrain profile | Signature resources | Danger | Notes |
|--------|:-----:|-----------------|---------------------|:------:|-------|
| **Corinthia** (Corinth) | 7 | coastal + isthmus | **trade tolls**, clay, port | 1 | The land-bridge: tolls on ALL north traffic; twin ports (two seas) |
| **Argolis** (Argos + Nafplio) | 8 | valley + coast | grain, culture sites, port | 1 | Argos = culture+farming; Nafplio = balanced trade+defense (fortress port) |
| **Achaea** (Patras) | 6 | north coast + hills | fish, currants/berries, port | 1 | Gateway to the western sea; ferry to Aetolia later |
| **Elis** (Olympia) | 6 | valley + meadow | grain, horses, **sacred site** | 0–1 | Olympia = legendary `sacred_grove`-class tile (festivals, faith) |
| **Arcadia** | 8 | inland mountain + forest | wood, stone, game, **iron (deep)** | 2–3 | The wild heart: rival hill-tribes, wolves; hardest inland region |
| **Messenia** (Kalamata) | 7 | fertile valley + coast | **grain surplus**, olives, fish, port | 1 | The breadbasket — feeds your early growth |
| **Laconia** (Sparta) | 8 | valley ringed by mountains | **copper, tin, iron**, stone | 1–2 | The mineral & military heartland (Taygetos mines) |
| **Mani** | 4 | harsh mountain peninsula | **rare ores (lapis, obsidian)**, little food | 3 | High-danger, high-reward; proud free clans resist claiming |
| **Vatika / Monemvasia** | 3 | cliff coast | **fortress port**, salt, quartz | 2 | Monemvasia = natural fortress tile (huge defense bonus) |
| **Kythira Strait** | 3 | island + sea approaches | fish, pearls, waystation | 1 | Stepping stone toward Crete (Act II tease on the horizon) |

**Tile-type distribution across the 60:**

| Type | Count | Role |
|------|:-----:|------|
| Coastal | 18 (6 of them **Ports**) | trade, tolls, fishing, naval unlock progression |
| Valley | 14 | farming, population growth |
| Inland (hills/forest) | 10 | wood, stone, clay, game |
| Mountain | 12 | minerals, rare ores, danger |
| Sacred/legendary | 3 | Olympia, Nemea, Cape Tainaron (oracle) |
| Island/strait | 3 | naval progression teasers |

### 3.2 Choosing a start

The player picks one **starting region** (its central tile becomes the capital). Each is a
different opening build:

| Start | Bias | Difficulty |
|-------|------|:----------:|
| **Sparta** (Laconia) | Minerals + military: fast weapons, slower food | ●● |
| **Corinth** | Trade + naval: gold-rich, exposed to raids | ●● |
| **Kalamata** (Messenia) | Food + growth: population engine, weak metals | ● |
| **Nafplio** (Argolis) | Balanced trade + defense | ● |
| **Argos** | Culture + farming: happiness/faith engine | ● |
| **Mani** | Mountains + rare ores: rich, dangerous, hungry | ●●●● |
| **Monemvasia** | Fortress port: unbreakable but cramped | ●●● |

### 3.3 Rivals of Act I (minor factions)

Pre-nation tribal enemies using the [PvE combat rules](09-military-and-combat.md#6-non-nation-combat-pve):

| Faction | Holds | Behavior | Reward for defeating |
|---------|-------|----------|----------------------|
| **Arcadian Hill Clans** | Arcadia interior | Raids farms in autumn; ambush in forests | Opens the iron road through Arcadia |
| **Free Clans of Mani** | Mani | Never attack first; fiercely resist claims | Mani's lapis/obsidian; recruitable elite skirmishers |
| **Argive Remnant** | 1–2 Argolis tiles | A proud old city-line; can be **absorbed diplomatically** | Peaceful path: culture bonus + their tiles |
| **Isthmus Brigands** | Corinthia fringe | Toll-robbers; raid trade | Corinth's full toll income |

### 3.4 Unification of the Peloponnese (Act I objective)

Checklist (all required):
- [ ] Own or vassalize **all 10 regions** (≥ 54 of 60 tiles)
- [ ] Capital at **Organized Settlement (T2)** or above — flag chosen
- [ ] **3 stabilized regions** (happiness ≥ 50 for a year)
- [ ] All rival tribes defeated, absorbed, or sworn
- [ ] **1 secured mineral zone** (a garrisoned mine in Laconia, Arcadia, or Mani)

**Completion — "The League Assembles":** cinematic + rewards:
- Techs `boats` + `shipbuilding` become researchable (naval age I)
- Polity becomes the **Peloponnesian League** (title: *Hegemon*)
- +Stability, +Influence; the horizon rolls back: **Act II regions appear** on the map edge
- The Isthmus port opens ferry routes to Attica (first sea lane)

### 3.5 Peloponnese mini-map (schematic)

```
            Gulf of Corinth ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈
        ┌─────────┬──────────────┬───────────┐
        │ ACHAEA  │   CORINTHIA  ═ isthmus ═▶│ (Attica — Act II)
        │ (Patras)│  (Corinth 2 ports, tolls)│
        ├─────────┴───┬──────────┴─────┬─────┤
        │    ELIS     │    ARCADIA     │ARGOL│
        │  (Olympia✦) │  ▲▲ wild hills │(Argos│
        │   horses    │  iron, tribes  │Nafpl)│
        ├─────────────┴───┬────────────┴─────┤
        │    MESSENIA     │     LACONIA      │
        │   (Kalamata)    │    (Sparta)      │
        │   grain, port   │  ▲ Taygetos ▲    │
        │                 │  copper/tin/iron │
        └───────┬─────────┴───────┬────┬─────┘
                │      MANI ▲▲▲   │VATIKA│
                │   lapis, clans  │Monem-│
                │   danger 3      │vasia⛨│
                └─────────────────┴──┬───┘
                     Kythira ○ ≈≈≈  (→ Crete, Act II)
```

---

## 4. ACT II — Greece Unification (100 tiles) {#act-2}

### 4.1 The +40 tiles

| Region | Tiles | Profile | Signature | Danger |
|--------|:-----:|---------|-----------|:------:|
| **Attica** (Athens) | 5 | coastal city + silver hills | **silver (Laurion)**, culture, great port | 1–2 |
| **Boeotia & Phocis** (Delphi) | 4 | valley + sacred mountain | grain, **Delphi oracle** (legendary) | 1 |
| **Euboea** | 2 | long island | copper, timber, fish | 1 |
| **Thessaly** | 5 | great plain | **horses** (cavalry!), grain | 2 |
| **Epirus** | 4 | rugged west mountains | timber, hardy tribes | 2–3 |
| **Macedonia** | 6 | highland kingdom | **gold, timber, iron**, strong men | 2–3 |
| **Thrace (west)** | 4 | wild frontier | gold, horses, fierce tribes | 3 |
| **Cyclades** | 4 | island ring | marble, trade routes, **Thera 🌋** | 1–2 |
| **Crete** | 5 | great southern island | **ancient ruins (Knossos)**, timber, ports | 2 |
| **North Aegean Isles** | 1 | waystation | fish, marble | 1 |

### 4.2 What's new in Act II

- **Stronger enemies:** Aetolian raider leagues, Cretan corsairs (first naval raids on your
  coasts!), Thracian horse-clans, early **Illyrian** probing raids from beyond the horizon.
- **Richer trade:** Aegean **trade routes** between your ports (each connected port pair =
  recurring gold; corsairs can cut them — protect with patrol fleets).
- **More advanced minerals:** Laurion **silver** (economy), Macedonian **gold**, and on
  **Thera** the campaign's first **volcanic zone** — obsidian + the first **ember-iron**
  veins (a taste of the Iron Pantheon, §6) under heat hazards.
- **Inland danger:** Epirus/Macedonia/Thrace interiors are danger 2–3 with hostile terrain —
  the north teaches mountain warfare before Illyria does.

### 4.3 Unifying Greece (Act II objective)

- Own/vassalize **all 10 Greek regions** (≥ 90 of 100 tiles), capital at **Early Capital (T3)**,
  defeat or absorb the corsair and raider factions, control **3 of 4 sacred sites**
  (Olympia, Delphi, Knossos, Mt. Athos site).
- **Completion — "The Kingdom of Hellas":** the **Kingdom Stage** begins: title *Basileus*,
  `naval_warfare` researchable, **warships** unlock, Act III horizon opens, and every AI empire
  formally *notices* you (embassies arrive — diplomacy screens light up).

---

## 5. ACT III — Kingdom Stage: the Naval Age {#naval-age}

### 5.1 Naval progression (five ages)

Naval reach is the campaign's second ladder, parallel to metals (Pillar P3):

| Age | Ships | Tech | Range | Capability |
|:---:|-------|------|-------|------------|
| **0. Rafts** | Raft | `boats` | Adjacent coast only | Fishing, river/strait ferry; no open water |
| **I. Early Boats** | Pentekonter | `shipbuilding` | 1 sea zone, coast-hugging | Exploration, light transport (1 unit), first sea lanes |
| **II. Warships** | Trireme, Bireme transport | `naval_warfare` | 2 sea zones | **Naval combat (ram!)**, overseas colonization, escorts |
| **III. Advanced Ships** | Quinquereme, heavy transport | `advanced_shipbuilding` | 4 sea zones | Boarding (corvus), coastal siege, army lift (2 units/ship) |
| **IV. Deep-Sea Ships** | Grand Galleon (thalassic class) | `deep_sea_navigation` | **Unlimited** | Open-water crossing, empire trade network, 4-unit lift, all-season sailing |

**Ship stats live in** [`/data/game-data.json`](../data/game-data.json) (units) and
[`/data/campaign-mediterranean.json`](../data/campaign-mediterranean.json) (classes & ranges).

### 5.2 Sea zones (the 14 sea tiles)

The sea is tiled into **named zones** (from the real map). A fleet moves zone-to-zone; "range"
= how many zones from a friendly **Harbor**. Zones have weather: **winter storms** raise
travel risk (ties into [Seasons](12-extra-mechanics.md#seasonal-cycles)) until Age IV ships.

| # | Sea zone | Connects | Act |
|---|----------|----------|:---:|
| 1 | **Aegean Sea** | Attica ↔ Cyclades ↔ Ionia ↔ N. Aegean | III |
| 2 | **Sea of Crete** | Cyclades ↔ Crete ↔ Levantine | III |
| 3 | **Ionian Sea** | W. Greece ↔ Magna Graecia ↔ Sicily | III |
| 4 | **Adriatic Sea** | Illyria ↔ N. Italy | III |
| 5 | **Sea of Marmara** (+Bosporus/Dardanelles straits) | Aegean ↔ Black Sea; Thrace ↔ Anatolia | IV |
| 6 | **Tyrrhenian Sea** | C. Italy ↔ Sicily ↔ Sardinia/Corsica | IV |
| 7 | **Levantine Sea** (E. Mediterranean) | Cilicia ↔ Phoenicia ↔ Egypt ↔ Crete | IV |
| 8 | **Ligurian Sea** | N. Italy ↔ Gaul coast | V |
| 9 | **Gulf of Lion** | Gaul ↔ Iberia east | V |
| 10 | **Balearic Sea** | Iberia ↔ open west | V |
| 11 | **Alboran Sea** | Iberia south ↔ Mauretania (the Pillars) | V |
| 12 | **Gulf of Gabès** | Carthage ↔ Libya | V |
| 13 | **Gulf of Sidra** | Libya ↔ Cyrenaica | V |
| 14 | **Black Sea approaches** | Marmara ↔ Pontus/Dacia coasts | V |

### 5.3 Kingdom-stage reach (what Act III opens — +62 tiles)

| Region | Tiles | Why go | Threat |
|--------|:-----:|--------|--------|
| **Illyria** (Albania/Bosnia coast) | 10 | iron, timber, hardy recruits | **Illyrian Highland Despotate** (first empire war) |
| **Moesia (Bulgaria)** | 8 | gold rivers, grain plain | Thracian/Moesian tribes, Despotate influence |
| **Thrace (east) + Byzantion** | 6 | THE strait city (tolls on Marmara), vines | City-state of Byzantion (courtable!) |
| **Ionia & Lydia (W. Anatolia)** | 14 | **rich cities, gold (Pactolus), marble, dawn-iron foothills** | **Empire of Anatolia** border satraps |
| **Magna Graecia (S. Italy)** | 12 | fertile colonies, kin-cities (easier colonization) | **Italic Maritime Empire** sphere |
| **Sicily** | 8 | grain island + **Etna 🌋 (ember-iron, magma glass)** | Italic & Phoenician colonial rivalry — three-way contest |
| Sea zones | 4 | Aegean, Sea of Crete, Ionian, Adriatic | Corsairs, rival navies |

### 5.4 Overseas colonization rules (extends [08](08-colonization-and-expansion.md))

- An overseas claim requires: a **Harbor** at origin, a **transport fleet** (capacity ≥ settler
  party), a warship **escort** if the route crosses a contested/corsair zone, and the target
  within **naval range**.
- Overseas colonies substitute a **Sea Lane** (harbor-to-harbor route through controlled/safe
  zones) for the road-based supply line. A cut sea lane = the colony is **isolated** (attrition,
  unrest, no trade) — protect the lane or lose the colony.
- **Kin-colonies:** culturally Greek regions (Magna Graecia, Ionia, Sicily's Greek cities) cost
  −25% to colonize and start +10 happiness — colonization there is homecoming, not conquest.

---

## 6. ACT IV — The Advanced Mineral Age & the Iron Pantheon {#iron-pantheon}

Beyond Greece the earth is stranger. Act IV is about securing the **exotic metals** that only
exist abroad — the campaign's expression of "risk lives where reward lives."

### 6.1 The Iron Pantheon — the full named-metal ladder

The core spine (copper → bronze → iron → steel → adamantine, docs [03](03-resources-mining-and-gear.md)/[04](04-weapons-and-crafting.md))
is joined by **named iron-family variants**. Each has a **grade multiplier** (slots into the
[combat grade table](09-military-and-combat.md), extending `grade_mult` in
[`game-data.json`](../data/game-data.json)), a **home region**, and a **signature effect**.
Spellings normalized from the design notes; the weakest, **Mystic Iron**, is deliberately
*common* — every land has a little.

| # | Metal | Grade | Found / made | Region(s) | Signature effect | Act |
|:-:|-------|:-----:|--------------|-----------|------------------|:---:|
| 1 | **Mystic Iron** | 1.8 | shallow veins, **common** | everywhere (incl. Peloponnese) | The peasant's iron: workable pre-`metallurgy`, cheap, **low durability** — bridges bronze→iron | I |
| 2 | **Iron** (spine) | 2.0 | deep veins | Laconia, Arcadia, Illyria, mountains | The standard — see docs 03/04 | II |
| 3 | **Ember-Iron** | 2.15 | volcanic slopes | **Thera, Etna**, Cappadocia fringe | Weapons **burn** (bonus dmg); forging needs heat gear | II–III |
| 4 | **Frostbound Iron** | 2.15 | high cold ranges | Dacia, Balkan peaks | Units immune to *Cold-Bitten*; **winter combat bonus** | III |
| 5 | **Storm Iron** | 2.2 | sea-cliff lodes struck by storms | Ionian/Adriatic cliff coasts | **+naval combat**, +unit speed | III |
| 6 | **Verdant Iron** | 2.2 | living veins under old forests | Gaul deep woods, Epirus | Self-mending gear (**no upkeep**), +forest combat | III–V |
| 7 | **Dawn Iron** | 2.25 | east-facing sunrise ranges | Ionia/Lydia foothills, Armenia | **+morale**, negates *Fearful* on the wielder's unit | III |
| 8 | **Runic Ferrite** | 2.3 | veins threaded through **ancient ruins** | Knossos deep, Mesopotamia, Egypt ruins | **Enchantable** (accepts one rune mod); +research when forged | IV |
| 9 | **Shadowsteel** | 2.4 | crafted: iron + coal + obsidian, deep dark mines | Iberian deep mines | **Ambush/night bonus**, units harder to scout | IV–V |
| 10 | **Dragoon Steel** | 2.5 | crafted: steel + horse-country tempering | Thessaly, Iberian hills | **Cavalry-specialist**: +charge, +cavalry defense | IV |
| 11 | **Lapis Steel** | 2.55 | **crafted: lapis + iron** (`advanced_forging`) | any Foundry with lapis | Prestige metal: +culture aura from equipped units, anti-morale-shock | IV |
| 12 | **Steel** (spine) | 2.6 | crafted: iron + coal | any Foundry | The professional standard | IV |
| 13 | **Aetherium** | 2.9 | sky-touched peaks (thin-air mines) | Armenian highlands, highest Alps-edge | **Featherweight**: +move, +range for ranged units | V |
| 14 | **Void-Iron** | 3.0 | **meteor falls** (star-metal craters) | Libyan deep desert, rare world events | **Armor-piercing** (ignores part of DEF) | V |
| 15 | **Mythril** | 3.2 | legendary veins (1–2 in the world) | Cretan labyrinth deep, Iberian mother-lode | Elite light armor: heavy protection at zero speed cost | V |
| 16 | **Starforged Iron** | 3.4 | **forged: void-iron + aetherium** at the Great Forge wonder | — (crafted) | Wonder-metal: hero units, one-per-army weapons | V–VI |
| 17 | **Celestium** | 3.5 | celestial veins above the cloud-line | Cappadocian high core 🌋 | Radiant: unit projects a morale aura; temple-grade building trim | VI |
| 18 | **Adamantine** (apex) | 3.6 | **volcanic cores only** | **Cappadocia core**, Etna heart | The apex — see docs 03/04 (elite everything) | VI |

**Non-weapon exotics** (building/utility tier, same act pacing):

| Material | Source | Use |
|----------|--------|-----|
| **Magma Glass** | foreign volcanic regions (Etna, Thera deep, Cappadocia) | lenses, elite trim, exosuits (as in doc 03) |
| **Deep Crystal Ore** | rare foreign mountains (Armenia, Mesopotamian ranges) | **siege engine cores**, research instruments, high-tier buildings |

Design rules: exotic irons are **sidegrades-with-personality** between the spine metals — you
kit *specific units* for *specific fronts* (frostbound for the Dacian winter war, storm iron
marines, shadowsteel raiders), rather than replacing the ladder. Full data:
[`campaign-mediterranean.json`](../data/campaign-mediterranean.json) → `campaign_metals`.

### 6.2 What Act IV opens (+46 tiles)

| Region | Tiles | The prize | The guard |
|--------|:-----:|-----------|-----------|
| **Phrygia (C. Anatolia)** | 10 | iron, wool, roads to the core | Empire of Anatolia heartland |
| **Cappadocia volcanic core 🌋** | 10 | **ADAMANTINE**, celestium, magma glass | Anatolia's elite + heat/ash/eruptions at max |
| **Cilicia** | 4 | timber, pirate coves (clear them), pass to Levant | Corsair strongholds |
| **Central Italy** | 12 | rich cities, discipline doctrine (tech steals) | **Italic Maritime Empire** core |
| **Sardinia / Corsica** | 4+3 | silver, granite, storm-iron cliffs | Phoenician & Italic navies contest you |
| Sea zones | 3 | Tyrrhenian, Marmara, Levantine | rival fleets |

**Act IV objective:** refine **each of**: 1 exotic iron, lapis steel, magma glass — and hold a
volcanic-core tile for a full year. Completion = **Thalassocracy** stage (*Megas Basileus*),
`deep_sea_navigation` researchable, Act V horizon falls.

---

## 7. ACT V — Empire Stage: the full Mediterranean (300–400 tiles) {#empire-stage}

### 7.1 The full atlas (grand totals)

| Group | Regions (tiles) | Group total |
|-------|-----------------|:-----------:|
| **Greece (home)** | Peloponnese 60 · Central+North Greece 30 · Isles 10 | **100** |
| **Balkans** | Illyria 10 · Moesia 8 · Thrace-E 6 · **Dacia 8** | **32** |
| **Anatolia** | Ionia/Lydia 14 · Phrygia 10 · Cappadocia core 10 · **Pontus 6** | **40** |
| **Levant & Mesopotamia** | Cilicia 4 · **Syria (Damascus, Emesa) 8 · Phoenicia 6 · Judea 6 · Mesopotamia 12** | **36** |
| **Egypt & Africa** | **Nile Egypt 14 · Cyrenaica 6 · Libya/Sirte 4 · Carthage/Tunisia 10 · Numidia (Algeria) 8 · Mauretania (Morocco) 6** | **48** |
| **Italy & isles** | Magna Graecia 12 · Sicily 8 · Central Italy 12 · **Cisalpine North 8** · Sardinia 4 · Corsica 3 | **47** |
| **The Far West** | **Iberia East 10 · Iberia Central 8 · Iberia South 6 · Gaul South 8 · Gaul Central 8 · Gaul North-edge 4** | **44** |
| **Sea zones** | the 14 zones of §5.2 | **14** |
| | **GRAND TOTAL** | **361** |

(Bold = newly playable in Act V. Every region's resources/danger/owner: `campaign-mediterranean.json` → `regions`.)

Regional flavor highlights: **Nile Egypt** = river-valley super-farms (flood cycle: levees!),
massive pop capacity; **Mesopotamia** = magma glass + deep crystal + the oldest ruins
(runic ferrite), late-game reach across the Levantine routes; **Dacia** = frostbound iron +
gold; **Gaul** = verdant iron forests + the largest tribal armies; **Iberia** = shadowsteel
mines, mythril mother-lode rumor, guerrilla country; **Carthage** = the Phoenician jewel —
taking it flips western trade.

### 7.2 Empire administration (new layer, Act V)

At empire scale, per-tile micromanagement gives way to **provinces**:

- **Provinces (Themes/Satrapies):** group 2–4 regions under a **Governor** (a named notable:
  *Strategos* for border themes, *Satrap* for eastern provinces, *Exarch* for overseas ones).
- Governors have 2 traits (e.g. *Incorruptible*, *Ambitious*, *Engineer*) and set the province's
  **stance**: Develop / Extract / Fortify / Assimilate.
- **Autonomy vs. tribute slider** per province: high tribute = gold now, unrest later; high
  autonomy = stability, less income, small **secession risk** if a war goes badly.
- **Distance drain** ([08](08-colonization-and-expansion.md)) is now measured along **sea
  lanes** — a harbor network makes a sea empire *tighter* than a land one (thalassocracy!).
- **Multi-front warfare:** each simultaneous war front adds **front fatigue** (war-weariness
  multiplier) — the mechanical reason to finish wars, fortify, and use vassals/allies.
- **Empire trade network:** every pair of connected harbors adds trade income scaled by
  distance and goods diversity; the **Grand Harbor** & **Lighthouse (wonder_beacon)** multiply it.

### 7.3 Deep-sea invasion (the Act V verb)

Age IV fleets enable full **naval invasions**: embark an army (with siege train), cross open
water, land on a hostile coast (beach landing = 1-round defender bonus unless you land at a
captured/friendly port), sustained by a sea lane. Cutting the *enemy's* lanes starves their
islands and coastal cities — sea control **is** empire control.

---

## 8. ACT VI — The Eight Empires {#empires}

### 8.1 Roster

Eight AI empires (extending [doc 10](10-ai-nations-and-diplomacy.md) — campaign sets AI count
to 8) with **ancient-style polity names**. Each has a flag (procedural crest until/unless PNGs
are supplied via the [flag pipeline](../assets/flags/README.md)).

| # | Empire | Polity style | Inspiration | Personality ([10 §2](10-ai-nations-and-diplomacy.md#2-ai-personalities)) | Core lands (tiles) | First contact |
|:-:|--------|--------------|-------------|------------------|--------------------|:---:|
| 1 | **Empire of Anatolia** | Empire | Hittite / Lydian / Phrygian | Warlord–Builder | Ionia, Phrygia, Cappadocia, Pontus (**40**) | Act III |
| 2 | **Phoenician Coastal Dominion** | Dominion | Phoenician city-states | Merchant | Phoenicia + Carthage/Tunisia (**16** + trade posts everywhere) | Act III (sea) |
| 3 | **Kingdom of Kemet** | Kingdom | Late Egyptian dynasties | Builder–Zealot | Nile Egypt, Cyrenaica (**20**) | Act IV |
| 4 | **Illyrian Highland Despotate** | Despotate | Illyrian tribes | Warlord–Nomad | Illyria (**10**) + Moesian influence | **Act III (first war)** |
| 5 | **Italic Maritime Empire** | Empire | early Rome / Etruria | Builder–Merchant (militant) | Central Italy, Cisalpine, Sardinia, Corsica (**27**) | Act III–IV |
| 6 | **Iberian Hill Kingdoms** | Kingdoms (confed.) | Celtiberian tribes | Nomad (guerrilla) | Iberia E/C/S (**24**) | Act V |
| 7 | **Gaulish Grand Kingdom** | Grand Kingdom | Gallic federations | Warlord (proud) | Gaul S/C/N (**20**) | Act V |
| 8 | **Mesopotamian Imperial Satrapy** | Satrapy | Neo-Assyrian / Babylonian | Zealot–Builder (siege) | Mesopotamia, Syria (**20**) | Act V (late) |

### 8.2 Dossiers

**1. Empire of Anatolia** — *the endgame rival.* Sits on the **adamantine core**. Heavy
infantry + **war chariots** (unique: chariot line, devastating on plains, useless in mountains).
Slow, methodical expansion westward. Beat them by: winning Ionia's Greek cities to your side
(kin-colonies), mountain warfare, and racing them to Cappadocia's core.
*Unique units:* Anatolian Chariots, Core-Guard (early adamantine-grade heavies).

**2. Phoenician Coastal Dominion** — *the sea rival.* Never wants your land — wants every
**port and sea zone**. Fights with fleets, embargoes, and hired corsairs; will offer rich trade
deals right up until it strangles your lanes. Beat them by: out-shipping them (storm-iron
marines), taking **Carthage**, or making them so rich *with* you that war is unthinkable.
*Unique:* Corsair Hires, Purple Trade Fleets (double trade income).

**3. Kingdom of Kemet** — *the population colossus.* The Nile makes them the biggest pop and
food economy in the world; elite **archer corps** and river fleets defend it. Slow to anger,
nearly impossible to starve. Beat them by: sea control of the Levantine, taking the Delta
harbors, or a grand alliance — or simply out-culture them (they respect monuments).
*Unique:* Medjay Archers, Nile Flotillas, monument-building race behavior.

**4. Illyrian Highland Despotate** — *your first war.* Mountain ambushers with iron mastery;
raids your Adriatic lanes the moment Act III opens. Small but vicious — a tutorial in supply
lines, garrisons, and mountain combat. Beat them by: coastal forts + punitive expeditions into
the highlands (bring frostbound-iron kit).
*Unique:* Ambush doctrine (attacks from unscouted tiles), Highland Raiders.

**5. Italic Maritime Empire** — *the mirror.* Disciplined legions-in-embryo + serious fleets;
expands methodically down Magna Graecia toward "your" kin-cities — the natural mid-game
collision. Beat them by: winning Sicily's three-way contest, Tyrrhenian sea control, or a
partition pact with the Phoenicians (they hate each other — play it).
*Unique:* Disciplined Infantry (morale floor), Colonia founding (fast colonization).

**6. Iberian Hill Kingdoms** — *the quagmire.* A confederation, not a state: defeat one hill
king and two more rise. Forest cavalry + guerrilla raids; their **shadowsteel** mines and the
mythril rumor are the lure. Beat them by: fortress-creep (fort chains), buying kings apart
(gold + vassal offers), never marching a big slow army through the hills.
*Unique:* Guerrilla doctrine (no front lines), Shadowsteel Raiders.

**7. Gaulish Grand Kingdom** — *the host.* Enormous armies, heavy cavalry, proud kings who
respect strength and *remember insults*. Verdant-iron champions. Beat them by: prestige
diplomacy (they ally with the strong), set-piece battles you choose the ground for — or simply
never go north until you must.
*Unique:* Heavy Horse Companions, Champion duels (pre-battle morale event).

**8. Mesopotamian Imperial Satrapy** — *the old power.* The east's ancient siege-masters:
**deep crystal siege engines**, magma-glass works, tribute system radiating from the Twin
Rivers. Late-game reach into the Levant collides with yours. Beat them by: naval superiority
(they are a land power), Levantine harbor control, and counter-siege engineering.
*Unique:* Great Siege Train, Tribute Web (vassal minors fight for them).

### 8.3 Threat timeline

```
 Act:      I         II          III           IV            V             VI
           │ tribes   │ corsairs  │ ILLYRIA ⚔  │ ANATOLIA ⚔  │ all 8 active │ endgame
 pressure  │ ▁▁       │ ▂▂        │ ▄▄  ITALIC │ ▅▅ PHOENIC. │ ▆▆ coalitions│ ▇▇
           └──────────┴───────────┴─ contact ──┴─ KEMET seen ┴─ W+E fronts ─┴─────▶
```

### 8.4 Final objective — becoming the Mediterranean Empire

Any **one** path ends the campaign in victory (extends [GDD §8](GAME_DESIGN_DOCUMENT.md#8-win--loss--endgame)):

| Path | Condition |
|------|-----------|
| **Mare Nostrum** | Control all **14 sea zones** + every port region (the sea is yours — the classic thalassocratic win) |
| **Dominion** | Own or vassalize **≥ 250 of 361 tiles** |
| **The Eight Thrones** | All 8 empires defeated, vassalized, or allied-under-hegemony (`statecraft`) |
| **Golden Age** | Cultural Ascendancy conditions (GDD §8) achieved at Empire stage — win without conquering the west |

---

## 9. Naming conventions & titles {#titles}

### 9.1 Polity-type glossary (ancient-style)

Used for the player's evolving state name, AI empires, and generated minors:

| Term | Means | Used by |
|------|-------|---------|
| **Polis / City-State** | one great city + hinterland | early player, Byzantion |
| **League** | sworn confederation under a Hegemon | player after Act I |
| **Kingdom** | one crowned ruler, unified land | player Act II; Kemet |
| **Despotate** | militarized autocracy of a harsh land | Illyria |
| **Dominion** | rule through ports & trade, not land | Phoenicia |
| **Satrapy** | imperial province system radiating tribute | Mesopotamia |
| **Grand Kingdom** | federation of proud kings under a high king | Gaul |
| **Thalassocracy** | empire of the sea | player Act IV stage |
| **Empire** | many nations under one throne | Anatolia, Italic, player endgame |
| **Exarchate / Theme** | overseas/border imperial province | player Act V provinces |

### 9.2 Player title & state-name ladder

The polity's **name auto-evolves** (player can override at each stage, like the capital rename):

| Stage | Auto state name | Ruler title | Reached at |
|:-----:|-----------------|-------------|------------|
| 0 | Chiefdom of the Morea | **Archon** | start |
| 1 | *\<Capital\>*, a Free Polis | Archon | capital T2 |
| 2 | The Peloponnesian League | **Hegemon** | Act I complete |
| 3 | Kingdom of Hellas | **Basileus** | Act II complete |
| 4 | Thalassocracy of the Hellenes | **Megas Basileus** | Act IV complete |
| 5 | **The Mediterranean Empire** *(player names it)* | **Autokrator** | Act V/VI |

*(Flavor easter egg: refusing to expand past Act I renames you the "Despotate of the Morea"
and unlocks a defensive-tall achievement.)*

### 9.3 Settlement name banks (extends the [name generator](14-formulas-and-data-appendix.md#name-generator))

Greek-style banks for campaign settlements: prefixes *Nea-, Kalli-, Mega-, Palaio-*, roots
*-polis, -ion, -ea, -os, -inthos*, epithets *"…on-the-Sea", "…of-the-Isthmus"*. Foreign colonies
blend banks (a Greek colony in Iberia: *"Emporion Nea"*). Full banks in the campaign data file.

---

## 10. Integration notes (campaign vs. core systems)

When the Mediterranean campaign is active:

| System | Change |
|--------|--------|
| [01 Worldgen](01-world-and-tiles.md) | Replaced by the **authored map** (`campaign-mediterranean.json`); generic worldgen remains for Skirmish mode |
| Map growth | Acts add tiles via **Beyond the Horizon** (§1.1); tile data model unchanged |
| [02 Capital tiers](02-capital-and-flags.md) | Unchanged; acts reference tiers as gates (§2.2) |
| [03/04 Materials](03-resources-mining-and-gear.md) | Spine unchanged; **Iron Pantheon** exotics added (§6.1); *adamantine* is the apex metal's canonical name |
| [06 Tech](06-technology.md) | +4 naval techs (`shipbuilding`, `naval_warfare`, `advanced_shipbuilding`, `deep_sea_navigation`) |
| [07 Buildings](07-city-building.md) | +Shipyard, Great Harbor, Sea Fort (in `game-data.json`) |
| [09 Military](09-military-and-combat.md) | +ship units; naval combat = same resolution model with zone terrain; `grade_mult` extended per §6.1 |
| [10 AI](10-ai-nations-and-diplomacy.md) | AI count = **8 named empires** + scripted minors; personalities as mapped in §8.1 |
| [12 Seasons](12-extra-mechanics.md) | Mediterranean climate: mild coastal winters, **storm season** for sea zones, Nile flood cycle |
| Victory | Campaign victories of §8.4 replace/extend GDD §8 |

---

### Cross-references
- Systems this campaign instantiates: every doc 01–14 (see §10 table)
- Machine-readable campaign data: [`/data/campaign-mediterranean.json`](../data/campaign-mediterranean.json)
- Enemy-empire flags: [flag pipeline](../assets/flags/README.md) (PNGs can be supplied per empire)
