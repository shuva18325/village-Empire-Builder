#!/usr/bin/env node
// Bundle the game into ONE self-contained HTML file (game/dist/empire-builder-hellas.html):
// CSS + all JS inlined, flag PNGs embedded as data URIs. The output is written as
// body-content-only markup (no <html>/<head>/<body>) so it can be published as a
// claude.ai Artifact, yet it also opens fine directly in a browser.
// Run: node game/build-single.js
const fs = require('fs'), path = require('path');
const G = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const css = G('style.css');

// flag PNGs -> data URIs keyed by flag id (filenames are flag_<id>.png)
const flagDir = path.join(__dirname, '..', 'assets', 'flags');
const uris = {};
for (const f of fs.readdirSync(flagDir)) {
  if (!f.endsWith('.png')) continue;
  const id = f.replace(/^flag_/, '').replace(/\.png$/, '');
  uris[id] = 'data:image/png;base64,' + fs.readFileSync(path.join(flagDir, f)).toString('base64');
}

// order matters: the flag-URI override must run BEFORE ui.js calls UI.init()
const override = `// embedded flag art (single-file build)
(function () {
  const FLAG_URIS = ${JSON.stringify(uris)};
  DATA.FLAGS.forEach(f => { if (FLAG_URIS[f.id]) f.png = FLAG_URIS[f.id]; });
})();`;
const js = [G('data.js'), override, G('game.js'), G('map.js'), G('ui.js')].join('\n;\n');

// body markup from index.html (between <body> and the first <script>)
const html = G('index.html');
const body = html.split(/<body>/)[1].split(/<script/)[0].trim();

const out = `<title>Empire Builder — Hellas (Acts I–III)</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${css}
</style>
${body}
<script>
${js}
</script>
`;

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const dest = path.join(__dirname, 'dist', 'empire-builder-hellas.html');
fs.writeFileSync(dest, out);
console.log('wrote', dest, Math.round(out.length / 1024) + ' KB');
