/* Starter scene — replace with your own choreography.
   Every animation is keyed to narration time: S(id) = cue start, E(id) = cue end,
   W(id, 'word') = the moment that word is spoken. Build once; window.seek(t) does the rest.
   Layout zones (1080x1920): header y 60–230 · main stage y 280–1180 · detail panel y 1200–1650 · captions y ~1760. */
(async function () {
  const E = await makeEngine();
  const { C, MUTED, S, W, node, T, R, I, arrow, eout, L_stage, L_main, L_panel, L_head } = E;
  const INK = E.INK, CX = 540;

  // ---- persistent header: kicker + section title that swaps per section ----
  const kicker = node(L_head, CX, 104);
  T(kicker.g, 'A VISUAL EXPLAINER', 0, 0, { font: 'sans', size: 22, weight: 600, fill: MUTED, ls: 3 });
  kicker.show(S('c1') - .4, .8);

  const sections = [['c1', 'c2', 'Section one'], ['c2', null, 'Section two', C.blue.t]];
  sections.forEach(([a, b, txt, col]) => {
    const n = node(L_head, CX, 182);
    T(n.g, txt, 0, 0, { size: 62, fill: col || INK });
    const ul = node(n.g, 0, 0);
    const w = txt.length * 13.5;
    R.curve(ul.g, [[-w, 18], [-w * .3, 24], [w * .4, 16], [w, 22]], { stroke: col || C.orange.s, strokeWidth: 3.2 });
    n.show(S(a) - .35, .5); if (b) n.hide(S(b) - .45, .4);
    ul.draw(S(a), .8);
  });

  // ---- intro title card (before first cue) ----
  const title = node(L_stage, CX, 900);
  T(title.g, 'Your Title', 0, 0, { size: 110 });
  title.wipe(.4, 1.0);
  title.hide(S('c1') - .5, .6);

  // ---- main visual: a box that draws itself, a number that counts up ----
  const box = node(L_main, CX, 700);
  R.rect(box.g, -300, -200, 600, 400, { fill: C.blue.l, fillStyle: 'hachure', hachureGap: 11 });
  box.op.v0 = 0; box.op.to(S('c1'), .05, 1); box.draw(S('c1'), 1.6);

  const num = node(L_main, CX, 730);
  const numT = T(num.g, '0', 0, 0, { font: 'sans', size: 120, weight: 800, fill: C.blue.t });
  num.rise(W('c1', 'number'), .6, 20);
  num.every(t => { const p = eout(Math.min(1, Math.max(0, (t - W('c1', 'number')) / 1.5))); numT.textContent = Math.round(1000 * p).toLocaleString('en-US'); });

  // ---- detail panel: icons pop on keywords, then leave ----
  const a = node(L_panel, 300, 1420); I.robot(a.g); T(a.g, 'a chatbot', 0, 140, { size: 44, fill: C.blue.t });
  a.pop(W('c2', 'chatbot'), .7);
  const b = node(L_panel, 780, 1420); I.flask(b.g); T(b.g, 'science', 0, 140, { size: 44, fill: C.purple.t });
  b.pop(W('c2', 'science'), .7);
  // dock the icon onto the main visual so the diagram accumulates meaning
  a.move(E.E('c2') + .3, 1.0, CX - 200, 620, .4);

  E.captions({ keywords: /(\d|%)/, accentFor: () => C.orange.t });
  E.finish();
})();
