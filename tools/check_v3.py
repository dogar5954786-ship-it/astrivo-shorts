#!/usr/bin/env python3
"""Check a rendered v3 Short against the FORMAT-V3.md targets.

    python3 tools/check_v3.py out/<id>.mp4

The targets come from measuring two reference Shorts in this niche (54.9M and 12.1M views).
Run this before sending the review email. A FAIL means the Short will very likely underperform
in the way our old format did: too long, too static, or too cut-up.
"""
import json
import subprocess
import sys

import cv2
import numpy as np

# measured from the references
LEN_MIN, LEN_MAX, LEN_HARD = 15.0, 22.0, 25.0
MOTION_FLOOR = 1.5          # no single second may be quieter than this
MOTION_MEAN = 4.0           # whole-Short average
MAX_CUTS = 4                # references: 2 and 4
LUFS_LO, LUFS_HI = -16.0, -12.5
TP_MAX = -0.8               # true peak must stay below this (no clipping)
SAFE_BOTTOM = 0.78          # nothing important below 78% of the height


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-show_entries", "stream=width,height,codec_type", "-of", "json", path],
        capture_output=True, text=True).stdout
    return json.loads(out)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path,
                        "-af", "loudnorm=print_format=summary", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    lufs = tp = None
    for line in r.splitlines():
        if "Input Integrated" in line:
            lufs = float(line.split()[-2])
        if "Input True Peak" in line:
            tp = float(line.split()[-2])
    return lufs, tp


def main():
    if len(sys.argv) < 2:
        raise SystemExit("usage: check_v3.py <rendered.mp4>")
    path = sys.argv[1]
    info = probe(path)
    dur = float(info["format"]["duration"])
    vs = next(s for s in info["streams"] if s["codec_type"] == "video")
    w, h = vs["width"], vs["height"]

    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    prev, diffs, frames, bottom_ink = None, [], 0, 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.resize(fr, (180, 320))
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        if prev is not None:
            diffs.append(float(np.abs(g.astype(np.int16) - prev.astype(np.int16)).mean()))
        prev = g
        # bright pixels in the bottom safe zone (YouTube UI sits there)
        band = g[int(320 * SAFE_BOTTOM):]
        bottom_ink = max(bottom_ink, int((band > 170).sum()))
        frames += 1
    cap.release()

    d = np.array(diffs) if diffs else np.array([0.0])
    per_sec = [float(d[int(s * fps):int((s + 1) * fps)].mean())
               for s in range(max(1, int(frames / fps)))]
    th = max(d.mean() + 4 * d.std(), 15)
    cut_frames = np.where(d > th)[0]
    # collapse runs of adjacent frames into one cut
    cuts, last = 0, -99
    for j in cut_frames:
        if j - last > 3:
            cuts += 1
        last = j
    lufs, tp = loudness(path)

    rows, ok_all = [], True

    def check(name, passed, got, want):
        nonlocal ok_all
        ok_all = ok_all and passed
        rows.append(("PASS" if passed else "FAIL", name, got, want))

    check("resolution", (w, h) == (1080, 1920), f"{w}x{h}", "1080x1920")
    check("length", LEN_MIN <= dur <= LEN_MAX, f"{dur:.1f}s",
          f"{LEN_MIN:.0f}-{LEN_MAX:.0f}s (hard max {LEN_HARD:.0f})")
    check("hard cuts", cuts <= MAX_CUTS, str(cuts), f"<= {MAX_CUTS}")
    check("quietest second", min(per_sec) >= MOTION_FLOOR,
          f"{min(per_sec):.1f}", f">= {MOTION_FLOOR}")
    check("average motion", float(d.mean()) >= MOTION_MEAN,
          f"{d.mean():.1f}", f">= {MOTION_MEAN}")
    check("bottom safe zone", bottom_ink < 900, f"{bottom_ink} bright px",
          "< 900 (watermark only)")
    if lufs is not None:
        check("loudness", LUFS_LO <= lufs <= LUFS_HI, f"{lufs:.1f} LUFS",
              f"{LUFS_LO} to {LUFS_HI}")
    if tp is not None:
        check("true peak", tp <= TP_MAX, f"{tp:+.1f} dBTP", f"<= {TP_MAX} (no clipping)")

    wid = max(len(r[1]) for r in rows)
    print(f"\nv3 check — {path}\n")
    for status, name, got, want in rows:
        print(f"  [{status}] {name.ljust(wid)}  {got:<18} want {want}")
    print(f"\n  motion per second: {[round(v, 1) for v in per_sec]}")
    print("\n" + ("ALL CHECKS PASSED" if ok_all else "SOME CHECKS FAILED — see FORMAT-V3.md") + "\n")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
