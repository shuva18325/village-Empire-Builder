# Village → City → Civilization — *Empire Builder*

> A single-player 4X / grand-strategy city-builder where you guide **one tiny village**
> on a **~100-tile world** all the way to a **Grand Capital** ruling a civilization —
> mining volcanic adamantine, forging elite armies, managing population and happiness,
> and out-maneuvering rival AI nations.

**Working title:** *Empire Builder* (rename in-game once you reach the capital-naming tier).
**Genre:** 4X · City-Builder · Grand Strategy · Survival-Economy hybrid.
**Perspective:** Top-down hex/tile map + zoomed city view.
**Target:** Desktop-first (web + native), mouse-driven, keyboard shortcuts.

---

## What this repository is

This repo currently holds the **complete Game Design Document (GDD)** for the game.
It is written so that the actual game can be built from it in a series of follow-up
prompts/sessions ("we can build the final game in 1–3 prompts or more"). Everything is
intentionally modular so we can **add systems later** without rewriting the core.

Nothing here is final — the GDD is a living document. Treat every number as a
**tunable balance constant**, not a law.

## How to read the docs

Start at **[`docs/GAME_DESIGN_DOCUMENT.md`](docs/GAME_DESIGN_DOCUMENT.md)** — it is the
master index, vision, design pillars, and the core gameplay loop. Every subsystem then
lives in its own numbered file so it can grow independently:

| # | Document | Covers |
|---|----------|--------|
| — | [GAME_DESIGN_DOCUMENT.md](docs/GAME_DESIGN_DOCUMENT.md) | Vision, pillars, core loop, glossary, index |
| 01 | [World & Tiles](docs/01-world-and-tiles.md) | Terrain, resources, fog-of-war, hazards, animals, legendary tiles |
| 02 | [Capital & Flags](docs/02-capital-and-flags.md) | 5-tier capital evolution, renaming, the flag system + PNG integration |
| 03 | [Resources, Mining & Gear](docs/03-resources-mining-and-gear.md) | Full material taxonomy, pickaxe tiers, hazard mining, worker gear |
| 04 | [Weapons & Crafting](docs/04-weapons-and-crafting.md) | Tribal → adamantine weapon tree, crafting buildings, recipes |
| 05 | [Population & Happiness](docs/05-population-and-happiness.md) | Pop groups, growth, status effects, decrees |
| 06 | [Technology](docs/06-technology.md) | Full tech tree, eras, costs, unlocks |
| 07 | [City Building](docs/07-city-building.md) | Building catalog, districts, upgrade chains, material costs |
| 08 | [Colonization & Expansion](docs/08-colonization-and-expansion.md) | Claim → colonize → develop pipeline, roads & supply lines |
| 09 | [Military & Combat](docs/09-military-and-combat.md) | Units, armies, supply, the combat resolution model |
| 10 | [AI Nations & Diplomacy](docs/10-ai-nations-and-diplomacy.md) | Rival AI, personalities, trade, war, reputation |
| 11 | [Visual & UI](docs/11-visual-and-ui.md) | Screen inventory, ASCII mockups, HUD, iconography |
| 12 | [Extra Mechanics](docs/12-extra-mechanics.md) | Seasons, disasters, culture, religion, migration, festivals |
| 13 | [Future Roadmap](docs/13-future-roadmap.md) | Holiday/festival ideas, backlog, phased build plan |
| 14 | [Formulas & Data Appendix](docs/14-formulas-and-data-appendix.md) | Every formula, balance constants, progression charts, sample run |
| 15 | [The Mediterranean Campaign](docs/15-mediterranean-campaign.md) | **The shipped campaign**: Peloponnese (60 tiles) → Greece (100) → Mediterranean Empire (300–400), naval ages, the Iron Pantheon metals, 8 rival empires |

## Repo layout

```
village-Empire-Builder/
├── README.md                      ← you are here
├── LICENSE
├── docs/                          ← the Game Design Document (living)
│   ├── GAME_DESIGN_DOCUMENT.md    ← master index / start here
│   └── 01 … 15 section files      (15 = the Mediterranean Campaign)
├── assets/
│   └── flags/                     ← the 6 integrated flag PNGs + SVG sources + generator
│       └── README.md
└── data/                          ← machine-readable seed data for the future build
    ├── flags.json                 ← flag registry (name, symbolism, bonuses)
    ├── game-data.json             ← resources, buildings, units, tech seed tables
    └── campaign-mediterranean.json← authored campaign: acts, regions, metals, empires
```

## Flags — integrated ✅

Six flags are live (recreated as faithful vector art from the user-supplied designs, PNG +
editable SVG): **The Imperial Eagle** (+ Porphyrogennetos variant), **The Labarum**,
**The Holy Cross**, **The Sun of Vergina**, **The Eternal Ankh**. Each has name, symbolism,
bonuses, and flavor in [`data/flags.json`](data/flags.json).

To add or override a flag: drop `flag_<id>.png` into `assets/flags/` and add/edit its entry in
`data/flags.json` — see [`assets/flags/README.md`](assets/flags/README.md). Full system:
**[Capital & Flags](docs/02-capital-and-flags.md)**.

## Status

| Area | State |
|------|-------|
| Game Design Document | ✅ Complete pass (14 system docs) |
| **Mediterranean Campaign** | ✅ Designed ([doc 15](docs/15-mediterranean-campaign.md) + [campaign data](data/campaign-mediterranean.json)) |
| Flags | ✅ 6 integrated (PNG + SVG + registry) |
| Seed data (`data/`) | ✅ Core + campaign tables |
| **Playable build (P0–P2)** | ✅ **[`game/`](game/README.md)** — open `game/index.html`: Peloponnese map, fog, population/happiness, buildings (incl. Breeding Hub), expansion, tribes & tile warfare, T2 + flags, Act I victory |
| Later phases (P3–P8) | ⏳ Mining/tech/AI nations/naval — see [roadmap](docs/13-future-roadmap.md) |

## License

MIT — see [LICENSE](LICENSE).
