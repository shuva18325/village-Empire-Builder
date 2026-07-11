# Flag Assets — drop your PNGs here

This folder holds the **flag artwork** for the game. You (the user) provide the PNGs; the game
lists every flag that has **both** a PNG here **and** a matching entry in
[`/data/flags.json`](../../data/flags.json). No code change is needed per flag — the flag list
is **data-driven**.

Design & integration details live in
**[docs/02 — Capital & Flags](../../docs/02-capital-and-flags.md)**.

---

## The 5-step drop-in pipeline

```
STEP 1  Export each flag as a PNG.
STEP 2  Name it   flag_<id>.png       (id = lower_snake_case, unique)
STEP 3  Put it in this folder  (assets/flags/)
STEP 4  Add a matching object to  data/flags.json  with the SAME "id"
STEP 5  (Build phase) It auto-appears on the Flag Selection screen.
```

## File requirements

| Property | Recommended | Notes |
|----------|-------------|-------|
| Format | **PNG** | Transparent background preferred (falls back to solid) |
| Aspect ratio | **5:3** (e.g. 512×320, 640×384) | Matches flag/banner rendering |
| Size | ≤ 500 KB each | Keep the repo light |
| Naming | `flag_<id>.png` | e.g. `flag_ember_crown.png` → id `ember_crown` |
| Color | Colorblind-friendly if possible | Distinguishable from AI flags on the map |

Optional companion art (nice-to-have, not required):
- `flag_<id>_banner.png` — a tall banner crop for tile banners.
- `flag_<id>_icon.png` — a tiny square crop for unit tokens / diplomacy chips.
If these aren't provided, the engine derives them from the main PNG.

## The registry link

Each PNG must have a twin entry in [`/data/flags.json`](../../data/flags.json) providing the
**name, symbolism, bonuses, and flavor** (schema in
[docs/02 §7](../../docs/02-capital-and-flags.md#7-flag-data-model-what-each-flag-holds)). Example:

```jsonc
{
  "id": "ember_crown",
  "name": "The Ember Crown",
  "png": "assets/flags/flag_ember_crown.png",
  "symbolism": "A crown of flame over black stone — mastery of the volcano and the forge.",
  "flavor": "Raised first by the smiths who dared the burning slopes.",
  "culture_tag": "industrious",
  "bonuses": { "culture": 0, "morale": 5, "military": 3, "special": "mining_heat_resist_+5%" },
  "unlock": "always",
  "variant_of": null
}
```

## Current status — 6 flags integrated ✅

The user supplied five historical flag designs (as images); they were recreated as **faithful
vector art** and rasterized to the PNGs in this folder, plus one unlockable variant:

| PNG | Flag | Source design |
|-----|------|---------------|
| `flag_imperial_eagle.png` | The Imperial Eagle | Byzantine/Athonite double-headed eagle, gold field, sword + **globus cruciger** |
| `flag_imperial_eagle_royal.png` | The Imperial Eagle (Porphyrogennetos) | Same, framed in Tyrian purple (T3 variant) |
| `flag_labarum.png` | The Labarum | Chi-Rho monogram, gold on red |
| `flag_holy_cross.png` | The Holy Cross | White flared cross on red |
| `flag_vergina_sun.png` | The Sun of Vergina | 16-ray Macedonian star, gold on red |
| `flag_eternal_ankh.png` | The Eternal Ankh | Gold ankh on deep river-red |
| `flag_descending_dove.png` | The Descending Dove | Gold dove stooping, on imperial purple |
| `flag_crimson_eagle.png` | The Crimson Eagle | Blood-red displayed eagle on cloth-of-gold |
| `flag_elder_rune.png` | The Elder Rune | Single gold rune on purple |
| `flag_ringed_cross.png` | The Ringed Cross | Gold ringed cross w/ four bezants, on red |

- **Registry:** every flag has its entry (name, symbolism, bonuses, flavor) in
  [`/data/flags.json`](../../data/flags.json).
- **Vector sources:** editable SVGs live in [`svg/`](svg/); they are the authoritative art
  sources. [`generate_flags.py`](generate_flags.py) rebuilds every PNG+SVG
  (`pip install cairosvg`, then `python3 generate_flags.py`).
- **Overriding with your own art:** drop a PNG with the same filename over any of these and it
  simply replaces the recreation — the registry entry keeps working unchanged.
