"""Narration + timing for an explainer video.

Usage:  python tts.py [project_dir]        (default: current directory)

Reads   <project>/script.json
Writes  <project>/timeline.json          cue start/end, per-word times, caption chunks
        <project>/audio/narration.npy    mono float32 @ 48 kHz, placed on the timeline
        <project>/audio/<cue>.mp3/.wav/.json  per-cue cache (re-used if text+voice+rate unchanged)

script.json:
{
  "voice": "en-US-AndrewNeural", "rate": "-9%",
  "intro": 4.0,          # silent seconds before first cue (title card)
  "outro": 8.0,          # seconds held after last cue
  "gap_scale": 1.45, "gap_pad": 0.1,   # effective gap = gap * gap_scale + gap_pad
  "display": [["six billion", "6 billion"], ...],   # spoken -> caption form (never split)
  "cues": [{"id": "c1", "text": "Spoken sentence.", "gap": 0.6}, ...]
}
"""
import asyncio, json, os, re, subprocess, sys, wave
import numpy as np
import edge_tts

SR = 48000
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
AUD = os.path.join(ROOT, "audio")
CFG = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
VOICE = CFG.get("voice", "en-US-AndrewNeural")
RATE = CFG.get("rate", "-5%")
DISPLAY = [tuple(p) for p in CFG.get("display", [])]
MAX_CAPTION = CFG.get("caption_chars", 52)


async def _synth(cid, text):
    mp3 = os.path.join(AUD, f"{cid}.mp3")
    words = []
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    with open(mp3, "wb") as f:
        async for ch in comm.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), os.path.join(AUD, f"{cid}.wav")], check=True)
    return words


async def synth(cid, text):
    cache = os.path.join(AUD, f"{cid}.json")
    key = {"text": text, "rate": RATE, "voice": VOICE}
    if os.path.exists(cache) and os.path.exists(os.path.join(AUD, f"{cid}.wav")):
        c = json.load(open(cache, encoding="utf-8"))
        if all(c.get(k) == v for k, v in key.items()):
            return c["words"]
    for attempt in range(6):  # the edge endpoint occasionally returns no audio; retry
        try:
            words = await _synth(cid, text)
            json.dump(dict(key, words=words), open(cache, "w", encoding="utf-8"))
            return words
        except Exception as e:
            print("retry", cid, e)
            await asyncio.sleep(3 + attempt * 3)
    raise RuntimeError(f"TTS failed for {cid}")


def read_wav(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def attach_punct(text, words):
    pos = 0
    for w in words:
        i = text.find(w["w"], pos)
        if i < 0:
            w["p"] = ""
            continue
        j = i + len(w["w"])
        w["p"] = re.match(r"[^\w\s']*", text[j:]).group(0)
        pos = j + len(w["p"])
    return words


def merge_display(words):
    out, i = [], 0
    while i < len(words):
        hit = None
        for phrase, disp in DISPLAY:
            toks = phrase.lower().split()
            seg = words[i:i + len(toks)]
            if len(seg) == len(toks) and (all(a["w"].lower().strip("-") == b for a, b in zip(seg, toks))
                                          or " ".join(x["w"].lower() for x in seg) == phrase.lower()):
                hit = (len(toks), disp)
                break
        if hit:
            n, disp = hit
            seg = words[i:i + n]
            out.append({"w": disp, "s": seg[0]["s"], "e": seg[-1]["e"], "p": seg[-1].get("p", "")})
            i += n
        else:
            out.append(dict(words[i]))
            i += 1
    return out


def ends_sentence(w):
    p = w.get("p", "")
    return bool(p) and p[0] in ".?!"


def chunk(words, maxc=MAX_CAPTION):
    tok = lambda x: x["w"] + x.get("p", "")
    chunks, cur = [], []
    for w in words:
        if cur and len(" ".join([tok(x) for x in cur] + [tok(w)])) > maxc:
            chunks.append(cur)
            cur = []
        cur.append(w)
        if ends_sentence(w):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    merged = []  # fold short orphan tails ("code.") into the previous chunk of the same sentence
    for c in chunks:
        if merged and len(" ".join(tok(x) for x in c)) <= 16 and not ends_sentence(merged[-1][-1]):
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    return [{"text": " ".join(tok(x) for x in c), "s": c[0]["s"], "e": c[-1]["e"]} for c in merged]


async def main():
    os.makedirs(AUD, exist_ok=True)
    t = CFG.get("intro", 3.5)
    gs, gp = CFG.get("gap_scale", 1.0), CFG.get("gap_pad", 0.0)
    timeline = {"intro": t, "cues": []}
    pieces = []
    for cue in CFG["cues"]:
        cid, text, gap = cue["id"], cue["text"], cue.get("gap", 0.5)
        words = attach_punct(text, await synth(cid, text))
        audio = read_wav(os.path.join(AUD, f"{cid}.wav"))
        nz = np.nonzero(np.abs(audio) > 0.003)[0]
        speech_end = (nz[-1] / SR + 0.08) if len(nz) else len(audio) / SR
        caps = chunk(merge_display(words))
        timeline["cues"].append({
            "id": cid, "text": text, "start": round(t, 3), "end": round(t + speech_end, 3),
            "words": [{"w": w["w"], "s": round(t + w["s"], 3), "e": round(t + w["e"], 3)} for w in words],
            "captions": [{"text": c["text"], "s": round(t + c["s"], 3), "e": round(t + c["e"], 3)} for c in caps],
        })
        pieces.append((t, audio[: int(speech_end * SR)]))
        print(f"{cid:6s} {t:7.2f}s  {speech_end:5.2f}s  {text[:60]}")
        t += speech_end + gap * gs + gp
    total = t + CFG.get("outro", 6.0)
    timeline["total"] = round(total, 3)
    out = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for st, a in pieces:
        i = int(st * SR)
        out[i:i + len(a)] += a
    np.save(os.path.join(AUD, "narration.npy"), out[: int(total * SR)])
    json.dump(timeline, open(os.path.join(ROOT, "timeline.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"TOTAL {total:.2f}s ({int(total // 60)}:{int(total % 60):02d})")


asyncio.run(main())
