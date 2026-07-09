# 10 — AI Nations & Diplomacy

> You are not alone on the map (Pillar P5). Rival tribes and nations explore, expand, fight,
> trade, and react to your growth. This document defines the AI opponents, their behavior, and
> the diplomacy system that lets you ally, trade, or war with them.

**Related:** [World & Tiles](01-world-and-tiles.md) · [Military](09-military-and-combat.md) ·
[Colonization](08-colonization-and-expansion.md) · [Capital & Flags §11](02-capital-and-flags.md#11-ai-nations-also-have-flags)

---

## 1. The other players

The world seeds **2–4 rival AI nations** (tunable) in Skirmish mode, each starting as a small
tribe like you and growing over the game. They occupy the map's other regions and compete for
the same finite tiles and rare resources.

> **Campaign note:** the Mediterranean Campaign instead fields **8 named empires** (Empire of
> Anatolia, Phoenician Coastal Dominion, Kingdom of Kemet, Illyrian Highland Despotate, Italic
> Maritime Empire, Iberian Hill Kingdoms, Gaulish Grand Kingdom, Mesopotamian Imperial Satrapy)
> plus scripted minor factions — full dossiers in
> [doc 15 §The Eight Empires](15-mediterranean-campaign.md#empires). The personality system
> below powers them all.

Each AI nation has:
| Attribute | Meaning |
|-----------|---------|
| **Flag & name** | Its identity on the map/units/diplomacy (see [02 §11](02-capital-and-flags.md#11-ai-nations-also-have-flags)) |
| **Personality** | Its behavioral archetype (§2) |
| **Cultural trait** | Aggressive / peaceful / industrious / etc. (ties to [12](12-extra-mechanics.md#cultural-traits)) |
| **Capital tier** | It evolves T1→T5 like you — a visible rival scoreboard |
| **Territory & army** | Tiles it owns, forces it fields |
| **Opinion of you** | A −100…+100 relationship score driving its stance |

---

## 2. AI personalities

Personality shapes how an AI expands and how it treats you. (These are archetypes; a nation
blends a primary + secondary.)

| Personality | Expands by | Diplomacy tendency | Watch out for |
|-------------|-----------|--------------------|---------------|
| **Warlord** | Conquest, raiding | Demands tribute, quick to war | Early rushes; keep borders defended |
| **Merchant** | Trade wealth, buying influence | Loves trade deals & alliances | Out-teching you via gold; peaceful but sneaky |
| **Builder** | Tall, developed cities | Prefers non-aggression, wary | Becomes a late-game juggernaut if ignored |
| **Zealot** | Culture/faith spread | Allies with co-believers, shuns others | Culture victory race; belief clashes |
| **Nomad** | Wide, mobile, opportunistic | Fickle, follows advantage | Grabs legendary/rare tiles fast |

The AI **reacts to your growth**: rapid expansion makes Warlords nervous (and hostile), impresses
Merchants (trade offers), and provokes competition for rares. Reaching a new capital tier can
trigger AI responses (congratulations, envy, coalitions against a runaway leader).

---

## 3. AI behavior loop (what the AI actually does)

On its planning cadence (roughly each season/year), each AI evaluates and acts:

```
  ASSESS (its needs, your threat, rivals, resources)
     │
     ▼
  EXPAND  ── claim/colonize/develop nearby tiles (same pipeline as you, doc 08)
  RESEARCH ── climb its own tech tree
  BUILD/ARM ── grow economy & army per personality
  DIPLOMACY ── send offers/threats to you & other AIs (§4)
  WAR ── if opportunity/personality says so, attack (weak, rich, or rival targets)
  REACT ── respond to your actions (broken deals, border pushes, your tier-ups)
```

The AI competes for **legendary/rare tiles** and can **beat you to the volcano** — a real race.
It also fights *other AIs*, so the geopolitical map shifts on its own (Pillar P5).

---

## 4. Diplomacy actions

Diplomacy scales with your capital tier ([02](02-capital-and-flags.md)): **contact** at T2,
**basic** deals at T3, **alliances/vassals** at T4 (needs `statecraft`), **hegemony** at T5.

| Action | Effect | Cost/requirement |
|--------|--------|------------------|
| **Open contact / envoy** | Establish relations, exchange map info | Reach the AI (scouting/adjacency) |
| **Trade deal** | Exchange resources/gold on a recurring basis | Mutual benefit; Trade Post/roads help |
| **Gift** | One-off resource/gold gift → +opinion | The gift itself |
| **Non-aggression pact** | Both agree not to attack for N years | +opinion, mutual consent |
| **Alliance** | Mutual defense, shared vision, coordinated war | High opinion + `statecraft` |
| **Research/tech exchange** | Trade tech (roadmap: deeper tech trading) | Trust, parity |
| **Demand / ultimatum** | Extract tribute or a tile under threat | Military leverage; hurts opinion |
| **Declare war** | Begin hostilities | War weariness at home; casus belli helps |
| **Peace / vassalize** | End a war on terms (tribute, tiles, vassal status) | Battlefield leverage |
| **Denounce / coalition** | Rally AIs against a common threat | Diplomatic standing |

### 4.1 Opinion drivers
```
opinion += trades, gifts, shared enemies, kept promises, aligned culture/faith, alliances
opinion −= border friction, broken deals, competing for the same tiles, denouncements,
           being a runaway leader, differing belief (for Zealots)
```
Opinion sets the AI's **stance**: Friendly → Neutral → Wary → Hostile → At War.

---

## 5. Trade

- **Resource & gold trade** helps both sides specialize: sell your surplus obsidian for their
  grain, buy iron you lack, etc.
- **Trade routes** (via Trade Post + roads/caravans, and boats for coastal AIs) generate ongoing
  **gold** and **food variety** (happiness). Routes can be **raided** in war.
- The **Merchant** AI leans hard on trade; good trade relations can keep a powerful neighbor
  peaceful and profitable.

---

## 6. War with nations

War uses the [Military](09-military-and-combat.md) systems. Diplomatic layer specifics:
- **Casus belli:** having a reason (border disputes, broken pacts, defense of an ally) reduces
  war-weariness penalties and diplomatic fallout.
- **War goals:** take specific tiles, force tribute, vassalize, or eliminate. Peace is negotiated
  around these.
- **Coalitions:** if you snowball, AIs may **gang up** — a natural late-game difficulty ramp and
  a reason to use diplomacy, not just force.
- **Vassals:** a defeated nation can become a **vassal** (pays tribute, follows your wars) rather
  than being annexed tile-by-tile — a path to the Conquest/Hegemony victory.

---

## 7. Diplomacy screen (UI)

```
  ┌──────────────────────── DIPLOMACY ────────────────────────┐
  │  YOU ⚑ Ashford            vs.        ⚑ The Iron Pact       │
  │  Grand Capital (T5)                   Developed (T4)        │
  │  Opinion: ▓▓▓▓▓▓░░░░  +38 (Friendly)   Personality: Builder │
  │  Status: Non-Aggression (4 yrs left)   Culture: Industrious │
  │ ──────────────────────────────────────────────────────────│
  │  [ Trade… ]  [ Gift ]  [ Alliance ]  [ Demand ]  [ War! ]   │
  │  Recent: +you gifted iron  −border friction at t_7_3        │
  │  Their armies: 2 known   Their known tech: Steel            │
  └────────────────────────────────────────────────────────────┘
```

The AI's **flag** is always shown opposite yours — every negotiation is two banners facing off
(Pillar P1).

---

## 8. AI difficulty & fairness

- **No hard cheating** by default: the AI plays the same rules (same pipeline, tech, economy).
  Difficulty scales via AI **count, aggression, and small economic multipliers**, not by giving
  it free armies from fog.
- **Rubber-banding (optional/roadmap):** coalitions and envy mechanics already provide a soft
  catch-up so a runaway player faces rising resistance without feeling cheated.
- AIs should feel **characterful** (their personality is legible in their actions) — a Warlord
  neighbor plays very differently from a Merchant one, giving each game a different political shape.

---

### Cross-references
- Fighting them → [09 Military & Combat](09-military-and-combat.md)
- Racing them for tiles → [08 Colonization](08-colonization-and-expansion.md)
- Their flags/identity → [02 Capital & Flags](02-capital-and-flags.md)
- Cultural traits driving personalities → [12 Extra Mechanics](12-extra-mechanics.md#cultural-traits)
