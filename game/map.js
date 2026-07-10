// ============================================================================
// EMPIRE BUILDER — map renderer (canvas) + tile picking
// ============================================================================
window.MapView = (function () {
  const D = window.DATA, C = D.CONST;
  let cv, ctx, selected = null;
  const flagImgs = {};                      // id -> HTMLImageElement

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

  function onClick(e) {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (cv.width / rect.width) - 10;
    const y = (e.clientY - rect.top) * (cv.height / rect.height) - 10;
    const c = Math.floor(x / C.TILE), r = Math.floor(y / C.TILE);
    const t = Game.state && Game.state.tiles[c + ',' + r];
    selected = t ? t.key : null;
    if (window.UI) UI.selectTile(selected);
    draw();
  }
  let hoverKey = null;
  function onMove(e) {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (cv.width / rect.width) - 10;
    const y = (e.clientY - rect.top) * (cv.height / rect.height) - 10;
    const c = Math.floor(x / C.TILE), r = Math.floor(y / C.TILE);
    const k = c + ',' + r;
    if (k !== hoverKey) { hoverKey = k; draw(); }
  }

  function draw() {
    if (!ctx) return;
    const G = Game.state;
    // sea
    const grad = ctx.createLinearGradient(0, 0, 0, cv.height);
    grad.addColorStop(0, '#2e5674'); grad.addColorStop(1, '#1e3c54');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cv.width, cv.height);
    // subtle waves
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(40 + (i * 97) % (cv.width - 60), 30 + (i * 61) % (cv.height - 50), 8, Math.PI * .1, Math.PI * .9);
      ctx.stroke();
    }
    if (!G) return;
    const conn = Game.roadConnected();

    // Kythira strait dashes
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10 + 8 * C.TILE + C.TILE / 2, 10 + 8 * C.TILE + C.TILE - 4);
    ctx.lineTo(10 + 8 * C.TILE + C.TILE / 2, 10 + 9 * C.TILE + 4);
    ctx.stroke(); ctx.setLineDash([]);

    // land tiles
    Object.values(G.tiles).forEach(t => {
      const x = px(t), y = py(t), s = C.TILE - 3;
      if (!t.explored) {                                  // FOG
        ctx.fillStyle = '#141a24';
        rr(x, y, s, s, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.font = '18px serif'; ctx.textAlign = 'center';
        ctx.fillText('?', x + s / 2, y + s / 2 + 6);
        if (G.scouts.some(sc => sc.key === t.key)) {
          ctx.fillStyle = '#f4c400'; ctx.font = '13px sans-serif';
          ctx.fillText('🥾', x + s / 2, y + s - 8);
        }
        return;
      }
      // terrain
      ctx.fillStyle = D.TERRAIN[t.terrain].col;
      rr(x, y, s, s, 7); ctx.fill();
      // explored-but-unowned dim
      if (t.owner !== 'player') { ctx.fillStyle = 'rgba(10,14,22,.35)'; rr(x, y, s, s, 7); ctx.fill(); }
      // roads
      if (t.road) {
        ctx.strokeStyle = '#e8d9a8'; ctx.lineWidth = 4; ctx.setLineDash([]);
        Game.neighbors(t.key).forEach(n => {
          if ((n.road || n.key === G.capital) && n.owner === 'player') {
            ctx.beginPath();
            ctx.moveTo(x + s / 2, y + s / 2);
            ctx.lineTo(px(n) + s / 2, py(n) + s / 2);
            ctx.stroke();
          }
        });
      }
      // owner outline
      if (t.owner === 'player') {
        ctx.strokeStyle = '#f4c400'; ctx.lineWidth = 2.5;
        rr(x + 1, y + 1, s - 2, s - 2, 6); ctx.stroke();
      } else if (t.owner !== 'neutral') {
        ctx.strokeStyle = D.FACTIONS[t.owner].col; ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]); rr(x + 1, y + 1, s - 2, s - 2, 6); ctx.stroke(); ctx.setLineDash([]);
      }
      // icons
      ctx.textAlign = 'center'; ctx.font = '15px sans-serif';
      if (t.key === G.capital) {
        ctx.font = '20px sans-serif'; ctx.fillText('🏛️', x + s / 2, y + s / 2 + 2);
      } else if (t.settled) {
        ctx.fillText('🏘️', x + s / 2, y + s / 2 + 2);
      } else if (t.camp && t.owner !== 'neutral' && t.owner !== 'player') {
        ctx.fillText(D.FACTIONS[t.owner].icon, x + s / 2, y + s / 2 + 2);
      } else if (t.terrain === 'mtn') {
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.font = '13px sans-serif';
        ctx.fillText('▲', x + s / 2, y + s / 2 + 4);
      } else if (t.terrain === 'forest') {
        ctx.fillStyle = 'rgba(0,40,0,.4)'; ctx.font = '12px sans-serif';
        ctx.fillText('♣', x + s / 2, y + s / 2 + 4);
      }
      // seat star / sacred / ore / port
      ctx.font = '10px sans-serif';
      if (t.seat) { ctx.fillStyle = '#ffe9a0'; ctx.fillText('★', x + 9, y + 13); }
      if (t.sacred) { ctx.fillText('✦', x + s - 9, y + 13); }
      if (t.ore && t.owner === 'player') { ctx.fillText('⛏', x + s - 9, y + s - 6); }
      if (t.port) { ctx.fillText('⚓', x + 9, y + s - 6); }
      // danger skulls (explored, unowned, dangerous)
      if (t.owner !== 'player' && t.danger >= 3) {
        ctx.fillText('☠', x + s - 9, y + 13);
      }
      // buildings pip count
      if (t.owner === 'player' && t.buildings.length > 1) {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(x + 4, y + s - 13, 16, 10);
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
        ctx.fillText(t.buildings.length, x + 12, y + s - 5);
      }
      // player flag banner on capital + connected settled tiles
      if (t.owner === 'player' && G.flag && (t.key === G.capital || (conn.has(t.key) && (t.settled || t.road)))) {
        const im = flagImgs[G.flag.id];
        const big = t.key === G.capital;
        const w = big ? 22 : 14, h = big ? 14 : 9;
        if (im && im.complete && im.naturalWidth) {
          ctx.drawImage(im, x + s - w - 3, y + 3, w, h);
          ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
          ctx.strokeRect(x + s - w - 3, y + 3, w, h);
        } else {
          ctx.fillStyle = '#f4c400'; ctx.fillRect(x + s - w - 3, y + 3, w, h);
        }
      }
      // construction hammer
      if (G.builds.some(b => b.key === t.key) || G.roadsBuilding.some(rb => rb.key === t.key)) {
        ctx.font = '11px sans-serif'; ctx.fillText('🔨', x + s / 2 + 14, y + 14);
      }
    });

    // region borders (draw last, thicker where regions differ)
    ctx.strokeStyle = 'rgba(20,20,25,.5)'; ctx.lineWidth = 1.5;
    Object.values(G.tiles).forEach(t => {
      const x = px(t), y = py(t), s = C.TILE - 3;
      [[1, 0, x + s, y, x + s, y + s], [0, 1, x, y + s, x + s, y + s]].forEach(([dc, dr, x1, y1, x2, y2]) => {
        const n = G.tiles[(t.c + dc) + ',' + (t.r + dr)];
        if (n && n.region !== t.region && t.explored && n.explored) {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      });
    });

    // hover + selection
    const hov = G.tiles[hoverKey];
    if (hov) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
      rr(px(hov), py(hov), C.TILE - 3, C.TILE - 3, 7); ctx.stroke();
    }
    const sel = selected && G.tiles[selected];
    if (sel) {
      ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 3;
      rr(px(sel) - 1, py(sel) - 1, C.TILE - 1, C.TILE - 1, 8); ctx.stroke();
    }
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { init, draw, get selected() { return selected; }, select: k => { selected = k; draw(); } };
})();
