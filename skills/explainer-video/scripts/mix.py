"""Synthesize a soft ambient pad, duck it under the narration, write <project>/build/mix.wav.

Usage: python mix.py [project_dir] [--no-music] [--music-level 0.11]
"""
import json, os, sys, wave
import numpy as np

def movavg(x, k):
    c = np.cumsum(np.concatenate([np.zeros(k // 2 + 1), x, np.zeros(k)]))
    return (c[k:k + len(x)] - c[:len(x)]) / k


args = [a for a in sys.argv[1:] if not a.startswith("--")]
HERE = os.path.abspath(args[0] if args else ".")
NO_MUSIC = "--no-music" in sys.argv
LEVEL = float(sys.argv[sys.argv.index("--music-level") + 1]) if "--music-level" in sys.argv else 0.11
SR = 48000
voice = np.load(os.path.join(HERE, "audio", "narration.npy"))
tl = json.load(open(os.path.join(HERE, "timeline.json"), encoding="utf-8"))
N = len(voice)
t = np.arange(N) / SR

def hz(m): return 440 * 2 ** ((m - 69) / 12)

# Cmaj9 – Am9 – Fmaj7#11 – G6sus, 8s each, voiced low and soft
chords = [[48, 55, 62, 64, 71], [45, 52, 59, 60, 67], [41, 48, 55, 57, 64], [43, 50, 57, 59, 62]]
CH = 8.0
pad = np.zeros(N, dtype=np.float64)
rng = np.random.default_rng(3)
for k in range(int(N / SR / CH) + 2):
    st = k * CH - 1.5
    notes = chords[k % 4]
    i0, i1 = max(0, int(st * SR)), min(N, int((st + CH + 3.0) * SR))
    if i0 >= i1:
        continue
    tt = t[i0:i1] - st
    env = np.clip(tt / 2.5, 0, 1) * np.clip((CH + 3.0 - tt) / 3.0, 0, 1)
    env = env ** 1.6
    for n in notes:
        f = hz(n)
        for det in (-0.07, 0.07):
            ph = rng.uniform(0, 6.28)
            ff = f * 2 ** (det / 12)
            pad[i0:i1] += env * (np.sin(2 * np.pi * ff * tt + ph) + 0.18 * np.sin(4 * np.pi * ff * tt + ph)) / len(notes)
# slow shimmer + gentle lowpass via moving average
pad *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t)
k = 24
pad = movavg(pad, k)
pad /= np.max(np.abs(pad)) + 1e-9

# ducking under speech
speech = np.zeros(N)
for c in tl["cues"]:
    speech[int(c["start"] * SR):int(c["end"] * SR)] = 1
win = int(0.4 * SR)
duck = movavg(speech, win)
gain = LEVEL - LEVEL * 0.45 * duck                      # ~ -19 dB idle, ~ -24 dB under voice
fade = np.clip(t / 2.0, 0, 1) * np.clip((t[-1] - t) / 3.0, 0, 1)
music = pad * gain * fade * (0 if NO_MUSIC else 1)

v = voice / (np.max(np.abs(voice)) + 1e-9) * 0.86
mix = v + music
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
st = np.stack([mix, mix], 1)
out = (np.clip(st, -1, 1) * 32767).astype(np.int16)
os.makedirs(os.path.join(HERE, "build"), exist_ok=True)
with wave.open(os.path.join(HERE, "build", "mix.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print("mix seconds", N / SR)
