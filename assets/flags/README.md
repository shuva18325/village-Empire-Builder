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

## Current status

- **PNGs in this folder:** _none yet_ — awaiting your artwork.
- **Registry:** [`/data/flags.json`](../../data/flags.json) already contains **example entries**
  (with placeholder art paths) so the pipeline and UI can be built and tested before real art
  arrives. Replace/extend those entries to match your PNGs.

> Tip: when you send the PNGs, also tell me each flag's intended **name, symbolism, bonuses, and
> flavor** and I'll populate `data/flags.json` for you. If you don't specify bonuses, I'll assign
> small balanced ones (≤10 power budget per flag — see docs/02 §8).

## `.gitkeep`

A `.gitkeep` file keeps this folder in version control while it's empty. It can be removed once
real PNGs are added.
