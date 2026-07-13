// ============================================================================
// EMPIRE BUILDER — UI layer: HUD, panels, modals, main loop
// ============================================================================
window.UI = (function () {
  const D = window.DATA, C = D.CONST;
  const $ = id => document.getElementById(id);
  let selectedKey = null, lastT = 0;
  const ICON = { wood: '🪵', stone: '🪨', food: '🍖', gold: '🪙', copper: '🟠', tin: '⚪', bronze: '🟤',
    iron: '⛓️', lapis: '🔵', obsidian: '🟣', copper_ore: '🟠', tin_ore: '⚪', iron_ore: '⛓️', lapis_ore: '🔵', obsidian_ore: '🟣' };
  const rcost = c => Object.entries(c).map(([r, v]) => `${v}${ICON[r] || ' ' + r}`).join(' ');
  const NAVAL_REACH = ['coastal only', 'Greek isles · Balkans · Asia Minor · S. Italy', '+ distant Iberia', '+ obsidian rams'];

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
    else if (ev === 'day') { paintHUD(); paintLog(); MapView.draw(); paintTilePanel(); paintPop(); paintIndustry(); paintDiplo(); }
    else if (ev === 'pop') { paintPop(); paintHUD(); paintIndustry(); }
    else if (ev === 'hud') paintSpeed();
    else if (ev === 'tile') { MapView.draw(); paintTilePanel(); }
    else if (ev === 'tier2') showFlagPicker();
    else if (ev === 'tier3') showTier3();
    else if (ev === 'act1') showAct1();
    else if (ev === 'act2') showAct2();
    else if (ev === 'act4') showAct4();
    else if (ev === 'act5') showAct5();
    else if (ev === 'victory5') showVictory5();
    else if (ev === 'diplo') showDiploEvent();
    else if (ev === 'mode') { paintModes(); MapView.draw(); }
    else if (ev === 'victory') showVictory();
    else if (ev === 'defeat') showDefeat();
    else paintAll();
  }
  function paintAll() { paintHUD(); paintPop(); paintDecrees(); paintIndustry(); paintDiplo(); paintModes(); paintLog(); paintTilePanel(); paintSpeed(); MapView.draw(); }
  function ingotSummary(R) {
    return ['copper', 'bronze', 'iron', 'lapis', 'obsidian'].filter(m => (R[m] || 0) >= 1)
      .map(m => `${ICON[m]}${Math.floor(R[m])}`).join(' ');
  }

  // ---------- Industry · Army · Trade · Navy panel (Phase 3) ----------
  function paintIndustry() {
    const G = Game.state, R = G.res;
    const cur = D.TOOLS[G.tool], nxt = D.TOOLS[G.tool + 1];
    let tools = `<div class="isec"><b>🛠️ Tools:</b> ${cur.name} <span class="dim">×${cur.yield} yield · −${Math.round(cur.hazardCut * 100)}% hazard</span> `;
    if (nxt) tools += `<button class="mini" onclick="Game.craftTool()" ${Game.canCraftTool() ? '' : 'disabled'} title="Tool Workshop + ${rcost(nxt.recipe)}">⬆ ${nxt.name} (${rcost(nxt.recipe)})</button>`;
    else tools += `<span class="good">max</span>`;
    if (G._mineBlocked) tools += ` <span class="warn" title="Some ore needs a better pickaxe">⚠ ore locked</span>`;
    tools += `</div>`;

    let army = `<div class="isec"><b>⚔️ Army</b> ${G.jobs.soldier} <span class="dim">best: ${Game.bestTierName()}</span><div class="army">`;
    D.GEAR_TIERS.forEach((g, i) => {
      const n = G.army[g.id] || 0;
      army += `<span class="chip" title="power ${g.power} · def ${g.def} · siege ${g.siege} · morale ${g.morale}">${g.name} <b>${n}</b>`;
      if (i > 0) army += ` <button class="mini" onclick="Game.equipTroops(${i},1)" ${Game.canEquip(i) ? '' : 'disabled'} title="upgrade 1 → ${g.name} (${rcost(g.cost)}); needs Forge">▲</button>`;
      army += `</span>`;
    });
    army += `</div>${Game.countB('forge') === 0 ? '<span class="dim">Build a Forge to equip metal tiers.</span>' : ''}</div>`;

    let trade = `<div class="isec"><b>🐫 Trade</b> `;
    if (Game.countB('resource_market') > 0) {
      trade += `<span class="dim">sell ×10:</span> `;
      ['wood', 'stone', 'copper', 'iron', 'gold' === 'never' ? 'x' : 'bronze'].forEach(r =>
        trade += `<button class="mini" onclick="Game.marketSell('${r}',10)" ${(R[r] || 0) >= 10 ? '' : 'disabled'} title="+${(10 * C.MARKET_SELL)}🪙">${ICON[r]}</button>`);
    } else trade += `<span class="dim">build a Resource Market & Trade Depots.</span>`;
    trade += `</div>`;

    let navy = `<div class="isec"><b>⚓ Navy</b> <span class="dim">reach: ${NAVAL_REACH[G.navalTier] || '—'}</span>`;
    if (G.act < 3) navy += ` <span class="dim">🔒 unify Greece first (Act ${G.act}/III)</span>`;
    else if (Game.countB('shipyard') > 0) {
      navy += `<div class="army">`;
      D.SHIPS.forEach(s => navy += `<button class="mini" onclick="Game.buildShip('${s.id}')" ${Game.canBuildShip(s.id) ? '' : 'disabled'} title="${s.tip} — ${rcost(s.cost)}">${s.name}${G.ships[s.id] ? ` ×${G.ships[s.id]}` : ''}</button>`);
      navy += `</div>`;
    } else navy += ` <span class="dim">research Shipwright, then build a Shipyard (coastal).</span>`;
    navy += `</div>`;

    $('industryPanel').innerHTML = `<h3 class="phead">⚒️ Industry · Army · Trade · Navy</h3>${tools}${army}${trade}${navy}`;
    paintTech();
  }

  // ---------- Phase 4: tech tree panel ----------
  function paintTech() {
    const G = Game.state;
    let head = '';
    if (G.research) {
      const t = D.TECHS.find(x => x.id === G.research.id);
      const pct = Math.min(100, Math.round(G.research.prog / t.cost * 100));
      const eta = Math.ceil((t.cost - G.research.prog) / Math.max(0.1, Game.rpPerDay()));
      head = `<div class="isec"><b>🔬 ${t.name}</b> <span class="dim">(${t.br})</span>
        <div class="tbar"><div class="tfill" style="width:${pct}%"></div></div>
        <span class="dim">${pct}% · ~${eta}d · ${Game.rpPerDay().toFixed(1)} RP/day</span></div>`;
    } else {
      head = `<div class="isec dim">🔬 No research active — pick a technology below. (${Game.rpPerDay().toFixed(1)} RP/day)</div>`;
    }
    const branches = D.TECH_BRANCHES.map(br => {
      const list = D.TECHS.filter(t => t.br === br);
      const done = list.filter(t => Game.hasTech(t.id)).length;
      const rows = list.map(t => {
        const owned = Game.hasTech(t.id);
        const active = G.research && G.research.id === t.id;
        const can = Game.canResearch(t);
        const lockTxt = t.act && G.act < t.act ? ' 🔒 needs a united Hellas'
          : (t.req && !Game.hasTech(t.req) ? ` 🔒 needs ${D.TECHS.find(x => x.id === t.req).name}` : '');
        return `<button class="bopt" onclick="Game.setResearch('${t.id}')" ${can ? '' : 'disabled'}
          title="${t.tip}${lockTxt}">${owned ? '✅' : active ? '⏳' : '🔬'} ${t.name}<i>${owned ? 'done' : t.cost + ' RP'}</i></button>`;
      }).join('');
      return `<details class="bmenu"><summary>${br} (${done}/${list.length})</summary>${rows}</details>`;
    }).join('');
    $('techPanel').innerHTML = `<h3 class="phead">🔬 Technology · 🏺 Culture ${Math.floor(G.culture)}
      <span class="dim">(+${Game.culturePerDay().toFixed(1)}/d)</span></h3>${head}${branches}`;
  }

  // ---------- Phase 5: map mode buttons ----------
  const MODE_META = { normal: ['🗺️', 'Normal'], political: ['👑', 'Political'], population: ['👥', 'Population'], resource: ['⛏️', 'Resource'], naval: ['⚓', 'Naval'] };
  function paintModes() {
    const G = Game.state; if (!G || !$('mapModes')) return;
    $('mapModes').innerHTML = D.MAP_MODES.map(m =>
      `<button class="mode ${G.mapMode === m ? 'on' : ''}" onclick="Game.setMapMode('${m}')" title="${MODE_META[m][1]} map">${MODE_META[m][0]} ${MODE_META[m][1]}</button>`).join('');
  }

  // ---------- Phase 5: diplomacy panel ----------
  function paintDiplo() {
    const G = Game.state; if (!G || !$('diploPanel')) return;
    if (!G.empires || !Object.keys(G.empires).length) { $('diploPanel').innerHTML = ''; return; }
    const rows = Object.entries(G.empires).map(([id, E]) => {
      const meta = D.EMPIRES[id];
      if (E.eliminated) return `<div class="isec dim"><b style="color:${meta.col}">■</b> ${meta.name} — <s>fallen</s></div>`;
      const st = E.status === 'war' ? '<span class="warn">⚔️ WAR</span>'
        : E.alliance ? '👑 Allied' : E.pact ? '🤝 Pact' : E.trade ? '⚖️ Trade' : E.nap ? '🕊️ NAP' : 'Peace';
      const op = Math.round(E.opinion);
      const opPct = Math.round((op + 100) / 2);
      const trib = E.tributesPlayer ? ' · <span class="good">pays YOU</span>' : E.playerTributes ? ' · <span class="warn">you pay them</span>' : '';
      const btns = Object.keys(D.DIPLO).map(a =>
        `<button class="mini" onclick="Game.diploAction('${id}','${a}')" ${Game.canDiplo(id, a) ? '' : 'disabled'} title="${D.DIPLO[a].tip}">${D.DIPLO[a].icon}</button>`).join('');
      return `<div class="isec">
        <b style="color:${meta.col}">■</b> <b>${meta.name}</b> ${meta.distant ? '<span class="dim">(distant)</span>' : ''} — ${st}${trib}
        <div class="obar" title="opinion ${op}"><div class="ofill" style="width:${opPct}%"></div></div>
        <span class="dim">⚔ ${Math.round(E.strength)} vs yours ${Math.round(Game.playerPower())} · ⚓ navy ${E.navy}</span>
        <div class="army">${btns}</div>
      </div>`;
    }).join('');
    $('diploPanel').innerHTML = `<h3 class="phead">🕊️ Diplomacy — the Eight Powers</h3>${rows}`;
  }

  // ---------- HUD ----------
  function paintHUD() {
    const G = Game.state, R = G.res;
    const h = Game.happiness();
    const stab = Game.stability(), cov = Math.round(Game.coverage() * 100);
    const realm = G.act >= 5 ? 'The Empire of Hellas' : G.act >= 3 ? 'Kingdom of Hellas' : G.act === 2 ? 'The Peloponnesian League' : 'Chiefdom of the Morea';
    $('hudTitle').innerHTML =
      `${G.flag ? `<img class="hudflag" src="${G.flag.png}" ${G.tier >= 3 ? 'style="outline:2px solid #7a3aa8"' : ''}>` : '⚑'} <b>${G.capitalName}</b>
       <span class="dim">· ${D.TIER_NAMES[G.tier]} (T${G.tier}) · ${realm}${G.flag ? ` · ${G.flag.dynasty}` : ''}</span>`;
    $('hudStats').innerHTML = [
      st('🛡️', stab + '%', `STABILITY — drives growth, morale, diplomacy & rebellion (${Game.warsActive()} wars)`, stab < 30 ? 'warn' : stab >= 70 ? 'good' : ''),
      st('🌾', cov + '%', 'Sustenance coverage (farms, lodges, foragers vs. population)', cov < 80 ? 'warn' : ''),
      st('😊', h + '%', 'Happiness', h < 30 ? 'warn' : h >= 75 ? 'good' : ''),
      st('👥', Math.floor(G.pop) + `<i>/${Game.popCap()}</i>`, 'Population / capacity'),
      st('🪵', Math.floor(R.wood), 'Wood'),
      st('🪨', Math.floor(R.stone), 'Stone'),
      st('⚒️', ingotSummary(R) || '—', 'Ingots (copper·bronze·iron·lapis·obsidian)'),
      st('🛠️', D.TOOLS[G.tool].name.split(' ')[0], `Mining tool: ${D.TOOLS[G.tool].name}`),
      st('🪙', Math.floor(R.gold), 'Gold'),
      st('🏺', Math.floor(G.culture), `Culture (+${Game.culturePerDay().toFixed(1)}/day) — fuels festivals`),
      st('🎖️', G.jobs.soldier + `<i>/${Game.soldierCap()}</i>`, `Army (best: ${Game.bestTierName()})`),
      st('🏛️', Math.floor(G.influence), 'Influence (claims tiles)'),
      st('🌤️', `${Game.season()} · Y${G.year} D${G.day}`, 'Season · Year · Day'),
    ].join('');
    const a = Game.actInfo();
    $('hudProgress').innerHTML = G.act === 1
      ? `ACT I ⚑ ${a.peloOwned}/${a.peloTotal} · ★ ${a.peloSeatsOwned}/${a.peloSeatsTotal}
         <span class="dim">— unite the Peloponnese (≥${C.VICTORY_TILES} tiles & every seat)</span>`
      : G.act === 2
      ? `ACT II ⚑ ${a.mainOwned}/${a.mainTotal} mainland · ★ ${a.mainSeatsOwned}/${a.mainSeatsTotal}
         <span class="dim">— unify Greece to open the sea</span>`
      : G.act === 3
      ? `ACT III ★ ${a.greekSeatsOwned}/${a.greekSeatsTotal} Greek seats
         <span class="dim">— iron tools + iron hulls open the Mineral Age</span>`
      : G.act === 4
      ? `ACT IV <span class="dim">— hold 3 overseas tiles at a Grand Capital (T3) → the EMPIRE AGE</span>`
      : `ACT V <span class="dim">— make every nearby empire bow, pay or ally → Master of the Middle Sea (400-tile world: Phase 6)</span>`;
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
           <button class="mini" onclick="Game.recruit()" ${Game.canRecruit() ? '' : 'disabled'} title="10🪵 3🪙 at the Barracks">recruit</button>`
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
    let html = `
      <button class="dec ${G.decrees.families ? 'on' : ''}" onclick="Game.toggleFamilies()" title="${D.DECREES.families.tip}">
        👪 Families ${G.decrees.families ? 'ON' : 'off'}</button>
      <button class="dec" onclick="Game.holdFestival()" title="${f.tip}"
        ${G.decrees.festivalCd > 0 || G.res.food < f.cost.food || G.res.gold < f.cost.gold ? 'disabled' : ''}>
        🎉 Festival${G.decrees.festivalCd > 0 ? ` (${G.decrees.festivalCd}d)` : ''}</button>
      <button class="dec" onclick="Game.conscript()" title="${D.DECREES.conscription.tip}"
        ${Game.countB('barracks') === 0 || Game.idle() < 5 ? 'disabled' : ''}>🪖 Conscript</button>`;
    // Phase 4 grand festivals (culture-fuelled, tech-gated)
    Object.entries(D.FESTS4).forEach(([id, fd]) => {
      if (!Game.hasTech(fd.tech)) return;
      const active = (G.fest[id] || 0) > 0, cd = G.festCd[id] || 0;
      html += `<button class="dec ${active ? 'on' : ''}" onclick="Game.holdFest('${id}')" title="${fd.tip} — costs ${Object.entries(fd.cost).map(([r, v]) => v + ' ' + r).join(' + ')}"
        ${Game.canFest(id) ? '' : 'disabled'}>${fd.icon} ${fd.name.replace('Festival of the ', '').replace('Festival of ', '')}${active ? ` ${G.fest[id]}d` : cd > 0 ? ` (${cd}d)` : ''}</button>`;
    });
    $('decrees').innerHTML = html;
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
    if (t.overseas && !Game.overseasReachable(t)) {
      el.innerHTML = `<h3>🌊 Beyond the horizon</h3>
        <div class="dim pad">Open sea toward <b>${t.regionName}</b> (${t.seaGroup}). Build a <b>Shipyard</b> on a
        coastal tile and launch ${t.naval >= 2 ? 'a <b>Lapis-Reinforced</b> ship' : 'an <b>Iron-Hulled</b> ship'} to reach it.</div>`;
      return;
    }
    if (!t.explored) {
      const scouting = G.scouts.find(s => s.key === t.key);
      el.innerHTML = `<h3>Unknown land</h3>
        <div class="dim">${t.regionName} — shrouded in fog.${t.overseas ? ' <b>Overseas</b> — land scouts by ship at the port.' : ''}</div>
        ${scouting ? `<div class="pad">🥾 Scouting… ${Math.ceil(scouting.daysLeft)}d left</div>`
          : `<button class="act" onclick="UI.act('scout')" ${Game.canScout(t) ? '' : 'disabled'}
              title="Needs a hunter; takes ${1 + t.danger} days; risk vs danger">🥾 Scout (${1 + t.danger}d)</button>`}
        ${t.danger >= 3 ? '<div class="warn pad">Travellers speak of danger here…</div>' : ''}`;
      return;
    }
    const own = t.owner === 'player';
    const emp = D.EMPIRES[t.owner] ? Game.state.empires[t.owner] : null;
    const empMeta = D.EMPIRES[t.owner] || null;
    const fac = (!emp && t.owner !== 'player' && t.owner !== 'neutral') ? D.FACTIONS[t.owner] : null;
    let html = `<h3>${Game.tileName(t)} ${t.seat ? '★' : ''}${t.sacred ? '✦' : ''}</h3>
      <div class="kv"><span>Region</span><b>${t.regionName}</b></div>
      <div class="kv"><span>Terrain</span><b>${D.TERRAIN[t.terrain].name}${t.coastal ? ' · coast' : ''}${t.port ? ' ⚓port' : ''}${t.ore ? ' · ⛏ore' : ''}${t.rich ? ' (rich!)' : ''}</b></div>
      <div class="kv"><span>Danger</span><b>${'☠'.repeat(t.danger) || '—'}</b></div>
      <div class="kv"><span>Owner</span><b>${own ? '⚑ You' : empMeta ? `<span style="color:${empMeta.col}">■</span> ${empMeta.name}` : fac ? `${fac.icon} ${fac.name}` : 'Unclaimed'}</b></div>
      <div class="kv"><span>Riches</span><b class="dim">${t.res}</b></div>`;
    if (t.ores && t.ores.length) {
      html += `<div class="kv"><span>Ores</span><b>${t.ores.map(o => {
        const od = D.ORES[o], locked = G.tool < od.toolReq;
        return `<span style="color:${od.dot}" title="${locked ? 'needs ' + D.TOOLS[od.toolReq].name : 'mineable now'}">${od.name}${locked ? ' 🔒' : ''}</span>`;
      }).join(' · ')}</b></div>`;
    }
    if (t.hazards && t.hazards.length) html += `<div class="kv"><span>Hazards</span><b class="warn">${t.volcanic ? '🌋 ' : ''}${t.hazards.join(' · ')}</b></div>`;
    if (fac) html += `<div class="pad dim">"${fac.flavor}"</div>
      <div class="kv"><span>Warriors</span><b>${t.warriors}${t.camp ? ' (camp)' : ''}${t.fortress ? ' 🏰' : ''}</b></div>`;
    if (empMeta) html += `<div class="pad dim">"${empMeta.tip}"</div>
      <div class="kv"><span>Garrison</span><b>${t.warriors}${t.fortress || t.seat ? ' 🏰' : ''}</b></div>
      <div class="kv"><span>Relations</span><b>${emp.status === 'war' ? '⚔️ AT WAR' : emp.alliance ? '👑 Allied' : emp.trade ? '⚖️ Trading' : emp.nap ? '🕊️ Pact' : 'Peace'} · opinion ${Math.round(emp.opinion)}</b></div>
      <div class="dim pad">Attacking will mean WAR. Manage relations in the Diplomacy panel →</div>`;

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
          title="${C.COLONIZE_POP} settlers + ${C.COLONIZE_WOOD}🪵">🏛️ Colonize (${C.COLONIZE_POP}👥 ${C.COLONIZE_WOOD}🪵)</button>`;
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
      const cost = Object.keys(b.cost).length ? rcost(b.cost) : 'free';
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
        <span class="dyn">${f.dynasty}</span>
        <i>${f.sym}</i>
        <span class="bon">${f.btxt}</span>
      </button>`).join('');
    modal(`<h2>🏛️ An Age Begins — a Developed Capital (T2)!</h2>
      <p>Your people look to a single banner. <b>Choose the dynasty whose standard you raise</b> —
      it will fly over your capital, your roads, and your armies.</p>
      <div class="fcards">${cards}</div>`);
  }
  function pickFlag(id) { Game.chooseFlag(id); closeModal(); paintAll(); }

  function showAct1() {
    const G = Game.state, s = G.stats;
    modal(`<h2>👑 THE LEAGUE ASSEMBLES — Act I complete</h2>
      <p><b>The Peloponnese is united.</b> Sixty tiles, eleven regions, one banner${G.flag ? ` — ${G.flag.name} of the ${G.flag.dynasty}` : ''}.</p>
      <p><b>ACT II begins:</b> the north lies open. March through the Isthmus and unify
      <b>all of mainland Greece</b> — Attica, Boeotia, Thessaly, Epirus, Macedonia, Thrace —
      before the sea can be yours.</p>
      <div class="vstats">Year ${G.year} · Population ${Math.floor(G.pop)} ·
        Battles ${s.battlesWon}W/${s.battlesLost}L · Raids ${s.raidsSuffered} · Hazards ${s.hazards || 0}</div>
      <button class="act" onclick="UI.closeModal2()">To the Isthmus! (continue)</button>`);
  }
  function showAct2() {
    modal(`<h2>👑 THE KINGDOM OF HELLAS — Greece is unified!</h2>
      <p>From Kalamata to Thrace, every mainland seat bows to ${Game.state.capitalName}.
      The <b>Naval branch</b> of the tech tree is now open.</p>
      <p><b>ACT III:</b> research <b>Shipwright</b>, raise a coastal <b>Shipyard</b>, and launch
      hulls of iron, lapis and obsidian. The isles — Cyclades, Crete, the Aegean — and the wider
      Mediterranean await your sails.</p>
      <button class="act" onclick="UI.closeModal2()">To the sea! (continue)</button>`);
  }
  function showTier3() {
    modal(`<h2 style="color:#b57edc">👑 PORPHYROGENNETOS — the Grand Capital (T3)</h2>
      <p><b>${Game.state.capitalName}</b> now ranks among the great cities of the age.
      Your banner is framed in imperial purple; the <b>Elite Guard</b> musters
      (+10 soldier cap${Game.hasTech('war3') ? ', +10% defense' : ''}), and with High Culture the
      <b>Shrine of Kings</b> wonder may rise.</p>
      <button class="act" onclick="UI.closeModal2()">Let the age be recorded</button>`);
  }
  function showVictory() {
    const G = Game.state, s = G.stats;
    modal(`<h2>🏛️ HELLAS UNITED</h2>
      <p><b>Every Greek seat — from Kythira to Thrace, Delos to Knossos — flies the banner of the
      ${G.flag ? G.flag.dynasty : 'League'}.</b></p>
      <p class="dim">Acts I–III complete. Beyond the horizon: Illyria, Italy, Asia Minor, Iberia…
      and the Empire Stage (Phase 5). Keep ruling in sandbox, or start a new dynasty.</p>
      <div class="vstats">Year ${G.year} · Population ${Math.floor(G.pop)} · Tier ${G.tier} ·
        Techs ${G.techs.length}/${D.TECHS.length} · Battles ${s.battlesWon}W/${s.battlesLost}L</div>
      <button class="act" onclick="UI.closeModalV()">Continue ruling (sandbox)</button>`);
  }
  function showAct4() {
    modal(`<h2>⛏️ ACT IV — THE MINERAL AGE</h2>
      <p>Iron tools bite deeper; iron hulls sail farther. <b>Lapis and obsidian</b> wait in
      Mani's burning shafts, on Delos, in Iberia's shadowed hills — the metals that will arm
      your empire.</p>
      <p class="dim">Reach a Grand Capital (T3) and hold 3 overseas tiles to enter the Empire Age.</p>
      <button class="act" onclick="UI.closeModal2()">Dig deep (continue)</button>`);
  }
  function showAct5() {
    modal(`<h2>👑 ACT V — THE EMPIRE AGE</h2>
      <p>The eight powers now treat ${Game.state.capitalName} as a rival throne. Envoys arrive
      with demands; fleets probe your ports. <b>Tribute, alliances, blockades, invasions</b> —
      the games of empires begin.</p>
      <p><b>Goal:</b> every nearby empire must bow (tribute), march beside you (alliance), or fall.</p>
      <p class="dim">Beyond it: Phase 6 — the volcano, adamantine, and the FULL 400-tile Mediterranean.</p>
      <button class="act" onclick="UI.closeModal2()">Let them come</button>`);
  }
  function showVictory5() {
    const G = Game.state;
    modal(`<h2>🌊 MASTER OF THE MIDDLE SEA</h2>
      <p><b>Every nearby empire bows, pays, or marches beside the ${G.flag ? G.flag.dynasty : 'League'}.</b>
      From the Peloponnese to Sicily and the Anatolian shore, the sea answers to ${G.capitalName}.</p>
      <p class="dim">The finale awaits in Phase 6: the volcano's adamantine heart and the full
      400-tile Mediterranean — Carthage, Kemet, Gaul, Mesopotamia.</p>
      <button class="act" onclick="UI.closeModal2()">Rule on (sandbox)</button>`);
  }
  function showDiploEvent() {
    const G = Game.state, p = G.pendingDiplo; if (!p) return;
    const meta = D.EMPIRES[p.empire];
    if (p.kind === 'demand') {
      modal(`<h2 style="color:${meta.col}">🗡️ An ultimatum from the ${meta.name}</h2>
        <p>"${G.capitalName} grows fat. Pay <b>${p.gold} gold</b> — or feed our soldiers instead."</p>
        <p class="dim">Refusing risks war. Paying without gold makes you their tributary.</p>
        <button class="act" onclick="Game.resolveDiplo(true);UI.closeModal2()">💰 Pay them</button>
        <button class="act warlike" onclick="Game.resolveDiplo(false);UI.closeModal2()">🗡️ Refuse — let them try</button>`);
    } else if (p.kind === 'offer_trade') {
      modal(`<h2 style="color:${meta.col}">⚖️ Envoys of the ${meta.name}</h2>
        <p>"Our ships are heavy with goods. Open your ports — <b>+2 gold/day for us both</b>."</p>
        <button class="act" onclick="Game.resolveDiplo(true);UI.closeModal2()">⚖️ Accept the trade</button>
        <button class="act" onclick="Game.resolveDiplo(false);UI.closeModal2()">Decline</button>`);
    } else if (p.kind === 'offer_peace') {
      modal(`<h2 style="color:${meta.col}">🏳️ The ${meta.name} sues for peace</h2>
        <p>Bloodied and weary, they offer peace — <b>and tribute to YOU</b>.</p>
        <button class="act" onclick="Game.resolveDiplo(true);UI.closeModal2()">🏳️ Accept their submission</button>
        <button class="act warlike" onclick="Game.resolveDiplo(false);UI.closeModal2()">⚔️ Fight on</button>`);
    }
  }
  function closeModal2() { closeModal(); paintAll(); }
  function closeModalV() { Game.state.victory = 'shown'; closeModal(); }
  function showDefeat() {
    modal(`<h2>💀 The Chiefdom has fallen</h2>
      <p>The last families scattered to the hills. The Morea will remember another name.</p>
      <button class="act" onclick="localStorage.removeItem('eb_save1');location.reload()">Try again</button>`);
  }

  return { init, on, selectTile, act, pickStart, pickFlag, resume, closeModalV, closeModal2 };
})();
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', UI.init);
else UI.init();
