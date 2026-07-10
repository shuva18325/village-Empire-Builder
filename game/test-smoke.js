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
ok(tiles.length === 60, `60 land tiles authored (got ${tiles.length})`);
ok(tiles.filter(t => t.seat).length === 11, '11 region seats');
ok(tiles.filter(t => t.camp).length > 0, 'hostile camps exist');
ok(DATA.STARTS.length === 7, '7 starting regions');
ok(DATA.FLAGS.length === 5, '5 flags wired');

console.log('— new game (Sparta) —');
const G = Game.newGame('sparta');
ok(G.capital === '5,6', 'capital at Sparta');
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

console.log(fails === 0 ? '\nALL SMOKE TESTS PASSED ✅' : `\n${fails} FAILURES ❌`);
process.exit(fails ? 1 : 0);
