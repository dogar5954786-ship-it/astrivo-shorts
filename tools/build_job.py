#!/usr/bin/env python3
"""Build one Astrivo Short from a job folder.

Usage: python3 tools/build_job.py jobs/<id>            (needs jobs/<id>/job.json)
       python3 tools/build_job.py jobs/<id> --audio x.mp3 --no-whisper   (local testing)
       python3 tools/build_job.py jobs/<id> --preview [--audio x.mp3]   (flat style: contact sheet only,
                                                 timings estimated from the text if there is no audio)

Jobs with "style": "flat" use the Flat-Vector Science renderer (flat/, needs jobs/<id>/scene.js).
Older jobs use the 3D renderer below.

Steps:
 1. download the voiceover (voice_url)
 2. find the exact time of every spoken word (faster-whisper), match them to the script
 3. give every segment (shot) its start/end time, and make 1-3 word captions
 4. render each shot with the 3D renderer, join them, add the voice
 5. write jobs/<id>/result.json  ->  out/<id>.mp4
"""
import json, os, re, subprocess, sys, urllib.request, difflib, math, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
PAGES = {"space": "real3d.html", "street": "street3d.html"}


def sh(*cmd, **kw):
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True, **kw)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def whisper_words(audio):
    from faster_whisper import WhisperModel
    model = WhisperModel(os.environ.get("WHISPER_MODEL", "base.en"), device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, word_timestamps=True, language="en", vad_filter=False)
    words = []
    for s in segs:
        for w in s.words or []:
            words.append((w.word.strip(), w.start, w.end))
    return words


def align(tokens, audio, use_whisper):
    """tokens: list of script words. returns list of (start, end) per token."""
    total = duration(audio)
    times = [None] * len(tokens)
    if use_whisper:
        try:
            ww = whisper_words(audio)
            a = [norm(t) for t in tokens]
            b = [norm(w[0]) for w in ww]
            sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
            for blk in sm.get_matching_blocks():
                for k in range(blk.size):
                    w = ww[blk.b + k]
                    times[blk.a + k] = (w[1], w[2])
            print(f"whisper matched {sum(t is not None for t in times)}/{len(tokens)} words", flush=True)
        except Exception as e:  # fall back to estimate
            print("whisper failed, estimating timings:", e, flush=True)
    if all(t is None for t in times):
        # estimate: spread words by character length over the audio
        lead, tail = 0.1, 0.25
        lens = [len(t) + 2 for t in tokens]
        span = max(0.5, total - lead - tail)
        acc = lead
        for i, L in enumerate(lens):
            d = span * L / sum(lens)
            times[i] = (acc, acc + d)
            acc += d
        return times, total
    # fill gaps by interpolation between known neighbours
    known = [i for i, t in enumerate(times) if t is not None]
    for i in range(len(tokens)):
        if times[i] is not None:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = times[prev][1] if prev is not None else 0.05
        t1 = times[nxt][0] if nxt is not None else total - 0.1
        n_gap = (nxt if nxt is not None else len(tokens)) - (prev if prev is not None else -1) - 1
        pos = i - (prev if prev is not None else -1) - 1
        step = max(0.05, (t1 - t0) / max(1, n_gap))
        times[i] = (t0 + pos * step, t0 + (pos + 1) * step)
    return times, total


def chunk_captions(words, max_words=3, max_chars=16):
    """words: list of (text, start, end). Break on punctuation too."""
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x[0] for x in cur)
        if len(cur) >= max_words or len(text) >= max_chars or re.search(r"[.?!,;:]$", w[0]):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    # keep the punctuation that helps reading (? !) and drop the rest
    out = []
    for c in chunks:
        txt = " ".join(x[0] for x in c)
        txt = re.sub(r"[;:.\"“”]+", "", txt)
        txt = re.sub(r",(?!\d)", "", txt).replace("  ", " ").strip()   # keep commas inside numbers (384,400)
        out.append({"text": txt, "t0": c[0][1], "t1": c[-1][2]})
    for i in range(len(out) - 1):  # hold each caption until the next one starts (no flicker)
        if out[i + 1]["t0"] - out[i]["t1"] < 0.6:
            out[i]["t1"] = out[i + 1]["t0"]
    return out


