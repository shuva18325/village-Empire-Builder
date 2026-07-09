# 11 — Visual & UI System

> How the player *sees* and *touches* the game. This document is the screen inventory, HUD,
> panels, iconography, and ASCII mockups. The guiding principle is **Pillar P1: the map tells
> your story** — the interface should make progress legible at a glance.

**Related:** every system doc (this renders them). Especially
[World & Tiles](01-world-and-tiles.md), [Capital & Flags](02-capital-and-flags.md), [Population](05-population-and-happiness.md).

---

## 1. Art direction (brief)

- **Style:** clean, warm, semi-stylized top-down — readable icons over realism. Cozy in the
  early game, grand and monumental by the endgame.
- **Readability first:** terrain, ownership (flags), danger, and hazards must be distinguishable
  at a glance and colorblind-safe (shape + color, never color alone).
- **Diegetic progress:** the *same tile* visibly grows from tents → town → city as DL rises;
  the capital sprite steps through the five tiers; roads and banners spread. The player should
  be able to *see* how far they've come without reading a number.
- **Feedback:** every action has a clear visual/audio response (build puffs, banner unfurls,
  eruption screen-shake, festival fireworks, tier-up fanfare).

---

## 2. Screen inventory

| Screen | Purpose | Doc |
|--------|---------|-----|
| **World Map** (main) | The tile grid; primary play space | [01](01-world-and-tiles.md) |
| **Tile Info Panel** | Selected-tile details & actions | [01](01-world-and-tiles.md) |
| **City / Tile Overview** | Zoomed building view of one settlement | [07](07-city-building.md) |
| **Population Management** | Assign job groups, see status effects | [05](05-population-and-happiness.md) |
| **Tech Tree** | Research selection & progress | [06](06-technology.md) |
| **Flag Selection** | Choose/refine your banner | [02](02-capital-and-flags.md) |
| **Military / Army** | Recruit, equip, form & move armies | [09](09-military-and-combat.md) |
| **Diplomacy** | Deal with AI nations | [10](10-ai-nations-and-diplomacy.md) |
| **Decrees / Policy** | Enact leadership decrees | [05](05-population-and-happiness.md) |
| **Codex / Help** | In-game reference to all systems | — |
| **Event Modals** | Disasters, tier-ups, battles, festivals | [12](12-extra-mechanics.md) |

---

## 3. The main World Map screen (HUD)

```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ ⚑ ASHFORD  ·  Early Capital (T3)      🍖 Food ▓▓▓▓▓░ +12/d   😊 Happy 58%       │  ← TOP BAR
 │ 👥 Pop 412 (idle 6⚠)  🪵420 🪨310 ⛏Iron 44 💰300  🔬RP 18/d  🌤 Spring, Yr 7   │    (civ vitals)
 ├──────────────────────────────────────────────────────────────┬──────────────────┤
 │                                                              │  TILE INFO PANEL │
 │   ┌────┬────┬────┬────┬────┬────┐                            │  ┌──────────────┐│
 │   │,,⚑ │♣♣⚑ │,,  │▲▲🔒│░░🔒│ ?? │   ⚑ owned+road banner      │  │ t_4_1 Mountain││
 │   ├────┼────┼────┼────┼────┼────┤   🔒 locked terrain (tech) │  │ Iron ●●● Coal●●││
 │   │,,⚑ │[⚑⚑]│,,⚑ │♣♣  │🌋 │ ?? │   [⚑⚑] capital             │  │ Danger 2 ⚔    ││
 │   ├────┼────┼────┼────┼────┼────┤   ?? fogged                │  │ Pop 0 / cap 8 ││
 │   │~~  │,,⚑ │∩∩  │▲▲  │▒▒☠ │ ?? │   ☠ hazard icon           │  │ ─────────────││
 │   └────┴────┴────┴────┴────┴────┘                            │  │ [Scout][Claim]││
 │                                                              │  │ [Colonize]    ││
 │  [Map] [Cities] [Pop] [Tech] [Army] [Diplo] [Decrees]        │  │ [Build ▸]     ││
 │   ⏸ ▶ ▶▶ ▶▶▶  speed        🔔 3 alerts                       │  └──────────────┘│
 └──────────────────────────────────────────────────────────────┴──────────────────┘
```

