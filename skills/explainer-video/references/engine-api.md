# Engine API (`engine.js`)

`const E = await makeEngine(cfg)` — call once at the top of `scene.js`, end with `E.captions(...)` and `E.finish()`.

`cfg`: `{ palette: { blue: { s, l, t }, ... }, ink: '#...', width: 1080, height: 1920 }` (all optional). For 16:9, change the `viewBox`/`width`/`height` in `index.html` to 1920×1080, pass `width/height`, and generate `paper.png` at that size (`python paper.py paper.png 1920 1080`).

## Contents
- Timing · Nodes · Drawing primitives · Text · Icons · Layers · Captions/finish · Easing & utils

## Timing (seconds on the narration timeline)
| fn | meaning |
|---|---|
| `S(id)` / `E.E(id)` | start / end of cue `id` (destructure `E` carefully — `E` is also the engine object) |
| `W(id, word, nth=0)` | start of the nth word in the cue whose normalized form starts with `word` |
| `TLD.total` | total video length |
| `TLD.intro` | when the first cue starts |

## Nodes — `node(parent, x, y, { s, r, op })` → `N`
A node is a `<g>` with animatable `x, y, s` (scale), `r` (rotation, deg), `op` (opacity). Draw children around (0,0); `n.g` is the group.

Each property is a `P` tween track: `n.x.v0 = start`, `n.x.to(t0, dur, value, ease)`. Segments run in time order, each starting from the previous value.

Sugar (all return the node, chainable):
- `show(t0, d=.5)` / `hide(t0, d=.5)` / `life(t0, t1, d)` — fade in/out
- `pop(t0, d=.6)` — scale-up with overshoot + fade (icons, chips)
- `rise(t0, d=.7, dy=40)` — slide up + fade (labels, numbers)
- `move(t0, d, x, y, s, ease)` — fly to a position/scale (use `null` to keep an axis)
- `draw(t0, dur)` — pencil draw-on of every stroked path inside, in DOM order; solid fills fade in in the second half. Hachure fills draw as a sweeping shading. Usually pair with `op.v0 = 0; op.to(t0, .05, 1)`.
- `wipe(t0, dur, pad)` — left-to-right reveal via clip (handwriting feel for text)
- `every(fn(t))` — per-frame callback for custom effects (count-ups, typing, swarms). Must be a pure function of `t`.

Count-up pattern:
```js
const lab = node(L_main, 540, 428); const big = T(lab.g, '0', 0, 0, { font: 'sans', size: 92, weight: 800 });
lab.rise(t, .6, 20);
lab.every(tt => { const p = eout(clamp((tt - t) / 1.6)); big.textContent = Math.round(5000 * p).toLocaleString('en-US'); });
```

## Drawing primitives — `R.*` (rough.js, pencil style, deterministic seeds)
`R.line(p,x1,y1,x2,y2,o)`, `R.rect(p,x,y,w,h,o)`, `R.rrect(p,x,y,w,h,r,o)`, `R.circle(p,cx,cy,d,o)`, `R.ellipse(p,cx,cy,w,h,o)`, `R.poly(p,pts,o)`, `R.lines(p,pts,o)` (open polyline), `R.curve(p,pts,o)` (smooth through points), `R.path(p,d,o)`, `R.arc(...)`. `arrow(p, pts, o)` draws a curved arrow with a head at the last point.

Options `o` (rough.js): `stroke`, `strokeWidth` (default 2.6), `fill`, `fillStyle` (`'hachure'` default when fill set, `'solid'`, `'cross-hatch'`, `'zigzag'`, `'dots'`), `hachureGap`, `hachureAngle`, `fillWeight`, `roughness` (0.4 tidy … 1.6 loose), `strokeLineDash: [10,12]`.

## Text — `T(parent, str, x, y, o)` → `<text>`
`o.font`: `'hand'` (Caveat, default — labels/annotations), `'sans'` (Inter — numbers, captions, titles), `'mono'` (Consolas, preserves spaces), `'serif'` (math). Also `size, weight, fill, anchor ('middle'|'start'|'end'), ls` (letter-spacing), `rotate`. Measure with `textEl.getComputedTextLength()` to position things after text.

## Icons — `I.<name>(parent)`, drawn around origin in a ~160px box
`person(p, col, fill, sc)`, `stick(p, col, pose: 'stand'|'shrug'|'talkL'|'talkR')`, `robot`, `search`, `doc`, `plane`, `briefcase`, `codeTag(p, col)`, `mathTag(p, col)`, `calendar`, `prompt`, `check(p, col)`, `window(p, w, h, col)`, `build`, `copy`, `translate`, `decompile`, `building`, `lock(p, col)`, `eye`, `bug`, `shield`, `flask`, `math`, `hourglass`, `napkin`.

Need another icon? Write a small function the same way (a `<g>` with a few `R.*` calls, a light fill color, ink outlines). Keep them simple — 3 to 8 strokes reads best.

## Palette — `C`
`C.gray|blue|orange|purple` each with `.s` (stroke/saturated), `.l` (light fill), `.t` (text, darker). Plus `E.INK`, `MUTED`, `PAPER`.

## Layers (back → front)
`L_stage` (full-screen scenes, intro), `L_main` (the persistent diagram), `L_panel` (detail vignettes), `L_head` (header), `L_cap` (captions), `L_top` (end fade). `layer(name)` adds another on top.

## Captions & finish
`E.captions({ y, size, keywords: /regex/, accentFor: cueId => color, fill })` — renders every caption chunk from `timeline.json` (≤2 lines), fading in/out on speech timing; words matching `keywords` are bold in the accent color.
`E.finish({ fadeOut: true })` — adds the end fade, exposes `window.seek`, marks ready. Call last.

## Easing & utils
`eio` (in-out cubic, default), `eout`, `lin`, `back` (overshoot), `clamp`, `lerp`, `rnd(seed)` (deterministic PRNG — never use `Math.random()`, it breaks parallel rendering).