def estimate_words(tokens, wps=2.75):
    """No audio yet: spread words at a natural speaking pace, with a pause after sentences."""
    t, out = 0.1, []
    for w in tokens:
        d = (len(w) + 3) / (wps * 7.0)
        out.append((t, t + d))
        t += d + (0.18 if re.search(r"[.?!]$", w) else 0.06 if w.endswith(",") else 0)
    return out, t + 0.2


def build_flat(job, job_dir, args):
    jid = job["id"]
    work = os.path.join(ROOT, "build", jid)
    os.makedirs(work, exist_ok=True)
    use_whisper = "--no-whisper" not in args
    preview = "--preview" in args
    audio = None
    if "--audio" in args:
        audio = os.path.join(work, "voice.mp3")
        shutil.copy(args[args.index("--audio") + 1], audio)
    elif not preview:
        audio = os.path.join(work, "voice.mp3")
        req = urllib.request.Request(job["voice_url"], headers={"User-Agent": "astrivo-renderer"})
        with urllib.request.urlopen(req, timeout=120) as r, open(audio, "wb") as f:
            f.write(r.read())
    tokens, owner = [], []
    for si, seg in enumerate(job["segments"]):
        for w in seg["text"].split():
            tokens.append(w)
            owner.append(si)
    if audio:
        times, total = align(tokens, audio, use_whisper)
    else:
        times, total = estimate_words(tokens)
    words = [(tokens[i], times[i][0], times[i][1]) for i in range(len(tokens))]
    nseg = len(job["segments"])
    starts = [0.0 if si == 0 else max(0.0, words[owner.index(si)][1] - 0.04) for si in range(nseg)]
    D = round(max(total, words[-1][2]) + float(job.get("tail", 1.2)), 3)
    D = math.ceil(D * FPS) / FPS
    segs = [{"i": si, "t0": round(starts[si], 3), "t1": round(starts[si + 1] if si + 1 < nseg else D, 3),
             "text": job["segments"][si]["text"]} for si in range(nseg)]
    timing = {"D": D, "segs": segs,
              "words": [{"w": w, "t0": round(a, 3), "t1": round(b, 3), "s": owner[i]} for i, (w, a, b) in enumerate(words)],
              "caps": chunk_captions(words)}
    tpath = os.path.join(work, "timing.json")
    json.dump(timing, open(tpath, "w"), indent=1)
    rel = lambda p: os.path.relpath(p, ROOT)
    renderer = os.path.join(ROOT, "flat", "render.mjs")
    if preview:
        sheet = os.path.join(work, "sheet.png")
        cmd = ["node", renderer, "--job", rel(job_dir), "--timing", rel(tpath), "--sheet", sheet]
        if "--frames" in args:
            cmd += ["--frames", args[args.index("--frames") + 1]]
        sh(*cmd)
        print("PREVIEW", sheet, flush=True)
        return
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    final = os.path.join(ROOT, "out", f"{jid}.mp4")
    sh("node", renderer, "--job", rel(job_dir), "--timing", rel(tpath), "--voice", audio, "--out", final)
    res = {"status": "rendered", "id": jid, "style": "flat", "seconds": round(duration(final), 2), "file": f"{jid}.mp4",
           "captions": timing["caps"]}
    json.dump(res, open(os.path.join(job_dir, "result.json"), "w"), indent=1)
    print("DONE", final, res["seconds"], "s", flush=True)


