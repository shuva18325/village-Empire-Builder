# 02 — Capital Evolution & the Flag System

> Your capital is both your home base and your **scoreboard**. It evolves through five named
> tiers, each a milestone across every subsystem. Your **flag** is your civilization's
> identity — chosen from PNGs you provide — and it spreads visibly across the world as you grow.

**Related:** [Master GDD §5](GAME_DESIGN_DOCUMENT.md#5-macro-progression--village-to-civilization) ·
[City Building](07-city-building.md) · [Population](05-population-and-happiness.md) ·
[Flag registry `/data/flags.json`](../data/flags.json) · [Flag assets](../assets/flags/README.md)

---

## Part A — Capital Evolution

### 1. The five tiers

```
  T1 Primitive     T2 Organized      T3 Early         T4 Developed      T5 GRAND
     Village    ─▶   Settlement   ─▶   Capital    ─▶     Capital    ─▶    CAPITAL
   ┌─────────┐     ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │  ⛺ ⛺   │     │ 🏠 🏠   │      │ 🏛 🏠🏠 │      │ 🏛🏛🏰   │      │ 🏰👑🏛🏛 │
   │  ⛺      │     │ 🏠 ⛺   │      │ 🏠🏠🏠  │      │ 🏠🏠🏠🏠 │      │ 🏠🏠🏠🏠🏠│
   └─────────┘     └─────────┘      └─────────┘      └─────────┘      └─────────┘
   tents, a fire   wood houses,     brick & stone,   walls, forts,    wonders, plaza,
                   a palisade,      a keep, market,   grand districts, monuments,
                   YOUR FLAG,       RENAME CAPITAL    volcano reach    civilization tier
                   first colony
```

Each tier changes the **capital tile's sprite/skyline**, unlocks new buildings & decrees, and
raises soft caps (pop, influence, garrison). Advancing is a **celebrated event** (auto-pause,
fanfare, a *"An Age Begins"* modal, a temporary happiness/growth buff).

### 2. Tier requirement tables

Requirements are **AND-gates** across systems (Pillar P3). Numbers are tunable; the *shape* —
"you must grow on many axes at once" — is the design intent.

#### T1 → T2 : Primitive Village → Organized Settlement
| Requirement | Value |
|-------------|-------|
| Total population | ≥ 25 |
| Distinct building **types** built | ≥ 3 (e.g. House, Granary, Hunter's Lodge) |
| Tech researched | `farming` |
| Tiles claimed (incl. capital) | ≥ 2 |
| Happiness (capital) | ≥ 40% |
| Stored food buffer | ≥ 5 days |
| **Unlocks** | **Choose your Flag**, roads, first colony, palisade walls, seasons UI |

#### T2 → T3 : Organized Settlement → Early Capital
| Requirement | Value |
|-------------|-------|
| Total population | ≥ 120 |
| Tech researched | `metallurgy` (implies `mining`, `architecture`) |
| Colonies founded | ≥ 1 |
| Buildings | an **Armory** + a **Market** + a Culture building |
| Capital Development Level | ≥ 30 |
| Happiness | ≥ 45% |
| **Unlocks** | **Rename the capital**, barracks/armies, brick buildings, refine flag, basic diplomacy |

#### T3 → T4 : Early Capital → Developed Capital
| Requirement | Value |
|-------------|-------|
| Total population | ≥ 400 |
| Tech researched | `engineering` + `volcanic_extraction` |
| A claimed **volcano or volcanic-slope** tile | ≥ 1 |
| Colonies / developed tiles | ≥ 3 |
| Buildings | a **Fort**, a **University**, a **Foundry** (steel) |
| Capital Development Level | ≥ 55 |
| Military | a standing army ≥ 3 detachments |
| **Unlocks** | forts everywhere, advanced diplomacy (alliances/vassals), steel-tier, aqueducts |

#### T4 → T5 : Developed Capital → **Grand Capital**
| Requirement | Value |
|-------------|-------|
| Total population | ≥ 1000 |
| Tech researched | `adamantine_refinement` (top of the tree) |
| Developed tiles (DL ≥ 45) | ≥ 6 |
| Buildings | a **Grand Plaza** + at least **1 Wonder** |
| Adamantine refined (lifetime) | ≥ 50 |
| Happiness | ≥ 55% sustained (no unrest for 1 year) |
| **Unlocks** | civilization-tier decrees, elite (adamantine) units, endgame victory checks |

### 3. Auto-generated capital name & renaming

- At **T1**, the capital is auto-named from a **flavor generator**: `{Prefix}{Root}{Suffix}`
  drawing on terrain + a seeded word list, e.g. *"Stonehearth"*, *"Cliffwold"*, *"Rvenmark"*,
  *"Ashford"*. It is shown with a subtle *"(unnamed — expand to rename)"* hint.
- **Renaming unlocks at T3 (Early Capital).** A rename prompt appears as part of the tier-up
  celebration. The player can rename **once for free**, then again anytime via the capital
  panel (a small Influence cost to discourage spam).
- The capital name propagates to save files, diplomacy screens, and the flag banner.

Name-generator word bank + rules: [Formulas & Data Appendix](14-formulas-and-data-appendix.md#name-generator).

### 4. What each tier changes (at a glance)

| Aspect | T1 | T2 | T3 | T4 | T5 |
|--------|----|----|----|----|----|
| Capital sprite | Tents | Wood town | Brick keep | Walled city + fort | Grand skyline + wonders |
| Pop soft cap (capital) | 40 | 120 | 350 | 700 | 1500+ |
| Flag | none | **choose** | refine | fixed | ceremonial variants |
| Rename | no | no | **yes** | yes | yes |
| Decree slots | 1 | 2 | 3 | 4 | 5 (civilization decrees) |
| Diplomacy | none | contact only | basic | alliances/vassals | hegemony options |
| Best weapon tier reachable | bone/stone | copper | iron/steel | steel | **adamantine** |

---

## Part B — The Flag System

The flag is your civilization's **visual identity and a small mechanical bonus**. You provide
the artwork (PNGs); the game presents your flags as selectable options with names, symbolism,
bonuses, and flavor.

### 5. When & how the player chooses a flag

- **Unlocks at T2 (Organized Settlement).** A one-time **Flag Selection screen** opens as part
  of the T2 celebration. The player can also open it later from the capital panel.
- At **T3 (Early Capital)** the player may **refine** the choice (swap flag, or unlock a
  "royal variant" of the same flag) — representing the civilization maturing.
- Choosing a flag is **free the first time**; later changes cost a little **Influence** and
  trigger a brief *"A New Banner"* happiness event (positive if morale is high, mixed if low).

### 6. Where the flag appears (Pillar P1 — the map tells your story)

| Location | Rendering |
|----------|-----------|
| **Capital tile** | Flag flies on the keep; largest, animated wave |
| **Connected/owned tiles** | Small **banner** on tiles linked by road/supply line |
| **Military units** | Each detachment carries the flag on its unit token & in combat |
| **Diplomacy screens** | Your flag vs. the AI nation's flag, side by side |
| **Colonies & forts** | Flag on the settlement icon; contested tiles show *two* flags |
| **Loading/summary/victory screens** | Full-size flag with civilization name |

```
   Owned-tile banner example (map view):
   ┌────┬────┬────┐
   │,, ⚑│♣♣ ⚑│,,  │   ⚑ = your flag banner on road-connected owned tiles
   ├────┼────┼────┤       (fades in as the road/supply line completes)
   │,, ⚑│[⚑⚑]│~~  │   [⚑⚑] = capital, big flag
   └────┴────┴────┘
```

### 7. Flag data model (what each flag holds)

Every flag is one entry in [`/data/flags.json`](../data/flags.json), paired with a PNG in
[`/assets/flags/`](../assets/flags/). Schema:

```jsonc
{
  "id": "ember_crown",                 // matches PNG file flag_ember_crown.png
  "name": "The Ember Crown",
  "png": "assets/flags/flag_ember_crown.png",
  "symbolism": "A crown of flame over black stone — mastery of the volcano and the forge.",
  "flavor": "Raised first by the smiths who dared the burning slopes; a promise that this
             people bends fire to its will.",
  "culture_tag": "industrious",        // ties into cultural traits (see doc 12)
  "bonuses": {                          // small, flavorful — never mandatory to win
    "culture":  0,
    "morale":   5,                      // % or flat — see §8
    "military": 3,
    "special":  "mining_heat_resist_+5%"// optional keyed special effect
  },
  "unlock": "always",                   // always | tier:T3 | achievement:<id>  (gating, optional)
  "variant_of": null                    // for royal/ceremonial variants at T3
}
```

**Required per your brief — each flag includes:** a **name**, a **symbolism explanation**, an
**optional bonuses** block (culture / morale / military / special), and **historical/cultural
flavor**. All four are first-class fields above.

### 8. Flag bonuses (kept small & optional)

Flag bonuses are **spice, not strategy-defining** — so the flag you *like* is never a trap.
Guidelines:

| Bonus type | Field | Typical range | Applies to |
|------------|-------|---------------|------------|
| **Culture** | `bonuses.culture` | +0 … +6% | culture generation, festival potency |
| **Morale** | `bonuses.morale` | +0 … +6% | happiness floor, combat morale |
| **Military** | `bonuses.military` | +0 … +5% | unit attack **or** defense |
| **Special** | `bonuses.special` | keyed effect | one themed perk (e.g. `mining_heat_resist_+5%`, `birth_rate_+3%`, `trade_income_+5%`) |

**Balance rule:** total "power budget" per flag ≤ **10 points** (where 1% ≈ 1 point and a
special ≈ 3–5 points). If you provide flags with different themes, we tag each so choices feel
distinct without being unbalanced.

### 9. The Flag Selection screen (UI)

```
  ┌──────────────────────────── CHOOSE YOUR BANNER ────────────────────────────┐
  │                                                                            │
  │   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐          │
  │   │ [PNG]  │   │ [PNG]  │   │ [PNG]  │   │ [PNG]  │   │  + ??  │   ← locked │
  │   │ Ember  │   │ Green  │   │ Silver │   │ Twin   │   │ (tier) │            │
  │   │ Crown  │   │ Vale   │   │ Wolf   │   │ Rivers │   │        │            │
  │   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘          │
  │      ▲ selected                                                            │
  │  ┌──────────────────────────────────────────────────────────────────┐    │
  │  │  THE EMBER CROWN                                    culture +0     │    │
  │  │  "A crown of flame over black stone — mastery of the  morale  +5   │    │
  │  │   volcano and the forge."                             military +3  │    │
  │  │  Flavor: Raised first by the smiths who dared the      special:    │    │
  │  │  burning slopes…                                     +5% heat resist│   │
  │  └──────────────────────────────────────────────────────────────────┘    │
  │                                   [ Preview on map ]   [ CONFIRM BANNER ]  │
  └────────────────────────────────────────────────────────────────────────────┘
```

- **Only flags whose PNG exists** in `/assets/flags/` are shown. Missing art → the slot is
  hidden (or shown as a "coming soon" placeholder if flagged in the registry).
- **Locked flags** (`unlock: "tier:T3"` etc.) appear greyed with the unlock condition.
- **"Preview on map"** temporarily stamps the flag on the capital + connected tiles so the
  player sees it in context before confirming.

### 10. How to add your flag PNGs (the drop-in pipeline)

You said you'll supply the flag PNGs. Here is the exact contract (also in
[`/assets/flags/README.md`](../assets/flags/README.md)):

```
STEP 1  Export each flag as PNG, ideally 512×320 (5:3), transparent or solid bg, < 500 KB.
STEP 2  Name it   flag_<id>.png     e.g.  flag_ember_crown.png   (id = lower_snake_case)
STEP 3  Drop it into  assets/flags/
STEP 4  Add a matching object to  data/flags.json  with the same "id" and the fields in §7.
STEP 5  (Build phase) The game auto-lists every flag that has BOTH a registry entry AND a PNG.
```

No code change is needed per flag — the flag list is **data-driven**. Add art + a JSON row and
it appears in-game.

### 10.1 Current flag roster (v0.2 — integrated ✅)

The user supplied five historical flag designs; they were recreated as faithful vector art
(PNG + editable SVG in [`/assets/flags`](../assets/flags/README.md)) and registered in
[`/data/flags.json`](../data/flags.json), plus one tier-gated variant:

| Flag | Field & charge | Culture tag | Bonuses (headline) | Unlock |
|------|----------------|-------------|--------------------|--------|
| **The Imperial Eagle** | Gold; crowned double-headed eagle with sword & **globus cruciger** | aggressive | +3 mil, +2 cul, −5% claim cost | always |
| **The Labarum** | Red; gold Chi-Rho monogram | devout | +4 morale, +5% battle morale | always |
| **The Holy Cross** | Red; white flared cross | peaceful | +3 morale, +3 mil, +5% garrison def | always |
| **The Sun of Vergina** | Red; gold 16-ray star | aggressive | +4 mil, +5% conquest morale | always |
| **The Eternal Ankh** | River-red; gold ankh | peaceful | +2 cul, +2 morale, **+6% birth rate** | always |
| **Imperial Eagle (Porphyrogennetos)** | Gold, ringed in Tyrian purple | aggressive | +3 mil, +3 cul, −5% claim cost | **tier:T3** |

### 11. AI nations also have flags

Each rival AI nation is assigned a flag too (from a reserved pool or procedurally colored
crests), shown on their tiles, units, and in diplomacy. This keeps the map legible — every
banner on the map tells you *whose* it is at a glance. See
[AI Nations & Diplomacy](10-ai-nations-and-diplomacy.md).

---

### Cross-references
- Tier-up requirements draw on nearly every doc — see the [system map](GAME_DESIGN_DOCUMENT.md#9-system-map--how-everything-connects).
- Buildings that gate tiers → [07 City Building](07-city-building.md)
- Flag bonuses tie to cultural traits → [12 Extra Mechanics](12-extra-mechanics.md#cultural-traits)
