# Empire Builder — Playable Build (Phases P0–P2 + warfare slice)

**Act I: The Peloponnese.** The skeleton of the game from the GDD, playable in a browser.

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

Deliberately deferred (next phases): tech tree & metallurgy (P4), full weapon tiers &
armory (P3/P4), mining tool ladder & hazards (P3), AI nations that expand (P5), naval
Act II+ (P5/P6), disasters/religion/holidays (P7).

## Files

```
game/
├── index.html      shell & panels
├── style.css       UI theme
├── data.js         the 60-tile map, buildings, factions, starts, flags, decrees
├── game.js         simulation core (DOM-free — testable headless)
├── map.js          canvas renderer + picking
├── ui.js           HUD, panels, modals, main loop
└── test-smoke.js   headless test:  node game/test-smoke.js
```

## Testing

```
node game/test-smoke.js       # 40+ assertions across every system
```

Balance constants live at the top of `data.js` (`CONST`) — tune there, per the GDD's
"balance is data" rule.