def main():
    args = sys.argv[1:]
    _job = json.load(open(os.path.join(os.path.abspath(args[0]), "job.json")))
    if _job.get("style") == "flat":
        return build_flat(_job, os.path.abspath(args[0]), args)
    job_dir = os.path.abspath(args[0])
    use_whisper = "--no-whisper" not in args
    job = json.load(open(os.path.join(job_dir, "job.json")))
    jid = job["id"]
    work = os.path.join(ROOT, "build", jid)
    shutil.rmtree(work, ignore_errors=True)
    os.makedirs(work)

    # 1. voiceover
    audio = os.path.join(work, "voice.mp3")
    if "--audio" in args:
        shutil.copy(args[args.index("--audio") + 1], audio)
    else:
        req = urllib.request.Request(job["voice_url"], headers={"User-Agent": "astrivo-renderer"})
        with urllib.request.urlopen(req, timeout=120) as r, open(audio, "wb") as f:
            f.write(r.read())

    # 2. timings
    tokens, owner = [], []
    for si, seg in enumerate(job["segments"]):
        for w in seg["text"].split():
            tokens.append(w)
            owner.append(si)
    times, total = align(tokens, audio, use_whisper)
    words = [(tokens[i], times[i][0], times[i][1]) for i in range(len(tokens))]

    # 3. shot times: each segment starts when its first word starts; frame-exact boundaries
    nseg = len(job["segments"])
    starts = []
    for si in range(nseg):
        first = owner.index(si)
        starts.append(0.0 if si == 0 else max(0.0, words[first][1] - 0.05))
    end_total = max(total, words[-1][2]) + 0.5
    fb = [round(s * FPS) for s in starts] + [math.ceil(end_total * FPS)]
    captions = chunk_captions(words)

    # 4. render each segment
    clips = []
    hook = job.get("hook")
    for si, seg in enumerate(job["segments"]):
        f0, f1 = fb[si], fb[si + 1]
        if f1 <= f0:
            continue
        t0, d = f0 / FPS, (f1 - f0) / FPS
        page = PAGES.get(seg.get("page", "space"), "real3d.html")
        shot = dict(seg.get("shot") or {})
        cam = shot.get("camera") or [{"t": 0, "pos": [0, 0, 4], "look": [0, 0, 0], "fov": 40}, {"t": 1, "pos": [0.4, 0.2, 3.6], "look": [0, 0, 0], "fov": 40}]
        shot["camera"] = [{**k, "t": float(k.get("t", 0)) * d} for k in cam]  # job uses 0..1 fractions
        shot["t0"], shot["t1"] = 0, d + 1
        if si > 0 and "cutFlash" not in shot:
            shot["cutFlash"] = True
        caps = [{"text": c["text"], "t0": c["t0"] - t0, "t1": c["t1"] - t0} for c in captions if c["t1"] > t0 and c["t0"] < t0 + d]
        scene = {"duration": d, "shots": [shot], "captions": caps}
        if si == 0 and hook:
            scene["hook"] = {"text": hook["text"], "t1": min(d, float(hook.get("seconds", 3.0)))}
        sf = os.path.join(work, f"scene_{si:02d}.json")
        json.dump(scene, open(sf, "w"))
        clip = os.path.join(work, f"clip_{si:02d}.mp4")
        sh("node", os.path.join(ROOT, "render3d.mjs"), sf, clip, "--dur", f"{d:.4f}", env={**os.environ, "PAGE": page})
        clips.append(clip)

    # 5. join + voice
    lst = os.path.join(work, "list.txt")
    open(lst, "w").write("".join(f"file '{c}'\n" for c in clips))
    silent = os.path.join(work, "silent.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent)
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    final = os.path.join(ROOT, "out", f"{jid}.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", audio,
       "-filter_complex", "[1:a]adelay=0|0,apad[a]", "-map", "0:v", "-map", "[a]",
       "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-maxrate", "5M", "-bufsize", "10M", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", final)
    res = {"status": "rendered", "id": jid, "seconds": round(duration(final), 2), "file": f"{jid}.mp4",
           "captions": captions}
    json.dump(res, open(os.path.join(job_dir, "result.json"), "w"), indent=1)
    print("DONE", final, res["seconds"], "s", flush=True)


if __name__ == "__main__":
    main()
