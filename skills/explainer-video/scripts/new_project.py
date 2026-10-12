"""Scaffold an explainer-video project.

Usage: python new_project.py <project_dir> [--example funnel]

Copies the engine, page template, pipeline scripts, a starter (or the worked funnel example)
scene.js + script.json, generates the paper background, and installs node deps.
"""
import os, shutil, subprocess, sys, json

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(SKILL, "assets")
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
dst = os.path.abspath(args[0])
example = "--example" in sys.argv
os.makedirs(os.path.join(dst, "build"), exist_ok=True)
os.makedirs(os.path.join(dst, "audio"), exist_ok=True)

def cp(src, name):
    target = os.path.join(dst, name)
    if os.path.exists(target) and name in ("scene.js", "script.json"):
        print("keep existing", name)
        return
    shutil.copy(src, target)

cp(os.path.join(A, "index.html"), "index.html")
cp(os.path.join(A, "engine.js"), "engine.js")
for s in ("tts.py", "mix.py", "render.js", "paper.py"):
    cp(os.path.join(SKILL, "scripts", s), s)
if example:
    cp(os.path.join(A, "examples", "funnel-scene.js"), "scene.js")
    cp(os.path.join(A, "examples", "funnel-script.json"), "script.json")
else:
    cp(os.path.join(A, "scene-starter.js"), "scene.js")
    if not os.path.exists(os.path.join(dst, "script.json")):
        json.dump({
            "voice": "en-US-AndrewNeural", "rate": "-8%", "intro": 4.0, "outro": 7.0,
            "gap_scale": 1.0, "gap_pad": 0.1, "display": [["one thousand", "1,000"]],
            "cues": [
                {"id": "c1", "text": "Here is the first idea, and here is the number one thousand.", "gap": 0.8},
                {"id": "c2", "text": "Some see a chatbot. Others see new science.", "gap": 0.6},
            ],
        }, open(os.path.join(dst, "script.json"), "w", encoding="utf-8"), indent=1)

subprocess.run([sys.executable, os.path.join(dst, "paper.py"), os.path.join(dst, "paper.png")], check=True)
if not os.path.exists(os.path.join(dst, "package.json")):
    json.dump({"name": "explainer", "private": True}, open(os.path.join(dst, "package.json"), "w"))
npm = "npm.cmd" if os.name == "nt" else "npm"
subprocess.run([npm, "i", "--silent", "roughjs@4.6.6", "@fontsource/caveat@5", "@fontsource/inter@5", "playwright-core@1.56.1"], cwd=dst, check=True)
print("project ready:", dst)
