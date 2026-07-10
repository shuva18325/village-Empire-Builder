// ============================================================================
// EMPIRE BUILDER — UI layer: HUD, panels, modals, main loop
// ============================================================================
window.UI = (function () {
  const D = window.DATA, C = D.CONST;
  const $ = id => document.getElementById(id);
  let selectedKey = null, lastT = 0;

  // ---------- boot ----------
  function init() {
    MapView.init();
    $('speeds').innerHTML = ['⏸', '▶', '▶▶', '▶▶▶'].map((s, i) =>
      `<button class="spd" data-s="${i === 3 ? 4 : i}" id="spd${i}">${s}</button>`).join('');
    document.querySelectorAll('.spd').forEach(b =>
      b.addEventListener('click', () => { Game.setSpeed(+b.dataset.s); paintSpeed(); }));
    $('btnSave').addEventListener('click', () => Game.save());
    $('btnLoad').addEventListener('click', () => { if (Game.load()) { selectedKey = null; paintAll(); } });
    $('btnNew').addEventListener('click', () => { localStorage.removeItem('eb_save1'); location.reload(); });
    showStartPicker();
    requestAnimationFrame(loop);
  }
  function loop(t) {
    const dt = Math.min(100, t - lastT); lastT = t;
    Game.update(dt);
    requestAnimationFrame(loop);
  }

  // ---------- event hook from Game ----------
  function on(ev) {
    if (!Game.state) return;
    if (ev === 'log') paintLog();
    else if (ev === 'day') { paintHUD(); paintLog(); MapView.draw(); paintTilePanel(); paintPop(); }
    else if (ev === 'pop') { paintPop(); paintHUD(); }
    else if (ev === 'hud') paintSpeed();
    else if (ev === 'tile') { MapView.draw(); paintTilePanel(); }
    else if (ev === 'tier2') showFlagPicker();
    else if (ev === 'victory') showVictory();
    else if (ev === 'defeat') showDefeat();
    else paintAll();
  }
  function paintAll() { paintHUD(); paintPop(); paintDecrees(); paintLog(); paintTilePanel(); paintSpeed(); MapView.draw(); }

  // ---------- HUD ----------
  const TIERS = { 1: 'Primitive Village', 2: 'Organized Settlement' };
  function paintHUD() {
    const G = Game.state, R = G.res;
    const h = Game.happiness();
    const buffer = (R.food / Math.max(1, Game.dailyFood())).toFixed(1);
    $('hudTitle').innerHTML =
      `${G.flag ? `<img class="hudflag" src="${G.flag.png}">` : '⚑'} <b>${G.capitalName}</b>
       <span class="dim">· ${TIERS[G.tier]} (T${G.tier}) · Chiefdom of the Morea</span>`;
    $('hudStats').innerHTML = [
      st('🍖', Math.floor(R.food) + `<i>/${Game.foodCap()}</i>`, `Food (buffer ${buffer} days)`, R.food < Game.dailyFood() * 3 ? 'warn' : ''),
      st('😊', h + '%', 'Happiness', h < 30 ? 'warn' : h >= 75 ? 'good' : ''),
      st('👥', Math.floor(G.pop) + `<i>/${Game.popCap()}</i>`, 'Population / capacity'),
      st('🪵', Math.floor(R.wood), 'Wood'),
      st('🪨', Math.floor(R.stone), 'Stone'),
      st('⛓️', Math.floor(R.metal), 'Metal (arms soldiers)'),
      st('🪙', Math.floor(R.gold), 'Gold'),
      st('🎖️', G.jobs.soldier + `<i>/${Game.soldierCap()}</i>`, 'Soldiers / capacity'),
      st('🏛️', Math.floor(G.influence), 'Influence (claims tiles)'),
      st('🌤️', `${Game.season()} · Y${G.year} D${G.day}`, 'Season · Year · Day'),
    ].join('');
    const tiles = Object.values(G.tiles).filter(t => t.owner === 'player').length;
    $('hudProgress').innerHTML =
      `⚑ ${tiles}/60 tiles · ★ ${Object.values(G.tiles).filter(t => t.seat && t.owner === 'player').length}/11 seats
       <span class="dim">— unite ≥${C.VICTORY_TILES} tiles & every seat</span>`;
  }
  const st = (ic, v, tip, cls) => `<span class="stat ${cls || ''}" title="${tip}">${ic} ${v}</span>`;
  function paintSpeed() {
    const G = Game.state; if (!G) return;
    document.querySelectorAll('.spd').forEach((b, i) => {
      const v = i === 3 ? 4 : i;
      b.classList.toggle('on', G.speed === v);
    });
  }

  // ---------- population panel ----------
  const JOB_META = {
    farmer: ['🌾', 'Farmers', 'work Farms'], hunter: ['🏹', 'Hunters', 'work Lodges & scout'],
    builder: ['🔨', 'Builders', 'build, cut wood, run Markets'], miner: ['⛏️', 'Miners', 'work Quarries & Mines'],
    soldier: ['🎖️', 'Soldiers', 'defend & attack (recruit at Barracks)'],
  };
  function paintPop() {
    const G = Game.state;
    let rows = D.JOBS.map(j => {
      const [ic, nm, tip] = JOB_META[j];
      const ctl = j === 'soldier'
        ? `<button class="mini" onclick="Game.jobRemove('soldier',1)">−</button>
           <button class="mini" onclick="Game.recruit()" ${Game.canRecruit() ? '' : 'disabled'} title="20🍖 5🪵 (+1⛓️ if available)">recruit</button>`
        : `<button class="mini" onclick="Game.jobRemove('${j}',1)">−</button>
           <button class="mini" onclick="Game.jobAdd('${j}',1)">+</button>
           <button class="mini" onclick="Game.jobAdd('${j}',5)">+5</button>`;
      return `<div class="jrow" title="${tip}"><span>${ic} ${nm}</span><b>${G.jobs[j]}</b><span class="ctl">${ctl}</span></div>`;
    }).join('');
    rows += `<div class="jrow"><span>💤 Idle (forage)</span><b>${Game.idle()}</b>
             <span class="ctl"><button class="mini" onclick="Game.autoBalance()" title="Fill all building slots">auto</button></span></div>`;
    // statuses
    const SMETA = {
      wellfed: ['🍖 Well-Fed', '+happiness, +births', 'good'], prosperous: ['💰 Prosperous', '+growth', 'good'],
      heroic: ['🎖️ Heroic', '+attack, +happiness', 'good'], fearful: ['😨 Fearful', '−happiness', 'bad'],
      overworked: ['😓 Overworked', '−happiness', 'bad'],
    };
    const sts = Object.keys(G.statuses).map(s =>
      `<span class="chip ${SMETA[s][2]}" title="${SMETA[s][1]}">${SMETA[s][0]} ${G.statuses[s]}d</span>`).join('') ||
      '<span class="dim">no status effects</span>';
    $('popPanel').innerHTML = rows + `<div class="statuses">${sts}</div>`;
    paintDecrees();
  }

  function paintDecrees() {
    const G = Game.state;
    const f = D.DECREES.festival;
    $('decrees').innerHTML = `
      <button class="dec ${G.decrees.families ? 'on' : ''}" onclick="Game.toggleFamilies()" title="${D.DECREES.families.tip}">
        👪 Families ${G.decrees.families ? 'ON' : 'off'}</button>
      <button class="dec" onclick="Game.holdFestival()" title="${f.tip}"
        ${G.decrees.festivalCd > 0 || G.res.food < f.cost.food || G.res.gold < f.cost.gold ? 'disabled' : ''}>
        🎉 Festival${G.decrees.festivalCd > 0 ? ` (${G.decrees.festivalCd}d)` : ''}</button>
      <button class="dec" onclick="Game.conscript()" title="${D.DECREES.conscription.tip}"
        ${Game.countB('barracks') === 0 || Game.idle() < 5 ? 'disabled' : ''}>🪖 Conscript</button>`;
  }

  // ---------- log ----------
  function paintLog() {
    const G = Game.state;
    $('log').innerHTML = G.log.slice(0, 40).map(l =>
      `<div class="lg ${l.cls}"><span class="d">d${l.d}</span> ${l.msg}</div>`).join('');
  }

  // ---------- tile panel ----------
  function selectTile(key) { selectedKey = key; paintTilePanel(); }
  function paintTilePanel() {
    const G = Game.state, el = $('tilePanel');
    const t = selectedKey && G.tiles[selectedKey];
    if (!t) { el.innerHTML = '<div class="dim pad">Select a tile on the map.</div>'; return; }
    if (!t.explored) {
      const scouting = G.scouts.find(s => s.key === t.key);
      el.innerHTML = `<h3>Unknown land</h3>
        <div class="dim">${t.regionName} — shrouded in fog.</div>
        ${scouting ? `<div class="pad">🥾 Scouting… ${Math.ceil(scouting.daysLeft)}d left</div>`
          : `<button class="act" onclick="UI.act('scout')" ${Game.canScout(t) ? '' : 'disabled'}
              title="Needs a hunter; takes ${1 + t.danger} days; risk vs danger">🥾 Scout (${1 + t.danger}d)</button>`}
        ${t.danger >= 3 ? '<div class="warn pad">Travellers speak of danger here…</div>' : ''}`;
      return;
    }
    const own = t.owner === 'player';
    const fac = (t.owner !== 'player' && t.owner !== 'neutral') ? D.FACTIONS[t.owner] : null;
    let html = `<h3>${Game.tileName(t)} ${t.seat ? '★' : ''}${t.sacred ? '✦' : ''}</h3>
      <div class="kv"><span>Region</span><b>${t.regionName}</b></div>
      <div class="kv"><span>Terrain</span><b>${D.TERRAIN[t.terrain].name}${t.coastal ? ' · coast' : ''}${t.port ? ' ⚓port' : ''}${t.ore ? ' · ⛏ore' : ''}${t.rich ? ' (rich!)' : ''}</b></div>
      <div class="kv"><span>Danger</span><b>${'☠'.repeat(t.danger) || '—'}</b></div>
      <div class="kv"><span>Owner</span><b>${own ? '⚑ You' : fac ? `${fac.icon} ${fac.name}` : 'Unclaimed'}</b></div>
      <div class="kv"><span>Riches</span><b class="dim">${t.res}</b></div>`;
    if (fac) html += `<div class="pad dim">"${fac.flavor}"</div>
      <div class="kv"><span>Warriors</span><b>${t.warriors}${t.camp ? ' (camp)' : ''}${t.fortress ? ' 🏰' : ''}</b></div>`;

    if (own) {
      html += `<div class="kv"><span>Development</span><b>DL ${Math.floor(t.dl)} · ${dlBand(t.dl)}</b></div>`;
      if (t.settled) {
        html += `<div class="blist">${t.buildings.map(b => `<span class="chip" title="${D.BUILDINGS[b].tip}">${D.BUILDINGS[b].icon} ${D.BUILDINGS[b].name}</span>`).join('')}
          <span class="dim">(${t.buildings.length}/${Game.slots(t)} slots)</span></div>`;
        G.builds.filter(b => b.key === t.key).forEach(b =>
          html += `<div class="pad">🔨 ${D.BUILDINGS[b.b].name} — ${Math.ceil(b.daysLeft)}d</div>`);
        html += buildMenu(t);
      } else {
        html += `<button class="act" onclick="UI.act('colonize')" ${Game.canColonize(t) ? '' : 'disabled'}
          title="${C.COLONIZE_POP} settlers + ${C.COLONIZE_WOOD}🪵 ${C.COLONIZE_FOOD}🍖">🏛️ Colonize (${C.COLONIZE_POP}👥 ${C.COLONIZE_WOOD}🪵 ${C.COLONIZE_FOOD}🍖)</button>`;
      }
      if (!t.road) html += `<button class="act" onclick="UI.act('road')" ${Game.canRoad(t) ? '' : 'disabled'}
        title="Connects to the capital network: +25% output, banners, supply">🛤️ Road (${C.ROAD_STONE}🪨)</button>`;
    } else if (!fac) {
      html += `<button class="act" onclick="UI.act('claim')" ${Game.canClaim(t) ? '' : 'disabled'}>
        ⚑ Claim (${Game.claimCost(t)} influence)</button>
        ${!Game.neighbors(t.key).some(n => n.owner === 'player') ? '<div class="dim pad">Must border your lands.</div>' : ''}`;
    } else {
      const maxS = G.jobs.soldier;
      html += `<div class="pad">
        <input type="range" id="atkCount" min="1" max="${Math.max(1, maxS)}" value="${Math.max(1, maxS)}"
          oninput="document.getElementById('atkN').textContent=this.value" ${maxS ? '' : 'disabled'}>
        <span id="atkN">${Math.max(1, maxS)}</span> soldiers
        <button class="act warlike" onclick="UI.act('attack')" ${Game.canAttack(t) ? '' : 'disabled'}>⚔️ Attack</button></div>`;
      if (fac.absorbable) html += `<button class="act" onclick="UI.act('absorb')" ${Game.canAbsorb(t) ? '' : 'disabled'}
        title="40 influence, happiness ≥55 — their tiles & people join in peace">🏺 Absorb peacefully (40 inf)</button>`;
      if (!Game.neighbors(t.key).some(n => n.owner === 'player'))
        html += '<div class="dim pad">Must border your lands to attack.</div>';
    }
    el.innerHTML = html;
  }
  function dlBand(dl) {
    return dl >= 85 ? 'Metropolis' : dl >= 65 ? 'City' : dl >= 45 ? 'Developed' :
      dl >= 25 ? 'Town' : dl >= 10 ? 'Village' : 'Outpost';
  }
  function buildMenu(t) {
    const opts = Object.keys(D.BUILDINGS).filter(b => !D.BUILDINGS[b].auto).map(bId => {
      const b = D.BUILDINGS[bId];
      const cost = Object.entries(b.cost).map(([r, v]) => `${v}${{ wood: '🪵', stone: '🪨', food: '🍖', metal: '⛓️', gold: '🪙' }[r]}`).join(' ');
      const ok = Game.canBuild(t, bId);
      return `<button class="bopt" onclick="UI.act('build','${bId}')" ${ok ? '' : 'disabled'}
        title="${b.tip} — cost ${cost || 'free'} · ${b.days}d">${b.icon} ${b.name}<i>${cost}</i></button>`;
    }).join('');
    return `<details class="bmenu" open><summary>🔨 Build (${t.buildings.length}/${Game.slots(t)})</summary>${opts}</details>`;
  }

  function act(what, arg) {
    const k = selectedKey; if (!k) return;
    if (what === 'scout') Game.scout(k);
    else if (what === 'claim') Game.claim(k);
    else if (what === 'colonize') Game.colonize(k);
    else if (what === 'road') Game.road(k);
    else if (what === 'build') Game.build(k, arg);
    else if (what === 'attack') {
      const n = +(document.getElementById('atkCount') || {}).value || Game.state.jobs.soldier;
      Game.attack(k, n);
    }
    else if (what === 'absorb') Game.absorb();
    paintAll();
  }

  // ---------- modals ----------
  function modal(html) { $('modal').innerHTML = `<div class="mbox">${html}</div>`; $('modal').classList.add('show'); }
  function closeModal() { $('modal').classList.remove('show'); }

  function showStartPicker() {
    const cards = D.STARTS.map(s => `
      <button class="scard" onclick="UI.pickStart('${s.id}')">
        <b>${s.name}</b><span class="diff">${'●'.repeat(s.diff)}</span>
        <i>${s.tip}</i>
      </button>`).join('');
    modal(`<h2>⚑ Choose your starting region</h2>
      <p class="dim">The Peloponnese, sixty tiles of valley, mountain and coast. Unite it. (docs/15 · Act I)</p>
      <div class="scards">${cards}</div>
      ${Game.hasSave() ? `<button class="act" onclick="UI.resume()">📂 Resume saved game</button>` : ''}`);
  }
  function pickStart(id) { closeModal(); Game.newGame(id); paintAll(); }
  function resume() { if (Game.load()) { closeModal(); paintAll(); } }

  function showFlagPicker() {
    const cards = D.FLAGS.map(f => `
      <button class="fcard" onclick="UI.pickFlag('${f.id}')">
        <img src="${f.png}" alt="${f.name}">
        <b>${f.name}</b>
        <i>${f.sym}</i>
        <span class="bon">${f.btxt}</span>
      </button>`).join('');
    modal(`<h2>🏛️ An Age Begins — Organized Settlement!</h2>
      <p>Your people look to a single banner. <b>Choose your flag</b> — it will fly over your
      capital, your roads, and your armies.</p>
      <div class="fcards">${cards}</div>`);
  }
  function pickFlag(id) { Game.chooseFlag(id); closeModal(); paintAll(); }

  function showVictory() {
    const G = Game.state, s = G.stats;
    modal(`<h2>👑 THE LEAGUE ASSEMBLES</h2>
      <p><b>The Peloponnese is united.</b> Sixty tiles, eleven regions, one banner${G.flag ? ` — ${G.flag.name}` : ''}.</p>
      <p class="dim">Act I complete. Early naval technology is now within reach — Attica, the
      Cyclades and Crete wait beyond the horizon (Act II, next build phase).</p>
      <div class="vstats">Year ${G.year} · Population ${Math.floor(G.pop)} ·
        Battles ${s.battlesWon}W/${s.battlesLost}L · Raids suffered ${s.raidsSuffered}</div>
      <button class="act" onclick="UI.closeModalV()">Continue ruling (sandbox)</button>`);
  }
  function closeModalV() { Game.state.victory = 'shown'; closeModal(); }
  function showDefeat() {
    modal(`<h2>💀 The Chiefdom has fallen</h2>
      <p>The last families scattered to the hills. The Morea will remember another name.</p>
      <button class="act" onclick="localStorage.removeItem('eb_save1');location.reload()">Try again</button>`);
  }

  return { init, on, selectTile, act, pickStart, pickFlag, resume, closeModalV };
})();
window.addEventListener('DOMContentLoaded', UI.init);
