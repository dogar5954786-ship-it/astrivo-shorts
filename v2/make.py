#!/usr/bin/env python3
"""Build an Astrivo v2 Short from a job folder (script.json + scene.py).

  python3 v2/make.py v2/jobs/<id> voice                 # stand-in voice (Kokoro) + timing.json
  python3 v2/make.py v2/jobs/<id> voice --audio x.mp3   # real ElevenLabs voice: word times via Whisper
  python3 v2/make.py v2/jobs/<id> voice --url <url>     # same, downloads the MP3 first
  python3 v2/make.py v2/jobs/<id> stills 0.5 4 10.2     # draw test frames + contact sheet (frames/sheet.png)
  python3 v2/make.py v2/jobs/<id> render [-j 2]         # sound + all scenes + final MP4 (out/<id>.mp4)
  python3 v2/make.py v2/jobs/<id> all                   # voice (if no timing.json) + render

Needs: pip install pycairo numpy scipy soundfile (+ kokoro-onnx for the stand-in voice,
faster-whisper for real-voice alignment), ffmpeg on PATH, Poppins font installed (fonts/ in this repo).
"""
import os, sys, json, glob, subprocess, importlib.util
from concurrent.futures import ProcessPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "engine"))
import lib, voice as V
from audio import Audio

def load(job_dir):
    lib.load_job(job_dir)
    spec = importlib.util.spec_from_file_location("scene", os.path.join(job_dir, "scene.py"))
    sc = importlib.util.module_from_spec(spec); spec.loader.exec_module(sc)
    sc.setup(lib.J); lib.SC = sc
    return sc

def _render_one(args):
    job_dir, i, outdir = args
    load(job_dir); lib.render_scene(i, outdir); return i

def voice_path(job_dir):
    for n in ("voice.mp3", "voice.wav"):
        p = os.path.join(job_dir, n)
        if os.path.exists(p): return p
    raise SystemExit("no voice yet: run `voice` first")

def cmd_voice(job_dir, argv):
    if "--url" in argv:
        mp3 = V.download(argv[argv.index("--url") + 1], os.path.join(job_dir, "voice.mp3")); V.from_audio(job_dir, mp3)
    elif "--audio" in argv:
        src = argv[argv.index("--audio") + 1]; dst = os.path.join(job_dir, "voice.mp3")
        if os.path.abspath(src) != os.path.abspath(dst): subprocess.run(["cp", src, dst], check=True)
        V.from_audio(job_dir, dst)
    else:
        V.standin(job_dir)
    t = json.load(open(os.path.join(job_dir, "timing.json")))
    for x in t: print(x["id"], x["start"], x["end"])

def cmd_stills(job_dir, times):
    load(job_dir); fd = os.path.join(job_dir, "frames"); os.makedirs(fd, exist_ok=True)
    for f in glob.glob(os.path.join(fd, "f_*.png")): os.remove(f)
    for tt in times: lib.still(float(tt), os.path.join(fd, f"f_{float(tt):06.2f}.png"))
    from PIL import Image
    fs = sorted(glob.glob(os.path.join(fd, "f_*.png"))); ims = [Image.open(f).resize((270, 480)) for f in fs]
    cols = 5; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (270 * cols, 480 * rows), "black")
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
    sheet.save(os.path.join(fd, "sheet.png")); print(os.path.join(fd, "sheet.png"))

def cmd_render(job_dir, argv):
    sc = load(job_dir); J = lib.J
    jid = os.path.basename(os.path.normpath(job_dir))
    work = os.path.join(job_dir, "build"); os.makedirs(work, exist_ok=True)
    for f in glob.glob(os.path.join(work, "*.mp4")): os.remove(f)
    A = Audio(J.TOTAL); sc.sound(A); A.mix(voice_path(job_dir), work); print("audio ok")
    jobs = int(argv[argv.index("-j") + 1]) if "-j" in argv else max(1, os.cpu_count() or 1)
    with ProcessPoolExecutor(jobs) as ex:
        for i in ex.map(_render_one, [(job_dir, i, work) for i in range(len(J.TIM))]): print("scene", i, "done", flush=True)
    lst = os.path.join(work, "list.txt")
    with open(lst, "w") as f:
        for i in range(len(J.TIM)): f.write(f"file '{os.path.abspath(work)}/{i:02d}.mp4'\n")
    vo = os.path.join(work, "video_only.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vo], check=True)
    os.makedirs(os.path.join(os.path.dirname(HERE), "out"), exist_ok=True)
    final = os.path.join(os.path.dirname(HERE), "out", f"{jid}.mp4")
    for wav, dst in (("mix.wav", final), ("mix_no_voice.wav", final.replace(".mp4", "_no_voice.mp4"))):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo, "-i", os.path.join(work, wav), "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", dst], check=True)
    print(final)

if __name__ == "__main__":
    job_dir, cmd, rest = sys.argv[1], sys.argv[2], sys.argv[3:]
    if cmd == "voice": cmd_voice(job_dir, rest)
    elif cmd == "stills": cmd_stills(job_dir, rest)
    elif cmd == "render": cmd_render(job_dir, rest)
    elif cmd == "all":
        if not os.path.exists(os.path.join(job_dir, "timing.json")): cmd_voice(job_dir, rest)
        cmd_render(job_dir, rest)
    else: raise SystemExit(__doc__)
