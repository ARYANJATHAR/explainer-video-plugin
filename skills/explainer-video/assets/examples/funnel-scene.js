/* Example scene: "The LLM Capability Funnel" (3:41, 9:16).
   A full worked example of choreographing a narrated explainer with the engine.
   Pair with examples/funnel-script.json. */
(async function () {
  const E = await makeEngine();
  const { svg, defs, TLD, C, MUTED, PAPER, clamp, eio, eout, lin, back, lerp, rnd,
    S, W, N, el, node, T, R, arrow, I, L_stage, L_panel, L_head, L_cap } = E;
  const E_ = E.E, INK = E.INK, L_fun = E.L_main;
  const Eend = E.E;
  // =====================================================================
  // FUNNEL GEOMETRY
  // =====================================================================
  const CX = 540;
  const HWP = [[300, 470], [530, 350], [770, 228], [960, 122], [1150, 4]];
  function hw(y) { for (let i = 0; i < HWP.length - 1; i++) { const [y0, w0] = HWP[i], [y1, w1] = HWP[i + 1]; if (y <= y1) return lerp(w0, w1, (y - y0) / (y1 - y0)); } return 4; }
  const TIERS = [
    { y0: 300, y1: 524, c: C.gray }, { y0: 536, y1: 764, c: C.blue },
    { y0: 776, y1: 954, c: C.orange }, { y0: 966, y1: 1150, c: C.purple },
  ];
  const tierPoly = (t, inset = 0) => [[CX - hw(t.y0) + inset, t.y0 + inset], [CX + hw(t.y0) - inset, t.y0 + inset], [CX + hw(t.y1) - inset * .4, t.y1 - inset], [CX - hw(t.y1) + inset * .4, t.y1 - inset]];

  // =====================================================================
  // HEADER
  // =====================================================================
  const kicker = node(L_head, CX, 104);
  T(kicker.g, 'A VISUAL READING  ·  ANDREJ KARPATHY ON LLM CAPABILITY', 0, 0, { font: 'sans', size: 22, weight: 600, fill: MUTED, ls: 3 });
  kicker.show(S('c1') - .4, .8);

  const sections = [
    ['c1', 'c4', 'A widening gap'],
    ['c4', 'c5', 'Napkin math'],
    ['c5', 'c6', '~75% · barely touched it', C.gray.t],
    ['c6', 'c10', '~20% · casual, free tier', C.blue.t],
    ['c10', 'c15', '0.2% · pros in math & code', C.orange.t],
    ['c15', 'c21', 'Internal · the frontier', C.purple.t],
    ['c21', 'c25', 'What drives the funnel?'],
    ['c25', 'c30', 'The weirdness of the moment'],
    ['c30', null, 'All at the same time.'],
  ];
  sections.forEach(([a, b, txt, col], i) => {
    const n = node(L_head, CX, 182);
    T(n.g, txt, 0, 0, { size: 62, fill: col || INK });
    const ul = el('g', {}, n.g);
    const w = txt.length * 13.5;
    R.curve(ul, [[-w, 18], [-w * .3, 24], [w * .4, 16], [w, 22]], { stroke: col || C.orange.s, strokeWidth: 3.2 });
    const t0 = S(a) - .35, t1 = b ? S(b) - .45 : null;
    n.show(t0, .5); if (t1) n.hide(t1, .4);
    n.y.v0 = 196; n.y.to(t0, .6, 182, eout);
    const uln = new N(ul); uln.draw(t0 + .3, .8);
  });

  // =====================================================================
  // INTRO TITLE
  // =====================================================================
  {
    const g = node(L_stage, CX, 0);
    const iconW = el('g', { transform: 'translate(0,640) scale(.55)' }, g.g); const icon = el('g', {}, iconW);
    TIERS.forEach((t, i) => R.poly(icon, tierPoly(t).map(([x, y]) => [x - CX, y - 725]), { fill: t.c.l, fillStyle: 'hachure', hachureGap: 12, stroke: INK }));
    const iconN = new N(icon); iconN.draw(.2, 1.6);
    const t1 = node(g.g, 0, 960); T(t1.g, 'The LLM', 0, 0, { size: 110 }); t1.wipe(.5, .9);
    const t2 = node(g.g, 0, 1075); T(t2.g, 'Capability Funnel', 0, 0, { size: 110, fill: C.purple.t }); t2.wipe(1.0, 1.1);
    const ul = node(g.g, 0, 0); R.curve(ul.g, [[-330, 1105], [-100, 1118], [150, 1100], [330, 1112]], { stroke: C.orange.s, strokeWidth: 4 }); ul.draw(1.8, .8);
    const sub = node(g.g, 0, 1190); T(sub.g, 'a visual reading of a tweet by Andrej Karpathy', 0, 0, { font: 'sans', size: 32, weight: 500, fill: MUTED }); sub.rise(2.0, .8, 20);
    g.hide(S('c1') - .5, .6);
  }

  // =====================================================================
  // C1 — tweet card + widening gap
  // =====================================================================
  {
    const card = node(L_stage, CX, 560);
    R.rrect(card.g, -400, -170, 800, 340, 26, { fill: '#fffdf8', fillStyle: 'solid' });
    R.circle(card.g, -320, -92, 72, { fill: C.blue.l, fillStyle: 'solid' });
    T(card.g, 'AK', -320, -80, { font: 'sans', size: 30, weight: 700, fill: C.blue.t });
    T(card.g, 'Andrej Karpathy', -268, -100, { font: 'sans', size: 34, weight: 700, anchor: 'start' });
    T(card.g, '@karpathy', -268, -62, { font: 'sans', size: 26, weight: 500, anchor: 'start', fill: MUTED });
    const lines = el('g', {}, card.g);
    [[-340, 230], [-340, 300], [-340, 170], [-340, 260]].forEach(([x, w], i) =>
      R.curve(lines, [[x, -4 + i * 38], [x + w * 1.2, -1 + i * 38], [x + w * 2.4, -5 + i * 38]], { stroke: '#bdb6aa', strokeWidth: 5, roughness: .6 }));
    const linesN = new N(lines); linesN.draw(S('c1') + .8, 1.6);
    // "April" calendar sticker
    const cal = node(card.g, 300, -150, { r: 8 });
    R.rect(cal.g, -78, -34, 156, 68, { fill: C.orange.l, fillStyle: 'solid' });
    T(cal.g, 'from April', 0, 13, { size: 40, fill: C.orange.t });
    cal.pop(W('c1', 'April'), .6);
    // dust puffs
    const dust = node(card.g, 0, 0);
    [[-430, -120], [-440, 40], [430, -60], [440, 110], [-200, 200], [220, 196]].forEach(([x, y], i) => {
      const a = Math.atan2(y, x);
      R.line(dust.g, x, y, x + Math.cos(a) * 36, y + Math.sin(a) * 36, { stroke: MUTED, strokeWidth: 2.4 });
    });
    dust.op.v0 = 0; dust.op.to(S('c1') + .2, .2, 1).to(S('c1') + .9, .6, 0);
    dust.s.v0 = .92; dust.s.to(S('c1') + .2, .9, 1.06, eout);
    card.op.v0 = 0; card.op.to(S('c1'), .4, 1); card.y.v0 = 440; card.y.to(S('c1'), .7, 560, back);
    card.hide(S('c2') - .3, .5);

    // gap
    const gapN = node(L_stage, CX, 1080);
    T(gapN.g, 'shared understanding of LLM capability', 0, -150, { size: 46, fill: INK });
    const left = node(gapN.g, 0, 0), right = node(gapN.g, 0, 0);
    R.poly(left.g, [[-500, -60], [-24, -60], [-40, 0], [-30, 70], [-500, 70]], { fill: C.blue.l, fillStyle: 'hachure', hachureGap: 10 });
    R.poly(right.g, [[24, -60], [500, -60], [500, 70], [36, 70], [26, 10]], { fill: C.orange.l, fillStyle: 'hachure', hachureGap: 10 });
    const tg = W('c1', 'gap');
    gapN.show(tg - .2, .6);
    left.draw(tg - .2, 1.0); right.draw(tg, 1.0);
    const tw = W('c1', 'widening');
    left.x.to(tw - .4, 2.4, -150); right.x.to(tw - .4, 2.4, 150);
    const arrs = node(gapN.g, 0, 150);
    arrow(arrs.g, [[-40, 0], [-180, 0]], { stroke: C.orange.s, strokeWidth: 3.5 });
    arrow(arrs.g, [[40, 0], [180, 0]], { stroke: C.orange.s, strokeWidth: 3.5 });
    T(arrs.g, 'widening', 0, 70, { size: 48, fill: C.orange.t });
    arrs.pop(tw, .6);
    gapN.hide(S('c2') - .3, .5);
  }

  // =====================================================================
  // C2 / C3 — talking past each other → funnel
  // =====================================================================
  {
    const t2 = S('c2'), t3 = S('c3');
    const grpL = node(L_stage, 250, 1000), grpR = node(L_stage, 830, 1000);
    [[-90, 10, C.blue.t], [0, -10, C.blue.t], [90, 14, C.blue.t]].forEach(([x, y, c]) => { const g = el('g', { transform: `translate(${x},${y})` }, grpL.g); I.stick(g, c, 'talkR'); });
    [[-90, 14, C.orange.t], [0, -10, C.orange.t], [90, 10, C.orange.t]].forEach(([x, y, c]) => { const g = el('g', { transform: `translate(${x},${y})` }, grpR.g); I.stick(g, c, 'talkL'); });
    grpL.rise(t2, .7); grpR.rise(t2 + .25, .7);
    const bL = node(L_stage, 250, 700), bR = node(L_stage, 830, 700);
    R.path(bL.g, 'M-180,-80 Q-180,-120 -140,-120 L140,-120 Q180,-120 180,-80 L180,20 Q180,60 140,60 L20,60 L-10,110 L-20,60 L-140,60 Q-180,60 -180,20 Z', { fill: '#fffdf8', fillStyle: 'solid', stroke: C.blue.t });
    T(bL.g, '“it’s a derpy', 0, -40, { size: 44, fill: C.blue.t }); T(bL.g, 'chatbot”', 0, 10, { size: 44, fill: C.blue.t });
    R.path(bR.g, 'M-180,-80 Q-180,-120 -140,-120 L140,-120 Q180,-120 180,-80 L180,20 Q180,60 140,60 L20,60 L10,110 L-20,60 L-140,60 Q-180,60 -180,20 Z', { fill: '#fffdf8', fillStyle: 'solid', stroke: C.orange.t });
    T(bR.g, '“it builds whole', 0, -40, { size: 44, fill: C.orange.t }); T(bR.g, 'apps for me”', 0, 10, { size: 44, fill: C.orange.t });
    bL.pop(W('c2', 'speaking') - .3, .6); bR.pop(W('c2', 'speaking') + .1, .6);
    // arrows that miss each other
    const miss = node(L_stage, 0, 0);
    arrow(miss.g, [[390, 520], [540, 450], [700, 470], [860, 540]].map(([x, y]) => [x, y - 20]), { stroke: C.blue.s, strokeWidth: 3 });
    arrow(miss.g, [[690, 860], [540, 920], [380, 900], [220, 850]].map(([x, y]) => [x, y + 250]), { stroke: C.orange.s, strokeWidth: 3 });
    T(miss.g, '?', 540, 410, { size: 70, fill: MUTED }); T(miss.g, '?', 540, 1230, { size: 70, fill: MUTED });
    miss.op.v0 = 0; miss.op.to(W('c2', 'past'), .2, 1); miss.draw(W('c2', 'past'), 1.2);
    // morph: everything flows into funnel mouth
    const tm = t3 - .2;
    for (const n of [grpL, grpR, bL, bR]) { n.move(tm, 1.1, CX, 420, .25, eio); n.hide(tm + .5, .6); }
    miss.hide(tm, .5);
  }

  // =====================================================================
  // FUNNEL
  // =====================================================================
  const tierN = [], tierFill = [], tierDim = [];
  const tDraw = S('c3') + .1;
  TIERS.forEach((t, i) => {
    const dim = node(L_fun, 0, 0); tierDim.push(dim);
    const fillSolid = node(dim.g, 0, 0);
    el('polygon', { points: tierPoly(t, 3).map(p => p.join(',')).join(' '), fill: t.c.l, opacity: 1 }, fillSolid.g);
    const hatch = node(dim.g, 0, 0);
    R.poly(hatch.g, tierPoly(t, 7), { stroke: 'none', fill: t.c.s, fillStyle: 'hachure', hachureGap: 11, fillWeight: 2.2, hachureAngle: -40, roughness: 1.3 });
    const outline = node(dim.g, 0, 0);
    R.poly(outline.g, tierPoly(t), { strokeWidth: 3 });
    outline.op.v0 = 0; outline.op.to(tDraw + i * .25, .05, 1); outline.draw(tDraw + i * .25, 1.2);
    fillSolid.op.v0 = 0; hatch.op.v0 = 0;
    tierFill.push({ solid: fillSolid, hatch });
    tierN.push(outline);
  });
  // funnel subtitle words at c3
  {
    const lbl = node(L_fun, CX, 1230); T(lbl.g, 'a sharp funnel', 0, 0, { size: 64, fill: C.purple.t });
    lbl.wipe(W('c3', 'sharp'), .8); lbl.hide(S('c4') - .2, .4);
  }
  function fillTier(i, t0, dur = 2.2) {
    const f = tierFill[i];
    f.solid.op.to(t0, dur * .8, i === 0 ? .9 : .85);
    f.hatch.op.to(t0, .05, 1); f.hatch.draw(t0, dur, eio);
  }
  // dim helper: focus one tier, others dimmed
  function focus(t0, idx, d = .6) {
    tierDim.forEach((n, i) => n.op.to(t0, d, idx == null || idx === i ? 1 : (i <= 3 ? .38 : 1)));
  }

  // tier labels
  const labels = [];
  function tierLabel(i, big, small, x, y, o = {}) {
    const n = node(L_fun, x, y);
    const bigT = T(n.g, big, 0, 0, { font: 'sans', size: o.size || 92, weight: 800, fill: o.fill || INK, anchor: o.anchor || 'middle', ls: -2 });
    T(n.g, small, o.sx || 0, o.sy || 54, { size: o.ssize || 46, fill: o.sfill || INK, anchor: o.anchor || 'middle' });
    labels[i] = { n, bigT };
    return n;
  }
  function countTo(textEl, n, t0, dur, fmt) {
    n.every(t => { const p = eout(clamp((t - t0) / dur)); textEl.textContent = fmt(p); });
  }

  // =====================================================================
  // PANEL helpers (y 1200–1650)
  // =====================================================================
  const PY = 1420;

  // ---------- C4 napkin ----------
  {
    const t = S('c4');
    const nap = node(L_panel, CX, PY, { r: -3 });
    I.napkin(nap.g);
    const math = el('g', {}, nap.g);
    T(math.g || math, '6B + 1.5B + 20M + 5k', 0, -30, { size: 54, fill: INK });
    T(math, '≈ 8 billion people', 0, 50, { size: 54, fill: C.orange.t });
    const pencil = el('g', { transform: 'translate(200,80) rotate(35)' }, nap.g);
    R.rect(pencil, -10, -90, 20, 150, { fill: '#e8c37a', fillStyle: 'solid' });
    R.poly(pencil, [[-10, 60], [10, 60], [0, 84]], { fill: '#f1dfc0', fillStyle: 'solid' });
    nap.pop(t - .2, .7);
    const mN = new N(math); mN.wipe(t + .2, 1.6, 10);
    nap.hide(S('c5') + 2.2, .6);
  }

  // ---------- C5: tier 1 ----------
  {
    const t = W('c5', 'six');
    fillTier(0, t - .2, 2.4);
    const lab = tierLabel(0, '0B', '~75% of humanity', CX, 428, { sfill: C.gray.t });
    lab.rise(t - .1, .6, 20);
    countTo(labels[0].bigT, lab, t - .1, 1.6, p => (p < 1 ? (6 * p).toFixed(1) : '6') + 'B');
    // panel: big counter + 20 people grid (15 gray)
    const big = node(L_panel, CX, 1330);
    const bigT = T(big.g, '0', 0, 0, { font: 'sans', size: 100, weight: 800, fill: C.gray.t, ls: -3 });
    big.rise(S('c5') + 2.0, .6, 30);
    countTo(bigT, big, S('c5') + 2.0, 2.2, p => Math.round(6e9 * p).toLocaleString('en-US'));
    const grid = node(L_panel, CX, 1500);
    const persons = [];
    for (let k = 0; k < 20; k++) {
      const r = Math.floor(k / 10), c = k % 10;
      const pn = node(grid.g, -405 + c * 90, -24 + r * 96);
      const gray = k < 15;
      I.person(pn.g, gray ? C.gray.s : INK, gray ? C.gray.l : null, .95);
      pn.pop(W('c5', 'seventyfive') + k * .05, .5);
      persons.push(pn);
    }
    const tag = node(L_panel, CX, 1640); T(tag.g, '15 in 20 have barely touched an LLM', 0, 0, { size: 44, fill: C.gray.t });
    tag.wipe(W('c5', 'barely'), 1.2);
    // mini people dock on tier 1
    const dockL = node(L_fun, 220, 455), dockR = node(L_fun, 860, 455);
    [-46, 0, 46].forEach(x => { const a = el('g', { transform: `translate(${x},0)` }, dockL.g); I.person(a, C.gray.t, C.gray.l, .8); });
    [-46, 0, 46].forEach(x => { const a = el('g', { transform: `translate(${x},0)` }, dockR.g); I.person(a, C.gray.t, C.gray.l, .8); });
    const td = S('c6') - .5;
    dockL.pop(td, .6); dockR.pop(td + .1, .6);
    for (const n of [big, grid, tag]) n.hide(td - .2, .5);
    focus(S('c5'), 0);
  }

  // ---------- C6–C9b: tier 2 ----------
  {
    const t = W('c6', 'one');
    focus(S('c6') - .2, 1);
    fillTier(1, t - .2, 2.4);
    const lab = tierLabel(1, '1–2B', '~20%', CX, 664, { size: 84, sfill: C.blue.t });
    lab.rise(t, .6, 20);
    // panel: 1–2 billion + chips
    const big = node(L_panel, CX, 1320);
    T(big.g, '1–2 billion', 0, 0, { font: 'sans', size: 96, weight: 800, fill: C.blue.t, ls: -3 });
    big.rise(t, .6, 30);
    const chips = [['casual', W('c6', 'casual')], ['infrequent', W('c6', 'infrequent')], ['free tier', W('c6', 'free')]];
    const chipNodes = chips.map(([txt, tt], i) => {
      const n = node(L_panel, [230, 540, 850][i], 1470);
      R.rrect(n.g, -130, -46, 260, 92, 46, { fill: C.blue.l, fillStyle: 'solid', stroke: C.blue.t });
      T(n.g, txt, 0, 16, { size: 50, fill: C.blue.t });
      n.pop(tt, .6); return n;
    });
    const t7 = S('c7') - .4;
    big.hide(t7, .4); chipNodes.forEach(n => n.hide(t7, .4));

    // c7 icons
    const ic = [
      ['robot', 'derpy chatbot', W('c7', 'derpy')],
      ['search', 'a better search', W('c7', 'better')],
      ['doc', 'writing aid', W('c7', 'writing')],
    ];
    const icNodes = ic.map(([k, lbl, tt], i) => {
      const n = node(L_panel, [200, 540, 880][i], 1400);
      I[k](n.g);
      T(n.g, lbl, 0, 140, { size: 46, fill: C.blue.t });
      n.pop(tt - .1, .7); return n;
    });
    // c8 plane
    const t8 = S('c8');
    const planeTrail = node(L_panel, 0, 0);
    R.curve(planeTrail.g, [[140, 1600], [400, 1560], [640, 1600], [900, 1540]], { stroke: C.blue.s, strokeWidth: 2.5, strokeLineDash: [10, 12] });
    planeTrail.op.v0 = 0; planeTrail.op.to(t8 + .3, .4, 1).to(S('c9') - .3, .4, 0);
    const plane = node(L_panel, 120, 1600, { s: .7, r: -8 });
    I.plane(plane.g);
    const q = T(plane.g, '?', 90, -40, { size: 70, fill: C.orange.s });
    plane.op.v0 = 0; plane.op.to(t8 + .1, .3, 1);
    plane.x.to(t8 + .1, 2.6, 900, eio); plane.y.to(t8 + .1, 2.6, 1540, eio);
    plane.r.to(t8 + .1, 2.6, -14);
    // icons shrink upward to make room — then dock onto tier 2
    const t9 = S('c9');
    const docks = [[340, 612], [340, 705], [742, 612], [742, 705]];
    [icNodes[0], icNodes[2], icNodes[1], plane].forEach((n, i) => {
      const [dx, dy] = docks[i];
      n.move(t9 - .5 + i * .12, 1.1, dx, dy, i === 3 ? .34 : .42, eio);
      if (i === 3) n.r.to(t9 - .5, 1.1, 0);
    });
    // hide labels while docked: fade label texts by covering — simpler: separate label nodes
    icNodes.forEach(n => { const txt = n.g.querySelector('text:last-of-type'); txt.setAttribute('class', 'lbl'); });
    // panel c9: shrugging friends
    const fr = node(L_panel, 0, 0);
    const f1 = el('g', { transform: 'translate(300,1480)' }, fr.g); I.stick(f1, INK, 'shrug');
    const f2 = el('g', { transform: 'translate(430,1490)' }, fr.g); I.stick(f2, INK, 'shrug');
    const bub = el('g', {}, fr.g);
    R.path(bub, 'M490,1310 Q490,1270 530,1270 L700,1270 Q740,1270 740,1310 L740,1340 Q740,1380 700,1380 L560,1380 L480,1420 L520,1380 Q490,1380 490,1340 Z', { fill: '#fffdf8', fillStyle: 'solid' });
    T(bub, '“meh, not much', 615, 1318, { size: 38 }); T(bub, 'use for it”', 615, 1360, { size: 38 });
    fr.rise(t9 + .1, .7, 30);
    const pro = node(L_panel, 820, 1440);
    I.briefcase(pro.g);
    T(pro.g, 'many pros too', 0, 120, { size: 44, fill: C.blue.t });
    pro.pop(W('c9b', 'professionals'), .7);
    const arr = node(L_panel, 0, 0);
    arrow(arr.g, [[960, 1400], [1010, 1150], [870, 760]], { stroke: C.blue.s, strokeWidth: 3 });
    arr.op.v0 = 0; arr.op.to(W('c9b', 'tier') - .4, .05, 1); arr.draw(W('c9b', 'tier') - .4, .9);
    const t10 = S('c10') - .5;
    for (const n of [fr, pro, arr]) n.hide(t10, .5);
  }
  // hide icon labels once docked
  svg.querySelectorAll('text.lbl').forEach(e => {
    const n = new N(e); n.op.to(S('c9') - .55, .3, 0);
  });

  // ---------- C10–C14: tier 3 ----------
  {
    focus(S('c10') - .2, 2);
    const head = node(L_panel, CX, 1290);
    T(head.g, 'frontier-grade LLMs', 0, 0, { size: 64, fill: C.orange.t });
    head.wipe(W('c10', 'frontier'), 1);
    const code = node(L_panel, 400, 1460); I.codeTag(code.g); code.pop(W('c10', 'math'), .6);
    const mth = node(L_panel, 680, 1460); I.mathTag(mth.g); mth.pop(W('c10', 'code') , .6);
    const plus = node(L_panel, 540, 1460); T(plus.g, '+', 0, 18, { font: 'sans', size: 60, weight: 600 }); plus.pop(W('c10', 'code') - .2, .5);
    const t11 = S('c11') - .3;
    for (const n of [head, code, mth, plus]) n.hide(t11, .4);

    const t = W('c11', 'twenty');
    fillTier(2, t - .2, 2.2);
    const lab = tierLabel(2, '20M', '0.2%', CX, 872, { size: 70, ssize: 44, sy: 46, sfill: C.orange.t });
    lab.rise(t, .6, 20);
    countTo(labels[2].bigT, lab, t, 1.4, p => Math.round(20 * p) + 'M');
    // weeks/months → prompt → done
    const cal = node(L_panel, 190, 1420); I.calendar(cal.g);
    T(cal.g, 'weeks or', 0, 110, { size: 44, fill: C.orange.t }); T(cal.g, 'months', 0, 150, { size: 44, fill: C.orange.t });
    cal.pop(W('c11', 'weeks'), .6);
    const a1 = node(L_panel, 0, 0); arrow(a1.g, [[290, 1420], [340, 1400], [390, 1420]], { strokeWidth: 3 });
    a1.op.v0 = 0; a1.op.to(W('c11', 'completed') - .3, .05, 1); a1.draw(W('c11', 'completed') - .3, .5);
    const pr = node(L_panel, 600, 1420); I.prompt(pr.g); T(pr.g, 'one prompt', 0, 100, { size: 44, fill: C.orange.t });
    pr.pop(W('c11', 'completed'), .6);
    const chk = node(L_panel, 860, 1420); R.circle(chk.g, 0, 0, 100, { fill: C.orange.l, fillStyle: 'solid', stroke: C.orange.t }); I.check(chk.g);
    T(chk.g, 'done', 0, 100, { size: 44, fill: C.orange.t });
    chk.pop(W('c11', 'prompt'), .6);
    const t12 = S('c12') - .4;
    for (const n of [cal, a1, pr, chk]) n.hide(t12, .4);

    // c12 four app tiles
    const tiles = [['build', 'Build apps', 'Building'], ['copy', 'Copy apps', 'Copying'], ['translate', 'Translate apps', 'Translating'], ['decompile', 'Decompile binaries', 'Decompiling']];
    const tileN = tiles.map(([k, lbl, w], i) => {
      const x = i % 2 ? 790 : 290, y = i < 2 ? 1305 : 1525;
      const n = node(L_panel, x, y);
      R.rrect(n.g, -235, -95, 470, 190, 22, { fill: '#fffdf8', fillStyle: 'solid', stroke: '#cfc6b6', strokeWidth: 2 });
      const ic = el('g', { transform: 'translate(-130,0) scale(.95)' }, n.g); I[k](ic);
      T(n.g, lbl.split(' ')[0], 80, -6, { size: 50, fill: C.orange.t });
      T(n.g, lbl.split(' ').slice(1).join(' '), 80, 40, { size: 40, fill: INK });
      n.pop(W('c12', w) - .1, .6); return n;
    });
    // c13 → tiles fly to dock on right of tier 3
    const t13 = S('c13');
    const dockXY = [[830, 822], [950, 822], [830, 912], [950, 912]];
    tileN.forEach((n, i) => { n.move(t13 + .2 + i * .1, 1.1, dockXY[i][0], dockXY[i][1], .24); });
    // c13 curve chart
    const ch = node(L_panel, 0, 0);
    R.lines(ch.g, [[180, 1300], [180, 1600], [900, 1600]], { strokeWidth: 3 });
    const curve = el('g', {}, ch.g);
    const pts = []; for (let k = 0; k <= 24; k++) { const x = k / 24; pts.push([190 + x * 700, 1590 - 280 * Math.pow(x, 6)]); }
    R.curve(curve, pts, { stroke: C.orange.s, strokeWidth: 5 });
    T(ch.g, 'very quickly, very recently', 520, 1660, { size: 44, fill: C.orange.t });
    T(ch.g, 'capability', 160, 1290, { size: 34, fill: MUTED, anchor: 'start' });
    ch.show(t13 + .4, .4); new N(curve).draw(t13 + .5, 2.0);
    ch.hide(S('c14') - .3, .4);

    // c14 stamp + code editor
    const t14 = S('c14');
    const stamp = node(L_panel, 280, 1255, { r: -6 });
    R.rect(stamp.g, -190, -38, 380, 76, { stroke: C.orange.s, strokeWidth: 4, roughness: 1.6 });
    T(stamp.g, 'less than 1 year ago', 0, 14, { size: 46, fill: C.orange.t });
    stamp.pop(t14 + .1, .6);
    const ed = node(L_panel, CX, 1470);
    R.rrect(ed.g, -430, -150, 860, 300, 18, { fill: '#2f2c28', fillStyle: 'solid', stroke: INK });
    [0, 1, 2].forEach(i => R.circle(ed.g, -400 + i * 24, -126, 12, { stroke: ['#e07a5f', '#f2cc8f', '#81b29a'][i], fill: ['#e07a5f', '#f2cc8f', '#81b29a'][i], fillStyle: 'solid', strokeWidth: 1 }));
    T(ed.g, 'editor.py', 0, -118, { font: 'sans', size: 22, fill: '#a9a294' });
    ed.rise(t14 + .3, .6, 30);
    const code1 = ['def fib(n):', '    a, b = 0, 1', '    for _ in range(n):', '        a, b = b, a + b', '    return a'];
    const lineEls = code1.map((s, i) => T(ed.g, '', -390, -70 + i * 46, { font: 'mono', size: 34, anchor: 'start', fill: '#f3ecdf', weight: 400 }));
    const cursor = el('rect', { width: 4, height: 38, fill: C.orange.s, x: -390, y: -98 }, ed.g);
    const typeStart = W('c14', 'typing'), tabT = W('c14', 'tab');
    const total = code1.slice(0, 3).join('').length + code1[3].length * 0.35 | 0;
    const ghost = T(ed.g, '', -390, -70 + 3 * 46, { font: 'mono', size: 34, anchor: 'start', fill: '#7d776d', weight: 400 });
    const key = node(ed.g, 320, 80);
    R.rrect(key.g, -66, -36, 132, 72, 12, { fill: '#fffdf8', fillStyle: 'solid' }); T(key.g, 'Tab ⇥', 0, 12, { font: 'sans', size: 30, weight: 700 });
    key.pop(tabT - .1, .5); key.s.to(tabT + .35, .12, .9, lin).to(tabT + .47, .15, 1, lin);
    ed.every(t => {
      // typed chars
      const p = clamp((t - typeStart) / (tabT - typeStart - .3));
      let n = Math.floor(p * total), li = 0, col = 0;
      for (let i = 0; i < code1.length; i++) {
        let shown = '';
        if (i < 3) { const take = Math.min(code1[i].length, Math.max(0, n)); shown = code1[i].slice(0, take); n -= take; }
        else if (i === 3) { const part = Math.floor(code1[3].length * .35); const take = Math.min(part, Math.max(0, n)); shown = code1[3].slice(0, take); n -= take; }
        if (t >= tabT + .45 && i >= 3) shown = code1[i];
        if (lineEls[i].textContent !== shown) lineEls[i].textContent = shown;
        if (shown.length || i === 0) { li = i; col = shown.length; }
      }
      const showGhost = t > tabT - .2 && t < tabT + .45;
      ghost.textContent = showGhost ? code1[3] : '';
      const blink = (Math.floor(t * 2.2) % 2 === 0) || (t > typeStart && t < tabT);
      cursor.setAttribute('x', (-390 + col * 18.7).toFixed(1));
      cursor.setAttribute('y', (-98 + li * 46).toFixed(1));
      cursor.setAttribute('opacity', blink ? 1 : 0);
    });
    // stamp docks above tier-3 icons
    const tOut = S('c15') - .6;
    ed.hide(tOut, .5);
    stamp.move(tOut, 1.0, 890, 768, .52);
  }

  // ---------- C15–C20: tier 4 ----------
  {
    focus(S('c15') - .2, 3);
    const t = W('c15', 'five');
    fillTier(3, t - .3, 2.0);
    const lead = node(L_fun, 0, 0); R.line(lead.g, 610, 1035, 668, 1035, { stroke: C.purple.t, strokeWidth: 2.5 }); lead.op.v0 = 0; lead.op.to(t, .05, 1); lead.draw(t, .4);
    const lab = tierLabel(3, '0', '0.00006%', 680, 1056, { size: 66, anchor: 'start', fill: C.purple.t, ssize: 44, sy: 50, sfill: C.purple.t });
    lab.rise(t, .6, 20);
    countTo(labels[3].bigT, lab, t, 1.6, p => Math.round(5000 * p).toLocaleString('en-US'));
    // internal tag w/ lock — left of tier 4
    const intern = node(L_fun, 330, 1110);
    const lk = el('g', { transform: 'translate(-90,-12) scale(.55)' }, intern.g); I.lock(lk);
    T(intern.g, 'internal', 20, 0, { size: 50, fill: C.purple.t });
    intern.pop(W('c15', 'internally'), .6);
    // panel building
    const b = node(L_panel, 300, 1430); I.building(b.g);
    const lock = node(b.g, 60, 40, { s: .9 }); I.lock(lock.g);
    b.pop(W('c15', 'access') - .2, .7); lock.pop(W('c15', 'internally'), .5);
    const bt = node(L_panel, 690, 1420);
    T(bt.g, 'frontier-grade', 0, -20, { size: 54, fill: C.purple.t }); T(bt.g, 'systems, internally', 0, 34, { size: 54, fill: INK });
    bt.wipe(W('c15', 'frontier'), 1.2);
    const t16 = S('c16') - .3;
    b.hide(t16, .4); bt.hide(t16, .4);
    // c16 preview
    const pv = node(L_panel, CX, 1420);
    R.rect(pv.g, -330, -150, 660, 300, { strokeWidth: 3 });
    R.rect(pv.g, -330, -150, 660, 300, { stroke: 'none', fill: C.purple.l, fillStyle: 'cross-hatch', hachureGap: 16, fillWeight: 1 });
    const curt = el('g', {}, pv.g);
    R.rect(curt, -330, -150, 400, 300, { fill: '#fffdf8', fillStyle: 'solid', stroke: INK });
    const eye = el('g', { transform: 'translate(190,0)' }, pv.g); I.eye(eye);
    T(pv.g, 'the preview', -130, 12, { size: 60, fill: C.purple.t });
    pv.pop(S('c16') - .1, .6);
    pv.hide(S('c17') - .3, .4);
    // c17 swarm
    const t17 = S('c17');
    const sw = node(L_panel, 0, 0);
    const NA = 64, rand = rnd(42);
    const ag = []; const lines = [];
    const lg = el('g', {}, sw.g), dg = el('g', {}, sw.g);
    for (let k = 0; k < 110; k++) lines.push(el('line', { stroke: C.purple.s, 'stroke-width': 1.4, opacity: 0 }, lg));
    for (let k = 0; k < NA; k++) {
      const a = { cx: 120 + rand() * 840, cy: 1250 + rand() * 340, ax: 20 + rand() * 50, ay: 14 + rand() * 30, fx: .3 + rand() * .5, fy: .25 + rand() * .5, ph: rand() * 6.28, born: rand() * 1.8, r: 6 + rand() * 6 };
      a.el = el('circle', { r: a.r, fill: k % 7 === 0 ? C.orange.s : C.purple.s, stroke: INK, 'stroke-width': 1.5 }, dg);
      ag.push(a);
    }
    sw.op.v0 = 0; sw.op.to(t17 - .2, .5, 1);
    sw.every(t => {
      const lt = t - t17;
      for (const a of ag) {
        const g = clamp((lt - a.born * 1.6) / .4);
        a.x = a.cx + a.ax * Math.sin(a.fx * t + a.ph); a.y = a.cy + a.ay * Math.cos(a.fy * t + a.ph * 1.3);
        a.el.setAttribute('cx', a.x.toFixed(1)); a.el.setAttribute('cy', a.y.toFixed(1)); a.el.setAttribute('r', (a.r * back(g)).toFixed(2));
        a.g = g;
      }
      let li = 0;
      for (let i = 0; i < NA && li < lines.length; i++) for (let j = i + 1; j < NA && li < lines.length; j++) {
        const A = ag[i], B = ag[j]; const d = Math.hypot(A.x - B.x, A.y - B.y);
        if (d < 120) {
          const ln = lines[li++]; ln.setAttribute('x1', A.x.toFixed(1)); ln.setAttribute('y1', A.y.toFixed(1)); ln.setAttribute('x2', B.x.toFixed(1)); ln.setAttribute('y2', B.y.toFixed(1));
          ln.setAttribute('opacity', (Math.min(A.g, B.g) * (1 - d / 120) * .8).toFixed(2));
        }
      }
      for (; li < lines.length; li++) lines[li].setAttribute('opacity', 0);
    });
    const swT = node(L_panel, CX, 1660);
    T(swT.g, 'thousands of agents · weeks · megaprojects', 0, 0, { size: 44, fill: C.purple.t });
    swT.wipe(W('c17', 'collaborating'), 1.4);
    const t18 = S('c18') - .2;
    sw.op.to(t18, .6, .16); swT.hide(t18, .4);
    // c18 four tiles
    const items = [['bug', 'minting zero-days', W('c18', 'minting')], ['shield', 'attack & defense', W('c18', 'running')], ['flask', 'new science', W('c18', 'discovering')], ['math', 'frontier math', W('c18', 'advancing')]];
    const itN = items.map(([k, lbl, tt], i) => {
      const n = node(L_panel, 150 + i * 260, 1400);
      I[k](n.g); T(n.g, lbl, 0, 130, { size: 40, fill: C.purple.t });
      n.pop(tt - .1, .6); return n;
    });
    // c19 hourglass years → weeks
    const t19 = S('c19');
    itN.forEach((n, i) => {
      const lbl = n.g.querySelector('text:last-of-type'); const ln = new N(lbl); ln.op.to(t19 - .3, .3, 0);
      n.move(t19 - .3 + i * .1, 1.1, 145 + i * 78, 1012, .36);
    });
    sw.hide(t19 - .3, .5);
    const hg = node(L_panel, 300, 1430); I.hourglass(hg.g); hg.pop(t19 + .4, .6); hg.r.to(W('c19', 'years') - .2, .8, 180);
    const yT = node(L_panel, 660, 1430);
    T(yT.g, 'years of top-pro work', 0, -24, { size: 56, fill: INK }); T(yT.g, '→ weeks of agents', 0, 40, { size: 56, fill: C.purple.t });
    yT.wipe(W('c19', 'years') - .1, 1.2);
    const t20 = S('c20') - .3;
    hg.hide(t20, .4); yT.hide(t20, .4);
    // c20 human review falling behind: stack grows
    const st = node(L_panel, 0, 0); st.show(S('c20') - .1, .4);
    const reviewer = el('g', { transform: 'translate(250,1560)' }, st.g); I.stick(reviewer, INK, 'stand');
    const mag = el('g', { transform: 'translate(300,1480) scale(.45)' }, st.g); I.search(mag);
    const papers = [];
    for (let k = 0; k < 14; k++) {
      const p = node(st.g, 560 + ((k * 37) % 23) - 11, 1600 - k * 26, { r: ((k * 53) % 9) - 4 });
      R.rect(p.g, -110, -11, 220, 22, { fill: '#fffdf8', fillStyle: 'solid', strokeWidth: 2 });
      p.pop(S('c20') + .2 + k * .22, .4); papers.push(p);
    }
    const lag = node(L_panel, 840, 1330); T(lag.g, 'human review', 0, 0, { size: 46, fill: INK }); T(lag.g, 'falls behind', 0, 50, { size: 46, fill: C.orange.t });
    lag.wipe(W('c20', 'fall') - .3, 1);
    const sweat = node(st.g, 0, 0); R.curve(sweat.g, [[285, 1475], [290, 1490], [284, 1500]], { stroke: C.blue.s, strokeWidth: 3 }); sweat.pop(W('c20', 'behind'), .5);
    const t21 = S('c21') - .5;
    st.hide(t21, .5); lag.hide(t21, .5);
  }

  // ---------- C21–C24: drivers ----------
  {
    focus(S('c21') - .3, null);
    const rows = [
      { id: 'c22', n: '1', title: 'Impact scales with', sub: 'ambition · problem size · horizon', col: C.blue },
      { id: 'c23', n: '2', title: 'Jaggedness', sub: 'peaks: digital · verifiable · valuable', col: C.orange },
      { id: 'c24', n: '3', title: 'Access', sub: 'free tier · paid tier · internal', col: C.purple },
    ];
    const rowN = rows.map((r, i) => {
      const n = node(L_panel, 0, 1275 + i * 140);
      R.circle(n.g, 110, 0, 84, { fill: r.col.l, fillStyle: 'solid', stroke: r.col.t, strokeWidth: 3 });
      T(n.g, r.n, 110, 20, { font: 'sans', size: 52, weight: 800, fill: r.col.t });
      T(n.g, r.title, 180, -6, { font: 'sans', size: 44, weight: 700, anchor: 'start' });
      T(n.g, r.sub, 180, 44, { size: 42, fill: r.col.t, anchor: 'start' });
      n.x.v0 = -30; n.op.v0 = 0; n.op.to(S(r.id) - .1, .5, 1); n.x.to(S(r.id) - .1, .7, 0, eout);
      return n;
    });
    // driver 1 bars (ambition/size/horizon) at row right
    const bars = node(rowN[0].g, 0, 0);
    [0, 1, 2].forEach(k => {
      const b = node(bars.g, 0, 0);
      const h = [34, 52, 70][k];
      R.rect(b.g, 860 + k * 44, 30 - h, 30, h, { fill: C.blue.s, fillStyle: 'hachure', hachureGap: 6, strokeWidth: 2 });
      b.op.v0 = 0; b.op.to(W('c22', ['ambition', 'problem', 'horizon'][k]), .05, 1); b.draw(W('c22', ['ambition', 'problem', 'horizon'][k]), .6);
    });
    // driver 2 jagged line in its row
    const jag = node(rowN[1].g, 0, 0);
    R.lines(jag.g, [[800, 34], [830, 10], [850, 28], [872, -44], [892, 22], [916, 6], [940, 30], [962, -54], [984, 24], [1010, 0], [1036, 30]], { stroke: C.orange.s, strokeWidth: 3.5, roughness: .6 });
    jag.op.v0 = 0; jag.op.to(W('c23', 'jaggedness'), .05, 1); jag.draw(W('c23', 'jaggedness'), 1.4);
    // driver 3 tags on funnel
    const tags = [['free tier', 1, 140, 664, W('c24', 'free')], ['paid tier', 2, 250, 876, W('c24', 'paid')]];
    tags.forEach(([txt, ti, x, y, tt]) => {
      const n = node(L_fun, x, y);
      R.rrect(n.g, -92, -34, 184, 68, 30, { fill: TIERS[ti].c.l, fillStyle: 'solid', stroke: TIERS[ti].c.t });
      T(n.g, txt, 0, 14, { size: 42, fill: TIERS[ti].c.t });
      n.pop(tt - .1, .6);
    });
    // pulse 'internal' tag: reuse tier dims
    const ti = W('c24', 'internal');
    focus(W('c24', 'free') - .1, 1, .3); focus(W('c24', 'paid') - .1, 2, .3); focus(ti - .1, 3, .3); focus(ti + 1.2, null, .6);
    const tOut = S('c25') - .5;
    rowN.forEach(n => n.hide(tOut, .5));
  }

  // ---------- C25–C30: summary ----------
  {
    const rows = [
      ['c26', C.gray, 'Most people', 'have barely touched it', 0],
      ['c27', C.blue, 'When they have', 'a derpy chatbot', 1],
      ['c28', C.orange, 'Most professionals', 'a modest uplift', 2],
      ['c29', C.purple, 'A small sliver', 'the curve going vertical', 3],
    ];
    rows.forEach(([id, col, a, b, ti], i) => {
      const n = node(L_panel, 0, 1262 + i * 106);
      R.circle(n.g, 96, -12, 34, { fill: col.s, fillStyle: 'solid', stroke: col.t });
      const ta = T(n.g, a, 136, 2, { font: 'sans', size: 40, weight: 700, anchor: 'start' });
      const w = 136 + ta.getComputedTextLength() + 18;
      T(n.g, '→ ' + b, w, 2, { size: 46, fill: col.t, anchor: 'start' });
      n.x.v0 = -30; n.op.v0 = 0; n.op.to(S(id) - .1, .5, 1); n.x.to(S(id) - .1, .7, 0, eout);
      focus(S(id) - .1, ti, .5);
    });
    // vertical curve next to tier 4 label
    const vc = node(L_fun, 0, 0);
    const pts = []; for (let k = 0; k <= 20; k++) { const x = k / 20; pts.push([880 + x * 130, 1140 - 230 * Math.pow(x, 7)]); }
    R.curve(vc.g, pts, { stroke: C.purple.s, strokeWidth: 5 });
    vc.op.v0 = 0; vc.op.to(W('c29', 'vertigo') - .2, .05, 1); vc.draw(W('c29', 'vertigo') - .2, 1.6);
    // finale
    const t30 = S('c30');
    focus(t30 - .2, null, .6);
    TIERS.forEach((t, i) => {
      // gentle simultaneous pulse
      const pulse = node(L_fun, 0, 0);
      R.poly(pulse.g, tierPoly(t, -6), { stroke: t.c.s, strokeWidth: 5, roughness: .8 });
      pulse.op.v0 = 0; pulse.op.to(W('c30', 'same') - .3, .4, 1).to(W('c30', 'same') + 1.4, 1.2, .0);
      pulse.draw(W('c30', 'same') - .3, .9);
    });
    const credit = node(L_cap, CX, 1800);
    T(credit.g, 'Based on a tweet by Andrej Karpathy', 0, 0, { font: 'sans', size: 28, weight: 500, fill: MUTED });
    credit.show(Eend('c30') + .8, .8);
  }

  const order = ['c5', 'c6', 'c10', 'c15', 'c21'];
  const idx = id => TLD.cues.findIndex(c => c.id === id);
  E.captions({
    keywords: /(\d|%|LLM|funnel|agents|frontier|internal|derpy|vertical|vertigo|jaggedness|access|ambition|horizon)/i,
    accentFor: id => {
      const k = idx(id);
      if (k < idx('c5')) return C.orange.t;
      if (k < idx('c6')) return C.gray.t;
      if (k < idx('c10')) return C.blue.t;
      if (k < idx('c15')) return C.orange.t;
      if (k < idx('c21')) return C.purple.t;
      return C.orange.t;
    },
  });
  E.finish();
})();
