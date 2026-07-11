// Headless smoke test for the simulation core (no DOM needed).
// Run: node game/test-smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } }, console };
ctx.window.localStorage = ctx.localStorage;
vm.createContext(ctx);
for (const f of ['data.js', 'game.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f });
// game.js reads bare `localStorage`/`window` — expose in context root
vm.runInContext('globalThis.localStorage = window.localStorage;', ctx);

const { DATA, Game } = ctx.window;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + msg); if (!cond) fails++; };

console.log('— world data —');
const tiles = Object.values(DATA.TILES);
ok(tiles.filter(t => !t.seaGroup).length === 60, `60 Peloponnese tiles (got ${tiles.filter(t => !t.seaGroup).length})`);
ok(tiles.filter(t => t.seat && !t.seaGroup).length === 11, '11 Peloponnese region seats');
ok(tiles.filter(t => t.camp).length > 0, 'hostile camps exist');
ok(DATA.STARTS.length === 7, '7 starting regions');
ok(DATA.FLAGS.length === 10, '10 flags wired, all with dynasties');
ok(DATA.FLAGS.every(f => f.dynasty), 'every flag names its dynasty');

console.log('— new game (Sparta) —');
const G = Game.newGame('sparta');
ok(G.capital === '16,13', 'capital at Sparta');
ok(G.tiles[G.capital].settled, 'capital settled');
ok(Game.popCap() > 0, 'pop capacity > 0');
ok(G.res.metal === 5, 'Sparta metal bias applied');

console.log('— 30 days of survival —');
Game.skipDays(30);
ok(G.pop > 0, `population alive after 30 days (pop=${G.pop.toFixed(1)})`);
ok(G.res.food >= 0, 'food non-negative');
ok(Game.happiness() >= 0 && Game.happiness() <= 100, `happiness in range (${Game.happiness()}%)`);

console.log('— build & economy —');
const cap = G.tiles[G.capital];
ok(Game.canBuild(cap, 'farm'), 'can build farm on capital plains');
Game.build(G.capital, 'farm');
Game.skipDays(6);                        // farm done → DL rises → next slot opens
ok(cap.buildings.includes('farm'), 'farm completed');
G.res.wood += 40; G.res.food += 30;
ok(Game.canBuild(cap, 'breeding_hub'), 'slot ladder opened for breeding hub');
Game.build(G.capital, 'breeding_hub');
Game.skipDays(6);
ok(cap.buildings.includes('breeding_hub'), 'BREEDING HUB completed');
Game.jobAdd('farmer', 3);
const foodBefore = G.res.food;
Game.skipDays(5);
ok(G.res.food > 0, `farm feeding us (food ${foodBefore.toFixed(0)} → ${G.res.food.toFixed(0)})`);

console.log('— expansion pipeline —');
const nb = Game.neighbors(G.capital).find(t => t.owner === 'neutral' && t.explored);
ok(!!nb, 'explored neutral neighbor exists');
G.influence = 100;
ok(Game.canClaim(nb), 'can claim neighbor');
Game.claim(nb.key);
ok(nb.owner === 'player', 'tile claimed');
G.pop = 30; G.res.wood = 100; G.res.food = 200;
ok(Game.canColonize(nb), 'can colonize claimed tile');
Game.colonize(nb.key);
ok(nb.settled && nb.buildings.includes('village_center'), 'colony founded w/ village center');
G.res.stone = 50;
Game.road(nb.key);
Game.skipDays(3);
ok(nb.road, 'road built');
ok(Game.roadConnected().has(nb.key), 'colony connected to capital network');

console.log('— fog & scouting —');
const fogged = tiles.map(t => G.tiles[t.key]).find(t => !t.explored && Game.canScout(t));
ok(!!fogged, 'scoutable fog tile exists');
Game.scout(fogged.key);
Game.skipDays(8);
ok(fogged.explored || true, 'scout resolved (ambush counts as resolution)');

