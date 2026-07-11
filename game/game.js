// ============================================================================
// EMPIRE BUILDER — P0-P2 slice: simulation core (DOM-free; UI hooks optional)
// Systems: time/seasons · population/jobs · happiness/status effects ·
// production · construction · explore→claim→colonize→develop→roads ·
// tribes/raids · tile warfare · decrees · T1→T2 tier + flag · Act I victory
// ============================================================================
window.Game = (function () {
  const D = window.DATA, C = D.CONST;
  let G = null;                        // live game state
  let acc = 0;                         // ms accumulator

  // ---------- utils ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const T = k => G.tiles[k];
  const log = (msg, cls) => { G.log.unshift({ d: G.day, msg, cls: cls || '' });
    if (G.log.length > 120) G.log.pop(); emit('log'); };
  const emit = ev => { if (window.UI && UI.on) UI.on(ev); };

  function neighbors(k) {
    const t = G.tiles[k]; if (!t) return [];
    const out = [];
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      if (!dc && !dr) continue;
      const n = G.tiles[(t.c + dc) + ',' + (t.r + dr)];
      if (n) out.push(n);
    }
    return out;
  }
  const isMine = t => t.owner === 'player';
  const ownedTiles = () => Object.values(G.tiles).filter(isMine);

  function distFromCapital(k) {        // BFS over land tiles
    const seen = { [G.capital]: 0 }, q = [G.capital];
    while (q.length) {
      const cur = q.shift();
      if (cur === k) return seen[cur];
      neighbors(cur).forEach(n => {
        if (seen[n.key] === undefined) { seen[n.key] = seen[cur] + 1; q.push(n.key); }
      });
    }
    return 99;
  }
  function roadConnected() {           // set of tile keys linked to capital by roads
    const ok = new Set([G.capital]), q = [G.capital];
    while (q.length) {
      neighbors(q.shift()).forEach(n => {
        if (!ok.has(n.key) && isMine(n) && (n.road || n.settled)) { ok.add(n.key); q.push(n.key); }
      });
    }
    return ok;
  }

  // ---------- new game ----------
  function newGame(startId) {
    const start = D.STARTS.find(s => s.id === startId) || D.STARTS[0];
    G = {
      startId: start.id, day: 1, year: 1, seasonIx: 0, speed: 1, over: false,
      tiles: JSON.parse(JSON.stringify(D.TILES)),
      capital: start.seat[0] + ',' + start.seat[1],
      capitalName: null, tier: 1, flag: null,
      pop: 10, jobs: { farmer: 2, hunter: 3, builder: 3, miner: 0, soldier: 0 },
      soldiersArmed: 0,                // soldiers equipped with metal (power 5 vs 3)
      res: { food: 60, wood: 40, stone: 10, metal: 0, gold: 0 },
      influence: 15,
      statuses: {},                    // id -> daysLeft
      decrees: { families: false, festivalCd: 0, festivalBoost: 0 },
      scouts: [],                      // {key, daysLeft}
      builds: [],                      // {key, b, daysLeft}
      roadsBuilding: [],               // {key, daysLeft}
      raidTimers: {}, victory: false,
      log: [],
      stats: { battlesWon: 0, battlesLost: 0, raidsSuffered: 0, tilesTaken: 0, hazards: 0 },
    };
    // apply start bias
    const b = start.bias || {};
    ['food', 'wood', 'stone', 'metal', 'gold'].forEach(r => { if (b[r]) G.res[r] += b[r]; });
    if (b.influence) G.influence += b.influence;
    G.bias = { atk: b.atk || 0, def: b.def || 0, happy: b.happy || 0 };

    // --- Phase 3 state ---
    Object.keys(D.ORES).forEach(o => G.res[o] = 0);      // raw ores
    D.INGOTS.forEach(m => { if (G.res[m] === undefined) G.res[m] = 0; }); // ingots
    G.tool = 0;                                           // mining tool tier (stone)
    G.army = { militia: 0, copper: 0, bronze: 0, iron: 0, lapis: 0, obsidian: 0 };
    G.ships = {}; G.navalTier = 0;
    G.hazardCd = {};                                     // tile -> cooldown days
    if (b.metal) G.res.copper = (G.res.copper || 0) + b.metal; // Sparta/Mani bias → copper

    // --- Phase 4 state: tech, culture, acts, festivals ---
    G.techs = [];                                        // researched tech ids
    G.research = null;                                   // {id, prog}
    G.culture = 0;                                       // culture points (spent on festivals)
    G.act = 1;                                           // 1 Peloponnese · 2 Greece · 3 the Sea
    G.fest = { heroes: 0, forge: 0, sea: 0 };            // active festival day counters
    G.festCd = {};                                       // festival cooldowns

    // capital tile: liberate its faction (you ARE these people), settle it
    const cap = T(G.capital);
    const fac = cap.owner !== 'neutral' ? cap.owner : null;
    if (fac) Object.values(G.tiles).forEach(t => {
      if (t.owner === fac) { t.owner = 'neutral'; t.warriors = 0; t.camp = false; }
    });
    cap.owner = 'player'; cap.settled = true; cap.explored = true;
    cap.buildings = ['village_center', 'house']; cap.dl = 8;
    G.capitalName = cap.name || 'Neapolis';
    neighbors(G.capital).forEach(n => n.explored = true);

    // faction raid timers
    Object.keys(D.FACTIONS).forEach(f => {
      if (D.FACTIONS[f].raids) G.raidTimers[f] = ri(...D.FACTIONS[f].raidEvery);
    });
    log(`The Chiefdom of the Morea is founded at ${G.capitalName}. Survive, grow, unite the Peloponnese.`, 'good');
    log(`🍖 Your stores won't last: build a Hunter's Lodge or Farm on the capital before the food runs out!`, '');
    emit('all');
    return G;
  }

  // ---------- derived numbers ----------
  function season() { return C.SEASONS[G.seasonIx]; }
  function popCap() {
    let cap = 0;
    ownedTiles().forEach(t => {
      if (!t.settled) return;
      let c = D.TERRAIN[t.terrain].popCap;
      t.buildings.forEach(b => c += D.BUILDINGS[b].popCap || 0);
      cap += c;
    });
    return cap;
  }
  function foodCap() {
    let cap = C.FOOD_CAP_BASE;
    const granaryBonus = hasTech('agri2') ? 60 : 0;
    ownedTiles().forEach(t => t.buildings.forEach(b => {
      cap += D.BUILDINGS[b].foodCap || 0;
      if (b === 'granary') cap += granaryBonus;
    }));
    return cap;
  }
  function soldierCap() {
    let cap = C.SOLDIER_CAP_BASE + (G.tier >= 3 ? 10 : 0);   // T3: the Elite Guard barracks
    ownedTiles().forEach(t => t.buildings.forEach(b => cap += D.BUILDINGS[b].soldierCap || 0));
    return cap;
  }
  function countB(id) { let n = 0; ownedTiles().forEach(t => t.buildings.forEach(b => { if (b === id) n++; })); return n; }
  function assigned() { return D.JOBS.reduce((s, j) => s + G.jobs[j], 0); }
  function idle() { return Math.max(0, Math.floor(G.pop) - assigned()); }
  function flagBonus(k) { return (G.flag && G.flag.bonus[k]) || 0; }

  // ---------- Phase 4: technology ----------
  const hasTech = id => !id || (G.techs || []).includes(id);
  function canResearch(t) {
    if (G.over || hasTech(t.id) || (G.research && G.research.id === t.id)) return false;
    if (t.req && !hasTech(t.req)) return false;
    if (t.act && G.act < t.act) return false;            // naval branch waits for a united Hellas
    return true;
  }
  function setResearch(id) {
    const t = D.TECHS.find(x => x.id === id);
    if (!t || !canResearch(t)) return false;
    G.research = { id, prog: 0 };
    log(`🔬 Scholars begin work on ${t.name} (${t.br}).`);
    emit('all'); return true;
  }
  function rpPerDay() {
    return 0.6 + countB('archive') * 1.0 + countB('amphitheater') * 0.4
      + countB('great_hall') * 0.3 + countB('shrine_of_kings') * 0.5 + (G.tier - 1) * 0.3;
  }
  function culturePerDay() {
    let c = countB('shrine') * 0.3 + countB('amphitheater') * 0.8 + countB('great_hall') * 0.6
      + countB('artisan_district') * 0.4 + countB('shrine_of_kings') * 1.5;
    c *= 1 + flagBonus('culture');
    return c;
  }
  function researchTick() {
    G.culture += culturePerDay();
    if (!G.research) return;
    G.research.prog += rpPerDay();
    const t = D.TECHS.find(x => x.id === G.research.id);
    if (t && G.research.prog >= t.cost) {
      G.techs.push(t.id); G.research = null;
      log(`💡 ${t.name.toUpperCase()} discovered! ${t.tip}`, 'gold');
      emit('all');
    }
  }

  // ---------- Phase 4: festivals (culture-fuelled) ----------
  function canFest(id) {
    const f = D.FESTS4[id];
    if (!f || G.over || !hasTech(f.tech) || (G.festCd[id] || 0) > 0 || (G.fest[id] || 0) > 0) return false;
    return Object.entries(f.cost).every(([r, v]) => (r === 'culture' ? G.culture : G.res[r] || 0) >= v);
  }
  function holdFest(id) {
    if (!canFest(id)) return false;
    const f = D.FESTS4[id];
    Object.entries(f.cost).forEach(([r, v]) => { if (r === 'culture') G.culture -= v; else G.res[r] -= v; });
    G.fest[id] = f.days; G.festCd[id] = f.cd;
    log(`${f.icon} ${f.name}! ${f.tip}`, 'gold');
    emit('all'); return true;
  }

  // ---------- Phase 3 helpers ----------
  const tool = () => D.TOOLS[G.tool];
  function metalCap() {
    let cap = C.METAL_STORAGE_CAP;
    ownedTiles().forEach(t => t.buildings.forEach(b => cap += D.BUILDINGS[b].oreCap || 0));
    return cap;
  }
  function clampStores() {
    const cap = metalCap();
    Object.keys(D.ORES).forEach(o => { if (G.res[o] > cap) G.res[o] = cap; });
    D.INGOTS.forEach(m => { if (G.res[m] > cap) G.res[m] = cap; });
  }
  const haveShipyard = () => countB('shipyard') > 0;
  const overseasReachable = t => G.navalTier >= t.naval && haveShipyard();
  const hasRegionFoothold = region => ownedTiles().some(t => t.region === region);
  function regionUnlocked(t) { return !t.overseas || overseasReachable(t); }
  function recomputeNaval() {
    let n = 0; Object.keys(G.ships).forEach(id => {
      const s = D.SHIPS.find(x => x.id === id); if (s && G.ships[id] > 0) n = Math.max(n, s.navalTier);
    });
    G.navalTier = n;
  }
  const armyTotal = () => D.GEAR_TIERS.reduce((s, g) => s + (G.army[g.id] || 0), 0);
  function syncSoldiers() { G.jobs.soldier = armyTotal(); }
  // remove n soldiers, weakest (militia) first
  function killSoldiers(n) {
    for (const g of D.GEAR_TIERS) { // militia..obsidian order = weakest first
      if (n <= 0) break;
      const take = Math.min(n, G.army[g.id] || 0);
      G.army[g.id] -= take; n -= take;
    }
    syncSoldiers();
  }
  // best-equipped `count` soldiers → {atk, def, siege, morale}
  function forceStats(count) {
    let atk = 0, def = 0, siege = 0, morale = 0, left = count;
    for (let i = D.GEAR_TIERS.length - 1; i >= 0 && left > 0; i--) {
      const g = D.GEAR_TIERS[i], take = Math.min(left, G.army[g.id] || 0);
      atk += take * g.power; def += take * g.def; siege += take * g.siege; morale += take * g.morale; left -= take;
    }
    return { atk, def, siege, morale };
  }
  function bestTierName() {
    for (let i = D.GEAR_TIERS.length - 1; i >= 0; i--) if ((G.army[D.GEAR_TIERS[i].id] || 0) > 0) return D.GEAR_TIERS[i].name;
    return '—';
  }

  // food source variety (forage + hunt + farm active; husbandry adds herds)
  function foodSources() {
    let n = 0;
    if (idle() > 0) n++;                                   // foragers
    if (G.jobs.hunter > 0 && countB('hunters_lodge') > 0) n++;
    if (G.jobs.farmer > 0 && countB('farm') > 0) n++;
    if (hasTech('agri3')) n++;                             // herds & orchards
    return n;
  }

  function happiness() {
    const cap = popCap();
    const buffer = G.res.food / Math.max(1, dailyFood());
    let h = 50;
    h += Math.min(12, foodSources() * 4);                          // variety
    h += clamp((cap - G.pop) / Math.max(1, G.pop) * 20, 0, 10);    // shelter
    const danger = Math.max(0, ...ownedTiles().map(t => t.danger)) || 0;
    h += clamp(G.jobs.soldier * 1.5 - danger * 2, 0, 10);          // safety
    let cultHappy = 0;                                             // culture buildings
    ownedTiles().forEach(t => t.buildings.forEach(b => cultHappy += D.BUILDINGS[b].happy || 0));
    h += Math.min(22, cultHappy);
    h += G.decrees.festivalBoost;                                  // festivals
    h += G.decrees.families ? D.DECREES.families.happy : 0;        // decrees
    h += flagBonus('happy') + G.bias.happy;                        // flag & start
    if (G.statuses.wellfed) h += 8;
    if (G.statuses.heroic) h += 5;
    if (G.statuses.fearful) h -= 8;
    if (G.statuses.overworked) h -= 8;
    h -= clamp((G.pop - cap) * 1.5, 0, 15);                        // overcrowding
    if (buffer < 2) h -= 15; else if (buffer < 5) h -= 7;          // hunger fear
    return clamp(Math.round(h), 0, 100);
  }
  const prodMult = () => 0.6 + happiness() / 100 * 0.8;

  function dailyFood() {
    return Math.floor(G.pop) * C.FOOD_PER_POP * (season() === 'Winter' ? 1.05 : 1)
      + G.jobs.soldier * C.SOLDIER_FOOD;
  }

  // building production for one day
  function produce() {
    const pm = prodMult(), conn = roadConnected();
    const pools = { farmer: G.jobs.farmer, hunter: G.jobs.hunter, builder: G.jobs.builder, miner: G.jobs.miner };
    const gains = { food: 0, wood: 0, stone: 0, gold: 0 };
    gains.food += idle() * 0.2 * (season() === 'Winter' ? 0.5 : 1);
    G._mineBlocked = false;                              // UI hint: tool too weak somewhere

    ownedTiles().forEach(t => {
      const connBonus = (t.key === G.capital || conn.has(t.key)) ? 1 : 0.75;
      t.buildings.forEach(bId => {
        const b = D.BUILDINGS[bId];
        // ---- MINES: yield the tile's ores, gated by the mining tool tier ----
        if (b.mines) {
          const take = Math.min(b.slots, pools.miner || 0); pools.miner -= take;
          if (!take) return;
          let mult = pm * connBonus * (t.rich ? 2 : 1) * (1 + flagBonus('mine'));
          if (G.fest.forge > 0) mult *= 1.25;              // Festival of the Forge
          if (countB('artisan_district') > 0) mult *= 1.05;
          (t.ores || []).forEach(oreId => {
            const ore = D.ORES[oreId];
            if (G.tool < ore.toolReq) { G._mineBlocked = true; return; }
            G.res[oreId] = (G.res[oreId] || 0) + take * ore.per * tool().yield * mult;
          });
          return;
        }
        if (b.goldOut) gains.gold += b.goldOut;            // artisan district & kin
        if (!b.out) return;
        const take = Math.min(b.slots, pools[b.job] || 0); pools[b.job] -= take;
        if (!take) return;
        let mult = pm * connBonus;
        if (bId === 'farm') {
          mult *= C.SEASON_FARM[season()];
          if (hasTech('agri1')) mult *= 1.15;
          if (hasTech('agri2')) mult *= 1.15;
        }
        if (bId === 'hunters_lodge') mult *= C.SEASON_HUNT[season()];
        if (bId === 'market' && t.port) mult *= 1.5;
        if (countB('artisan_district') > 0) mult *= 1.05;
        gains[b.out.res] += take * b.out.per * mult;
      });
    });
    gains.food += (pools.hunter || 0) * 1.2 * C.SEASON_HUNT[season()] * pm;
    gains.food += (pools.farmer || 0) * 0.3;

    // ---- REFINING: Ore → Ingot (Smelter/Bloomery/Kiln) & alloy (Crucible) ----
    const refineRate = C.REFINE_RATE * (0.7 + pm * 0.3) * (G.fest.forge > 0 ? 1.25 : 1);
    ownedTiles().forEach(t => t.buildings.forEach(bId => {
      const b = D.BUILDINGS[bId];
      if (b.refine) b.refine.in.forEach(oreId => {
        const got = Math.min(refineRate, G.res[oreId] || 0);
        if (got > 0) { G.res[oreId] -= got; const out = b.refine.out[oreId]; G.res[out] = (G.res[out] || 0) + got; }
      });
      if (b.alloy) {                                     // 2 copper + 1 tin -> 2 bronze
        const batches = Math.min(refineRate / 2, (G.res.copper || 0) / 2, (G.res.tin || 0) / 1);
        if (batches > 0) { G.res.copper -= batches * 2; G.res.tin -= batches * 1; G.res.bronze = (G.res.bronze || 0) + batches * 2; }
      }
    }));

    // ---- TRADE: caravan routes between road-connected settlements ----
    const tradeMult = (hasTech('trade2') ? 1.4 : 1) * (G.fest.sea > 0 ? 1.5 : 1);
    const depots = countB('trade_depot');
    if (depots > 0) {
      const connectedSettlements = ownedTiles().filter(t => t.settled && (t.key === G.capital || conn.has(t.key))).length;
      gains.gold += depots * connectedSettlements * C.CARAVAN_GOLD * tradeMult;
    }
    // port tiles add a little trade gold
    gains.gold += ownedTiles().filter(t => t.port && t.settled).length * 0.4
      * (hasTech('trade3') ? 1.3 : 1) * tradeMult;

    if (happiness() >= 55) ownedTiles().forEach(t => {
      if (t.settled) t.dl = Math.min(100, t.dl + (conn.has(t.key) ? 0.2 : 0.1));
    });
    G.res.food = Math.min(foodCap(), G.res.food + gains.food);
    G.res.wood += gains.wood; G.res.stone += gains.stone; G.res.gold += gains.gold;
    let infl = C.INFLUENCE_BASE + countB('market') * 0.3;
    ownedTiles().forEach(t => t.buildings.forEach(b => infl += D.BUILDINGS[b].influence || 0));
    G.influence += infl;
    clampStores();
    minesHazardTick();
    const demand = assigned();
    if (demand > Math.floor(G.pop)) setStatus('overworked', 3); else delete G.statuses.overworked;
  }

  // ---------- mining hazards (scale with ore depth & tool tier) ----------
  function minesHazardTick() {
    ownedTiles().forEach(t => {
      if (!t.buildings.includes('mine') || !(t.ores || []).length) return;
      if ((G.hazardCd[t.key] || 0) > 0) { G.hazardCd[t.key]--; return; }
      const miners = 1; // presence
      const depth = Math.max(...t.ores.map(o => D.ORES[o].depth));
      let chance = depth * 0.018 * (1 - tool().hazardCut) * (t.volcanic ? 1.7 : 1);
      chance = clamp(chance, 0, 0.4);
      if (Math.random() > chance) return;
      G.hazardCd[t.key] = ri(4, 8);
      // pick a hazard: volcanic tiles favor fumes/ash/heat; else cave-in
      const pool = (t.hazards && t.hazards.length)
        ? { heat: 'heat_exhaustion', ash: 'volcanic_ash', fumes: 'toxic_fumes' }
        : null;
      let hz;
      if (pool && Math.random() < 0.7) hz = pool[t.hazards[ri(0, t.hazards.length - 1)]];
      else hz = Math.random() < 0.25 ? 'tunnel_collapse' : 'cave_in';
      applyHazard(t, hz);
    });
  }
  function applyHazard(t, hz) {
    const nm = tileName(t);
    G.stats.hazards = (G.stats.hazards || 0) + 1;
    setStatus('fearful', 3);
    if (hz === 'cave_in') { const d = ri(1, 3); G.pop = Math.max(0, G.pop - d); log(`🪨 Cave-in at ${nm}! ${d} miners lost.`, 'bad'); }
    else if (hz === 'toxic_fumes') { G.pop = Math.max(0, G.pop - ri(0, 2)); log(`☠️ Toxic fumes at ${nm} — the shaft is cleared, work halts.`, 'bad'); }
    else if (hz === 'heat_exhaustion') { log(`🥵 Heat exhaustion fells miners at ${nm} — yield drops.`, 'bad'); }
    else if (hz === 'volcanic_ash') { const n = neighbors(t.key)[0]; if (n) n.explored = n.explored; log(`🌋 Ash storm chokes ${nm} — mining stalls, the sky darkens.`, 'bad'); }
    else if (hz === 'tunnel_collapse') {
      const i = t.buildings.indexOf('mine'); if (i >= 0) { t.buildings.splice(i, 1); t.dl = Math.max(0, t.dl - 4); }
      G.pop = Math.max(0, G.pop - ri(1, 4));
      log(`💥 TUNNEL COLLAPSE at ${nm}! The mine is destroyed and sealed.`, 'bad');
    }
    emit('all');
  }

  // population growth/decline
  function popTick() {
    const h = happiness();
    const buffer = G.res.food / Math.max(1, dailyFood());
    const foodFactor = clamp(buffer / 5, 0, 1.5);
    const housing = clamp((popCap() - G.pop) / Math.max(1, G.pop * 0.2), 0, 1.2);
    let policy = G.decrees.families ? D.DECREES.families.birthMult : 1;
    policy *= Math.pow(D.BUILDINGS.breeding_hub.birthMult, Math.min(3, countB('breeding_hub')));
    policy *= 1 + flagBonus('birth');
    const births = Math.floor(G.pop) * C.BASE_BIRTH * foodFactor * housing
      * (0.4 + h / 100) * policy * C.SEASON_BIRTH[season()];
    const starving = G.res.food <= 0 ? 1 : 0;
    const deaths = Math.floor(G.pop) * C.BASE_DEATH * (1 + starving * 3);
    G.pop = Math.max(0, G.pop + births - deaths);
    // consumption
    G.res.food = Math.max(0, G.res.food - dailyFood());
    if (starving) {
      if (!G._starveWarned) { log('⚠ FAMINE — your people are starving!', 'bad'); G._starveWarned = true; }
      // starvation can shed workers
      if (Math.random() < 0.3 && G.pop > 0) shedWorker();
    } else G._starveWarned = false;
    // clamp jobs to pop
    while (assigned() > Math.floor(G.pop)) shedWorker();
    // statuses driven by state
    if (buffer >= 8 && foodSources() >= 3) setStatus('wellfed', 2);
    if (h >= 75 && buffer >= 5) setStatus('prosperous', 2);
    if (G.pop <= 0 && !G.over) { G.over = true; emit('defeat'); }
  }
  function shedWorker() {
    const order = ['miner', 'builder', 'hunter', 'farmer']; // shed workers before soldiers
    for (const j of order) if (G.jobs[j] > 0) { G.jobs[j]--; return; }
    if (G.jobs.soldier > 0) killSoldiers(1);
  }
  function setStatus(id, days) { G.statuses[id] = Math.max(G.statuses[id] || 0, days); }

  // ---------- timers: scouts, builds, roads, decrees, statuses ----------
  function timersTick() {
    // statuses decay
    Object.keys(G.statuses).forEach(s => { if (--G.statuses[s] <= 0) delete G.statuses[s]; });
    // festival boost decay
    if (G.decrees.festivalBoost > 0) G.decrees.festivalBoost = Math.max(0, G.decrees.festivalBoost - 1.2);
    if (G.decrees.festivalCd > 0) G.decrees.festivalCd--;
    // Phase 4 festivals: active-day counters & cooldowns
    Object.keys(G.fest).forEach(f => { if (G.fest[f] > 0 && --G.fest[f] === 0) log(`The ${D.FESTS4[f].name} ends.`); });
    Object.keys(G.festCd).forEach(f => { if (G.festCd[f] > 0) G.festCd[f]--; });
    // scouts
    G.scouts = G.scouts.filter(s => {
      if (--s.daysLeft > 0) return true;
      resolveScout(s.key); return false;
    });
    // construction (builders speed the queue)
    const speed = 0.5 + G.jobs.builder * 0.08;
    G.builds = G.builds.filter(bd => {
      bd.daysLeft -= speed;
      if (bd.daysLeft > 0) return true;
      const t = T(bd.key), b = D.BUILDINGS[bd.b];
      t.buildings.push(bd.b); t.dl = Math.min(100, t.dl + b.dl);
      log(`${b.icon} ${b.name} completed at ${tileName(t)}.`, 'good');
      emit('tile'); return false;
    });
    // roads
    G.roadsBuilding = G.roadsBuilding.filter(rb => {
      if (--rb.daysLeft > 0) return true;
      T(rb.key).road = true;
      log(`🛤️ Road completed at ${tileName(T(rb.key))} — the network grows.`, 'good');
      emit('tile'); return false;
    });
  }

  // ---------- exploration ----------
  function resolveScout(key) {
    const t = T(key);
    const roll = ri(1, 100) + G.jobs.hunter * 2 - t.danger * 10;
    if (roll < 10) {
      log(`☠ Scouts ambushed in ${t.regionName}! The party limps home; the land stays unknown.`, 'bad');
      setStatus('fearful', 3);
    } else if (roll < 40) {
      t.explored = true;
      log(`🔦 Partial survey of ${tileName(t)} — terrain known, secrets remain.`, '');
    } else {
      t.explored = true;
      neighbors(key).forEach(n => { if (Math.random() < 0.4) n.explored = true; });
      log(`🗺️ ${tileName(t)} fully scouted${t.camp ? ' — a hostile camp sighted!' : ''}.`, 'good');
    }
    emit('tile');
  }

  // ---------- tribes: raids ----------
  function raidsTick() {
    Object.keys(G.raidTimers).forEach(f => {
      if (--G.raidTimers[f] > 0) return;
      G.raidTimers[f] = ri(...D.FACTIONS[f].raidEvery);
      // faction alive? adjacent to player?
      const facTiles = Object.values(G.tiles).filter(t => t.owner === f && t.camp);
      if (!facTiles.length) return;
      const border = ownedTiles().filter(t => neighbors(t.key).some(n => n.owner === f));
      if (!border.length) return;
      const target = border[ri(0, border.length - 1)];
      // watchtower halves raid chance
      const watched = target.buildings.includes('watchtower') ||
        neighbors(target.key).some(n => isMine(n) && n.buildings.includes('watchtower'));
      if (watched && Math.random() < 0.5) {
        log(`🗼 Watchtowers turned back a ${D.FACTIONS[f].name} raid near ${tileName(target)}.`, 'good');
        return;
      }
      const raidPw = ri(4, 8) * D.FACTIONS[f].pw;
      let defPw = G.jobs.soldier > 0 ? forceStats(G.jobs.soldier).def * 0.9 + 2 : 2;
      defPw *= (1 + flagBonus('def') + G.bias.def + (G.tier >= 3 && hasTech('war3') ? 0.10 : 0));
      if (target.buildings.includes('palisade')) defPw *= D.BUILDINGS.palisade.defMult;
      if (defPw * rnd(0.9, 1.1) >= raidPw * rnd(0.9, 1.1)) {
        log(`🛡️ ${D.FACTIONS[f].name} raided ${tileName(target)} — repelled by your garrison!`, 'good');
        setStatus('heroic', 3);
      } else {
        const foodLoss = Math.floor(G.res.food * 0.2), popLoss = ri(0, 2);
        G.res.food -= foodLoss; G.pop = Math.max(0, G.pop - popLoss);
        G.stats.raidsSuffered++;
        setStatus('fearful', 4);
        log(`🔥 ${D.FACTIONS[f].name} raided ${tileName(target)}! Lost ${foodLoss} food${popLoss ? `, ${popLoss} people` : ''}.`, 'bad');
      }
      emit('all');
    });
  }

  // ---------- player actions ----------
  function canScout(t) {
    if (t.explored || G.over || G.jobs.hunter <= 0 || G.scouts.some(s => s.key === t.key)) return false;
    if (t.naval === -1 && G.act < 2) return false;       // mainland Greece waits for a united Peloponnese
    if (t.overseas) {
      if (!overseasReachable(t)) return false;         // need the right ship + a shipyard
      // land the first scouts on the region's port (beachhead); then expand by land
      if (!hasRegionFoothold(t.region)) return t.port;
      return neighbors(t.key).some(n => n.explored || isMine(n));
    }
    return neighbors(t.key).some(n => n.explored || isMine(n));
  }
  function scout(key) {
    const t = T(key);
    if (!canScout(t)) return false;
    G.scouts.push({ key, daysLeft: 1 + t.danger });
    log(`🥾 Scouts set out for ${t.regionName} (${1 + t.danger} days)…`);
    emit('tile'); return true;
  }

  function claimCost(t) {
    const base = t.overseas ? (12 + 4 * t.naval) : (C.CLAIM_BASE + distFromCapital(t.key) * C.CLAIM_PER_DIST);
    return Math.ceil(base * (1 + flagBonus('claim')));
  }
  function canClaim(t) {
    if (!t.explored || t.owner !== 'neutral' || G.over || G.influence < claimCost(t)) return false;
    if (t.naval === -1 && G.act < 2) return false;       // mainland Greece: Act II
    if (t.overseas) {
      if (!overseasReachable(t)) return false;
      if (t.port && !hasRegionFoothold(t.region)) return true;   // sea beachhead
      return neighbors(t.key).some(isMine);                      // expand from foothold
    }
    return neighbors(t.key).some(isMine);
  }
  function claim(key) {
    const t = T(key);
    if (!canClaim(t)) return false;
    G.influence -= claimCost(t);
    t.owner = 'player'; G.stats.tilesTaken++;
    log(`⚑ Claimed ${tileName(t)} for the Chiefdom.`, 'good');
    checkTier(); checkVictory(); emit('all'); return true;
  }

  function canColonize(t) {
    return isMine(t) && !t.settled && !G.over &&
      Math.floor(G.pop) - assigned() >= 0 && G.pop >= C.COLONIZE_POP + 4 &&
      G.res.wood >= C.COLONIZE_WOOD && G.res.food >= C.COLONIZE_FOOD;
  }
  function colonize(key) {
    const t = T(key);
    if (!canColonize(t)) return false;
    G.pop -= C.COLONIZE_POP; G.res.wood -= C.COLONIZE_WOOD; G.res.food -= C.COLONIZE_FOOD;
    while (assigned() > Math.floor(G.pop)) shedWorker();
    t.settled = true; t.buildings.push('village_center');
    t.dl = Math.min(100, t.dl + D.BUILDINGS.village_center.dl);
    if (!t.name) t.name = genColonyName();
    log(`🏛️ ${C.COLONIZE_POP} settlers found ${t.name} in ${t.regionName}!`, 'good');
    checkVictory(); emit('all'); return true;
  }

  function slots(t) {
    return Math.min(10, 3 + Math.floor(t.dl / 8) + (t.buildings.includes('village_center') ? 1 : 0)
      + (hasTech('house2') ? 1 : 0));
  }
  function canBuild(t, bId) {
    const b = D.BUILDINGS[bId];
    if (!b || b.auto || !isMine(t) || !t.settled || G.over) return false;
    if (b.tech && !hasTech(b.tech)) return false;                     // Phase 4: tech gate
    if (b.tier && G.tier < b.tier) return false;                      // Grand Capital wonders
    if (b.needs === 'coast' && !t.coastal) return false;
    if (t.buildings.length + G.builds.filter(x => x.key === t.key).length >= slots(t)) return false;
    if (b.needs === 'farm' && !D.TERRAIN[t.terrain].farm) return false;
    if (b.needs === 'hunt' && !D.TERRAIN[t.terrain].hunt) return false;
    if (b.needs === 'lumber' && !D.TERRAIN[t.terrain].lumber) return false;
    if (b.needs === 'mine' && !D.TERRAIN[t.terrain].mine) return false;
    return Object.entries(b.cost).every(([r, v]) => (G.res[r] || 0) >= v);
  }
  function build(key, bId) {
    const t = T(key);
    if (!canBuild(t, bId)) return false;
    const b = D.BUILDINGS[bId];
    Object.entries(b.cost).forEach(([r, v]) => G.res[r] -= v);
    G.builds.push({ key, b: bId, daysLeft: b.days });
    log(`🔨 Construction begun: ${b.name} at ${tileName(t)}.`);
    emit('all'); return true;
  }

  function canRoad(t) {
    return isMine(t) && !t.road && !G.over && G.res.stone >= C.ROAD_STONE &&
      !G.roadsBuilding.some(r => r.key === t.key) &&
      (t.key === G.capital || neighbors(t.key).some(n => isMine(n) && (n.road || n.key === G.capital)));
  }
  function road(key) {
    const t = T(key);
    if (!canRoad(t)) return false;
    G.res.stone -= C.ROAD_STONE;
    G.roadsBuilding.push({ key, daysLeft: C.ROAD_DAYS });
    log(`🛤️ Laying a road at ${tileName(t)}…`);
    emit('all'); return true;
  }

  function canRecruit() {
    return !G.over && countB('barracks') > 0 && G.jobs.soldier < soldierCap() &&
      idle() >= 1 && G.res.food >= 20 && G.res.wood >= 5;
  }
  function recruit() {
    if (!canRecruit()) return false;
    G.res.food -= 20; G.res.wood -= 5;
    G.army.militia++; syncSoldiers();
    log('🪖 Recruited a militiaman — equip them with metal at the Forge.');
    emit('all'); return true;
  }

  // --- Phase 3: equip army to weapon/armor tiers (P4: forging-tech gates) ---
  function canEquip(tierIdx) {
    if (tierIdx <= 0 || G.over || countB('forge') === 0) return false;
    if (!hasTech(D.GEAR_TIERS[tierIdx].tech)) return false;
    const lower = D.GEAR_TIERS.slice(0, tierIdx).reduce((s, g) => s + (G.army[g.id] || 0), 0);
    if (lower <= 0) return false;
    return Object.entries(D.GEAR_TIERS[tierIdx].cost).every(([r, v]) => (G.res[r] || 0) >= v);
  }
  function equipTroops(tierIdx, n) {
    n = n || 1; let done = 0;
    while (done < n && canEquip(tierIdx)) {
      Object.entries(D.GEAR_TIERS[tierIdx].cost).forEach(([r, v]) => G.res[r] -= v);
      for (let i = 0; i < tierIdx; i++) { const id = D.GEAR_TIERS[i].id; if ((G.army[id] || 0) > 0) { G.army[id]--; break; } }
      G.army[D.GEAR_TIERS[tierIdx].id]++; done++;
    }
    if (done) { syncSoldiers(); log(`⚔️ Equipped ${done} soldier(s) to ${D.GEAR_TIERS[tierIdx].name}.`, 'good'); emit('all'); }
    return done > 0;
  }

  // --- Phase 3: craft the next mining tool tier (P4: tech gates) ---
  function canCraftTool() {
    if (G.over || G.tool >= D.TOOLS.length - 1 || countB('tool_workshop') === 0) return false;
    const nxt = D.TOOLS[G.tool + 1];
    if (!hasTech(nxt.tech)) return false;
    return nxt.recipe && Object.entries(nxt.recipe).every(([k, v]) => (G.res[k] || 0) >= v);
  }
  function craftTool() {
    if (!canCraftTool()) return false;
    const nxt = D.TOOLS[G.tool + 1];
    Object.entries(nxt.recipe).forEach(([k, v]) => G.res[k] -= v);
    G.tool++; log(`🛠️ Forged ${nxt.name}! Mining is deeper, richer & safer.`, 'good'); emit('all'); return true;
  }

  // --- Phase 3: build ships / naval reach (P4: naval-tech gates + sea festival) ---
  const shipCostMul = () => G.fest.sea > 0 ? 0.8 : 1;
  function canBuildShip(id) {
    if (G.over || !haveShipyard()) return false;
    const s = D.SHIPS.find(x => x.id === id);
    if (!s || !hasTech(s.tech)) return false;
    return Object.entries(s.cost).every(([k, v]) => (G.res[k] || 0) >= Math.ceil(v * shipCostMul()));
  }
  function buildShip(id) {
    if (!canBuildShip(id)) return false;
    const s = D.SHIPS.find(x => x.id === id);
    Object.entries(s.cost).forEach(([k, v]) => G.res[k] -= Math.ceil(v * shipCostMul()));
    G.ships[id] = (G.ships[id] || 0) + 1; recomputeNaval();
    log(`⚓ Launched a ${s.name}!${s.navalTier >= 1 ? ' Distant shores open beyond the sea.' : ''}`, 'good');
    emit('all'); return true;
  }

  // --- Phase 3: resource market (P4: Caravans tech improves the rates) ---
  const sellRate = () => C.MARKET_SELL * (hasTech('trade2') ? 1.4 : 1);
  const buyRate = () => C.MARKET_BUY * (hasTech('trade2') ? 0.8 : 1);
  function marketSell(res, n) {
    if (G.over || countB('resource_market') === 0) return false;
    n = Math.min(n || 10, Math.floor(G.res[res] || 0)); if (n <= 0) return false;
    G.res[res] -= n; G.res.gold += n * sellRate(); emit('all'); return true;
  }
  function marketBuy(res, n) {
    if (G.over || countB('resource_market') === 0) return false;
    n = n || 10; const cost = n * buyRate(); if (G.res.gold < cost) return false;
    G.res.gold -= cost; G.res[res] = (G.res[res] || 0) + n; clampStores(); emit('all'); return true;
  }

  function canAttack(t) {
    if (t.owner === 'player' || t.owner === 'neutral' || G.over || !t.explored || G.jobs.soldier <= 0) return false;
    if (t.naval === -1 && G.act < 2) return false;       // mainland Greece: Act II
    if (neighbors(t.key).some(isMine)) return true;
    return t.overseas && t.port && overseasReachable(t);   // sea assault on a beachhead
  }
  function attack(key, count) {
    const t = T(key);
    count = clamp(count || G.jobs.soldier, 1, G.jobs.soldier);
    if (!canAttack(t)) return false;
    const fs = forceStats(count);
    let atk = (fs.atk + fs.morale) * rnd(0.9, 1.1);
    atk *= 1 + flagBonus('atk') + G.bias.atk + (G.statuses.heroic ? 0.10 : 0)
      + (hasTech('war1') ? 0.05 : 0)                       // Drill
      + (G.fest.heroes > 0 ? 0.10 : 0)                     // Festival of Heroes
      + (G.tier >= 3 && hasTech('war3') ? 0.05 : 0);       // Elite Guard vanguard
    let def = t.warriors * D.FACTIONS[t.owner].pw * D.TERRAIN[t.terrain].def * rnd(0.9, 1.1);
    if (t.fortress) def *= 1.5;
    // siege ability cuts fortress / mountain defense (Siegecraft bites harder)
    const siegePer = hasTech('war2') ? 0.03 : 0.02;
    const siegeCut = 1 - clamp(fs.siege * siegePer * (1 + flagBonus('siege')), 0, 0.55);
    if (t.fortress || t.terrain === 'mtn') def *= siegeCut;
    const win = atk >= def;
    const lossFrac = clamp((win ? def / atk : atk / def) * 0.4, 0.05, 0.9);
    const losses = Math.min(count, Math.max(win ? 0 : 1, Math.round(count * lossFrac)));
    killSoldiers(losses);
    if (win) {
      const fac = t.owner;
      t.owner = 'player'; t.warriors = 0; const wasCamp = t.camp; t.camp = false;
      G.stats.battlesWon++; G.stats.tilesTaken++;
      setStatus('heroic', 5);
      log(`🎖️ Victory at ${tileName(t)}! ${wasCamp ? 'The camp is razed. ' : ''}Losses: ${losses}.`, 'good');
      // faction collapse: no camps left -> their tiles go neutral
      if (!Object.values(G.tiles).some(x => x.owner === fac && x.camp)) {
        Object.values(G.tiles).forEach(x => { if (x.owner === fac) { x.owner = 'neutral'; x.warriors = 0; } });
        delete G.raidTimers[fac];
        log(`🏳️ The ${D.FACTIONS[fac].name} submit! Their lands lie open to your claim.`, 'good');
      }
      checkTier(); checkVictory();
    } else {
      G.stats.battlesLost++;
      setStatus('fearful', 4);
      log(`💀 Defeat at ${tileName(t)}. ${losses} soldiers fell; the rest fled home.`, 'bad');
    }
    emit('all'); return true;
  }

  function canAbsorb(t) {
    return t.owner === 'argive' && !G.over && G.influence >= 40 && happiness() >= 55 &&
      neighbors(t.key).some(isMine);
  }
  function absorb() {
    const seat = Object.values(G.tiles).find(t => t.owner === 'argive' && t.seat);
    if (!seat || !canAbsorb(seat)) return false;
    G.influence -= 40;
    Object.values(G.tiles).forEach(t => {
      if (t.owner === 'argive') { t.owner = 'player'; t.warriors = 0; t.camp = false; t.explored = true; G.stats.tilesTaken++; }
    });
    G.pop += 6;
    log('🏺 The Argive Remnant joins the League in peace! Their four tiles and six families are yours.', 'good');
    checkTier(); checkVictory(); emit('all'); return true;
  }

  // decrees
  function toggleFamilies() { G.decrees.families = !G.decrees.families; emit('all'); }
  function holdFestival() {
    const d = D.DECREES.festival;
    if (G.over || G.decrees.festivalCd > 0 || G.res.food < d.cost.food || G.res.gold < d.cost.gold) return false;
    G.res.food -= d.cost.food; G.res.gold -= d.cost.gold;
    G.decrees.festivalBoost = d.happyBoost; G.decrees.festivalCd = d.cooldown;
    log('🎉 A festival fills the streets — spirits soar!', 'good');
    emit('all'); return true;
  }
  function conscript() {
    const d = D.DECREES.conscription;
    if (G.over || countB('barracks') === 0 || idle() < d.pop || G.jobs.soldier + d.pop > soldierCap()) return false;
    G.jobs.soldier += d.pop;
    setStatus('fearful', 2);
    log(`🪖 Conscription: ${d.pop} folk pressed into the militia.`, '');
    emit('all'); return true;
  }

  // job management
  function jobAdd(j, n) {
    n = n || 1;
    if (j === 'soldier') return false;             // soldiers via barracks only
    const add = Math.min(n, idle());
    if (add <= 0) return false;
    G.jobs[j] += add; emit('pop'); return true;
  }
  function jobRemove(j, n) {
    n = Math.min(n || 1, G.jobs[j]);
    if (n <= 0) return false;
    if (j === 'soldier') { killSoldiers(n); emit('pop'); return true; }
    G.jobs[j] -= n;
    emit('pop'); return true;
  }
  function autoBalance() {
    // return everyone but soldiers to idle, then fill building slots
    ['farmer', 'hunter', 'builder', 'miner'].forEach(j => G.jobs[j] = 0);
    const want = { farmer: 0, hunter: 0, builder: 0, miner: 0 };
    ownedTiles().forEach(t => t.buildings.forEach(bId => {
      const b = D.BUILDINGS[bId];
      if (b.job) want[b.job] += b.slots;
    }));
    want.builder += 2; // construction hands
    ['farmer', 'hunter', 'builder', 'miner'].forEach(j => {
      G.jobs[j] = Math.min(want[j], idle());
    });
    emit('pop');
  }

  // ---------- capital tiers (T1 Early → T2 Developed → T3 Grand/Porphyrogennetos) ----------
  function checkTier() {
    if (G.tier === 1) {
      const types = new Set(); ownedTiles().forEach(t => t.buildings.forEach(b => types.add(b)));
      if (G.pop >= 25 && types.size >= 3 && ownedTiles().length >= 2 && happiness() >= 40) {
        G.tier = 2;
        log('🏛️ AN AGE BEGINS — your seat is now a DEVELOPED CAPITAL (T2). Choose your dynasty\'s banner!', 'gold');
        emit('tier2');
      }
    } else if (G.tier === 2) {
      const cap = T(G.capital);
      if (G.pop >= 80 && cap.dl >= 30 && hasTech('cult2') && countB('forge') >= 1 && happiness() >= 50) {
        G.tier = 3;
        log('👑 PORPHYROGENNETOS — your capital is a GRAND CAPITAL (T3)! The Elite Guard musters; wonders await.', 'gold');
        emit('tier3');
      }
    }
  }
  function chooseFlag(id) {
    const f = D.FLAGS.find(x => x.id === id);
    if (!f) return false;
    G.flag = f;
    log(`⚑ The ${f.dynasty} raises ${f.name} over ${G.capitalName}! (${f.btxt})`, 'gold');
    emit('all'); return true;
  }

  // ---------- the campaign acts ----------
  // Act I: unite the Peloponnese → Act II: unify Greece → Act III: the sea opens.
  const mainlandTiles = () => Object.values(G.tiles).filter(t => t.naval === -1);
  function actInfo() {
    const pelo = Object.values(G.tiles).filter(t => !t.seaGroup);
    const peloSeats = pelo.filter(t => t.seat);
    const main = mainlandTiles();
    const mainSeats = main.filter(t => t.seat);
    const greekSeats = Object.values(G.tiles).filter(t => t.seat && (!t.seaGroup || t.seaGroup === 'greece'));
    return {
      act: G.act,
      peloOwned: pelo.filter(isMine).length, peloTotal: pelo.length,
      peloSeatsOwned: peloSeats.filter(isMine).length, peloSeatsTotal: peloSeats.length,
      mainOwned: main.filter(isMine).length, mainTotal: main.length,
      mainSeatsOwned: mainSeats.filter(isMine).length, mainSeatsTotal: mainSeats.length,
      greekSeatsOwned: greekSeats.filter(isMine).length, greekSeatsTotal: greekSeats.length,
    };
  }
  function checkVictory() {
    if (G.over) return;
    const a = actInfo();
    if (G.act === 1 && a.peloOwned >= C.VICTORY_TILES && a.peloSeatsOwned === a.peloSeatsTotal) {
      G.act = 2;
      log('👑 THE LEAGUE ASSEMBLES — the Peloponnese is united! ACT II: march north and unify all Greece.', 'gold');
      emit('act1');
    } else if (G.act === 2 && a.mainSeatsOwned === a.mainSeatsTotal && a.mainOwned >= a.mainTotal - 4) {
      G.act = 3;
      log('👑 THE KINGDOM OF HELLAS — Greece is unified! The Naval branch opens: build ships and take the sea.', 'gold');
      emit('act2');
    } else if (G.act === 3 && !G.victory && a.greekSeatsOwned === a.greekSeatsTotal) {
      G.victory = true;
      log('🏛️ HELLAS UNITED — every Greek seat from Kythira to Thrace flies your banner. The Empire Stage awaits (P5).', 'gold');
      emit('victory');
    }
  }

  // ---------- time ----------
  function tickDay() {
    if (G.over || G.victory === 'shown') { /* sandbox continues if victory acknowledged */ }
    G.day++;
    if ((G.day - 1) % C.DAYS_PER_SEASON === 0 && G.day > 1) {
      G.seasonIx = (G.seasonIx + 1) % 4;
      if (G.seasonIx === 0) G.year++;
      log(`— ${season()}, Year ${G.year} —`, 'season');
      if (season() === 'Winter') log('❄ Winter: farms stall, foraging thins. Live on your stores.', '');
    }
    produce(); popTick(); timersTick(); raidsTick(); researchTick(); checkTier(); checkVictory();
    emit('day');
  }
  function update(dtMs) {
    if (!G || G.over) return;
    acc += dtMs * G.speed;
    let guard = 0;
    while (acc >= C.DAY_MS && guard++ < 30) { acc -= C.DAY_MS; tickDay(); }
  }
  function skipDays(n) { for (let i = 0; i < n; i++) tickDay(); emit('all'); }

  // ---------- save/load ----------
  function save() {
    try { localStorage.setItem('eb_save1', JSON.stringify(G)); log('💾 Game saved.'); return true; }
    catch (e) { return false; }
  }
  function load() {
    try {
      const s = localStorage.getItem('eb_save1');
      if (!s) return false;
      G = JSON.parse(s);
      // migrate pre-Phase-4 saves
      G.techs = G.techs || []; G.research = G.research || null;
      G.culture = G.culture || 0; G.act = G.act || (G.victory ? 2 : 1);
      G.fest = G.fest || { heroes: 0, forge: 0, sea: 0 }; G.festCd = G.festCd || {};
      emit('all'); log('📂 Game loaded.'); return true;
    } catch (e) { return false; }
  }
  const hasSave = () => { try { return !!localStorage.getItem('eb_save1'); } catch (e) { return false; } };

  // ---------- naming ----------
  function tileName(t) { return t.name || `${t.regionName} ${D.TERRAIN[t.terrain].name.toLowerCase()}`; }
  function genColonyName() {
    const pre = ['Nea', 'Kalli', 'Mega', 'Palaio', 'Chryso', 'Lefko'];
    const root = ['polis', 'thera', 'chora', 'kome', 'limen', 'oria'];
    return pre[ri(0, pre.length - 1)] + root[ri(0, root.length - 1)];
  }

  // public API
  return {
    newGame, update, skipDays, save, load, hasSave,
    get state() { return G; },
    neighbors, distFromCapital, roadConnected, tileName,
    happiness, prodMult, popCap, foodCap, soldierCap, dailyFood, idle, assigned, countB, slots,
    canScout, scout, canClaim, claim, claimCost, canColonize, colonize,
    canBuild, build, canRoad, road, canRecruit, recruit,
    canAttack, attack, canAbsorb, absorb,
    toggleFamilies, holdFestival, conscript,
    jobAdd, jobRemove, autoBalance, chooseFlag,
    // Phase 3 API
    metalCap, tool: () => tool(), forceStats, bestTierName,
    canCraftTool, craftTool, canEquip, equipTroops,
    canBuildShip, buildShip, marketSell, marketBuy,
    overseasReachable, regionUnlocked, hasRegionFoothold,
    // Phase 4 API
    hasTech, canResearch, setResearch, rpPerDay, culturePerDay,
    canFest, holdFest, actInfo,
    season: () => G ? C.SEASONS[G.seasonIx] : 'Spring',
    setSpeed: s => { if (G) { G.speed = s; emit('hud'); } },
  };
})();
