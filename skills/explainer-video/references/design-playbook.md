# Design playbook

What made the reference video (assets/examples/funnel-scene.js) look professional rather than like a slideshow.

## One persistent hero diagram
Pick one central visual that embodies the whole argument (funnel, timeline, map, stack, cycle, 2×2) and **build it up over the video** instead of cutting between unrelated slides. Each section adds or fills one part. The viewer ends up holding the whole idea in a single image, which is also the final frame.

- Draw the outline early (when the idea is introduced), fill sections later as each is discussed.
- While a section is discussed, dim the others to ~0.38 opacity; restore all at summary moments.
- After a section's detail vignette, **dock** its icons onto the hero diagram (`move` + shrink to ~0.25–0.45). The diagram accumulates meaning, and the transition doubles as a recap.

## Vertical layout (1080×1920)
| zone | y | use |
|---|---|---|
| header | 60–230 | small caps kicker (constant) + handwritten section title with drawn underline, swapping per section |
| hero | 280–1180 | the persistent diagram + its labels |
| panel | 1200–1650 | detail vignettes: icons, counters, mini-charts; cleared between beats |
| captions | ~1700–1840 | 2-line captions, keywords bold in the section color |

Keep a 40–60px side margin. Never stack more than ~3 distinct things in the panel at once. For 16:9, put the hero on the left ~55% and the panel on the right.

## Pacing
- Something should visibly change every 1.5–3 s; long cues get several beats keyed to words (`W`).
- Trigger visuals on the **noun or number** as it's spoken, or ~0.1–0.3 s before — never after.
- Clear the panel ~0.3–0.5 s before the next cue starts so the new beat lands on a clean stage.
- Give section changes 1.2–1.8 s of gap in `script.json`; use it for the header swap and diagram transitions.
- Open with a 3–4 s silent title card that draws itself; close with ~8 s holding the complete diagram plus a summary and a credit line, then fade.

## Style
- Cream paper background, warm near-black ink, rough.js strokes (`roughness` ~1.0–1.3) with hachure fills for "pencil shading".
- One muted color per concept/tier (`C.gray/blue/orange/purple`), used consistently in diagram fill, panel icons, header title and caption accents.
- Two type voices: Caveat (handwritten) for labels and annotations; Inter heavy for numbers and statements. Big numbers 70–110px, labels 40–60px, captions 42px.
- Motion vocabulary: draw-on for shapes, wipe for handwritten text, pop for icons, rise for numbers, count-up for quantities, move for docking. Ease in-out; overshoot only on pops.
- Generous white space. If a frame looks busy on the contact sheet, remove something.

## Visual metaphors that worked
- Groups "talking past each other": two clusters of stick figures with speech bubbles and arrows that miss each other.
- Scale/proportion: a grid of 20 person icons with N highlighted; a counter rolling up to the full number.
- Speed/acceleration: an exponential curve drawn over 2 s; "years → weeks" with an hourglass flipping.
- "Before vs now": a code editor typing character by character, then an autocomplete ghost line accepted with a Tab keycap.
- Scale of activity: an agent swarm — ~60 dots drifting on deterministic sine paths with proximity lines.
- Overload: a paper stack growing beside a small figure.
- Factors/drivers: numbered rows (colored circle, bold title, handwritten subline) sliding in, each with a tiny inline visual.
