---
name: explainer-video
description: Produce polished, narrated, animated explainer videos (hand-drawn/sketch aesthetic, diagrams that build themselves, counting numbers, captions, voiceover, soft music) as a rendered MP4 — vertical 9:16 for Reels/Shorts/TikTok or 16:9. Use this whenever the user wants to turn a tweet, thread, essay, article, script, concept or dataset into a video, asks for an "animated explainer", "visual reading", "whiteboard / sketch-style video", "motion graphic", "narrated video", "YouTube Short / Reel about X", or mentions Manim/Remotion/After-Effects-style output — even if they don't say "explainer". Not for editing existing footage or making a product/website launch video from a codebase.
---

# Explainer video

Turn a script into a finished MP4: neural voiceover with word-level timing → a deterministic, seekable SVG animation (rough.js pencil style) choreographed to the spoken words → frame capture in headless Chrome → ffmpeg encode with a ducked ambient music bed.

The key idea: **narration drives everything.** The TTS step records exactly when every word is spoken, and every animation is keyed to those times (`W('c5', 'billion')`), so visuals land on the word without any manual syncing. Because the page renders any time `t` deterministically (`window.seek(t)`), frames can be captured in parallel and re-rendered identically.

## Requirements
Python 3 with `edge-tts numpy pillow` (`pip install edge-tts numpy pillow`), Node 18+, ffmpeg on PATH, and Chrome/Edge/Chromium installed (or set `CHROME_PATH`). `edge-tts` needs internet. Check these first and tell the user what's missing rather than improvising another stack.

## Workflow

### 1. Scaffold
```bash
python <skill>/scripts/new_project.py <project_dir>            # blank starter
python <skill>/scripts/new_project.py <project_dir> --example  # full worked example (3:41 funnel video)
```
This copies `engine.js`, `index.html`, `scene.js`, `script.json`, the pipeline scripts, makes `paper.png`, and runs `npm i`. Put the project somewhere the user will find it (their working directory), not a temp dir.

Read `assets/examples/funnel-scene.js` before writing your first scene — it is a complete, proven choreography (header sections, a diagram that builds tier by tier, icons that pop on keywords then dock onto the diagram, count-ups, a typing code editor, an agent swarm, numbered drivers, summary rows, finale). Copy its patterns liberally.

### 2. Write the narration — `script.json`
Split the text into cues of one or two sentences (`c1`, `c2`, …). Each cue is a unit you choreograph against.
- Clean the text for speech: spell numbers the way they should be *said* ("six billion", "zero point two percent") and add a `display` mapping so captions show `6 billion`, `0.2%`. Display phrases are never split across caption chunks.
- `gap` after each cue is a breath; use ~0.4–0.7s within a section and 1.2–1.8s at section changes so visuals have room to transition.
- Hit a requested length by adjusting `rate` (e.g. `-9%`), `gap_scale`, `intro`, `outro` — not by padding the script. ~150 spoken words ≈ 1 minute at `-8%`.
- Good voices: `en-US-AndrewNeural` (warm, default), `en-US-BrianNeural`, `en-US-AvaNeural`, `en-US-EmmaNeural`, `en-GB-RyanNeural`. List all: `edge-tts --list-voices`.

Run `python tts.py` (in the project). It prints each cue's start time and the total length; `timeline.json` holds per-word times. Re-runs are cached per cue.

### 3. Choreograph — `scene.js`
Read `references/engine-api.md` for the API. Read `references/design-playbook.md` for layout, pacing and style rules — they encode what made the example look professional.

Core loop: create a node at a position, draw into it around the origin, then schedule when it appears/moves/draws, using times from the narration:
```js
const n = node(L_panel, 300, 1420); I.robot(n.g); T(n.g, 'derpy chatbot', 0, 140, { size: 46, fill: C.blue.t });
n.pop(W('c7', 'derpy'), .7);              // appears exactly as "derpy" is spoken
n.move(S('c9') - .5, 1.1, 340, 612, .42); // later flies onto the diagram and shrinks
```

### 4. Check stills before rendering (important)
Full renders take minutes; stills take seconds. After writing or changing the scene:
```bash
node render.js sheet 2.5 14 30 48 70 95 120 150 180 210
```
then **look at `build/sheet.png`** (Read the image). Pick times mid-cue and just after each big transition. Look for overlaps, elements that never disappear, text running off-canvas, things invisible because a `show()`/`op.v0 = 0` was forgotten, and empty-looking stretches. Fix and repeat. This loop is where quality comes from — do at least two passes.

### 5. Render
```bash
python mix.py                  # music bed ducked under voice -> build/mix.wav  (--no-music, --music-level 0.08)
node render.js video 6         # parallel capture -> build/part*.mp4  (~2.5 s of wall time per second of video with 6 workers)
node render.js final ../name.mp4
```
Run the `video` step in the background and wait for it; it can take ~10 minutes for a 4-minute video. Afterwards, extract a few frames from the final MP4 with ffmpeg and look at them as a last check, and report duration/resolution with ffprobe.

## Things that bite
- `new N(el)` takes over `el`'s `transform` attribute. If an element needs a fixed transform (e.g. `scale(.55)`), wrap it: put the transform on an outer `<g>` and create the node on an inner one.
- Nodes are visible by default (`op` = 1). Anything that should appear later needs `.show()`, `.pop()`, `.rise()`, `.life()` or `op.v0 = 0`.
- Tweens on the same property must not overlap in time; each starts from wherever the previous one ended.
- `W(cue, word)` matches the start of a normalized word (`'seventyfive'` for "seventy-five"); a miss logs `word not found` in the render output — watch for it.
- Monospace text needs `font: 'mono'` (sets `white-space: pre`) or indentation collapses.
- Don't put real people's likeness or fabricated quotes in the video. When reading someone's post, show placeholder scribble lines instead of inventing tweet text, and credit them.
