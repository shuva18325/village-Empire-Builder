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
      stats: { battlesWon: 0, battlesLost: 0, raidsSuffered: 0, tilesTaken: 0 },
    };
    // apply start bias
    const b = start.bias || {};
    ['food', 'wood', 'stone', 'metal', 'gold'].forEach(r => { if (b[r]) G.res[r] += b[r]; });
    if (b.influence) G.influence += b.influence;
    G.bias = { atk: b.atk || 0, def: b.def || 0, happy: b.happy || 0 };

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
    ownedTiles().forEach(t => t.buildings.forEach(b => cap += D.BUILDINGS[b].foodCap || 0));
    return cap;
  }
  function soldierCap() {
    let cap = C.SOLDIER_CAP_BASE;
    ownedTiles().forEach(t => t.buildings.forEach(b => cap += D.BUILDINGS[b].soldierCap || 0));
    return cap;
  }
  function countB(id) { let n = 0; ownedTiles().forEach(t => t.buildings.forEach(b => { if (b === id) n++; })); return n; }
  function assigned() { return D.JOBS.reduce((s, j) => s + G.jobs[j], 0); }
  function idle() { return Math.max(0, Math.floor(G.pop) - assigned()); }
  function flagBonus(k) { return (G.flag && G.flag.bonus[k]) || 0; }

  // food source variety (forage + hunt + farm active)
  function foodSources() {
    let n = 0;
    if (idle() > 0) n++;                                   // foragers
    if (G.jobs.hunter > 0 && countB('hunters_lodge') > 0) n++;
    if (G.jobs.farmer > 0 && countB('farm') > 0) n++;
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
    h += Math.min(15, countB('shrine') * (D.BUILDINGS.shrine.happy)); // culture
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
    const gains = { food: 0, wood: 0, stone: 0, metal: 0, gold: 0 };
    // foragers: idle pop scrapes by
    gains.food += idle() * 0.2 * (season() === 'Winter' ? 0.5 : 1);

    ownedTiles().forEach(t => {
      const connBonus = (t.key === G.capital || conn.has(t.key)) ? 1 : 0.75;
      t.buildings.forEach(bId => {
        const b = D.BUILDINGS[bId];
        if (!b.out) return;
        const take = Math.min(b.slots, pools[b.job] || 0);
        pools[b.job] -= take;
        if (!take) return;
        let mult = pm * connBonus;
        if (bId === 'farm') mult *= C.SEASON_FARM[season()];
        if (bId === 'hunters_lodge') mult *= C.SEASON_HUNT[season()];
        if (bId === 'mine') mult *= t.rich ? 2 : (t.ore ? 1.5 : 1);
        if (bId === 'market' && t.port) mult *= 1.5;
        gains[b.out.res] += take * b.out.per * mult;
      });
    });
    // hunters without a lodge still hunt the wilds (less well); farmers glean
    gains.food += (pools.hunter || 0) * 1.2 * C.SEASON_HUNT[season()] * pm;
    gains.food += (pools.farmer || 0) * 0.3;
    // development creeps up on happy, fed, connected settlements (docs/01 §7)
    if (happiness() >= 55) ownedTiles().forEach(t => {
      if (t.settled) t.dl = Math.min(100, t.dl + (conn.has(t.key) ? 0.2 : 0.1));
    });
    G.res.food = Math.min(foodCap(), G.res.food + gains.food);
    G.res.wood += gains.wood; G.res.stone += gains.stone;
    G.res.metal += gains.metal; G.res.gold += gains.gold;
    G.influence += C.INFLUENCE_BASE + countB('shrine') * D.BUILDINGS.shrine.influence + countB('market') * 0.3;
    // overworked check: more job slots demanded than people
    const demand = assigned();
    if (demand > Math.floor(G.pop)) setStatus('overworked', 3); else delete G.statuses.overworked;
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
    const order = ['soldier', 'miner', 'builder', 'hunter', 'farmer'];
    for (const j of order) if (G.jobs[j] > 0) {
      G.jobs[j]--;
      if (j === 'soldier') G.soldiersArmed = Math.min(G.soldiersArmed, G.jobs.soldier);
      return;
    }
  }
  function setStatus(id, days) { G.statuses[id] = Math.max(G.statuses[id] || 0, days); }

  // ---------- timers: scouts, builds, roads, decrees, statuses ----------
  function timersTick() {
    // statuses decay
    Object.keys(G.statuses).forEach(s => { if (--G.statuses[s] <= 0) delete G.statuses[s]; });
    // festival boost decay
    if (G.decrees.festivalBoost > 0) G.decrees.festivalBoost = Math.max(0, G.decrees.festivalBoost - 1.2);
    if (G.decrees.festivalCd > 0) G.decrees.festivalCd--;
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
      let defPw = G.jobs.soldier > 0
        ? (G.soldiersArmed * 5 + (G.jobs.soldier - G.soldiersArmed) * 3) * 0.6 : 2;
      defPw *= (1 + flagBonus('def') + G.bias.def);
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
    return !t.explored && !G.over && G.jobs.hunter > 0 &&
      !G.scouts.some(s => s.key === t.key) &&
      neighbors(t.key).some(n => n.explored || isMine(n));
  }
  function scout(key) {
    const t = T(key);
    if (!canScout(t)) return false;
    G.scouts.push({ key, daysLeft: 1 + t.danger });
    log(`🥾 Scouts set out for ${t.regionName} (${1 + t.danger} days)…`);
    emit('tile'); return true;
  }

  function claimCost(t) {
    return Math.ceil((C.CLAIM_BASE + distFromCapital(t.key) * C.CLAIM_PER_DIST) * (1 + flagBonus('claim')));
  }
  function canClaim(t) {
    return t.explored && t.owner === 'neutral' && !G.over &&
      neighbors(t.key).some(isMine) && G.influence >= claimCost(t);
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
    return Math.min(10, 3 + Math.floor(t.dl / 8) + (t.buildings.includes('village_center') ? 1 : 0));
  }
  function canBuild(t, bId) {
    const b = D.BUILDINGS[bId];
    if (!b || b.auto || !isMine(t) || !t.settled || G.over) return false;
    if (t.buildings.length + G.builds.filter(x => x.key === t.key).length >= slots(t)) return false;
    if (b.needs === 'farm' && !D.TERRAIN[t.terrain].farm) return false;
    if (b.needs === 'hunt' && !D.TERRAIN[t.terrain].hunt) return false;
    if (b.needs === 'lumber' && !D.TERRAIN[t.terrain].lumber) return false;
    if (b.needs === 'mine' && !D.TERRAIN[t.terrain].mine) return false;
    return Object.entries(b.cost).every(([r, v]) => G.res[r] >= v);
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
    G.jobs.soldier++;
    if (G.res.metal >= 1) { G.res.metal -= 1; G.soldiersArmed++; log('⚔️ Recruited an armed soldier (copper-grade).', 'good'); }
    else log('🪵 Recruited a militiaman (no metal for weapons).');
    emit('all'); return true;
  }

  function canAttack(t) {
    return t.explored && !G.over && t.owner !== 'player' && t.owner !== 'neutral' &&
      G.jobs.soldier > 0 && neighbors(t.key).some(isMine);
  }
  function attack(key, count) {
    const t = T(key);
    count = clamp(count || G.jobs.soldier, 1, G.jobs.soldier);
    if (!canAttack(t)) return false;
    const armedSent = Math.min(count, G.soldiersArmed);
    let atk = (armedSent * 5 + (count - armedSent) * 3) * rnd(0.9, 1.1);
    atk *= 1 + flagBonus('atk') + G.bias.atk + (G.statuses.heroic ? 0.10 : 0);
    let def = t.warriors * D.FACTIONS[t.owner].pw * D.TERRAIN[t.terrain].def * rnd(0.9, 1.1);
    if (t.fortress) def *= 1.5;
    const win = atk >= def;
    const lossFrac = clamp((win ? def / atk : atk / def) * 0.4, 0.05, 0.9);
    const losses = Math.min(count, Math.max(win ? 0 : 1, Math.round(count * lossFrac)));
    G.jobs.soldier -= losses;
    G.soldiersArmed = Math.max(0, G.soldiersArmed - Math.min(losses, armedSent));
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
    G.jobs[j] -= n;
    if (j === 'soldier') G.soldiersArmed = Math.min(G.soldiersArmed, G.jobs.soldier);
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

  // ---------- tier & victory ----------
  function checkTier() {
    if (G.tier !== 1) return;
    const types = new Set(); ownedTiles().forEach(t => t.buildings.forEach(b => types.add(b)));
    if (G.pop >= 25 && types.size >= 3 && ownedTiles().length >= 2 && happiness() >= 40) {
      G.tier = 2;
      log('🏛️ AN AGE BEGINS — your village is now an ORGANIZED SETTLEMENT (T2). Choose your banner!', 'gold');
      emit('tier2');
    }
  }
  function chooseFlag(id) {
    const f = D.FLAGS.find(x => x.id === id);
    if (!f) return false;
    G.flag = f;
    log(`⚑ The banner of ${f.name} flies over ${G.capitalName}! (${f.btxt})`, 'gold');
    emit('all'); return true;
  }
  function checkVictory() {
    if (G.victory || G.over) return;
    const mine = ownedTiles();
    const seats = Object.values(G.tiles).filter(t => t.seat);
    const allSeats = seats.every(isMine);
    if (mine.length >= C.VICTORY_TILES && allSeats) {
      G.victory = true;
      log('👑 THE LEAGUE ASSEMBLES — the Peloponnese is united! Act I complete.', 'gold');
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
    produce(); popTick(); timersTick(); raidsTick(); checkTier();
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
      G = JSON.parse(s); emit('all'); log('📂 Game loaded.'); return true;
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
    season: () => G ? C.SEASONS[G.seasonIx] : 'Spring',
    setSpeed: s => { if (G) { G.speed = s; emit('hud'); } },
  };
})();