**HUD zones:**
- **Top bar** — civilization vitals: capital name + tier + flag, food/happiness, population,
  key stockpiles, research rate, season/year. Anything critical (food shortage, unrest) turns
  **red and pulses**.
- **Map** — the tile grid with fog, ownership banners, roads, hazards, danger, and unit tokens.
- **Tile Info Panel** (right) — appears on tile select; shows all fields + context actions.
- **Bottom bar** — screen tabs, speed controls, and the **alert feed** (🔔).
- **Overlays** (toggle): danger heatmap, resource overlay, supply/road network, ownership,
  happiness — each recolors the map to answer one question.

---

## 4. Tile Info Panel (expanded)

```
 ┌──────────── TILE: t_5_2 ────────────┐
 │ Volcanic Slope 🌋   Danger 4 ☠      │
 │ Owner: You ⚑   DL 22 (Village)      │
 │ Hazards: ≋ heat3  ∴ ash2  ☁ smoke1  │
 │ ─────────── RESOURCES ───────────── │
 │  obsidian ●●●  lapis ●●  magma_glass●│
 │  (adamantine: none here — core only)│
 │ ─────────── POPULATION ──────────── │
 │  Pop 14 / cap 18   Miners 8 Hunters2│
 │  ⚠ 3 miners Heat-Stressed 🥵 (no gear)
 │ ─────────── BUILDINGS ───────────── │
 │  Mine Lv2 · Palisade · Hunter Lodge │
 │  + 2 free slots                     │
 │ ─────────── ACTIONS ──────────────── │
 │ [Build▸][Assign▸][Road▸][Garrison]  │
 │ [Craft heat gear ⚠ recommended]     │
 └─────────────────────────────────────┘
```