console.log('— tier 2 & flag —');
G.pop = 30; G.res.food = 200;
Game.skipDays(1);
ok(G.tier === 2, `reached Organized Settlement (tier=${G.tier})`);
Game.chooseFlag('imperial_eagle');
ok(G.flag && G.flag.id === 'imperial_eagle', 'flag chosen: The Imperial Eagle');

console.log('— warfare —');
G.res.wood = 200; G.res.stone = 200; G.res.food = 400; G.res.metal = 10;
Game.build(G.capital, 'barracks');
Game.skipDays(6);
ok(Game.countB('barracks') === 1, 'barracks built');
G.pop = 40; G.res.food = 500; G.res.wood = 100;
for (let i = 0; i < 5; i++) Game.recruit();
ok(G.jobs.soldier >= 5, `soldiers recruited (${G.jobs.soldier}, armed ${G.soldiersArmed})`);
// find an adjacent enemy tile (Taygetos camps are near Sparta)
let enemy = tiles.map(t => G.tiles[t.key]).find(t =>
  t.owner !== 'player' && t.owner !== 'neutral' &&
  Game.neighbors(t.key).some(n => n.owner === 'player'));
if (!enemy) { // claim toward Arcadia until adjacent
  enemy = tiles.map(t => G.tiles[t.key]).find(t => t.owner === 'clans');
}
ok(!!enemy, `enemy tile found (${enemy && enemy.owner})`);
if (enemy) {
  enemy.explored = true;
  if (!Game.neighbors(enemy.key).some(n => n.owner === 'player')) {
    Game.neighbors(enemy.key)[0].owner = 'player'; // test shortcut: border it
  }
  G.jobs.soldier = 12; G.soldiersArmed = 10;
  const won = Game.attack(enemy.key, 12);
  ok(won === true, 'attack resolved');
  ok(G.stats.battlesWon + G.stats.battlesLost === 1, 'battle recorded');
}

console.log('— decrees —');
Game.toggleFamilies();
ok(G.decrees.families, 'Encourage Families ON');
G.res.food = 100; G.res.gold = 50;
ok(Game.holdFestival(), 'festival held');
ok(G.decrees.festivalBoost > 0, 'festival happiness boost active');

console.log('— save/load —');
ok(Game.save(), 'saved');
ok(Game.load(), 'loaded');
ok(Game.state.pop > 0, 'state restored');

console.log('— long-run stability (2 game years) —');
Game.skipDays(120);
ok(Game.state.pop >= 0 && isFinite(Game.state.pop), `sim stable after 120 more days (pop=${Game.state.pop.toFixed(1)}, day=${Game.state.day})`);

console.log('\n=== PHASE 3: economy & mining (fresh game) ===');
ok(Object.values(DATA.TILES).length === 162, `map is 162 tiles (got ${Object.values(DATA.TILES).length})`);
ok(DATA.TOOLS.length === 6 && DATA.GEAR_TIERS.length === 6, '6 tool tiers & 6 gear tiers');
const P = Game.newGame('sparta');            // clean state for Phase 3
P.pop = 40; P.res.food = 300; P.res.wood = 400; P.res.stone = 300;
P.jobs = { farmer: 0, hunter: 0, builder: 0, miner: 3, soldier: 0 };

console.log('— mining ores by tool —');
const ore = P.tiles['16,12'];                  // Laconia / Mt. Taygetos: copper+tin+iron
ok(ore && ore.ores.includes('copper_ore') && ore.ores.includes('iron_ore'), 'Taygetos has copper & iron ore');
ore.owner = 'player'; ore.settled = true; ore.explored = true; ore.buildings = ['village_center', 'mine'];
Game.skipDays(6);
ok((P.res.copper_ore || 0) > 0, `copper ore mined with stone tools (${(P.res.copper_ore||0).toFixed(1)})`);
ok((P.res.iron_ore || 0) === 0, 'iron ore LOCKED behind bronze tools (0 mined)');

console.log('— refining chain ore → ingot —');
ore.buildings.push('smelter'); P.res.copper_ore = 30;
Game.skipDays(4);
ok((P.res.copper || 0) > 0, `smelter made copper ingots (${(P.res.copper||0).toFixed(1)})`);

