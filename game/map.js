// ============================================================================
// EMPIRE BUILDER — map renderer: a political map of the Hellenic world.
// Land is drawn as a merged landmass with real coastline strokes, shallow-water
// halos, region colours & labels (styled after classical atlas maps).
// ============================================================================
window.MapView = (function () {
  const D = window.DATA, C = D.CONST;
  let cv, ctx, selected = null, hoverKey = null;
  const flagImgs = {};                      // id -> HTMLImageElement

  // region colour palette (reference: prefecture-coloured atlas maps)
  const RCOL = {
    achaea: '#e8a04a', corinthia: '#ddc85a', elis: '#8fbf5f', arcadia: '#46aa9f',
    argolis_argos: '#e3de5e', argolis_nafplio: '#c9d45f', messenia: '#e8b854',
    laconia: '#a9c957', mani: '#c98d64', vatika: '#9cc465', kythira: '#67b8d8',
    attica: '#f0e04a', boeotia: '#d8ae56', euboea: '#84b25e', thessaly: '#e59a4c',
    epirus: '#58b396', macedonia: '#e5aa47', thrace: '#93d0d8', cyclades: '#d8b46f',
    crete: '#54c0a8', naegean: '#b4ccd8', illyria: '#c48d6d', moesia: '#a8b870',
    ionia: '#d8bc62', lydia: '#c8a256', magna_graecia: '#d0b05c', sicily: '#e0c060',
    iberia_east: '#c08a5e',
  };
  const shade = (hex, f) => {               // lighten (f>0) / darken (f<0)
    const n = parseInt(hex.slice(1), 16);
    const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + f))));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  const TERR_SHADE = { plains: 0.04, grass: 0.0, forest: -0.16, hills: -0.10, mtn: -0.24 };

  function init() {
    cv = document.getElementById('map');
    cv.width = C.GRID_W * C.TILE + 20;
    cv.height = C.GRID_H * C.TILE + 20;
    ctx = cv.getContext('2d');
    cv.addEventListener('click', onClick);
    cv.addEventListener('mousemove', onMove);
    D.FLAGS.forEach(f => {
      const im = new Image();
      im.src = f.png; flagImgs[f.id] = im;
      im.onload = () => draw();
    });
  }

  const px = t => 10 + t.c * C.TILE;
  const py = t => 10 + t.r * C.TILE;
  const pick = e => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (cv.width / rect.width) - 10;
    const y = (e.clientY - rect.top) * (cv.height / rect.height) - 10;
    return Math.floor(x / C.TILE) + ',' + Math.floor(y / C.TILE);
  };
  function onClick(e) {
    const t = Game.state && Game.state.tiles[pick(e)];
    selected = t ? t.key : null;
    if (window.UI) UI.selectTile(selected);
    draw();
  }
  function onMove(e) {
    const k = pick(e);
    if (k !== hoverKey) { hoverKey = k; draw(); }
  }

  // a tile is "on the map" (drawn as land) vs "beyond the horizon" (silhouette)
  const visible = t => !t.overseas || Game.overseasReachable(t);

  function draw() {
    if (!ctx) return;
    const G = Game.state;
    const S = C.TILE;

    // ---- the sea ----
    const grad = ctx.createLinearGradient(0, 0, cv.width, cv.height);
    grad.addColorStop(0, '#4a7fa5'); grad.addColorStop(0.5, '#3a6b91');
    grad.addColorStop(1, '#2c567a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.arc(30 + (i * 137) % (cv.width - 60), 24 + (i * 83) % (cv.height - 40), 7, Math.PI * .1, Math.PI * .9);
      ctx.stroke();
    }
    if (!G) return;
    const conn = Game.roadConnected();
    const tiles = Object.values(G.tiles);
    const vis = tiles.filter(visible);

    // ---- beyond-the-horizon silhouettes (distant lands, no detail) ----
    tiles.filter(t => !visible(t)).forEach(t => {
      ctx.fillStyle = 'rgba(190,205,215,.10)';
      ctx.fillRect(px(t), py(t), S, S);
    });

    // ---- shallow-water shelf halo around the landmass ----
    ctx.fillStyle = 'rgba(150,200,220,.30)';
    vis.forEach(t => ctx.fillRect(px(t) - 4, py(t) - 4, S + 8, S + 8));

    // ---- land fill (region colour, terrain-shaded; fog = unknown dark land) ----
    vis.forEach(t => {
      const x = px(t), y = py(t);
      if (!t.explored) {
        ctx.fillStyle = '#2b333f';
        ctx.fillRect(x, y, S, S);
      } else {
        const base = RCOL[t.region] || '#c0b070';
        ctx.fillStyle = shade(base, TERR_SHADE[t.terrain] || 0);
        ctx.fillRect(x, y, S, S);
        if (t.owner !== 'player') {          // unowned/enemy: slight wash
          ctx.fillStyle = 'rgba(20,26,36,.18)';
          ctx.fillRect(x, y, S, S);
        }
      }
    });

    // ---- faint inner tile grid on explored land ----
    ctx.strokeStyle = 'rgba(0,0,0,.09)'; ctx.lineWidth = 1;
    vis.forEach(t => { if (t.explored) ctx.strokeRect(px(t) + .5, py(t) + .5, S - 1, S - 1); });

    // ---- roads ----
    ctx.strokeStyle = '#efe0b0'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    vis.forEach(t => {
      if (!t.road) return;
      Game.neighbors(t.key).forEach(n => {
        if ((n.road || n.key === G.capital) && n.owner === 'player' && (n.c > t.c || (n.c === t.c && n.r > t.r) || n.key === G.capital)) {
          ctx.beginPath();
          ctx.moveTo(px(t) + S / 2, py(t) + S / 2);
          ctx.lineTo(px(n) + S / 2, py(n) + S / 2);
          ctx.stroke();
        }
      });
    });

    // ---- region borders (thin ink) + COASTLINE (bold ink around the landmass) ----
    const isLand = (c, r) => { const n = G.tiles[c + ',' + r]; return n && visible(n); };
    vis.forEach(t => {
      const x = px(t), y = py(t);
      // edges: [dc,dr, x1,y1,x2,y2]
      [[1, 0, x + S, y, x + S, y + S], [-1, 0, x, y, x, y + S],
       [0, 1, x, y + S, x + S, y + S], [0, -1, x, y, x + S, y]].forEach(([dc, dr, x1, y1, x2, y2]) => {
        const n = G.tiles[(t.c + dc) + ',' + (t.r + dr)];
        if (!n || !visible(n)) {              // COAST
          ctx.strokeStyle = '#233246'; ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        } else if (n.region !== t.region && t.explored && n.explored && (dc === 1 || dr === 1)) {
          ctx.strokeStyle = 'rgba(35,35,30,.55)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      });
    });

    // ---- ownership tint borders ----
    vis.forEach(t => {
      const x = px(t), y = py(t);
      if (!t.explored) return;
      if (t.owner === 'player') {
        ctx.strokeStyle = '#f4c400'; ctx.lineWidth = 2.2;
        ctx.strokeRect(x + 1.5, y + 1.5, S - 3, S - 3);
      } else if (t.owner !== 'neutral') {
        ctx.strokeStyle = D.FACTIONS[t.owner].col; ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x + 1.5, y + 1.5, S - 3, S - 3);
        ctx.setLineDash([]);
      }
    });

    // ---- per-tile icons & marks ----
    ctx.textAlign = 'center';
    vis.forEach(t => {
      const x = px(t), y = py(t);
      if (!t.explored) {
        ctx.fillStyle = 'rgba(255,255,255,.16)';
        ctx.font = '13px serif';
        ctx.fillText('?', x + S / 2, y + S / 2 + 5);
        if (G.scouts.some(sc => sc.key === t.key)) {
          ctx.font = '11px sans-serif'; ctx.fillText('🥾', x + S / 2, y + S - 4);
        }
        return;
      }
      // terrain glyphs (subtle, atlas-style)
      ctx.fillStyle = 'rgba(30,30,20,.5)'; ctx.font = '10px sans-serif';
      if (t.terrain === 'mtn') ctx.fillText('▲', x + S / 2, y + S / 2 + 3);
      else if (t.terrain === 'hills') ctx.fillText('◠', x + S / 2, y + S / 2 + 3);
      else if (t.terrain === 'forest') { ctx.fillStyle = 'rgba(0,45,0,.5)'; ctx.fillText('♣', x + S / 2, y + S / 2 + 3); }
      // settlement / camp icons on top
      ctx.font = '13px sans-serif';
      if (t.key === G.capital) { ctx.font = '16px sans-serif'; ctx.fillText('🏛️', x + S / 2, y + S / 2 + 4); }
      else if (t.settled) ctx.fillText('🏘️', x + S / 2, y + S / 2 + 4);
      else if (t.camp && t.owner !== 'neutral' && t.owner !== 'player')
        ctx.fillText(D.FACTIONS[t.owner].icon, x + S / 2, y + S / 2 + 4);
      // small marks
      ctx.font = '9px sans-serif';
      if (t.seat) { ctx.fillStyle = '#8a5a00'; ctx.fillText('★', x + 7, y + 10); }
      if (t.sacred) { ctx.fillStyle = '#2a4a8a'; ctx.fillText('✦', x + S - 7, y + 10); }
      if (t.port) { ctx.fillStyle = '#1a3a5a'; ctx.fillText('⚓', x + 7, y + S - 4); }
      if (t.owner !== 'player' && t.danger >= 3) { ctx.fillStyle = '#7a1a10'; ctx.fillText('☠', x + S - 7, y + 10); }
      if (t.volcanic || (t.hazards && t.hazards.length)) { ctx.font = '10px sans-serif'; ctx.fillText('🌋', x + S / 2 - 8, y + 11); }
      // ore dots
      if (t.ores && t.ores.length) {
        t.ores.forEach((o, i) => {
          const od = D.ORES[o]; if (!od) return;
          ctx.fillStyle = od.dot;
          ctx.beginPath(); ctx.arc(x + S - 7 - i * 7, y + S - 7, 2.8, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = .7; ctx.stroke();
        });
      }
      // building pips
      if (t.owner === 'player' && t.buildings.length > 1) {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(x + 3, y + S - 12, 13, 9);
        ctx.fillStyle = '#fff'; ctx.font = '7.5px sans-serif';
        ctx.fillText(t.buildings.length, x + 9.5, y + S - 5);
      }
      // player flag banner (capital big, connected settlements small)
      if (t.owner === 'player' && G.flag && (t.key === G.capital || (conn.has(t.key) && (t.settled || t.road)))) {
        const im = flagImgs[G.flag.id];
        const big = t.key === G.capital;
        const w = big ? 20 : 12, h = big ? 12.5 : 7.5;
        const fx = x + S - w - 2, fy = y + 2;
        if (im && im.complete && im.naturalWidth) ctx.drawImage(im, fx, fy, w, h);
        else { ctx.fillStyle = '#f4c400'; ctx.fillRect(fx, fy, w, h); }
        // Porphyrogennetos: at T3 the capital banner is framed in imperial purple
        ctx.strokeStyle = (big && G.tier >= 3) ? '#5B2A83' : '#222';
        ctx.lineWidth = (big && G.tier >= 3) ? 2.2 : 1;
        ctx.strokeRect(fx, fy, w, h);
      }
      // construction hammer
      if (G.builds.some(b => b.key === t.key) || G.roadsBuilding.some(rb => rb.key === t.key)) {
        ctx.font = '10px sans-serif'; ctx.fillText('🔨', x + S - 8, y + S / 2);
      }
    });

    // ---- region labels at centroids (atlas style) ----
    const cent = {};
    vis.forEach(t => {
      if (!t.explored) return;
      (cent[t.region] = cent[t.region] || { x: 0, y: 0, n: 0, nm: t.regionName });
      cent[t.region].x += px(t) + S / 2; cent[t.region].y += py(t) + S / 2; cent[t.region].n++;
    });
    const SHORT = { 'Argolis — Argos': 'ARGOS', 'Argolis — Nafplio': 'NAFPLIO',
      'Vatika / Monemvasia': 'MONEMVASIA', 'Boeotia & Phocis': 'BOEOTIA',
      'Kythira Strait': 'KYTHIRA', 'Iberia (East)': 'IBERIA', 'North Aegean Isle': '' };
    ctx.font = '700 9px system-ui, sans-serif';
    Object.values(cent).forEach(c0 => {
      if (c0.n < 2) return;
      const lx = c0.x / c0.n, ly = c0.y / c0.n;
      const label = SHORT[c0.nm] !== undefined ? SHORT[c0.nm] : c0.nm.toUpperCase();
      if (!label) return;
      ctx.fillStyle = 'rgba(255,250,235,.75)';
      ctx.fillText(label, lx + .8, ly + .8);
      ctx.fillStyle = 'rgba(30,25,15,.95)';
      ctx.fillText(label, lx, ly);
    });

    // ---- hover & selection ----
    const hov = G.tiles[hoverKey];
    if (hov && visible(hov)) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6;
      ctx.strokeRect(px(hov) + .5, py(hov) + .5, S - 1, S - 1);
    }
    const sel = selected && G.tiles[selected];
    if (sel && visible(sel)) {
      ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 3;
      ctx.strokeRect(px(sel) - 1, py(sel) - 1, S + 2, S + 2);
    }
  }

  return { init, draw, get selected() { return selected; }, select: k => { selected = k; draw(); } };
})();
