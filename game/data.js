// ============================================================================
// EMPIRE BUILDER — P0-P2 slice data
// The authored Peloponnese map (60 land tiles, 11 regions) + building/faction/
// flag definitions. Mirrors docs/15 §3 and data/campaign-mediterranean.json.
// All numbers are tunable balance constants (docs/14).
// ============================================================================
window.DATA = (function () {

  const CONST = {
    GRID_W: 10, GRID_H: 10, TILE: 66,
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
    breeding_hub: { name: 'Breeding Hub',     icon: '👶', cost: { wood: 30, food: 15 },  days: 3, dl: 3, birthMult: 1.15, tip: '+15% birth rate (nursery & family hall). Stacks up to 3.' },
    farm:         { name: 'Farm',             icon: '🌾', cost: { wood: 20 },            days: 2, dl: 3, job: 'farmer', slots: 3, out: { res: 'food', per: 3.0 }, needs: 'farm',   tip: 'Farmers grow food (season-dependent). Plains/grassland.' },
    hunters_lodge:{ name: "Hunter's Lodge",   icon: '🏹', cost: { wood: 15 },            days: 1, dl: 2, job: 'hunter', slots: 2, out: { res: 'food', per: 2.2 }, needs: 'hunt',   tip: 'Hunters bring game meat. Forest/hills/mountain.' },
    granary:      { name: 'Granary',          icon: '🛖', cost: { wood: 25, stone: 15 }, days: 2, dl: 3, foodCap: CONST.GRANARY_CAP, tip: '+120 food storage — vital for winter.' },
    lumber_camp:  { name: 'Lumber Camp',      icon: '🪓', cost: { wood: 10 },            days: 1, dl: 2, job: 'builder', slots: 2, out: { res: 'wood', per: 2.0 }, needs: 'lumber', tip: 'Builders cut wood. Forest only.' },
    quarry:       { name: 'Quarry',           icon: '⛏️', cost: { wood: 25 },            days: 2, dl: 3, job: 'miner', slots: 2, out: { res: 'stone', per: 1.5 }, needs: 'mine',   tip: 'Miners cut stone. Hills/mountain.' },
    mine:         { name: 'Mine',             icon: '⚒️', cost: { wood: 25, stone: 20 }, days: 3, dl: 4, job: 'miner', slots: 3, out: { res: 'metal', per: 0.8 }, needs: 'mine',  tip: 'Miners dig copper/iron. ×1.5 on ore tiles, ×2 on rich veins.' },
    market:       { name: 'Market',           icon: '🏪', cost: { wood: 30, stone: 20 }, days: 3, dl: 4, job: 'builder', slots: 1, out: { res: 'gold', per: 2.0 }, tip: 'Trade income (×1.5 on ports). +0.3 influence/day.' },
    shrine:       { name: 'Shrine',           icon: '⛩️', cost: { wood: 15, stone: 10 }, days: 2, dl: 3, happy: 4, influence: 0.4, tip: '+happiness, +0.4 influence/day.' },
    palisade:     { name: 'Palisade',         icon: '🛡️', cost: { wood: 30 },            days: 2, dl: 2, defMult: 1.4, tip: 'Tile defense ×1.4 vs raids & attacks.' },
    watchtower:   { name: 'Watchtower',       icon: '🗼', cost: { wood: 25, stone: 15 }, days: 2, dl: 3, watch: true, tip: 'Halves raid chance on this region; reveals neighbors.' },
    barracks:     { name: 'Barracks',         icon: '⚔️', cost: { wood: 40, stone: 30 }, days: 3, dl: 4, soldierCap: CONST.BARRACKS_CAP, tip: 'Recruit & house soldiers (+10 soldier cap).' },
    village_center:{name: 'Village Center',   icon: '🏛️', cost: {},                      days: 0, dl: 5, popCap: 10, auto: true, tip: 'Heart of a settlement.' },
  };

  // --- jobs ------------------------------------------------------------------
  const JOBS = ['farmer', 'hunter', 'builder', 'miner', 'soldier'];

  // --- the 60-tile Peloponnese ------------------------------------------------
  // [col,row,terrain,{c:coastal, port, seat, nm:name, sacred, camp, ore, rich}]
  const REGION_SPECS = [
    { id: 'achaea', name: 'Achaea', danger: 1, res: 'fish · berries · timber', faction: null, tiles: [
      [3,0,'grass',{c:1}],[4,0,'plains',{c:1}],[5,0,'plains',{c:1}],
      [2,1,'plains',{c:1,port:1,seat:1,nm:'Patras'}],[3,1,'hills',{}],[4,1,'forest',{}] ]},
    { id: 'corinthia', name: 'Corinthia', danger: 1, res: 'trade tolls · clay · twin ports', faction: 'brigands', factionTiles: [[6,1],[8,2]], tiles: [
      [6,0,'hills',{}],[7,0,'plains',{c:1}],[8,0,'plains',{c:1,nm:'The Isthmus'}],
      [6,1,'hills',{camp:1}],[7,1,'plains',{c:1,port:1,seat:1,nm:'Corinth'}],[8,1,'plains',{c:1}],[8,2,'hills',{camp:1}] ]},
    { id: 'elis', name: 'Elis', danger: 1, res: 'grain · horses · the Sacred Games', faction: null, tiles: [
      [1,2,'plains',{c:1}],[2,2,'grass',{}],[1,3,'plains',{c:1}],
      [2,3,'grass',{sacred:1,seat:1,nm:'Olympia'}],[1,4,'plains',{c:1}],[2,4,'forest',{}] ]},
    { id: 'arcadia', name: 'Arcadia', danger: 3, res: 'wood · stone · game · deep iron', faction: 'clans', tiles: [
      [3,2,'forest',{}],[4,2,'mtn',{ore:1}],[5,2,'mtn',{camp:1}],
      [3,3,'hills',{}],[4,3,'mtn',{camp:1,seat:1,nm:'Tegea'}],[5,3,'forest',{}],
      [4,4,'mtn',{camp:1,ore:1}],[5,4,'hills',{}] ]},
    { id: 'argolis_argos', name: 'Argolis — Argos', danger: 1, res: 'grain · culture · the old line', faction: 'argive', tiles: [
      [6,2,'grass',{}],[7,2,'hills',{}],[6,3,'plains',{camp:1,seat:1,nm:'Argos'}],[7,3,'grass',{}] ]},
    { id: 'argolis_nafplio', name: 'Argolis — Nafplio', danger: 1, res: 'trade · strong walls', faction: null, tiles: [
      [8,3,'hills',{}],[7,4,'plains',{c:1}],[8,4,'plains',{c:1,port:1,seat:1,nm:'Nafplio'}],[9,4,'hills',{c:1}] ]},
    { id: 'messenia', name: 'Messenia', danger: 1, res: 'grain surplus · olives · fish', faction: null, tiles: [
      [2,5,'plains',{c:1}],[3,5,'grass',{}],[2,6,'plains',{c:1}],[3,6,'grass',{}],
      [4,6,'forest',{}],[2,7,'plains',{c:1}],[3,7,'plains',{c:1,port:1,seat:1,nm:'Kalamata'}] ]},
    { id: 'laconia', name: 'Laconia', danger: 2, res: 'copper · tin · iron · stone', faction: null, tiles: [
      [4,5,'mtn',{ore:1,nm:'Mt. Taygetos'}],[5,5,'hills',{}],[6,4,'hills',{ore:1}],[6,5,'forest',{}],
      [5,6,'plains',{seat:1,nm:'Sparta'}],[6,6,'hills',{}],[5,7,'plains',{}],[6,7,'hills',{c:1}] ]},
    { id: 'mani', name: 'Mani', danger: 3, res: 'lapis · obsidian · proud clans', faction: 'mani', tiles: [
      [4,7,'mtn',{ore:1,rich:1}],[4,8,'mtn',{camp:1,seat:1,nm:'Areopoli'}],
      [5,8,'hills',{c:1}],[5,9,'mtn',{c:1,sacred:1,nm:'Cape Tainaron'}] ]},
    { id: 'vatika', name: 'Vatika / Monemvasia', danger: 2, res: 'salt · quartz · the rock fortress', faction: null, tiles: [
      [7,7,'hills',{}],[7,8,'plains',{c:1}],[8,8,'hills',{c:1,port:1,seat:1,nm:'Monemvasia',fortress:1}] ]},
    { id: 'kythira', name: 'Kythira Strait', danger: 1, res: 'fish · pearls · the way to Crete', faction: null, island: true, tiles: [
      [7,9,'hills',{c:1}],[8,9,'plains',{c:1,port:1,seat:1,nm:'Kythira'}],[9,9,'grass',{c:1}] ]},
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
    { id: 'sparta',     name: 'Sparta',     seat: [5,6], diff: 2, bias: { metal: 5,  atk: 0.05 },  tip: 'Minerals + military. Fast weapons, slower food.' },
    { id: 'corinth',    name: 'Corinth',    seat: [7,1], diff: 2, bias: { gold: 30, influence: 5 },tip: 'Trade + naval. Gold-rich, exposed to brigands.' },
    { id: 'kalamata',   name: 'Kalamata',   seat: [3,7], diff: 1, bias: { food: 60 },              tip: 'Food + growth. A population engine.' },
    { id: 'nafplio',    name: 'Nafplio',    seat: [8,4], diff: 1, bias: { stone: 20, def: 0.05 },  tip: 'Balanced trade + defense.' },
    { id: 'argos',      name: 'Argos',      seat: [6,3], diff: 1, bias: { influence: 10, happy: 3 },tip: 'Culture + farming. Happiness engine.' },
    { id: 'mani',       name: 'Mani',       seat: [4,8], diff: 4, bias: { metal: 10 },             tip: 'Rare ores, little food. The hard road.' },
    { id: 'monemvasia', name: 'Monemvasia', seat: [8,8], diff: 3, bias: { stone: 15, def: 0.10 },  tip: 'The rock fortress. Unbreakable but cramped.' },
  ];

  // --- flags (subset of /data/flags.json usable at T2) -------------------------
  const FLAGS = [
    { id: 'imperial_eagle', name: 'The Imperial Eagle', png: '../assets/flags/flag_imperial_eagle.png',
      sym: 'Crowned double-headed eagle with sword & globus cruciger — a realm that never sleeps.',
      bonus: { atk: 0.03, claim: -0.05 }, btxt: '+3% attack · −5% claim cost' },
    { id: 'labarum', name: 'The Labarum', png: '../assets/flags/flag_labarum.png',
      sym: 'The sacred monogram carried at the head of the army. By this sign, conquer.',
      bonus: { happy: 4, def: 0.05 }, btxt: '+4 happiness · +5% defense' },
    { id: 'holy_cross', name: 'The Holy Cross', png: '../assets/flags/flag_holy_cross.png',
      sym: 'The vow of the order that holds the wall. The line has never yet fallen.',
      bonus: { happy: 3, def: 0.05, atk: 0.01 }, btxt: '+3 happiness · +5% defense' },
    { id: 'vergina_sun', name: 'The Sun of Vergina', png: '../assets/flags/flag_vergina_sun.png',
      sym: 'The sixteen-rayed star of a conquering dynasty. A sun that sets on no empire.',
      bonus: { atk: 0.04 }, btxt: '+4% attack' },
    { id: 'eternal_ankh', name: 'The Eternal Ankh', png: '../assets/flags/flag_eternal_ankh.png',
      sym: 'The golden key of life — the cradles are never quiet.',
      bonus: { birth: 0.06, happy: 2 }, btxt: '+6% birth rate · +2 happiness' },
  ];

  // --- decrees (docs/05 §5, slice trio) ----------------------------------------
  const DECREES = {
    families:     { name: 'Encourage Families', icon: '👪', toggle: true, birthMult: 1.3, happy: -2, tip: '+30% births while active, −2 happiness.' },
    festival:     { name: 'Hold a Festival',    icon: '🎉', cost: { food: 40, gold: 20 }, happyBoost: 12, boostDays: 10, cooldown: 30, tip: '+12 happiness fading over 10 days. 30-day cooldown.' },
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

  const REGIONS = {};
  REGION_SPECS.forEach(rs => {
    REGIONS[rs.id] = { id: rs.id, name: rs.name, danger: rs.danger, res: rs.res,
      faction: rs.faction, seat: rs.tiles.find(t => t[3].seat), island: !!rs.island };
  });

  return { CONST, TERRAIN, BUILDINGS, JOBS, TILES, REGIONS, REGION_SPECS, FACTIONS, STARTS, FLAGS, DECREES };
})();