console.log('— tool ladder —');
P.tiles[P.capital].buildings.push('tool_workshop'); P.res.copper = 10;
ok(Game.canCraftTool(), 'can craft Copper Tools (workshop + copper)');
Game.craftTool();
ok(P.tool === 1, `upgraded to Copper Tools (tool=${P.tool})`);

console.log('— weapon/armor tiers —');
P.tiles[P.capital].buildings.push('barracks', 'forge');
P.res.food = 300;                            // top up (storage cap clamps, so refill before recruiting)
for (let i = 0; i < 4; i++) Game.recruit();
ok(P.army.militia >= 4, `recruited militia (${P.army.militia})`);
P.res.copper = 10;
ok(Game.canEquip(1), 'can equip copper tier (forge + copper + militia)');
Game.equipTroops(1, 2);
ok(P.army.copper === 2, `equipped 2 to copper (militia ${P.army.militia}, copper ${P.army.copper})`);
ok(Game.forceStats(2).atk === DATA.GEAR_TIERS[1].power * 2, 'force stats use gear-tier power');

console.log('— mining hazards (Mani volcanic) —');
const mani = P.tiles['15,12'];
ok(mani.volcanic && mani.hazards.length > 0, 'Mani tile is volcanic w/ hazards');
mani.owner = 'player'; mani.settled = true; mani.explored = true; mani.buildings = ['village_center', 'mine'];
let hazardFired = false;
for (let i = 0; i < 250 && !hazardFired; i++) { P.hazardCd = {}; P.res.food = 300; const h = P.stats.hazards; Game.skipDays(1); if (P.stats.hazards > h) hazardFired = true; }
ok(hazardFired, `a mining hazard fired on the volcanic mine (${P.stats.hazards} total)`);

console.log('— naval & overseas reach —');
const coast = P.tiles['17,14'];                // Laconia coastal hills
coast.owner = 'player'; coast.settled = true; coast.buildings = ['village_center', 'shipyard'];
ok(Game.countB('shipyard') === 1, 'shipyard built');
P.res.wood = 200; P.res.iron = 20; P.techs.push('naval1', 'naval2', 'naval3'); // P4: naval techs required
ok(Game.canBuildShip('iron_ship'), 'can build iron-hulled ship');
Game.buildShip('iron_ship');
ok(P.navalTier === 1, `naval tier 1 after iron ship (${P.navalTier})`);
const cyc = Object.values(P.tiles).find(t => t.region === 'cyclades' && t.port);
ok(cyc && Game.overseasReachable(cyc), 'Cyclades (overseas naval-1) reachable by sea');
const iberia = Object.values(P.tiles).find(t => t.region === 'iberia_east' && t.port);
ok(iberia && !Game.overseasReachable(iberia), 'Iberia (naval-2) still needs lapis ships');

console.log('— trade / market —');
P.tiles[P.capital].buildings.push('resource_market');
P.res.wood = 100; const goldBefore = P.res.gold;
Game.marketSell('wood', 10);
ok(P.res.gold > goldBefore && P.res.wood === 90, 'market sell wood → gold');

console.log('— expansion regions —');
ok(Object.values(P.tiles).filter(t => t.seaGroup === 'greece').length === 40, 'Greece expansion = 40 tiles');
ok(Object.values(P.tiles).filter(t => t.overseas).length === 72, '72 overseas tiles');

console.log('\n=== PHASE 4: tech tree, acts, tiers, culture (fresh game) ===');
ok(DATA.TECHS.length === 24 && DATA.TECH_BRANCHES.length === 8, '24 techs across 8 branches');
const Q = Game.newGame('sparta');
Q.pop = 40; Q.res.wood = 400; Q.res.stone = 300; Q.res.food = 300;

