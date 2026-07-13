// ============================================================================
// EMPIRE BUILDER — P0-P2 slice data
// The authored Peloponnese map (60 land tiles, 11 regions) + building/faction/
// flag definitions. Mirrors docs/15 §3 and data/campaign-mediterranean.json.
// All numbers are tunable balance constants (docs/14).
// ============================================================================
window.DATA = (function () {

  const CONST = {
    GRID_W: 29, GRID_H: 19, TILE: 34,
    DAY_MS: 1100,                    // real ms per game day at 1x
    DAYS_PER_SEASON: 15,
    SEASONS: ['Spring', 'Summer', 'Autumn', 'Winter'],
    SEASON_FARM: { Spring: 1.1, Summer: 1.3, Autumn: 1.0, Winter: 0.15 },
    SEASON_HUNT: { Spring: 1.0, Summer: 1.0, Autumn: 1.2, Winter: 0.8 },
    SEASON_BIRTH: { Spring: 1.15, Summer: 1.0, Autumn: 1.0, Winter: 0.8 },
    BASE_BIRTH: 0.02, BASE_DEATH: 0.008,
    FOOD_PER_POP: 1.0, SOLDIER_FOOD: 0.15,
    FOOD_CAP_BASE: 220, GRANARY_CAP: 120,
    INFLUENCE_BASE: 1.0,
    CLAIM_BASE: 10, CLAIM_PER_DIST: 3,
    COLONIZE_POP: 8, COLONIZE_WOOD: 40, COLONIZE_FOOD: 30,
    ROAD_STONE: 10, ROAD_DAYS: 2,
    SOLDIER_CAP_BASE: 5, BARRACKS_CAP: 10,
    VICTORY_TILES: 54,
    // --- Phase 3: economy & mining ---
    ORE_CAP_BASE: 80, INGOT_CAP_BASE: 60, METAL_STORAGE_CAP: 120,
    REFINE_RATE: 3,               // ore -> ingot per refining building per day
    CARAVAN_GOLD: 0.8,            // gold per connected settlement per trade depot per day
    MARKET_SELL: 0.5, MARKET_BUY: 2.0,  // gold per unit sell / buy
  };

  // --- terrain -------------------------------------------------------------
  const TERRAIN = {
    plains: { name: 'Plains',   col: '#c9b876', popCap: 8, def: 1.0, farm: true },
    grass:  { name: 'Grassland',col: '#a9c069', popCap: 8, def: 1.0, farm: true },
    forest: { name: 'Forest',   col: '#5f8f57', popCap: 6, def: 1.2, hunt: true, lumber: true },
    hills:  { name: 'Hills',    col: '#b09a6a', popCap: 6, def: 1.3, hunt: true, mine: true },
    mtn:    { name: 'Mountain', col: '#8d8577', popCap: 4, def: 1.4, hunt: true, mine: true },
  };

  // --- buildings (P0-P2 set; costs from docs/07, slice-simplified) ----------
  // out: {res, perWorker} · workers use the named job pool
  const BUILDINGS = {
    house:        { name: 'House',            icon: '🏠', cost: { wood: 20 },            days: 2, dl: 3, popCap: 5,  tip: '+5 population capacity, shelter.' },
    breeding_hub: { name: 'Breeding Hub',     icon: '👶', cost: { wood: 35 },            days: 3, dl: 3, birthMult: 1.15, tip: '+15% birth rate (nursery & family hall). Stacks up to 3.' },
    farm:         { name: 'Farm',             icon: '🌾', cost: { wood: 20 },            days: 2, dl: 3, job: 'farmer', slots: 3, out: { res: 'sust', per: 3.0 }, needs: 'farm',   tip: 'Farmers sustain the people (season-dependent) — feeds STABILITY & growth. Plains/grassland.' },
    hunters_lodge:{ name: "Hunter's Lodge",   icon: '🏹', cost: { wood: 15 },            days: 1, dl: 2, job: 'hunter', slots: 2, out: { res: 'sust', per: 2.2 }, needs: 'hunt',   tip: 'Hunters sustain the people. Forest/hills/mountain.' },
    granary:      { name: 'Granary',          icon: '🛖', cost: { wood: 25, stone: 15 }, days: 2, dl: 3, stabAdd: 2, winterSust: 8, tip: '+2 stability (reserves) and +8 sustenance through winter.' },
    lumber_camp:  { name: 'Lumber Camp',      icon: '🪓', cost: { wood: 10 },            days: 1, dl: 2, job: 'builder', slots: 2, out: { res: 'wood', per: 2.0 }, needs: 'lumber', tip: 'Builders cut wood. Forest only.' },
    quarry:       { name: 'Quarry',           icon: '⛏️', cost: { wood: 25 },            days: 2, dl: 3, job: 'miner', slots: 2, out: { res: 'stone', per: 1.5 }, needs: 'mine',   tip: 'Miners cut stone. Hills/mountain.' },
    market:       { name: 'Market',           icon: '🏪', cost: { wood: 30, stone: 20 }, days: 3, dl: 4, job: 'builder', slots: 1, out: { res: 'gold', per: 2.0 }, tip: 'Trade income (×1.5 on ports). +0.3 influence/day.' },
    shrine:       { name: 'Shrine',           icon: '⛩️', cost: { wood: 15, stone: 10 }, days: 2, dl: 3, happy: 4, influence: 0.4, tip: '+happiness, +0.4 influence/day.' },
    palisade:     { name: 'Palisade',         icon: '🛡️', cost: { wood: 30 },            days: 2, dl: 2, defMult: 1.4, tip: 'Tile defense ×1.4 vs raids & attacks.' },
    watchtower:   { name: 'Watchtower',       icon: '🗼', cost: { wood: 25, stone: 15 }, days: 2, dl: 3, watch: true, tip: 'Halves raid chance on this region; reveals neighbors.' },
    barracks:     { name: 'Barracks',         icon: '⚔️', cost: { wood: 40, stone: 30 }, days: 3, dl: 4, soldierCap: CONST.BARRACKS_CAP, tip: 'Recruit & house soldiers (+10 soldier cap).' },
    village_center:{name: 'Village Center',   icon: '🏛️', cost: {},                      days: 0, dl: 5, popCap: 10, auto: true, tip: 'Heart of a settlement.' },
    // --- Phase 3: mining / refining / forging (Phase 4 adds tech gates) ---
    mine:         { name: 'Mine',             icon: '⚒️', cost: { wood: 25, stone: 20 }, days: 3, dl: 4, tech: 'mining1', job: 'miner', slots: 3, mines: true, needs: 'mine', tip: 'Miners dig the ORES on this tile (copper/tin/iron/lapis/obsidian). Tool tier gates depth & yield; deep/volcanic ores risk HAZARDS.' },
    smelter:      { name: 'Smelter',          icon: '🔥', cost: { stone: 25, wood: 15 }, days: 3, dl: 4, tech: 'forge1', refine: { in: ['copper_ore','tin_ore'], out: { copper_ore: 'copper', tin_ore: 'tin' } }, tip: 'Ore → Ingot: smelts copper & tin ore into ingots each day.' },
    bloomery:     { name: 'Bloomery',         icon: '🔩', cost: { stone: 30, wood: 15 }, days: 3, dl: 4, tech: 'forge1', refine: { in: ['iron_ore'], out: { iron_ore: 'iron' } }, tip: 'Ore → Ingot: smelts IRON ore into iron blooms.' },
    kiln:         { name: 'Kiln',             icon: '🏺', cost: { stone: 20, wood: 20 }, days: 2, dl: 3, tech: 'forge3', refine: { in: ['lapis_ore','obsidian_ore'], out: { lapis_ore: 'lapis', obsidian_ore: 'obsidian' } }, tip: 'Works LAPIS & OBSIDIAN ore into refined stones for tools, elite gear & ship reinforcement.' },
    crucible_forge:{name: 'Crucible Forge',   icon: '⚗️', cost: { stone: 40, iron: 10 }, days: 4, dl: 5, tech: 'forge2', alloy: true, tip: 'Alloy: 2 copper + 1 tin → 2 BRONZE per day. Needed for bronze tools & troops.' },
    forge:        { name: 'Forge',            icon: '⚒️', cost: { stone: 40, iron: 15 }, days: 4, dl: 5, tech: 'forge2', forge: true, tip: 'Ingot → Weapon/Armor: lets you EQUIP soldiers to metal tiers (copper → obsidian) in the Army panel.' },
    tool_workshop:{name: 'Tool Workshop',     icon: '🛠️', cost: { wood: 30, stone: 20 }, days: 3, dl: 4, tech: 'mining1', toolshop: true, tip: 'Ingot → Tools: craft the next PICKAXE tier (stone→copper→bronze→iron→lapis→obsidian) for deeper mining & fewer hazards.' },
    // --- Phase 3: economy ---
    trade_depot:  { name: 'Trade Depot',      icon: '🐫', cost: { wood: 30, stone: 20 }, days: 3, dl: 4, tech: 'trade1', caravan: true, tip: 'Caravan hub: earns gold per road-connected settlement. Build several & connect them.' },
    resource_market:{name: 'Resource Market', icon: '⚖️', cost: { wood: 30, stone: 25 }, days: 3, dl: 4, tech: 'trade1', market: true, tip: 'Buy & sell resources for gold (Trade panel). Ports trade at better rates.' },
    metal_storage:{name: 'Metal Storage',     icon: '🗄️', cost: { stone: 40, wood: 20 }, days: 2, dl: 3, oreCap: 120, tip: '+120 storage for ores & ingots (they overflow fast without it).' },
    // --- Phase 3: naval (Phase 4: gated behind Greece unification + Shipwright tech) ---
    harbor:       { name: 'Harbor',           icon: '🚢', cost: { wood: 40, stone: 25 }, days: 3, dl: 4, tech: 'naval1', needs: 'coast', harbor: true, tip: 'Coastal only. Enables sea trade & is the launch point for overseas ventures.' },
    shipyard:     { name: 'Shipyard',         icon: '⚓', cost: { wood: 50, stone: 30 }, days: 4, dl: 5, tech: 'naval1', needs: 'coast', shipyard: true, tip: 'Coastal only. Build ships (Navy panel). Metal-reinforced hulls reach overseas lands.' },
    // --- Phase 4: cultural buildings ---
    amphitheater: { name: 'Amphitheater',     icon: '🎭', cost: { stone: 45, wood: 20 }, days: 4, dl: 5, tech: 'cult1', happy: 6, cultureOut: 0.8, rp: 0.4, tip: '+6 happiness · +0.8 culture & +0.4 research/day. The people gather.' },
    archive:      { name: 'Archive',          icon: '📜', cost: { wood: 30, stone: 30 }, days: 3, dl: 4, tech: 'cult2', rp: 1.0, tip: '+1.0 research/day — the memory of the state.' },
    great_hall:   { name: 'Great Hall',       icon: '🏰', cost: { stone: 60, wood: 30 }, days: 5, dl: 6, tech: 'cult2', happy: 4, cultureOut: 0.6, rp: 0.3, tip: '+4 happiness · +0.6 culture/day. Where the mighty feast.' },
    artisan_district:{name:'Artisan District',icon: '🏺', cost: { wood: 40, stone: 30, copper: 5 }, days: 4, dl: 5, tech: 'cult3', cultureOut: 0.4, goldOut: 1.0, tip: '+1 gold & +0.4 culture/day; +5% production. Craft becomes art.' },
    shrine_of_kings:{name:'Shrine of Kings',  icon: '👑', cost: { stone: 80, gold: 40, lapis: 3 }, days: 6, dl: 8, tech: 'cult3', tier: 3, happy: 8, cultureOut: 1.5, rp: 0.5, influence: 1.0, tip: 'Grand Capital only: +8 happiness, +1.5 culture, +1 influence/day. A wonder.' },
    stone_houses: { name: 'Stone Houses',     icon: '🏛️', cost: { stone: 45, wood: 15 }, days: 3, dl: 4, tech: 'house1', popCap: 8, tip: '+8 population capacity — masonry housing.' },
    aqueduct:     { name: 'Aqueduct',         icon: '🌊', cost: { stone: 70 }, days: 5, dl: 6, tech: 'house3', happy: 6, popCap: 5, tip: '+6 happiness · +5 pop capacity. Clean water for the city.' },
  };

  // --- jobs ------------------------------------------------------------------
  const JOBS = ['farmer', 'hunter', 'builder', 'miner', 'soldier'];

  // --- the 60-tile Peloponnese (traced from the real coastline) ----------------
  // Grid is a stylized Mediterranean: Peloponnese ~cols 11-19 rows 8-17, with the
  // Gulf of Corinth (row 7 sea) above, the Isthmus at (18,8), three southern
  // prongs (Messenia / Mani / Malea-Vatika) and Kythira off the SE tip.
  // [col,row,terrain,{c:coastal, port, seat, nm:name, sacred, camp, ore, rich}]
  const REGION_SPECS = [
    { id: 'achaea', name: 'Achaea', danger: 1, res: 'fish · berries · timber', faction: null, tiles: [
      [12,8,'plains',{c:1,port:1,seat:1,nm:'Patras'}],[13,8,'grass',{c:1}],[14,8,'plains',{c:1}],
      [15,8,'plains',{c:1}],[13,9,'hills',{}],[14,9,'forest',{}] ]},
    { id: 'corinthia', name: 'Corinthia', danger: 1, res: 'trade tolls · clay · twin ports', faction: 'brigands', factionTiles: [[16,8],[18,9]], tiles: [
      [16,8,'hills',{c:1,camp:1}],[17,8,'plains',{c:1}],[18,8,'plains',{c:1,nm:'The Isthmus'}],
      [15,9,'hills',{}],[16,9,'plains',{}],[17,9,'plains',{c:1,port:1,seat:1,nm:'Corinth'}],[18,9,'hills',{c:1,camp:1}] ]},
    { id: 'elis', name: 'Elis', danger: 1, res: 'grain · horses · the Sacred Games', faction: null, tiles: [
      [12,9,'plains',{c:1}],[11,10,'plains',{c:1}],[12,10,'grass',{}],[11,11,'plains',{c:1}],
      [12,11,'grass',{}],[13,11,'grass',{sacred:1,seat:1,nm:'Olympia'}],[12,12,'plains',{c:1}],[13,12,'forest',{}] ]},
    { id: 'arcadia', name: 'Arcadia', danger: 3, res: 'wood · stone · game · deep iron', faction: 'clans', tiles: [
      [13,10,'forest',{}],[14,10,'mtn',{ore:1}],[15,10,'mtn',{camp:1}],
      [14,11,'hills',{}],[15,11,'mtn',{camp:1,seat:1,nm:'Tegea'}],[14,12,'mtn',{camp:1,ore:1}] ]},
    { id: 'argolis_argos', name: 'Argolis — Argos', danger: 1, res: 'grain · culture · the old line', faction: 'argive', tiles: [
      [16,10,'grass',{}],[17,10,'hills',{}],[16,11,'plains',{}],[17,11,'plains',{camp:1,seat:1,nm:'Argos'}] ]},
    { id: 'argolis_nafplio', name: 'Argolis — Nafplio', danger: 1, res: 'trade · strong walls', faction: null, tiles: [
      [18,10,'hills',{c:1}],[19,10,'hills',{c:1}],[18,11,'plains',{c:1,port:1,seat:1,nm:'Nafplio'}],[19,11,'hills',{c:1}] ]},
    { id: 'messenia', name: 'Messenia', danger: 1, res: 'grain surplus · olives · fish', faction: null, tiles: [
      [12,13,'plains',{c:1}],[13,13,'grass',{}],[14,13,'forest',{}],[12,14,'plains',{c:1}],
      [13,14,'plains',{c:1,port:1,seat:1,nm:'Kalamata'}],[12,15,'plains',{c:1,nm:'Pylos'}],[13,15,'plains',{c:1}] ]},
    { id: 'laconia', name: 'Laconia', danger: 2, res: 'copper · tin · iron · stone', faction: null, tiles: [
      [16,12,'mtn',{ore:1,nm:'Mt. Taygetos'}],[17,12,'hills',{ore:1}],[16,13,'plains',{seat:1,nm:'Sparta'}],
      [17,13,'hills',{}],[16,14,'plains',{c:1}],[17,14,'hills',{c:1}],[17,15,'hills',{c:1}] ]},
    { id: 'mani', name: 'Mani', danger: 3, res: 'lapis · obsidian · proud clans', faction: 'mani', tiles: [
      [15,12,'mtn',{ore:1,rich:1}],[15,13,'hills',{c:1}],
      [15,14,'mtn',{c:1,camp:1,seat:1,nm:'Areopoli'}],[15,15,'mtn',{c:1,sacred:1,nm:'Cape Tainaron'}] ]},
    { id: 'vatika', name: 'Vatika / Monemvasia', danger: 2, res: 'salt · quartz · the rock fortress', faction: null, tiles: [
      [18,13,'hills',{c:1}],[19,13,'hills',{c:1}],[18,14,'hills',{c:1,port:1,seat:1,nm:'Monemvasia',fortress:1}],[18,15,'plains',{c:1,nm:'Cape Malea'}] ]},
    { id: 'kythira', name: 'Kythira Strait', danger: 1, res: 'fish · pearls · the way to Crete', faction: null, island: true, tiles: [
      [17,16,'hills',{c:1}],[18,16,'plains',{c:1,port:1,seat:1,nm:'Kythira'}],[18,17,'grass',{c:1}] ]},
  ];

  // --- factions (Act I minors — docs/15 §3.3) --------------------------------
  const FACTIONS = {
    clans:    { name: 'Arcadian Hill Clans', icon: '🏕️', col: '#b0483a', campWar: 8,  pw: 3.5, raids: true,  raidEvery: [25, 40], flavor: 'Hill folk who raid farms in autumn and melt into the crags.' },
    brigands: { name: 'Isthmus Brigands',    icon: '🗡️', col: '#8a4a2a', campWar: 6,  pw: 3.0, raids: true,  raidEvery: [15, 25], flavor: 'Toll-robbers preying on the isthmus road.' },
    mani:     { name: 'Free Clans of Mani',  icon: '🪨', col: '#7a5a80', campWar: 10, pw: 4.0, raids: false, flavor: 'They never strike first. They never yield either.' },
    argive:   { name: 'Argive Remnant',      icon: '🏺', col: '#4a6a9a', campWar: 14, pw: 3.5, raids: false, absorbable: true, flavor: 'A proud old city-line. Gold and honor may win them without blood.' },
  };
  const TRIBE_TILE_GARRISON = 3; // non-camp tribe tiles

  // --- the seven starts (docs/15 §3.2) ----------------------------------------
  const STARTS = [
    { id: 'sparta',     name: 'Sparta',     seat: [16,13], diff: 2, bias: { metal: 5,  atk: 0.05 },  tip: 'Minerals + military. Fast weapons, slower food.' },
    { id: 'corinth',    name: 'Corinth',    seat: [17,9],  diff: 2, bias: { gold: 30, influence: 5 },tip: 'Trade + naval. Gold-rich, exposed to brigands.' },
    { id: 'kalamata',   name: 'Kalamata',   seat: [13,14], diff: 1, bias: { gold: 25, happy: 2 },    tip: 'Fertile valleys: growth + trade.' },
    { id: 'nafplio',    name: 'Nafplio',    seat: [18,11], diff: 1, bias: { stone: 20, def: 0.05 },  tip: 'Balanced trade + defense.' },
    { id: 'argos',      name: 'Argos',      seat: [17,11], diff: 1, bias: { influence: 10, happy: 3 },tip: 'Culture + farming. Happiness engine.' },
    { id: 'mani',       name: 'Mani',       seat: [15,14], diff: 4, bias: { metal: 10 },             tip: 'Rare ores, little food. The hard road.' },
    { id: 'monemvasia', name: 'Monemvasia', seat: [18,14], diff: 3, bias: { stone: 15, def: 0.10 },  tip: 'The rock fortress. Unbreakable but cramped.' },
  ];

  // --- flags: each banner is the standard of a DYNASTY (chosen at T2) ----------
  const FLAGS = [
    { id: 'imperial_eagle', name: 'The Imperial Eagle', dynasty: 'House of Palaiologos', png: '../assets/flags/flag_imperial_eagle.png',
      sym: 'Crowned double-headed eagle with sword & globus cruciger — a realm that never sleeps.',
      bonus: { atk: 0.03, claim: -0.05 }, btxt: '+3% attack · −5% claim cost' },
    { id: 'labarum', name: 'The Labarum', dynasty: 'House of Constantine', png: '../assets/flags/flag_labarum.png',
      sym: 'The sacred monogram carried at the head of the army. By this sign, conquer.',
      bonus: { happy: 4, def: 0.05 }, btxt: '+4 happiness · +5% defense' },
    { id: 'holy_cross', name: 'The Holy Cross', dynasty: 'House of Komnenos', png: '../assets/flags/flag_holy_cross.png',
      sym: 'The vow of the order that holds the wall. The line has never yet fallen.',
      bonus: { happy: 3, def: 0.05, atk: 0.01 }, btxt: '+3 happiness · +5% defense' },
    { id: 'vergina_sun', name: 'The Sun of Vergina', dynasty: 'House of Argead', png: '../assets/flags/flag_vergina_sun.png',
      sym: 'The sixteen-rayed star of a conquering dynasty. A sun that sets on no empire.',
      bonus: { atk: 0.04 }, btxt: '+4% attack' },
    { id: 'eternal_ankh', name: 'The Eternal Ankh', dynasty: 'House of Ptolemy', png: '../assets/flags/flag_eternal_ankh.png',
      sym: 'The golden key of life — the cradles are never quiet.',
      bonus: { birth: 0.06, happy: 2 }, btxt: '+6% birth rate · +2 happiness' },
    { id: 'descending_dove', name: 'The Descending Dove', dynasty: 'House of Rurik', png: '../assets/flags/flag_descending_dove.png',
      sym: 'A golden dove stooping from on high — a mandate granted from above.',
      bonus: { happy: 5 }, btxt: '+5 happiness · +festival potency' },
    { id: 'crimson_eagle', name: 'The Crimson Eagle', dynasty: 'House of Asen', png: '../assets/flags/flag_crimson_eagle.png',
      sym: 'A blood-red eagle displayed — martial vigilance and a warrior aristocracy.',
      bonus: { atk: 0.04, siege: 0.05 }, btxt: '+4% attack · +5% siege' },
    { id: 'elder_rune', name: 'The Elder Rune', dynasty: 'House of Dulo', png: '../assets/flags/flag_elder_rune.png',
      sym: 'The graven word of the ancestors — fate and hard-won wisdom.',
      bonus: { happy: 3, mine: 0.05 }, btxt: '+3 happiness · +5% mining' },
    { id: 'ringed_cross', name: 'The Ringed Cross', dynasty: 'House of Nemanjić', png: '../assets/flags/flag_ringed_cross.png',
      sym: 'A cross ringed in gold with four bezants — one faith binding the world.',
      bonus: { def: 0.05, happy: 2 }, btxt: '+5% defense · +2 happiness' },
    { id: 'golden_rho', name: 'The Golden Rho', dynasty: 'House of Lascaris', png: '../assets/flags/flag_golden_rho.png',
      sym: 'The single golden letter of empire on a white field — rule distilled to one word.',
      bonus: { happy: 2, claim: -0.04, culture: 0.1 }, btxt: '+2 happiness · −4% claim cost · +10% culture' },
  ];

  // --- decrees (docs/05 §5, slice trio) ----------------------------------------
  const DECREES = {
    families:     { name: 'Encourage Families', icon: '👪', toggle: true, birthMult: 1.3, happy: -2, tip: '+30% births while active, −2 happiness.' },
    festival:     { name: 'Hold a Festival',    icon: '🎉', cost: { gold: 40 }, happyBoost: 12, boostDays: 10, cooldown: 30, tip: '+12 happiness fading over 10 days. 30-day cooldown.' },
    conscription: { name: 'Conscription',       icon: '🪖', cost: {}, pop: 5, happy: -5, needsBarracks: true, tip: 'Turn 5 idle folk into militia at once (−5 happiness).' },
  };

  // ---- build the flat tile table ----------------------------------------------
  const TILES = {}; // key "c,r"
  REGION_SPECS.forEach(rs => {
    rs.tiles.forEach(([c, r, terr, f]) => {
      const isFactionTile = rs.faction && (!rs.factionTiles ||
        rs.factionTiles.some(([fc, fr]) => fc === c && fr === r) || f.camp);
      TILES[c + ',' + r] = {
        c, r, key: c + ',' + r,
        region: rs.id, regionName: rs.name,
        terrain: terr, danger: rs.danger, res: rs.res,
        coastal: !!f.c, port: !!f.port, seat: !!f.seat, sacred: !!f.sacred,
        fortress: !!f.fortress, island: !!rs.island,
        ore: !!f.ore, rich: !!f.rich, camp: !!f.camp,
        name: f.nm || null,
        owner: isFactionTile ? rs.faction : 'neutral',
        explored: false, dl: 0, buildings: [], road: false, settled: false,
        warriors: f.camp ? FACTIONS[rs.faction].campWar : (isFactionTile ? TRIBE_TILE_GARRISON : 0),
      };
    });
  });

  // ===========================================================================
  // PHASE 3 — ECONOMY & MINING DATA
  // ===========================================================================

  // --- ores / minerals: toolReq = min tool tier index; depth drives hazard ----
  const ORES = {
    copper_ore:   { name: 'Copper Ore',   ingot: 'copper',   toolReq: 0, depth: 1, dot: '#c87f4a', per: 1.4 },
    tin_ore:      { name: 'Tin Ore',      ingot: 'tin',      toolReq: 0, depth: 1, dot: '#b8b8c0', per: 1.1 },
    iron_ore:     { name: 'Iron Ore',     ingot: 'iron',     toolReq: 2, depth: 2, dot: '#9a9aa2', per: 1.0 },
    lapis_ore:    { name: 'Lapis Ore',    ingot: 'lapis',    toolReq: 3, depth: 3, dot: '#2b57c0', per: 0.7 },
    obsidian_ore: { name: 'Obsidian Ore', ingot: 'obsidian', toolReq: 4, depth: 3, dot: '#3a2a44', per: 0.7 },
  };
  const INGOTS = ['copper', 'tin', 'bronze', 'iron', 'lapis', 'obsidian'];

  // --- the mining TOOL ladder (index = tier) ----------------------------------
  const TOOLS = [
    { id: 'stone',    name: 'Stone Tools',    yield: 1.0, hazardCut: 0.00, recipe: null,                   tip: 'Basic. Mines copper & tin.' },
    { id: 'copper',   name: 'Copper Tools',   yield: 1.3, hazardCut: 0.10, recipe: { copper: 3 },          tip: 'Faster; a little safer.' },
    { id: 'bronze',   name: 'Bronze Tools',   yield: 1.6, hazardCut: 0.20, recipe: { bronze: 3 },          tech: 'forge2', tip: 'Unlocks IRON ore.' },
    { id: 'iron',     name: 'Iron Tools',     yield: 2.0, hazardCut: 0.32, recipe: { iron: 4 },            tech: 'mining2', tip: 'Unlocks LAPIS ore; deep mining.' },
    { id: 'lapis',    name: 'Lapis Tools',    yield: 2.4, hazardCut: 0.44, recipe: { lapis: 2, iron: 2 },  tech: 'mining3', tip: 'Unlocks OBSIDIAN ore; volcanic-ready.' },
    { id: 'obsidian', name: 'Obsidian Tools', yield: 2.9, hazardCut: 0.58, recipe: { obsidian: 2, iron: 2 }, tech: 'forge3', tip: 'The sharpest edge; safest deep mining.' },
  ];

  // --- weapon + armor tiers (index = grade; Phase 4 adds forging-tech gates) ---
  const GEAR_TIERS = [
    { id: 'militia',  name: 'Militia',        power: 3,  def: 1,  morale: 0, siege: 0, cost: null },
    { id: 'copper',   name: 'Copper',         power: 5,  def: 3,  morale: 1, siege: 1, cost: { copper: 2 } },
    { id: 'bronze',   name: 'Bronze',         power: 8,  def: 5,  morale: 2, siege: 2, cost: { bronze: 2 }, tech: 'forge2' },
    { id: 'iron',     name: 'Iron',           power: 12, def: 8,  morale: 3, siege: 3, cost: { iron: 2 }, tech: 'forge2' },
    { id: 'lapis',    name: 'Lapis-steel',    power: 16, def: 11, morale: 4, siege: 4, cost: { lapis: 2, iron: 1 }, tech: 'forge3' },
    { id: 'obsidian', name: 'Obsidian-edge',  power: 21, def: 15, morale: 5, siege: 6, cost: { obsidian: 2, iron: 1 }, tech: 'forge3' },
  ];

  // --- mining hazards ---------------------------------------------------------
  const HAZARDS = {
    cave_in:        { name: 'Cave-in',          icon: '🪨', tip: 'Miners crushed; some lost.' },
    toxic_fumes:    { name: 'Toxic Fumes',      icon: '☠️', tip: 'Sickness; work halts, morale falls.' },
    volcanic_ash:   { name: 'Volcanic Ash',     icon: '🌋', tip: 'Ash storm; output stalls, vision lost.' },
    heat_exhaustion:{ name: 'Heat Exhaustion',  icon: '🥵', tip: 'The heat zone saps miners; yield drops.' },
    tunnel_collapse:{ name: 'Tunnel Collapse',  icon: '💥', tip: 'The mine is destroyed and sealed.' },
  };

  // --- mid-game ships (naval tier unlocks overseas groups) --------------------
  const SHIPS = [
    { id: 'galley',      name: 'Galley',            navalTier: 0, cost: { wood: 40 },              tech: 'naval1', tip: 'Coastal galley — trade & short hops.' },
    { id: 'iron_ship',   name: 'Iron-Hulled Ship',  navalTier: 1, cost: { wood: 60, iron: 8 },    tech: 'naval2', tip: 'Reaches Greek isles, Balkans, Asia Minor & S. Italy.' },
    { id: 'lapis_ship',  name: 'Lapis-Reinforced',  navalTier: 2, cost: { wood: 70, lapis: 6 },   tech: 'naval3', tip: 'Stronger hull — reaches distant Iberia.' },
    { id: 'obsidian_ram',name: 'Obsidian-Cut Ram',  navalTier: 3, cost: { wood: 80, obsidian: 6 },tech: 'naval3', tip: 'Deadly ram — best naval reach & escort.' },
  ];

  // ===========================================================================
  // PHASE 4 — TECH TREE (8 branches × 3 tiers), festivals, capital tiers
  // ===========================================================================
  const TECHS = [
    // MINING
    { id: 'mining1', br: 'Mining', name: 'Prospecting',    cost: 25,  req: null,      tip: 'Unlocks the Mine & Tool Workshop.' },
    { id: 'mining2', br: 'Mining', name: 'Deep Shafts',    cost: 70,  req: 'mining1', tip: 'Iron Tools craftable · −8% hazards.' },
    { id: 'mining3', br: 'Mining', name: 'Gallery Props',  cost: 130, req: 'mining2', tip: 'Lapis Tools craftable · −12% hazards.' },
    // FORGING
    { id: 'forge1',  br: 'Forging', name: 'Smelting',      cost: 30,  req: null,      tip: 'Unlocks Smelter & Bloomery (ore → ingot).' },
    { id: 'forge2',  br: 'Forging', name: 'Bronzework',    cost: 75,  req: 'forge1',  tip: 'Crucible Forge, the Forge, bronze/iron gear & tools.' },
    { id: 'forge3',  br: 'Forging', name: 'Master Forging',cost: 140, req: 'forge2',  tip: 'Kiln, lapis-steel & obsidian-edge gear, obsidian tools.' },
    // NAVAL (opens only after Greece is unified — Act III)
    { id: 'naval1',  br: 'Naval', name: 'Shipwright',      cost: 60,  req: null, act: 3, tip: 'Harbor, Shipyard & Galleys. Requires a united Hellas.' },
    { id: 'naval2',  br: 'Naval', name: 'Iron Hulls',      cost: 110, req: 'naval1', act: 3, tip: 'Iron-hulled ships — reach the isles, Balkans, Italy, Asia Minor.' },
    { id: 'naval3',  br: 'Naval', name: 'Reinforced Hulls',cost: 170, req: 'naval2', act: 3, tip: 'Lapis hulls & obsidian rams — reach distant Iberia.' },
    // AGRICULTURE
    { id: 'agri1',   br: 'Agriculture', name: 'Crop Rotation', cost: 25, req: null,    tip: '+15% farm yield.' },
    { id: 'agri2',   br: 'Agriculture', name: 'Irrigation',    cost: 65, req: 'agri1', tip: '+15% more farm yield · granaries +60 storage.' },
    { id: 'agri3',   br: 'Agriculture', name: 'Husbandry',     cost: 120, req: 'agri2',tip: 'Herds & orchards: +1 food variety (happiness).' },
    // CULTURE
    { id: 'cult1',   br: 'Culture', name: 'Civic Rites',    cost: 30,  req: null,     tip: 'Amphitheater · Festival of Heroes.' },
    { id: 'cult2',   br: 'Culture', name: 'Chronicles',     cost: 80,  req: 'cult1',  tip: 'Archive & Great Hall · needed for the Grand Capital (T3).' },
    { id: 'cult3',   br: 'Culture', name: 'High Culture',   cost: 150, req: 'cult2',  tip: 'Artisan District & Shrine of Kings · festival potency +.' },
    // WARFARE
    { id: 'war1',    br: 'Warfare', name: 'Drill',          cost: 35,  req: null,     tip: '+5% attack.' },
    { id: 'war2',    br: 'Warfare', name: 'Siegecraft',     cost: 85,  req: 'war1',   tip: 'Siege gear bites harder vs fortresses & mountains.' },
    { id: 'war3',    br: 'Warfare', name: 'Elite Guard',    cost: 150, req: 'war2',   tip: 'At the Grand Capital (T3): +10% defense, harder soldiers.' },
    // HOUSING
    { id: 'house1',  br: 'Housing', name: 'Masonry',        cost: 30,  req: null,     tip: 'Stone Houses (+8 pop capacity).' },
    { id: 'house2',  br: 'Housing', name: 'Urban Planning', cost: 80,  req: 'house1', tip: '+1 build slot in every settlement.' },
    { id: 'house3',  br: 'Housing', name: 'Aqueducts',      cost: 140, req: 'house2', tip: 'Aqueduct building (+6 happiness, +5 pop cap).' },
    // TRADE
    { id: 'trade1',  br: 'Trade', name: 'Weights & Measures', cost: 30, req: null,    tip: 'Trade Depot & Resource Market.' },
    { id: 'trade2',  br: 'Trade', name: 'Caravans',           cost: 75, req: 'trade1',tip: '+40% caravan gold · better market rates.' },
    { id: 'trade3',  br: 'Trade', name: 'Sea Lanes',          cost: 130,req: 'trade2',tip: 'Port settlements earn +30% trade gold.' },
  ];
  const TECH_BRANCHES = ['Mining', 'Forging', 'Naval', 'Agriculture', 'Culture', 'Warfare', 'Housing', 'Trade'];

  // --- Phase 4 festivals (cost CULTURE; mid-game effects) ----------------------
  const FESTS4 = {
    heroes: { name: 'Festival of Heroes', icon: '🏅', tech: 'cult1', cost: { culture: 40 }, days: 15, cd: 45, tip: '+10% attack & battle morale for 15 days.' },
    forge:  { name: 'Festival of the Forge', icon: '🔥', tech: 'forge2', cost: { culture: 30, wood: 10 }, days: 10, cd: 45, tip: '+25% mining & refining for 10 days.' },
    sea:    { name: 'Festival of the Sea', icon: '🌊', tech: 'naval1', cost: { culture: 30 }, days: 10, cd: 45, tip: '+50% trade gold · ships 20% cheaper for 10 days.' },
  };

  // --- Phase 4 capital tiers ----------------------------------------------------
  const TIER_NAMES = { 1: 'Early Capital', 2: 'Developed Capital', 3: 'Grand Capital · Porphyrogennetos' };

  // ===========================================================================
  // PHASE 5 — EMPIRES, DIPLOMACY, MAP MODES, STABILITY
  // ===========================================================================

  // The eight empires (docs/15 §8). Five live on this map; three are DISTANT
  // powers (Kemet, Gaul, Mesopotamia) whose homelands arrive with the full
  // 400-tile Mediterranean in Phase 6 — they trade, scheme and raid by sea.
  const EMPIRES = {
    anatolia:   { name: 'Empire of Anatolia',            col: '#c26b2e', home: ['lydia'],        expandInto: ['lydia', 'ionia'],  personality: 'expansionist', distant: false, navy: 1, strength: 34, flagPref: ['elder_rune', 'crimson_eagle'], tip: 'Heavy infantry and chariot lords, hungry for the Aegean coast.' },
    phoenicia:  { name: 'Phoenician Coastal Dominion',   col: '#d0342c', home: ['sicily'],       expandInto: ['sicily'],          personality: 'merchant',     distant: false, navy: 3, strength: 24, flagPref: ['ringed_cross', 'eternal_ankh'], tip: 'Masters of the sea lanes — they buy before they burn. Their colonies band the coasts in red.' },
    italic:     { name: 'Italic Maritime Empire',        col: '#7a4a9e', home: ['magna_graecia'],expandInto: ['magna_graecia', 'sicily'], personality: 'expansionist', distant: false, navy: 2, strength: 30, flagPref: ['crimson_eagle', 'labarum'], tip: 'Disciplined legions and growing fleets across the strait.' },
    illyria:    { name: 'Illyrian Highland Despotate',   col: '#5a6e8a', home: ['illyria'],      expandInto: ['illyria', 'moesia'], personality: 'raider',     distant: false, navy: 1, strength: 26, flagPref: ['descending_dove', 'holy_cross'], tip: 'Mountain ambushers; iron mastery; they respect only strength.' },
    iberia:     { name: 'Iberian Hill Kingdoms',         col: '#4a7a3e', home: ['iberia_east'],  expandInto: ['iberia_east'],     personality: 'defensive',    distant: false, navy: 1, strength: 22, flagPref: ['holy_cross', 'descending_dove'], tip: 'Guerrilla hill-clans over silver and shadowed iron.' },
    kemet:      { name: 'Kingdom of Kemet',              col: '#d4a017', home: [],               expandInto: [],                  personality: 'merchant',     distant: true,  navy: 2, strength: 36, flagPref: ['eternal_ankh'], tip: 'The Nile colossus. Its granaries are bottomless — its homeland arrives with the full Mediterranean (Act VI).' },
    gaul:       { name: 'Gaulish Grand Kingdom',         col: '#3e8a7a', home: [],               expandInto: [],                  personality: 'expansionist', distant: true,  navy: 0, strength: 32, flagPref: ['vergina_sun'], tip: 'Proud hosts and heavy horse beyond the Alps — beyond the horizon for now.' },
    mesopotamia:{ name: 'Mesopotamian Imperial Satrapy', col: '#35589e', home: [],               expandInto: [],                  personality: 'defensive',    distant: true,  navy: 1, strength: 38, flagPref: ['golden_rho'], tip: 'The old power of the Twin Rivers; siege-masters. Their satrapies arrive with the full map.' },
  };
  const EMPIRE_TILE_GARRISON = 8;      // warriors per empire-held tile
  const EMPIRE_SEAT_GARRISON = 14;

  // Diplomacy actions (player side) — availability & costs
  const DIPLO = {
    gift:      { name: 'Send Gift',          icon: '🎁', cost: { gold: 50 },    opinion: +12, tip: '+12 opinion. Gold speaks every tongue.' },
    exchange:  { name: 'Cultural Exchange',  icon: '🎭', cost: { culture: 30 }, opinion: +15, tip: '+15 opinion. Poets, plays & marriages.' },
    trade:     { name: 'Trade Agreement',    icon: '⚖️', minOpinion: 0,   tip: 'Both earn +2 gold/day. Needs opinion ≥ 0.' },
    nap:       { name: 'Non-Aggression Pact',icon: '🕊️', cost: { gold: 30 }, minOpinion: -10, tip: 'No invasions either way. Needs opinion ≥ −10.' },
    pact:      { name: 'Defensive Pact',     icon: '🤝', minOpinion: 25, needs: 'nap', tip: 'They join your defense. Needs NAP + opinion ≥ 25.' },
    alliance:  { name: 'Alliance',           icon: '👑', minOpinion: 45, needs: 'trade', tip: 'Full alliance: shared cause, +3 gold/day. Needs trade + opinion ≥ 45.' },
    threaten:  { name: 'Demand Tribute',     icon: '🗡️', tip: 'If your armies dwarf theirs they pay 3 gold/day — otherwise it means WAR.' },
    war:       { name: 'Declare War',        icon: '⚔️', tip: 'Open invasions, sieges & blockades. War exhausts stability.' },
    peace:     { name: 'Sue for Peace',      icon: '🏳️', tip: 'End the war. If you are losing, expect to pay.' },
  };

  // --- map modes & the population gradient (8 purples, light → imperial) -------
  const MAP_MODES = ['normal', 'political', 'population', 'resource', 'naval'];
  const POP_COLORS = ['#e6d9f2', '#d4bfe8', '#c2a5de', '#a983d1', '#8f62c4', '#7443ae', '#5a2d96', '#3f1a7a'];
  // political mode palette — matched to the user's reference atlas (cyan sea, tan land)
  const POLITICAL = { sea: '#8fd8ea', seaDeep: '#6ec4dc', land: '#e9c96b', landEdge: '#8a6a20', neutral: '#e9c96b', player: '#f4c400' };

  // --- Phase 5 acts ------------------------------------------------------------
  const ACTS = {
    1: { name: 'Act I — Unite the Peloponnese' },
    2: { name: 'Act II — Unify Greece' },
    3: { name: 'Act III — The Naval Age' },
    4: { name: 'Act IV — The Mineral Age' },
    5: { name: 'Act V — The Empire Age' },
    6: { name: 'Act VI — The Full Mediterranean (Phase 6: the 400-tile world)' }, // P6 hook
  };

  // --- Phase 6 hooks (NOT active): advanced minerals & the 400-tile world ------
  const P6_HOOKS = {
    advancedMinerals: ['adamantine', 'magma_glass', 'deep_crystal', 'lapis_steel'],
    fullMapTiles: 400,
    volcanoRegions: ['mani', 'sicily'],   // eruption system lands here in P6
  };

  // minor overseas garrison faction (NOT an enemy empire — just tile danger)
  FACTIONS.natives = { name: 'Native Warbands', icon: '⚔️', col: '#6a6a72', campWar: 12, pw: 4.5, raids: false,
    flavor: 'Fierce local warbands. Only a metal-armed host will take these shores.' };

  // --- Peloponnese ore & volcanic-zone augmentation (Mani made REAL) ----------
  Object.values(TILES).forEach(t => {
    if (t.region === 'laconia' && t.ore) t.ores = ['copper_ore', 'tin_ore', 'iron_ore'];
    else if (t.region === 'arcadia' && t.ore) t.ores = ['iron_ore'];
    else if (t.region === 'mani') {
      if (t.terrain === 'mtn') { t.ores = ['lapis_ore', 'obsidian_ore']; t.hazards = ['heat', 'fumes', 'ash']; t.volcanic = true; }
      else if (t.ore || t.rich) t.ores = ['obsidian_ore'];
    }
    if (!t.ores) t.ores = [];
    if (!t.hazards) t.hazards = [];
  });

  const REGIONS = {};
  REGION_SPECS.forEach(rs => {
    REGIONS[rs.id] = { id: rs.id, name: rs.name, danger: rs.danger, res: rs.res,
      faction: rs.faction, seat: rs.tiles.find(t => t[3].seat), island: !!rs.island };
  });

  // ===========================================================================
  // MID-GAME MAP EXPANSION — Greece (full) + overseas (~162 tiles total)
  // naval: -1 = land-reachable (contiguous w/ Peloponnese via the Isthmus)
  //         1 = iron-hull ships   2 = lapis-hull ships   (region gate)
  // ===========================================================================
  const ov = (c, r, terr, f) => [c, r, terr, f || {}];
  const EXPANSION = [
    // ---- GREECE MAINLAND north of the Gulf of Corinth (land, naval -1) ----
    { id: 'attica', name: 'Attica', group: 'greece', danger: 1, naval: -1, res: 'silver · culture · the great port', tiles: [
      ov(19,7,'plains',{nm:'Megara'}), ov(20,7,'hills',{ore:['copper_ore'],nm:'Laurion'}),
      ov(20,8,'plains',{c:1,port:1,seat:1,nm:'Athens'}), ov(21,8,'plains',{c:1}), ov(21,9,'grass',{c:1,nm:'Sounion'}) ]},
    { id: 'boeotia', name: 'Boeotia & Phocis', group: 'greece', danger: 1, naval: -1, res: 'grain · the oracle', tiles: [
      ov(16,6,'grass',{sacred:1,seat:1,nm:'Delphi'}), ov(17,6,'grass',{}), ov(18,6,'hills',{}), ov(18,7,'plains',{}) ]},
    { id: 'euboea', name: 'Euboea', group: 'greece', danger: 1, naval: -1, res: 'copper · timber', tiles: [
      ov(19,5,'forest',{c:1,ore:['copper_ore'],nm:'Chalkis'}), ov(20,5,'forest',{c:1}) ]},
    { id: 'thessaly', name: 'Thessaly', group: 'greece', danger: 2, naval: -1, res: 'horses · grain', tiles: [
      ov(15,4,'plains',{}), ov(16,4,'plains',{seat:1,nm:'Larissa'}), ov(17,4,'grass',{}), ov(16,5,'plains',{}), ov(17,5,'hills',{c:1}) ]},
    { id: 'epirus', name: 'Epirus', group: 'greece', danger: 2, naval: -1, res: 'timber · iron', tiles: [
      ov(13,4,'mtn',{c:1,ore:['iron_ore']}), ov(14,4,'forest',{}), ov(13,5,'hills',{c:1}), ov(14,5,'mtn',{camp:1}) ]},
    { id: 'macedonia', name: 'Macedonia', group: 'greece', danger: 2, naval: -1, res: 'gold · timber · iron', tiles: [
      ov(15,2,'plains',{}), ov(16,2,'hills',{}), ov(14,3,'hills',{ore:['copper_ore']}),
      ov(15,3,'mtn',{ore:['iron_ore'],seat:1,nm:'Pella'}), ov(16,3,'hills',{}), ov(17,3,'forest',{c:1}) ]},
    { id: 'thrace', name: 'Thrace', group: 'greece', danger: 3, naval: -1, res: 'gold · horses · fierce clans', faction: 'natives', tiles: [
      ov(18,2,'hills',{}), ov(19,2,'plains',{camp:1,seat:1,nm:'Thrace'}), ov(18,3,'hills',{c:1}), ov(19,3,'plains',{c:1}) ]},
    // ---- GREEK ISLES (overseas, naval 1) ----
    { id: 'cyclades', name: 'Cyclades', group: 'greece', danger: 2, naval: 1, res: 'marble · OBSIDIAN · trade', tiles: [
      ov(22,10,'hills',{c:1,port:1,seat:1,nm:'Delos',ore:['obsidian_ore']}), ov(23,9,'hills',{c:1,nm:'Andros'}),
      ov(23,11,'plains',{c:1,nm:'Naxos'}), ov(24,10,'hills',{c:1,nm:'Paros'}) ]},
    { id: 'crete', name: 'Crete', group: 'greece', danger: 2, naval: 1, res: 'ancient ruins · timber · ports', tiles: [
      ov(19,17,'hills',{c:1,nm:'Chania'}), ov(20,17,'plains',{c:1,port:1,seat:1,nm:'Knossos'}),
      ov(21,17,'forest',{c:1}), ov(22,17,'hills',{c:1}), ov(23,17,'plains',{c:1,nm:'Lasithi'}) ]},
    { id: 'naegean', name: 'North Aegean Isle', group: 'greece', danger: 1, naval: 1, res: 'fish · marble', tiles: [
      ov(21,3,'hills',{c:1,port:1,seat:1,nm:'Aegean Isle'}) ]},
    // ---- BALKANS: Illyria up the Adriatic coast, Moesia beyond the north (naval 1) ----
    { id: 'illyria', name: 'Illyria', group: 'balkans', danger: 4, naval: 1, res: 'IRON · timber · highland raiders', faction: 'natives', tiles: [
      ov(8,0,'mtn',{c:1}), ov(9,0,'mtn',{c:1,ore:['iron_ore']}), ov(10,0,'hills',{}),
      ov(9,1,'hills',{c:1}), ov(10,1,'mtn',{ore:['iron_ore']}), ov(11,1,'mtn',{c:1,port:1,seat:1,nm:'Illyria',camp:1,ore:['iron_ore']}),
      ov(10,2,'mtn',{camp:1}), ov(11,2,'hills',{c:1}), ov(12,2,'forest',{}), ov(11,3,'hills',{c:1,ore:['copper_ore']}) ]},
    { id: 'moesia', name: 'Moesia', group: 'balkans', danger: 3, naval: 1, res: 'gold rivers · grain', tiles: [
      ov(14,0,'plains',{}), ov(15,0,'plains',{}), ov(16,0,'hills',{ore:['copper_ore']}), ov(17,0,'plains',{}),
      ov(14,1,'plains',{}), ov(15,1,'plains',{c:1,port:1,seat:1,nm:'Moesia'}), ov(16,1,'hills',{}), ov(17,1,'forest',{}) ]},
    // ---- ASIA MINOR: the Anatolian coast at the map's eastern edge (naval 1) ----
    { id: 'ionia', name: 'Ionia', group: 'asia_minor', danger: 3, naval: 1, res: 'rich cities · copper · marble', faction: 'natives', tiles: [
      ov(25,4,'plains',{c:1}), ov(26,4,'hills',{ore:['copper_ore']}), ov(25,5,'hills',{c:1}), ov(26,5,'plains',{}),
      ov(25,6,'plains',{c:1,port:1,seat:1,nm:'Ionia',ore:['copper_ore']}), ov(26,6,'hills',{}), ov(25,7,'plains',{c:1}), ov(26,7,'plains',{camp:1}) ]},
    { id: 'lydia', name: 'Lydia', group: 'asia_minor', danger: 3, naval: 1, res: 'gold (Pactolus) · iron', tiles: [
      ov(27,4,'hills',{}), ov(28,4,'mtn',{ore:['iron_ore']}), ov(27,5,'hills',{seat:1,nm:'Sardis',ore:['iron_ore']}),
      ov(28,5,'mtn',{}), ov(27,6,'hills',{}), ov(28,6,'mtn',{}) ]},
    // ---- ITALY: the boot's heel & toe with Sicily at the tip (naval 1) ----
    { id: 'magna_graecia', name: 'Magna Graecia', group: 'italy', danger: 2, naval: 1, res: 'fertile colonies · kin-cities', tiles: [
      ov(2,5,'plains',{c:1}), ov(3,5,'grass',{}), ov(2,6,'plains',{c:1}), ov(3,6,'plains',{}), ov(4,6,'hills',{}),
      ov(3,7,'grass',{c:1}), ov(4,7,'plains',{}), ov(5,7,'hills',{}), ov(4,8,'plains',{c:1}),
      ov(5,8,'plains',{c:1,port:1,seat:1,nm:'Taras'}), ov(5,9,'hills',{c:1,nm:'Rhegion'}), ov(6,9,'plains',{c:1}) ]},
    { id: 'sicily', name: 'Sicily', group: 'italy', danger: 3, naval: 1, res: 'grain · Etna OBSIDIAN · volcanic', faction: 'natives', tiles: [
      ov(3,10,'hills',{c:1,camp:1}), ov(4,10,'plains',{c:1}), ov(5,10,'mtn',{ore:['obsidian_ore'],haz:['heat','ash'],volcanic:1,nm:'Etna'}), ov(6,10,'hills',{c:1}),
      ov(3,11,'plains',{c:1}), ov(4,11,'grass',{}), ov(5,11,'hills',{c:1,port:1,seat:1,nm:'Syracuse'}), ov(6,11,'plains',{c:1}) ]},
    // ---- IBERIA: the far-western shore (overseas, naval 2 — lapis ships) ----
    { id: 'iberia_east', name: 'Iberia (East)', group: 'iberia', danger: 3, naval: 2, res: 'silver · IRON hills · LAPIS · guerrillas', faction: 'natives', tiles: [
      ov(0,4,'hills',{c:1}), ov(1,4,'mtn',{ore:['iron_ore']}), ov(0,5,'plains',{c:1}), ov(1,5,'mtn',{ore:['iron_ore']}),
      ov(0,6,'hills',{c:1,port:1,seat:1,nm:'Emporion',ore:['iron_ore']}), ov(1,6,'hills',{camp:1}),
      ov(0,7,'plains',{c:1}), ov(1,7,'mtn',{ore:['lapis_ore']}), ov(0,8,'hills',{c:1}), ov(1,8,'mtn',{ore:['lapis_ore']}) ]},
  ];

  EXPANSION.forEach(rs => {
    const overseas = rs.naval >= 0;
    rs.tiles.forEach(([c, r, terr, f]) => {
      const isCamp = !!f.camp;
      TILES[c + ',' + r] = {
        c, r, key: c + ',' + r, region: rs.id, regionName: rs.name,
        terrain: terr, danger: rs.danger, res: rs.res,
        coastal: !!f.c || overseas, port: !!f.port, seat: !!f.seat, sacred: !!f.sacred,
        fortress: false, island: overseas,
        ore: !!(f.ore && f.ore.length), rich: false, camp: isCamp,
        ores: f.ore || [], hazards: f.haz || [], volcanic: !!f.volcanic,
        name: f.nm || null,
        overseas, naval: rs.naval, seaGroup: rs.group,
        owner: (rs.faction && isCamp) ? rs.faction : 'neutral',
        explored: false, dl: 0, buildings: [], road: false, settled: false,
        warriors: isCamp ? FACTIONS[rs.faction || 'natives'].campWar : 0,
      };
    });
    REGIONS[rs.id] = { id: rs.id, name: rs.name, danger: rs.danger, res: rs.res,
      faction: rs.faction, group: rs.group, naval: rs.naval, overseas };
  });

  return { CONST, TERRAIN, BUILDINGS, JOBS, TILES, REGIONS, REGION_SPECS, FACTIONS, STARTS, FLAGS, DECREES,
           ORES, INGOTS, TOOLS, GEAR_TIERS, HAZARDS, SHIPS, EXPANSION,
           TECHS, TECH_BRANCHES, FESTS4, TIER_NAMES,
           EMPIRES, DIPLO, MAP_MODES, POP_COLORS, POLITICAL, ACTS, P6_HOOKS,
           EMPIRE_TILE_GARRISON, EMPIRE_SEAT_GARRISON };
})();
