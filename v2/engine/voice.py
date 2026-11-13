"""Voice + timing for a v2 job.

Two ways:
 1. Real voice (ElevenLabs MP3 from Abdullah or the Zapier action): word times come from
    faster-whisper via tools/build_job.align() -> timing.json with real word times.
 2. No voice yet: Kokoro stand-in voice, one clip per line -> voice.wav + timing.json.
    Kokoro model files come from GitHub releases (Hugging Face may be blocked):
      https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
      https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    Put them in $KOKORO_DIR (default ~/.cache/kokoro).
"""
import json, os, sys, subprocess, urllib.request
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KDIR = os.path.expanduser(os.environ.get("KOKORO_DIR", "~/.cache/kokoro"))
KURL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"

def _kokoro():
    os.makedirs(KDIR, exist_ok=True)
    for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        p = os.path.join(KDIR, f)
        if not os.path.exists(p):
            print("downloading", f, flush=True)
            subprocess.run(["curl", "-sSL", "-o", p, KURL + f], check=True)
    from kokoro_onnx import Kokoro
    return Kokoro(os.path.join(KDIR, "kokoro-v1.0.onnx"), os.path.join(KDIR, "voices-v1.0.bin"))

def standin(job_dir, voice="am_michael", speed=1.18, gap=0.10):
    lines = json.load(open(os.path.join(job_dir, "script.json")))
    k = _kokoro(); out = []; t = 0.0; timing = []; sr = 24000
    for L in lines:
        s, sr = k.create(L["text"], voice=voice, speed=speed, lang="en-us")
        idx = np.where(np.abs(s) > 0.01)[0]; s = s[max(idx[0] - 240, 0): idx[-1] + 480]
        d = len(s) / sr
        timing.append({**L, "start": round(t, 3), "end": round(t + d, 3)})
        out += [s, np.zeros(int(gap * sr), dtype=s.dtype)]; t += d + gap
    sf.write(os.path.join(job_dir, "voice.wav"), np.concatenate(out), sr)
    json.dump(timing, open(os.path.join(job_dir, "timing.json"), "w"), indent=1)
    return os.path.join(job_dir, "voice.wav")

def from_audio(job_dir, audio):
    """Align a real voiceover (text must match script.json exactly, lines joined by spaces)."""
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from build_job import align
    lines = json.load(open(os.path.join(job_dir, "script.json")))
    tokens, owner = [], []
    for i, L in enumerate(lines):
        for w in L["text"].split():
            tokens.append(w); owner.append(i)
    times, total = align(tokens, audio, True)
    timing = []
    for i, L in enumerate(lines):
        ws = [(tokens[k], *times[k]) for k in range(len(tokens)) if owner[k] == i]
        timing.append({**L, "start": round(ws[0][1], 3), "end": round(ws[-1][2], 3),
                       "words": [[w, round(a, 3), round(b, 3)] for w, a, b in ws]})
    json.dump(timing, open(os.path.join(job_dir, "timing.json"), "w"), indent=1)
    return audio

def download(url, path):
    urllib.request.urlretrieve(url, path); return path