Every field from the [tile data model](01-world-and-tiles.md#2-anatomy-of-a-tile-the-data-model)
is surfaced here, with **contextual warnings** (⚠) that double as calls-to-action.

---

## 5. City / Tile Overview (zoomed)

Double-clicking a settlement zooms into a **building view** of that tile — the classic
city-builder screen where you place/upgrade buildings in slots and watch the settlement grow.

```
 ┌──────────────── ASHFORD (Capital · T3) ────────────────┐
 │  DL 48 ▓▓▓▓▓░░░  Pop 210/350   Happiness 61% 😊        │
 │   🏛      🏠🏠     ⚒         🌾🌾                        │
 │  Keep    Houses  Forge      Farms      [+ slot]         │
 │   📚      🏪      ⛩         🏰                          │
 │  Library Market  Temple     Walls      [+ slot]         │
 │ ──────────────────────────────────────────────────────│
 │  Districts: Academic◎  Market◎  Sacred○                │
 │  [ Build ▸ ]  [ Upgrade ▸ ]  [ Assign workers ▸ ]      │
 └────────────────────────────────────────────────────────┘
```

---

## 6. Population Management screen

Shows the job-group allocation (from [05](05-population-and-happiness.md#12-assigning-population))
plus a **status-effect ledger** so the player sees *why* happiness is where it is.

```
 ┌───────────────── POPULATION ─────────────────┐
 │ Total 412  Idle 6⚠  Growth +3.1/day 📈       │
 │ Group      Count  Skill   Assigned tiles      │
 │ Farmers     150   ●●●○   Capital, Delta       │
 │ Miners       70   ●●○○   Iron Hills, Slope    │
 │ Builders     60   ●●●○   (build queue x3)     │
 │ Hunters      40   ●●●●   Great Herd           │
 │ Soldiers     50   ●●○○   Fort, Capital        │
 │ Scholars     36   ●●○○   University           │
 │ ───────────── STATUS EFFECTS ──────────────── │
 │ 🍖 Well-Fed (Capital)      +happy, +births    │
 │ 🥵 Heat-Stressed (Slope) ⚠ −health  [fix gear]│
 │ ✨ Inspired (Capital)      +culture (2 days)  │
 │ [ Auto-balance ] [ Decrees ▸ ] [ Priorities ] │
 └───────────────────────────────────────────────┘
```

---

## 7. Tech Tree screen {#tech-tree-screen}

See the mockup in [Technology §6](06-technology.md#6-research-pacing--the-tech-ui). Columns are
eras; nodes are cards (cost, prereqs, unlock icons); current research shows a progress bar +
ETA; locked nodes are greyed with tooltips explaining the gate.

---

## 8. Mining hazard indicators

Because hazard survival is core (Pillar P2), hazards get **loud, specific UI**:

| Indicator | Where | Meaning |
|-----------|-------|---------|
| `≋` heat badge (orange) | tile + miner tokens | Heat zone; shows intensity 1–5; red if workers unprotected |
| `∴` ash badge (grey) | tile (dims the tile art) | Ash zone; −vision; farms flagged |
| `☁` smoke badge | tile | Smoke; −morale |
| `☠` toxic badge (green) | tile | Toxic fumes; sickness risk |
| `※` unstable badge | mine UI | Collapse risk; shows crew safety % |
| **Tremor bar** | volcano tile + top bar | Eruption imminent (countdown); pulses red |
| **Gear check chip** | miner assignment UI | ✔/✘ per required gear (pick, heat, mask, shoring) |

A miner sent into a hazard **without** the right gear gets a persistent ⚠ with a one-click
**"craft/equip gear"** shortcut — the UI teaches the mechanic.

---

## 9. Alerts & the notification feed

The 🔔 feed (bottom bar) surfaces time-sensitive events, color-coded by severity:

| Severity | Examples |
|----------|----------|
| 🔴 Critical (auto-pause) | Eruption imminent, invasion, starvation, unrest/riot, tier-up ready |
| 🟠 Warning | Food buffer low, idle workers, node depleting, gear missing, army out of supply |
| 🔵 Info | Building complete, research done, migration wave, trade offer, festival soon |

Clicking an alert **jumps the camera** to the relevant tile/screen and offers the fix action.

---

## 10. Controls

| Input | Action |
|-------|--------|
| Left-click tile | Select → Tile Info Panel |
| Double-click settlement | Zoom to City Overview |
| Right-click | Context menu (quick build/assign/move) |
| Drag | Pan map; drag on army = set move order |
| Scroll | Zoom |
| Space | Pause/unpause |
| `1–4` | Speed (pause/1×/2×/3×) |
| Tab hotkeys | `M`ap `C`ities `P`op `T`ech `A`rmy `D`iplo |
| `O` | Cycle map overlays (danger/resource/supply/happiness) |
| `Esc` | Back / close panel |

Design goal: **mouse-sufficient** (fully playable with mouse), keyboard-accelerated for pros.

---

## 11. Onboarding & readability aids

- **Guided first hour:** contextual tips fire as systems unlock (first hunt, first mine, first
  claim, choosing a flag, first eruption) — teaching by doing, not walls of text.
- **"Why?" tooltips:** hover any stat (happiness, growth, yield) to see its **contributing
  factors** (the formula, humanized) — so the sim is never a black box.
- **Overlays over menus:** answer spatial questions ("where's the danger? where's the iron?")
  by recoloring the map, not by opening tables.
- **Codex:** a searchable in-game encyclopedia mirroring these design docs (terrain, resources,
  units, tech, status effects).

---

## 12. UI implementation notes (for the build)

- **Data-driven panels:** panels render from the same data model in
  [`/data/game-data.json`](../data/game-data.json) — add a building/tech/unit in data and it
  appears in the UI without bespoke screens.
- **Flags are assets:** the flag on the capital/units/diplomacy is the PNG from
  [`/assets/flags`](../assets/flags/README.md), tinted/waved by the renderer.
- **Scalable art:** each tile has art variants per DL band + per terrain + per hazard overlay,
  composited at runtime (base terrain → buildings → hazards → banner → unit tokens).
- **Accessibility:** colorblind-safe palettes, shape-coded icons, adjustable text size, full
  pause-any-time, and no reflex-dependent actions.

---

### Cross-references
- Everything shown here is defined in docs [01](01-world-and-tiles.md)–[10](10-ai-nations-and-diplomacy.md) & [12](12-extra-mechanics.md).
- Flag rendering → [02 Capital & Flags](02-capital-and-flags.md)
- The data the UI reads → [`/data/game-data.json`](../data/game-data.json)
