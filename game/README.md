# Empire Builder — Playable Build (Phases P0–P5)

**Acts I–V: Hellas & the Middle Sea.** The game from the GDD, playable in a browser: survive
& unite the 60-tile Peloponnese (Act I), march north and **unify all Greece** (Act II), open
the sea with iron/lapis/obsidian hulls (Act III), reach the **Mineral Age** (Act IV) and rise
to the **Empire Age** (Act V) — contending with **8 rival empires** that expand, wage war and
answer diplomacy across a **162-tile**, real-geography Mediterranean. Five map modes
(Normal · Political · Population · Resource · Naval), a **stability** economy (food retired),
a 24-tech tree, dynastic flags and capital tiers T1–T3.

**One-file build:** `node game/build-single.js` → `game/dist/empire-builder-hellas.html`
(everything inlined; open it anywhere or publish it as an artifact).

## How to run

No build step, no dependencies — plain HTML/JS:

```
open game/index.html          # macOS
xdg-open game/index.html      # Linux
# or just double-click index.html, or serve the repo root:  npx serve .
```

> Open from the **repo root** (keep the folder structure) — the flag images load from
> `../assets/flags/`.

## What's in this slice

| System | Doc | Status |
|--------|-----|--------|
| Authored 60-tile Peloponnese map, 11 regions, region seats | [15 §3](../docs/15-mediterranean-campaign.md) | ✅ |
| 7 selectable starts (Sparta, Corinth, Kalamata, Nafplio, Argos, Mani, Monemvasia) | 15 §3.2 | ✅ |
| Fog-of-war + scouting (risk rolls, ambushes) | 01 §6 | ✅ |
| Explore → **Claim** (influence) → **Colonize** (settlers) → **Develop** (DL 0–100) → **Roads** | 08 | ✅ |
| Population: 5 job groups, births/deaths, food buffer, housing caps | 05 | ✅ |
| **Happiness** (variety/shelter/safety/culture/festivals) + status effects (Well-Fed, Overworked, Fearful, Heroic, Prosperous) | 05 | ✅ |
| 13 buildings incl. **Breeding Hub**, Granary, Shrine, Palisade, Watchtower, Barracks | 07 | ✅ |
| Seasons (farming/hunting/births modifiers; winter bites) | 12 | ✅ |
| Decrees: Encourage Families · Festival · Conscription | 05 §5 | ✅ |
| Tribes: Arcadian Hill Clans, Isthmus Brigands, Free Clans of Mani, Argive Remnant (absorbable) + raids | 15 §3.3 | ✅ |
| **Tile warfare**: recruit (metal arms soldiers), attack camps, terrain/fortress defense, faction collapse | 09-lite | ✅ |
| Capital tiers T1→**T2** + **flag choice** (your real PNGs) with banners on connected tiles | 02 | ✅ |
| **Act I victory**: unite ≥54 tiles + all 11 region seats → "The League Assembles" | 15 §3.4 | ✅ |
| Save/load (browser localStorage) | — | ✅ |
| **P3 · Mining tool ladder** (stone→copper→bronze→iron→lapis→obsidian; gates ore depth, yield, hazard) | 03 | ✅ |
| **P3 · Ore→ingot→gear chains** (Smelter, Bloomery, Kiln, Crucible Forge, Forge, Tool Workshop) | 03/04 | ✅ |
| **P3 · Mid-game minerals** (copper, tin, iron, bronze, lapis, obsidian) + **Mani volcanic zones** | 03 | ✅ |
| **P3 · Mining hazards** (cave-in, toxic fumes, volcanic ash, heat exhaustion, tunnel collapse) scaling w/ depth & tool | 03 | ✅ |
| **P3 · Weapon & armor tiers** (militia→copper→bronze→iron→lapis→obsidian: power/def/morale/siege) | 04/09 | ✅ |
| **P3 · Economy** (Trade Depots + caravans, Resource Market buy/sell, Metal Storage caps, tile trade bonuses) | 07 | ✅ |
| **P3 · Mid-game navy** (Shipyard/Harbor; iron/lapis/obsidian hulls → overseas reach) | 15 §5 | ✅ |
| **P3 · Map expansion to 162 tiles** (Greece full, Balkans, Asia Minor, S. Italy, Sicily, Iberia) w/ naval gating | 15 | ✅ |
| **Map renovation**: real-coastline Mediterranean (Peloponnese prongs, Gulf of Corinth, Crete, Italy+Sicily, Adriatic, Anatolia) with region colours, coastline strokes, shallow-water halo & atlas labels | 11/15 | ✅ |
| **P4 · Tech tree**: 24 techs in 8 branches (Mining · Forging · Naval · Agriculture · Culture · Warfare · Housing · Trade) gating buildings, tools, gear & ships | 06 | ✅ |
| **P4 · Acts**: Act I unite the Peloponnese → Act II **unify Greece** → Act III the sea opens (naval branch locked until Hellas is one) → final "Hellas United" | 15 | ✅ |
| **P4 · Capital tiers T1–T3**: Early → Developed (flag/dynasty choice) → **Grand Capital · Porphyrogennetos** (purple-framed banner, Elite Guard, wonders) | 02 | ✅ |
| **P4 · Dynastic flags**: 10 banners, each a house — Palaiologos, Constantine, Komnenos, Argead, Ptolemy, Rurik, Asen, Dulo, Nemanjić, Lascaris | 02 | ✅ |
| **P4 · Culture & festivals**: culture resource, Amphitheater/Archive/Great Hall/Artisan District/Shrine of Kings, Festivals of Heroes · the Forge · the Sea | 12 | ✅ |
| **P5 · 8 rival empires**: Anatolia, Phoenician Dominion, Italic Empire, Illyrian Despotate, Iberian Hill Kingdoms — each a dynasty holding real homelands, expanding & warring by AI | 15 | ✅ |
| **P5 · Diplomacy**: gift · cultural exchange · trade pact · non-aggression · defensive pact · alliance · threaten (tribute-or-war) · declare war · sue for peace, driven by opinion (dynasty, culture, strength, border friction, tribute, shared enemies, festivals) | 10 | ✅ |
| **P5 · Stability economy** (food **retired**): sustenance coverage + stability 0–100 from happiness · housing · culture · festivals · tier · granaries − wars − war exhaustion − tribute pressure; drives births, development, combat morale & rebellion | 05 | ✅ |
| **P5 · Five map modes**: Normal · **Political** (reference-atlas cyan sea / tan land / empire colour bands + dynasty crests + labelled sea zones) · **Population** (8-step violet→imperial-purple gradient, gold-ringed capitals) · Resource · Naval | 01 | ✅ |
| **P5 · Empire economy & warfare**: naval tolls, trade income, tribute, blockades, gifts; frontline invasions, naval descents, sieges (×0.55 on strongholds), capital raids, elimination on last tile | 09/15 | ✅ |
| **P5 · Acts IV–V**: Act III sea → Act IV **Mineral Age** (navy + iron tools) → Act V **Empire Age** (Grand Capital + 3 overseas) → victory **"Master of the Middle Sea"** | 15 | ✅ |

Deliberately deferred (Phase 6+ hooks stubbed in `data.js` as `P6_HOOKS`): the **full
400-tile Mediterranean**, the volcano/adamantine & advanced-mineral system (magma glass,
deep crystal, lapis steel), the distant empires' homelands (Kemet, Gaul, Mesopotamia),
capital T4–T5, and advanced holidays.

## Files

```
game/
├── index.html      shell & panels
├── style.css       UI theme
├── data.js         the 162-tile map, buildings, factions, starts, flags, empires, diplomacy, acts
├── game.js         simulation core (DOM-free — testable headless)
├── map.js          canvas renderer + picking (5 map modes)
├── ui.js           HUD, panels, diplomacy, modals, main loop
├── build-single.js one-file bundler → dist/empire-builder-hellas.html
└── test-smoke.js   headless test:  node game/test-smoke.js
```

## Testing

```
node game/test-smoke.js       # 100 assertions across every system, incl. Phase 5 empires
```

Balance constants live at the top of `data.js` (`CONST`) — tune there, per the GDD's
"balance is data" rule.
