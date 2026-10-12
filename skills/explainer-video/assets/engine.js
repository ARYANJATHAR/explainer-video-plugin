/* explainer-video engine — deterministic, seekable SVG animation for narrated explainers.
   Usage (in scene.js):
     const E = await makeEngine({ palette: {...optional overrides} });
     const { S, W, node, T, R, I, ... } = E;
     ...build scenes...
     E.captions({ accentFor: cueId => color, keywords: /regex/ });
     E.finish();            // exposes window.seek(t) and window.READY
   See references/engine-api.md for the full API. */
window.makeEngine = async function (cfg = {}) {
  await document.fonts.ready;
  await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('svg');
  const defs = document.getElementById('defs');
  const rc = rough.svg(svg);
  const TLD = window.TL;

  // ---------- palette ----------
  let INK = '#2f2c28', MUTED = '#8c857a', PAPER = '#f6f1e7';
  const C = {
    gray: { s: '#9d978c', l: '#e2dccf', t: '#7d776d' },
    blue: { s: '#5f88b5', l: '#d5e3f0', t: '#456f9c' },
    orange: { s: '#d8843f', l: '#f6dcc3', t: '#bf6a26' },
    purple: { s: '#7d60b0', l: '#e3d8f2', t: '#674a9c' },
  };

  // ---------- easing / math ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const eout = p => 1 - Math.pow(1 - p, 3);
  const lin = p => p;
  const back = p => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const lerp = (a, b, p) => a + (b - a) * p;
  function rnd(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---------- timeline lookup ----------
  const CUE = {}; TLD.cues.forEach(c => CUE[c.id] = c);
  const S = id => CUE[id].start, E = id => CUE[id].end;
  const norm = w => w.toLowerCase().replace(/[^a-z0-9]/g, '');
  function W(id, word, nth = 0) {
    const ws = CUE[id].words; const k = norm(word); let n = 0;
    for (const w of ws) if (norm(w.w).startsWith(k)) { if (n++ === nth) return w.s; }
    console.warn('word not found', id, word); return CUE[id].start;
  }

  // ---------- tween engine ----------
  class P {
    constructor(v) { this.v0 = v; this.segs = []; }
    to(t0, dur, v, ease = eio) { this.segs.push({ t0, dur, v, ease }); this.segs.sort((a, b) => a.t0 - b.t0); return this; }
    at(t) {
      let v = this.v0;
      for (const s of this.segs) {
        if (t < s.t0) break;
        if (s.dur <= 0 || t >= s.t0 + s.dur) { v = s.v; continue; }
        return lerp(v, s.v, s.ease((t - s.t0) / s.dur));
      }
      return v;
    }
  }
  const NODES = [], EVERY = [];
  class N {
    constructor(g, o = {}) {
      this.g = g;
      this.x = new P(o.x || 0); this.y = new P(o.y || 0); this.s = new P(o.s ?? 1); this.r = new P(o.r || 0);
      this.op = new P(o.op ?? 1); this.fx = []; this._tr = null; this._op = null; this._vis = null;
      NODES.push(this);
    }
    apply(t) {
      const op = clamp(this.op.at(t));
      const vis = op > 0.002;
      if (vis !== this._vis) { this.g.setAttribute('display', vis ? 'inline' : 'none'); this._vis = vis; }
      if (!vis) return;
      const x = this.x.at(t), y = this.y.at(t), s = this.s.at(t), r = this.r.at(t);
      const tr = `translate(${x.toFixed(2)},${y.toFixed(2)})` + (r ? ` rotate(${r.toFixed(2)})` : '') + (s !== 1 ? ` scale(${s.toFixed(4)})` : '');
      if (tr !== this._tr) { this.g.setAttribute('transform', tr); this._tr = tr; }
      const o = op.toFixed(3); if (o !== this._op) { this.g.setAttribute('opacity', o); this._op = o; }
      for (const f of this.fx) f(t);
    }
    show(t0, d = .5) { this.op.v0 = 0; this.op.to(t0, d, 1); return this; }
    hide(t0, d = .5) { this.op.to(t0, d, 0); return this; }
    life(t0, t1, d = .5) { this.show(t0, d); if (t1 != null) this.hide(t1, d); return this; }
    pop(t0, d = .6) { const b = this.s.v0; this.op.v0 = 0; this.op.to(t0, d * .4, 1, lin); this.s.v0 = b * .55; this.s.to(t0, d, b, back); return this; }
    rise(t0, d = .7, dy = 40) { const y = this.y.v0; this.op.v0 = 0; this.op.to(t0, d * .7, 1); this.y.v0 = y + dy; this.y.to(t0, d, y, eout); return this; }
    move(t0, d, x, y, s, e = eio) { if (x != null) this.x.to(t0, d, x, e); if (y != null) this.y.to(t0, d, y, e); if (s != null) this.s.to(t0, d, s, e); return this; }
    // stroke draw-on for all stroked paths inside
    draw(t0, dur, ease = eio) {
      const paths = [...this.g.querySelectorAll('path,line,polyline,circle,ellipse,rect')].filter(p => {
        const st = p.getAttribute('stroke'); return st && st !== 'none';
      });
      const fills = [...this.g.querySelectorAll('path,rect,circle,ellipse,polygon')].filter(p => {
        const f = p.getAttribute('fill'); const st = p.getAttribute('stroke');
        return f && f !== 'none' && (!st || st === 'none');
      });
      const lens = paths.map(p => { try { return p.getTotalLength() || 1; } catch (e) { return 1; } });
      const total = lens.reduce((a, b) => a + b, 0);
      paths.forEach((p, i) => { p.setAttribute('stroke-dasharray', `${lens[i] + 2} ${lens[i] + 2}`); });
      const last = new Array(paths.length).fill(-1);
      let lastF = -1;
      this.fx.push(t => {
        const pr = ease(clamp((t - t0) / dur));
        let acc = 0; const cut = pr * total;
        for (let i = 0; i < paths.length; i++) {
          const pp = clamp((cut - acc) / lens[i]); acc += lens[i];
          if (pp === last[i]) continue; last[i] = pp;
          const p = paths[i];
          if (pp <= 0) { p.setAttribute('visibility', 'hidden'); continue; }
          p.setAttribute('visibility', 'visible');
          p.setAttribute('stroke-dashoffset', ((lens[i] + 2) * (1 - pp)).toFixed(2));
        }
        const fp = clamp((pr - .25) / .75);
        if (fp !== lastF) { lastF = fp; fills.forEach(f => f.setAttribute('opacity', fp.toFixed(3))); }
      });
      return this;
    }
    wipe(t0, dur, pad = 30) {
      const bb = this.g.getBBox(); const id = 'clip' + (CLIPID++);
      const cp = el('clipPath', { id }, defs);
      const r = el('rect', { x: bb.x - pad, y: bb.y - pad, height: bb.height + pad * 2, width: 0 }, cp);
      const inner = this.g; inner.setAttribute('clip-path', `url(#${id})`);
      const w = bb.width + pad * 2; let lw = -1;
      this.fx.push(t => { const v = (eio(clamp((t - t0) / dur)) * w); if (v !== lw) { lw = v; r.setAttribute('width', v.toFixed(1)); } });
      return this;
    }
    every(fn) { this.fx.push(fn); return this; }
  }
  let CLIPID = 0;

  // ---------- DOM helpers ----------
  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const layer = name => el('g', { id: name }, svg);
  function node(parent, x = 0, y = 0, o = {}) { const g = el('g', {}, parent); return new N(g, Object.assign({ x, y }, o)); }
  function T(parent, str, x, y, o = {}) {
    const fam = o.font === 'sans' ? 'Sans' : o.font === 'mono' ? 'Consolas, monospace' : o.font === 'serif' ? 'Georgia, serif' : 'Hand';
    const e = el('text', {
      x, y, 'font-family': fam, 'font-size': o.size || 40, 'font-weight': o.weight || (fam === 'Hand' ? 700 : 500),
      fill: o.fill || INK, 'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls || 0,
    }, parent);
    if (fam.startsWith('Consolas')) e.setAttribute('style', 'white-space:pre');
    if (o.rotate) e.setAttribute('transform', `rotate(${o.rotate} ${x} ${y})`);
    e.textContent = str;
    return e;
  }
  let SEED = 11;
  const O = (o = {}) => Object.assign({ stroke: INK, strokeWidth: 2.6, roughness: 1.05, bowing: .8, seed: SEED++, fillWeight: 1.6, hachureGap: 8 }, o);
  const add = (p, n) => { p.appendChild(n); return n; };
  const R = {
    line: (p, x1, y1, x2, y2, o) => add(p, rc.line(x1, y1, x2, y2, O(o))),
    rect: (p, x, y, w, h, o) => add(p, rc.rectangle(x, y, w, h, O(o))),
    circle: (p, cx, cy, d, o) => add(p, rc.circle(cx, cy, d, O(o))),
    ellipse: (p, cx, cy, w, h, o) => add(p, rc.ellipse(cx, cy, w, h, O(o))),
    poly: (p, pts, o) => add(p, rc.polygon(pts, O(o))),
    lines: (p, pts, o) => add(p, rc.linearPath(pts, O(o))),
    curve: (p, pts, o) => add(p, rc.curve(pts, O(o))),
    path: (p, d, o) => add(p, rc.path(d, O(o))),
    arc: (p, x, y, w, h, a0, a1, o) => add(p, rc.arc(x, y, w, h, a0, a1, false, O(o))),
    rrect: (p, x, y, w, h, r, o) => add(p, rc.path(`M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`, O(o))),
  };
  function arrow(p, pts, o = {}) {
    const g = el('g', {}, p);
    R.curve(g, pts, o);
    const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const L = o.head || 18;
    R.line(g, b[0], b[1], b[0] - L * Math.cos(ang - .45), b[1] - L * Math.sin(ang - .45), o);
    R.line(g, b[0], b[1], b[0] - L * Math.cos(ang + .45), b[1] - L * Math.sin(ang + .45), o);
    return g;
  }

  // ---------- layers ----------
  // Layers, back to front. Scenes may add more with layer(name).
  const L_stage = layer('stage'), L_fun = layer('main'), L_panel = layer('panel'), L_head = layer('header'), L_cap = layer('captions'), L_top = layer('top');

  // =====================================================================
  // ICONS (drawn around origin, ~160px box)
  // =====================================================================
  const I = {
    person(p, col = INK, fill = null, sc = 1) {
      const g = el('g', { transform: `scale(${sc})` }, p);
      R.circle(g, 0, -30, 26, { stroke: col, fill: fill || undefined, fillStyle: 'solid' });
      R.path(g, 'M-24,18 Q-24,-12 0,-12 Q24,-12 24,18 Z', { stroke: col, fill: fill || undefined, fillStyle: 'solid' });
      return g;
    },
    stick(p, col = INK, pose = 'stand') {
      const g = el('g', {}, p);
      R.circle(g, 0, -70, 34, { stroke: col });
      R.line(g, 0, -53, 0, 5, { stroke: col });
      R.line(g, 0, 5, -18, 50, { stroke: col }); R.line(g, 0, 5, 18, 50, { stroke: col });
      if (pose === 'shrug') {
        R.lines(g, [[0, -38], [-26, -30], [-38, -52]], { stroke: col });
        R.lines(g, [[0, -38], [26, -30], [38, -52]], { stroke: col });
      } else if (pose === 'talkR') {
        R.lines(g, [[0, -38], [-20, -10]], { stroke: col }); R.lines(g, [[0, -38], [28, -28], [40, -40]], { stroke: col });
      } else if (pose === 'talkL') {
        R.lines(g, [[0, -38], [20, -10]], { stroke: col }); R.lines(g, [[0, -38], [-28, -28], [-40, -40]], { stroke: col });
      } else {
        R.line(g, 0, -38, -20, -8, { stroke: col }); R.line(g, 0, -38, 20, -8, { stroke: col });
      }
      return g;
    },
    robot(p) {
      const g = el('g', {}, p);
      R.line(g, 0, -48, 0, -70); R.circle(g, 0, -76, 14, { fill: C.orange.s, fillStyle: 'solid' });
      R.rrect(g, -62, -48, 124, 96, 22, { fill: C.blue.l, fillStyle: 'solid' });
      R.circle(g, -24, -8, 30, { fill: '#fff', fillStyle: 'solid' }); R.circle(g, -20, -4, 9, { fill: INK, fillStyle: 'solid' });
      R.circle(g, 26, -12, 16, { fill: '#fff', fillStyle: 'solid' }); R.circle(g, 29, -15, 5, { fill: INK, fillStyle: 'solid' });
      R.curve(g, [[-26, 24], [-12, 30], [0, 22], [14, 32], [28, 22]]);
      R.line(g, -62, 0, -74, 0); R.line(g, 62, 0, 74, 0);
      return g;
    },
    search(p) {
      const g = el('g', {}, p);
      R.circle(g, -12, -12, 84, { fill: C.blue.l, fillStyle: 'hachure', hachureGap: 9 });
      R.line(g, 18, 18, 52, 52, { strokeWidth: 7 });
      R.line(g, -36, -20, 10, -20, { stroke: C.blue.t }); R.line(g, -36, -4, 0, -4, { stroke: C.blue.t });
      return g;
    },
    doc(p) {
      const g = el('g', {}, p);
      R.rect(g, -44, -58, 88, 112, { fill: '#fffdf8', fillStyle: 'solid' });
      for (let i = 0; i < 4; i++) R.line(g, -30, -36 + i * 20, i === 3 ? 0 : 28, -36 + i * 20, { stroke: MUTED, strokeWidth: 2 });
      R.poly(g, [[22, 42], [62, -6], [72, 2], [32, 50], [18, 54]], { fill: C.orange.l, fillStyle: 'solid' });
      return g;
    },
    plane(p) {
      const g = el('g', {}, p);
      R.path(g, 'M-60,6 L50,-6 Q70,-6 70,2 Q70,10 50,10 L-60,12 Z', { fill: C.blue.l, fillStyle: 'solid' });
      R.path(g, 'M-4,0 L-30,-44 L-12,-44 L24,-2 Z', { fill: C.blue.l, fillStyle: 'solid' });
      R.path(g, 'M-4,12 L-26,52 L-8,52 L22,12 Z', { fill: C.blue.l, fillStyle: 'solid' });
      R.path(g, 'M-58,6 L-70,-20 L-58,-20 L-42,4 Z', { fill: C.blue.l, fillStyle: 'solid' });
      return g;
    },
    briefcase(p) {
      const g = el('g', {}, p);
      R.rrect(g, -60, -30, 120, 80, 10, { fill: C.blue.l, fillStyle: 'hachure', hachureGap: 9 });
      R.rrect(g, -22, -50, 44, 22, 6); R.line(g, -60, 0, 60, 0);
      return g;
    },
    codeTag(p, col = C.orange) {
      const g = el('g', {}, p);
      R.rrect(g, -66, -50, 132, 100, 16, { fill: col.l, fillStyle: 'solid' });
      T(g, '</>', 0, 18, { font: 'mono', size: 50, weight: 700, fill: col.t });
      return g;
    },
    mathTag(p, col = C.orange) {
      const g = el('g', {}, p);
      R.rrect(g, -66, -50, 132, 100, 16, { fill: col.l, fillStyle: 'solid' });
      T(g, '∑ ∫', 0, 20, { font: 'serif', size: 56, weight: 400, fill: col.t });
      return g;
    },
    calendar(p, label = 'weeks') {
      const g = el('g', {}, p);
      R.rect(g, -58, -50, 116, 104, { fill: '#fffdf8', fillStyle: 'solid' });
      R.rect(g, -58, -50, 116, 26, { fill: C.orange.l, fillStyle: 'solid' });
      R.line(g, -30, -60, -30, -40); R.line(g, 30, -60, 30, -40);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) R.line(g, -42 + c * 26, -6 + r * 20, -32 + c * 26, -6 + r * 20, { stroke: MUTED, strokeWidth: 3, roughness: .4 });
      return g;
    },
    prompt(p) {
      const g = el('g', {}, p);
      R.rrect(g, -150, -40, 300, 80, 18, { fill: '#fffdf8', fillStyle: 'solid', stroke: C.orange.t });
      T(g, '› build me…', -128, 12, { font: 'mono', size: 30, anchor: 'start', fill: INK });
      return g;
    },
    check(p, col = C.orange.t) { const g = el('g', {}, p); R.lines(g, [[-26, 0], [-6, 22], [30, -26]], { stroke: col, strokeWidth: 6 }); return g; },
    window(p, w = 150, h = 108, col = C.orange) {
      const g = el('g', {}, p);
      R.rect(g, -w / 2, -h / 2, w, h, { fill: '#fffdf8', fillStyle: 'solid' });
      R.line(g, -w / 2, -h / 2 + 22, w / 2, -h / 2 + 22);
      [0, 1, 2].forEach(i => R.circle(g, -w / 2 + 14 + i * 14, -h / 2 + 11, 8, { stroke: col.t, strokeWidth: 1.8 }));
      return g;
    },
    build(p) {
      const g = el('g', {}, p); I.window(g);
      R.rect(g, -50, -16, 44, 50, { fill: C.orange.l, fillStyle: 'solid', strokeWidth: 2 });
      R.rect(g, 6, -16, 44, 22, { fill: C.orange.l, fillStyle: 'solid', strokeWidth: 2 });
      R.rect(g, 6, 12, 44, 22, { strokeWidth: 2 });
      return g;
    },
    copy(p) {
      const g = el('g', {}, p);
      const a = el('g', { transform: 'translate(-18,-14) scale(.8)' }, g); I.window(a);
      const b = el('g', { transform: 'translate(18,14) scale(.8)' }, g); I.window(b);
      R.rect(b, -50, -16, 100, 40, { fill: C.orange.l, fillStyle: 'hachure', hachureGap: 8, strokeWidth: 2 });
      return g;
    },
    translate(p) {
      const g = el('g', {}, p); I.window(g);
      T(g, 'py', -38, 26, { font: 'mono', size: 30, weight: 700, fill: C.blue.t });
      T(g, '→', 0, 26, { font: 'sans', size: 30, weight: 600 });
      T(g, 'rs', 38, 26, { font: 'mono', size: 30, weight: 700, fill: C.orange.t });
      return g;
    },
    decompile(p) {
      const g = el('g', {}, p); I.window(g);
      T(g, '0110', -30, 12, { font: 'mono', size: 22, fill: MUTED }); T(g, '1001', -30, 36, { font: 'mono', size: 22, fill: MUTED });
      T(g, '→', 14, 26, { font: 'sans', size: 26, weight: 600 });
      T(g, '{ }', 46, 28, { font: 'mono', size: 30, weight: 700, fill: C.orange.t });
      return g;
    },
    building(p) {
      const g = el('g', {}, p);
      R.rect(g, -70, -70, 140, 140, { fill: C.purple.l, fillStyle: 'hachure', hachureGap: 10 });
      R.poly(g, [[-82, -70], [0, -110], [82, -70]], { fill: C.purple.l, fillStyle: 'solid' });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) R.rect(g, -52 + c * 40, -48 + r * 40, 24, 24, { fill: '#fffdf8', fillStyle: 'solid', strokeWidth: 2 });
      R.rect(g, -16, 30, 32, 40, { fill: '#fffdf8', fillStyle: 'solid', strokeWidth: 2 });
      return g;
    },
    lock(p, col = C.purple) {
      const g = el('g', {}, p);
      R.arc(g, 0, -14, 44, 52, Math.PI, Math.PI * 2, { stroke: INK, strokeWidth: 5 });
      R.rrect(g, -32, -14, 64, 50, 8, { fill: col.s, fillStyle: 'solid' });
      R.circle(g, 0, 8, 10, { fill: PAPER, fillStyle: 'solid', stroke: PAPER });
      return g;
    },
    eye(p) {
      const g = el('g', {}, p);
      R.path(g, 'M-70,0 Q0,-60 70,0 Q0,60 -70,0 Z', { fill: '#fffdf8', fillStyle: 'solid' });
      R.circle(g, 0, 0, 44, { fill: C.purple.l, fillStyle: 'solid' }); R.circle(g, 0, 0, 16, { fill: INK, fillStyle: 'solid' });
      return g;
    },
    bug(p) {
      const g = el('g', {}, p);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) R.lines(g, [[s * 20, -16 + i * 18], [s * 44, -26 + i * 22], [s * 52, -12 + i * 24]]);
      R.ellipse(g, 0, 6, 56, 76, { fill: C.purple.l, fillStyle: 'hachure', hachureGap: 7 });
      R.circle(g, 0, -40, 32, { fill: C.purple.s, fillStyle: 'solid' });
      R.curve(g, [[-8, -54], [-16, -70], [-26, -74]]); R.curve(g, [[8, -54], [16, -70], [26, -74]]);
      R.line(g, 0, -20, 0, 42, { strokeWidth: 2 });
      return g;
    },
    shield(p) {
      const g = el('g', {}, p);
      R.path(g, 'M0,-62 L50,-42 Q52,20 0,62 Q-52,20 -50,-42 Z', { fill: C.purple.l, fillStyle: 'hachure', hachureGap: 8 });
      R.poly(g, [[6, -40], [-16, 4], [2, 4], [-6, 40], [18, -8], [0, -8]], { fill: C.orange.s, fillStyle: 'solid' });
      return g;
    },
    flask(p) {
      const g = el('g', {}, p);
      R.path(g, 'M-14,-60 L-14,-14 L-52,48 Q-56,58 -44,58 L44,58 Q56,58 52,48 L14,-14 L14,-60', {});
      R.path(g, 'M-32,22 L32,22 L48,50 Q50,54 44,54 L-44,54 Q-50,54 -48,50 Z', { fill: C.purple.s, fillStyle: 'hachure', hachureGap: 6, stroke: 'none' });
      R.line(g, -22, -60, 22, -60);
      R.circle(g, 6, 2, 10, { stroke: C.purple.t, strokeWidth: 2 }); R.circle(g, -8, -16, 7, { stroke: C.purple.t, strokeWidth: 2 });
      return g;
    },
    math(p) {
      const g = el('g', {}, p);
      R.rrect(g, -66, -56, 132, 112, 16, { fill: C.purple.l, fillStyle: 'solid' });
      T(g, '∫ π', 0, 2, { font: 'serif', size: 50, fill: C.purple.t, weight: 400 });
      T(g, 'e^iπ+1=0', 0, 38, { font: 'serif', size: 22, fill: INK, weight: 400 });
      return g;
    },
    hourglass(p) {
      const g = el('g', {}, p);
      R.line(g, -46, -64, 46, -64, { strokeWidth: 4 }); R.line(g, -46, 64, 46, 64, { strokeWidth: 4 });
      R.path(g, 'M-38,-64 Q-38,-14 0,0 Q38,-14 38,-64', {}); R.path(g, 'M-38,64 Q-38,14 0,0 Q38,14 38,64', {});
      R.path(g, 'M-28,60 Q-20,30 0,22 Q20,30 28,60 Z', { fill: C.purple.s, fillStyle: 'hachure', hachureGap: 5, stroke: 'none' });
      return g;
    },
    napkin(p) {
      const g = el('g', {}, p);
      R.poly(g, [[-200, -120], [170, -130], [205, -95], [200, 120], [-196, 126]], { fill: '#fffdf8', fillStyle: 'solid' });
      R.lines(g, [[170, -130], [168, -96], [205, -95]], { strokeWidth: 2 });
      for (let i = 0; i < 5; i++) R.line(g, -190, -100 + i * 52, 190, -104 + i * 52, { stroke: '#e9e1d2', strokeWidth: 1.5, roughness: .3 });
      return g;
    },
  };

  if (cfg.palette) Object.assign(C, cfg.palette);
  if (cfg.ink) INK = cfg.ink;
  const WIDTH = cfg.width || 1080, HEIGHT = cfg.height || 1920;

  // ---------- captions: one node per caption chunk from timeline.json ----------
  function captions(o = {}) {
    const y = o.y ?? HEIGHT - 160, size = o.size || 42, lh = o.lineHeight || Math.round(size * 1.38);
    const accentFor = o.accentFor || (() => C.orange.t);
    const KEY = o.keywords || /(\d|%)/;
    const all = [];
    TLD.cues.forEach(c => c.captions.forEach(cp => all.push(Object.assign({ cue: c.id }, cp))));
    all.forEach((cp, i) => {
      const next = all[i + 1];
      const n = node(L_cap, WIDTH / 2, y);
      const words = cp.text.split(' ');
      const lines = [[]]; let len = 0;
      const max = Math.max(24, Math.ceil(cp.text.length / 2) + 4);
      for (const w of words) { if (len + w.length > max && lines[lines.length - 1].length) { lines.push([]); len = 0; } lines[lines.length - 1].push(w); len += w.length + 1; }
      const y0 = lines.length === 1 ? 18 : -12;
      const acc = accentFor(cp.cue);
      lines.forEach((ln, li) => {
        const tx = el('text', { x: 0, y: y0 + li * lh, 'font-family': 'Sans', 'font-size': size, 'font-weight': 500, fill: o.fill || INK, 'text-anchor': 'middle' }, n.g);
        ln.forEach((w, wi) => {
          const ts = el('tspan', {}, tx);
          ts.textContent = (wi ? ' ' : '') + w;
          if (KEY.test(w)) { ts.setAttribute('font-weight', 700); ts.setAttribute('fill', acc); }
        });
      });
      const tin = cp.s - .12;
      let tout = cp.e + .5; if (next && next.s - .12 < tout) tout = next.s - .12;
      n.op.v0 = 0; n.op.to(tin, .18, 1, lin).to(tout, .18, 0, lin);
      n.y.v0 = y + 12; n.y.to(tin, .3, y, eout);
    });
  }

  // ---------- finish: end fade + expose seek ----------
  function finish(o = {}) {
    const fade = el('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: PAPER, opacity: 0 }, L_top);
    const fadeN = new N(fade); fadeN.op.v0 = 0;
    if (o.fadeOut !== false) fadeN.op.to(TLD.total - 1.3, 1.25, 1, lin);
    window.seek = t => { for (const n of NODES) n.apply(t); };
    window.DURATION = TLD.total;
    window.seek(0);
    window.READY = true;
  }

  return {
    svg, defs, rc, TLD, NS, C, get INK() { return INK; }, MUTED, PAPER, WIDTH, HEIGHT,
    clamp, eio, eout, lin, back, lerp, rnd,
    CUE, S, E, W, P, N, NODES, el, layer, node, T, O, R, arrow, I,
    L_stage, L_main: L_fun, L_panel, L_head, L_cap, L_top,
    captions, finish,
  };
};