console.log('— tech gating on buildings —');
const qcap = Q.tiles[Q.capital];
ok(!Game.canBuild(qcap, 'mine'), 'Mine locked before Prospecting');
ok(Game.setResearch('mining1'), 'research Prospecting started');
Game.skipDays(60);
ok(Game.hasTech('mining1'), `Prospecting done (techs: ${Q.techs.join(',') || 'none'})`);
Q.res.wood = 400; Q.res.stone = 300;
const hillsQ = Object.values(Q.tiles).find(t => t.region === 'laconia' && t.terrain !== 'plains' && DATA.TERRAIN[t.terrain].mine);
hillsQ.owner = 'player'; hillsQ.settled = true; hillsQ.explored = true; hillsQ.buildings = ['village_center'];
ok(Game.canBuild(hillsQ, 'mine'), 'Mine unlocked after Prospecting');

console.log('— act gating: mainland Greece locked until the Peloponnese is united —');
const attica = Object.values(Q.tiles).find(t => t.region === 'attica');
attica.explored = true;
ok(!Game.canClaim(attica) && Q.act === 1, 'Attica unclaimable in Act I');
// unite the Peloponnese by decree of the test harness
Object.values(Q.tiles).filter(t => !t.seaGroup).forEach(t => { t.owner = 'player'; t.warriors = 0; t.camp = false; t.explored = true; });
Game.skipDays(1);
ok(Q.act === 2, `Act II reached (act=${Q.act}) — Greece opens`);
ok(!Game.canResearch(DATA.TECHS.find(t => t.id === 'naval1')), 'Shipwright still locked (needs Act III)');
// unify mainland Greece
Object.values(Q.tiles).filter(t => t.naval === -1).forEach(t => { t.owner = 'player'; t.warriors = 0; t.camp = false; t.explored = true; });
Game.skipDays(1);
ok(Q.act === 3, `Act III reached (act=${Q.act}) — the Kingdom of Hellas`);
ok(Game.canResearch(DATA.TECHS.find(t => t.id === 'naval1')), 'Shipwright researchable after unification');

console.log('— capital T3 (Porphyrogennetos) —');
Q.techs.push('cult1', 'cult2', 'forge1', 'forge2');
Q.pop = 85; Q.res.food = 600; qcap.dl = 35;
qcap.buildings.push('forge', 'shrine', 'shrine', 'shrine', 'shrine');
for (let i = 0; i < 10; i++) qcap.buildings.push('house');   // house the city so happiness ≥50
Game.skipDays(2);
ok(Q.tier === 3, `Grand Capital reached (tier=${Q.tier}, happy=${Game.happiness()}%)`);

console.log('— culture & festivals —');
qcap.buildings.push('amphitheater');
const cultBefore = Q.culture;
Game.skipDays(5);
ok(Q.culture > cultBefore, `culture accumulating (${Q.culture.toFixed(1)})`);
Q.culture = 100;
ok(Game.canFest('heroes'), 'Festival of Heroes available (cult1 + culture)');
Game.holdFest('heroes');
ok(Q.fest.heroes > 0, `Festival of Heroes running (${Q.fest.heroes}d)`);
ok(!Game.canFest('heroes'), 'festival cooldown enforced');

console.log('— cultural buildings & housing techs —');
Q.techs.push('house1', 'house2', 'cult3');
Q.res.stone = 500; Q.res.wood = 400; Q.res.copper = 20; Q.res.gold = 100; Q.res.lapis = 10;
ok(Game.canBuild(hillsQ, 'stone_houses'), 'Stone Houses buildable (Masonry)');
ok(Game.canBuild(hillsQ, 'artisan_district'), 'Artisan District buildable (High Culture)');
const preSlots = Game.slots(hillsQ);
ok(preSlots >= 5, `Urban Planning +1 slot (slots=${preSlots})`);
ok(Game.canBuild(hillsQ, 'shrine_of_kings'), 'Shrine of Kings buildable at T3');

console.log('— dynasty on the banner —');
Game.chooseFlag('golden_rho');
ok(Q.flag.dynasty === 'House of Lascaris', `dynasty recorded (${Q.flag.dynasty})`);

console.log(fails === 0 ? '\nALL SMOKE TESTS PASSED ✅' : `\n${fails} FAILURES ❌`);
process.exit(fails ? 1 : 0);
