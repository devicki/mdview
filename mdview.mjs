#!/usr/bin/env node
// mdview: a Markdown file in the terminal, with its Mermaid blocks drawn.
//   mdview FILE              read it in a pager (less)
//   mdview --width=N FILE    print it N columns wide (yazi's preview)
//   mdview --images FILE     show each diagram as an image, one at a time (kitty graphics: Ghostty)
// Text goes through glow; diagrams are printed as they are, since glow would wrap a wide one.
import { existsSync, readFileSync, readSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMermaidASCII, renderMermaidSVG } from 'beautiful-mermaid';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const widthArg = Number((args.find((a) => a.startsWith('--width=')) || '').slice(8));
const width = widthArg || process.stdout.columns || 100;
if (!file) {
  console.error('usage: mdview [--width=N | --images] FILE');
  process.exit(2);
}

// Text and mermaid blocks, in order. A fence closes with the same marker it opened with.
// Control characters go before anything is drawn: diagrams are printed as they are, and a file
// could otherwise drive the terminal (its title, the clipboard through OSC 52, links). Tabs and
// newlines stay.
const src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '');
const FENCE = /^(`{3,}|~{3,})[ \t]*mermaid\b[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm;
const parts = [];
let at = 0;
for (const m of src.matchAll(FENCE)) {
  parts.push({ md: src.slice(at, m.index) }, { mermaid: m[2] });
  at = m.index + m[0].length;
}
parts.push({ md: src.slice(at) });
const diagrams = parts.filter((p) => p.mermaid !== undefined);

// Hangul, CJK and fullwidth characters take two columns; beautiful-mermaid counts one each, so
// boxes come out too narrow. Draw with an ASCII stand-in of the same width, then put the text
// back. The same text always gets the same stand-in, since it names one node.
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꥠ-꥿가-힣豈-﫿︰-﹏＀-｠￠-￦]+/g;
function masked(body, draw) {
  const tokens = new Map();
  const text = body.replace(WIDE, (run) => {
    if (tokens.has(run)) return tokens.get(run);
    const w = [...run].length * 2;
    const token = ('Q' + tokens.size.toString(36)).padEnd(w, 'q');
    if (token.length > w) return run;
    tokens.set(run, token);
    return token;
  });
  let out = draw(text);
  for (const [run, token] of tokens) out = out.split(token).join(run);
  return out;
}
// An SVG an image tool can draw: librsvg (chafa) knows neither CSS var() nor color-mix(), so
// every color is worked out here, in dark-terminal colors, and Korean gets a font that has it.
const BG = '#1e1e2e', FG = '#cdd6f4';
function flatten(svg) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (p) => '#' + rgb(FG).map((f, i) => Math.round((f * p + rgb(BG)[i] * (100 - p)) / 100).toString(16).padStart(2, '0')).join('');
  const vars = { bg: BG, fg: FG };
  for (const [, name, expr] of svg.matchAll(/(--_[a-z-]+):\s*([^;]+);/g)) {
    const p = expr.match(/var\(--fg\)\s+(\d+)%/);
    vars[name.slice(2)] = p ? mix(+p[1]) : expr.includes('--fg') ? FG : BG;
  }
  return svg
    .replace(/@import url\([^)]*\);/, '')
    .replace(/font-family:[^;]+;/, "font-family: 'Inter', 'NanumBarunGothic', 'NanumGothic', sans-serif;")
    .replace(/var\(--([a-z_-]+)\)/g, (m, n) => vars[n] || m);
}
const columns = (line) => [...line].length + (line.match(WIDE) || []).join('').length;

// A diagram as text art: the default spacing, or a compact one when that is too wide.
function art(body, cols) {
  try {
    let out = masked(body, (t) => renderMermaidASCII(t, { colorMode: 'none' }));
    if (Math.max(...out.split('\n').map(columns)) > cols)
      out = masked(body, (t) => renderMermaidASCII(t, { colorMode: 'none', paddingX: 2, paddingY: 1, boxBorderPadding: 0 }));
    return out.replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
  } catch (e) {
    return `(mermaid not drawn: ${String(e.message || e).split('\n')[0]})\n${body.replace(/\n+$/, '')}`;
  }
}

// glow's dark style with headings shown by color instead of their "##" markers, when it is here.
const STYLE = join(dirname(fileURLToPath(import.meta.url)), 'glow-style.json');
function glow(md, cols) {
  if (!md.trim()) return '';
  const r = spawnSync('glow', ['-s', existsSync(STYLE) ? STYLE : 'dark', '-w', String(cols), '-'], {
    input: md, encoding: 'utf8', env: { ...process.env, CLICOLOR_FORCE: '1' },
  });
  // glow links text with OSC 8 escapes; yazi's preview and less count them as text, which pushes
  // lines past the pane's edge, so they go.
  return (r.status === 0 ? r.stdout : md).replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/^\n+/, '').replace(/\n+$/, '');
}

if (args.includes('--images')) {
  if (!diagrams.length) {
    console.log('No mermaid diagrams in this file.');
    process.exit(0);
  }
  const dir = mkdtempSync(join(tmpdir(), 'mdview-'));
  const rows = process.stdout.rows || 40;
  try {
    for (const [i, d] of diagrams.entries()) {
      process.stdout.write('\x1b[2J\x1b[H');
      console.log(`diagram ${i + 1}/${diagrams.length}  ·  Enter: next  ·  q: quit\n`);
      let svg;
      try {
        svg = flatten(masked(d.mermaid, (t) => renderMermaidSVG(t, { bg: BG, fg: FG, transparent: true })));
      } catch (e) {
        console.log(art(d.mermaid, width));
      }
      if (svg) {
        const path = join(dir, `${i}.svg`);
        writeFileSync(path, svg);
        spawnSync('chafa', ['-f', 'kitty', '--size', `${width}x${rows - 4}`, path], { stdio: 'inherit' });
      }
      if (keypress() === 'q') break;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  process.exit(0);
}

const out = parts
  .map((p) => (p.mermaid !== undefined ? art(p.mermaid, width - 2).replace(/^/gm, '  ') : glow(p.md, width)))
  .filter(Boolean)
  .join('\n\n') + '\n';

if (!widthArg && process.stdout.isTTY) spawnSync('less', ['-RS'], { input: out, stdio: ['pipe', 'inherit', 'inherit'] });
else process.stdout.write(out);

// One key, without waiting for Enter.
function keypress() {
  if (!process.stdin.isTTY) return '';
  const buf = Buffer.alloc(8);
  spawnSync('stty', ['raw', '-echo'], { stdio: ['inherit', 'ignore', 'ignore'] });
  try {
    return buf.toString('utf8', 0, readSync(0, buf));
  } finally {
    spawnSync('stty', ['sane'], { stdio: ['inherit', 'ignore', 'ignore'] });
  }
}
