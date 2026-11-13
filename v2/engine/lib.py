"""Astrivo v2 engine: drawing library, HUD, captions, camera and frame loop.

A Short = a job folder with script.json + scene.py. scene.py imports this module
(`from lib import *`) and defines the scenes; the engine does everything else.
See v2/README.md for the full guide.
"""
import cairo, math, random, json, os, subprocess

W, H, FPS = 1080, 1920, 30

# ---------------- palette (one flat-vector style) ----------------
NAVY1 = (0.03, 0.04, 0.11); NAVY2 = (0.10, 0.10, 0.28)
YEL = (1.0, 0.82, 0.25); ORG = (1.0, 0.58, 0.12); WHITE = (1, 1, 1)
BLUE = (0.16, 0.50, 0.86); GREEN = (0.24, 0.68, 0.42); RED = (1.0, 0.30, 0.30)
ICE = (0.88, 0.96, 1.0); INK = (0.07, 0.08, 0.15)

# ---------------- math / easing ----------------
def clamp(x, a=0, b=1): return max(a, min(b, x))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def eout(x): x = clamp(x); return 1 - (1 - x) ** 3
def back(x):
    x = clamp(x); c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def lerp(a, b, x): return a + (b - a) * x
def mix(c1, c2, x): return tuple(lerp(a, b, x) for a, b in zip(c1, c2))

_R = random.Random(7)
STARS = [(_R.uniform(0, W), _R.uniform(0, H), _R.uniform(1.0, 3.4), _R.uniform(0, 6.28), _R.uniform(0.3, 1.0)) for _ in range(190)]
DUST = [(_R.uniform(0, W), _R.uniform(0, H), _R.uniform(2, 6), _R.uniform(0, 6.28), _R.uniform(10, 35)) for _ in range(40)]

# ---------------- job timing (filled by load_job) ----------------
class Job:
    pass
J = Job()

def load_job(job_dir):
    J.dir = job_dir
    J.TIM = json.load(open(os.path.join(job_dir, "timing.json")))
    J.TOTAL = round(J.TIM[-1]["end"] + 0.2, 2)
    J.S = {x["id"]: x["start"] for x in J.TIM}
    J.E = {x["id"]: x["end"] for x in J.TIM}
    J.IDS = [x["id"] for x in J.TIM]
    J.WT = {}
    for L in J.TIM:
        if L.get("words"):  # real word times (from Whisper alignment)
            J.WT[L["id"]] = [(w.upper().strip(".,?!\"'"), a, b) for w, a, b in L["words"]]
            continue
        ws = L["text"].replace("...", " ").replace("…", " ").split()
        lens = [len(w) + 2 for w in ws]; tot = sum(lens); t0 = L["start"]; d = L["end"] - L["start"]
        line = []
        for w, n in zip(ws, lens):
            line.append((w.upper().strip(".,?!\"'"), t0, t0 + d * n / tot)); t0 += d * n / tot
        J.WT[L["id"]] = line
    return J

def wstart(sid, word, nth=1):
    """Start time of the nth occurrence of WORD (case-insensitive) in line sid."""
    k = 0
    for w, a, b in J.WT[sid]:
        if w == word.upper():
            k += 1
            if k == nth: return a
    raise KeyError(f"{word} not in {sid}")

def scene_end(i): return J.TIM[i + 1]["start"] if i + 1 < len(J.TIM) else J.TOTAL

# ---------------- text & shapes ----------------
def font(ctx, size):
    ctx.select_font_face("Poppins", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); ctx.set_font_size(size)

def text(ctx, s, x, y, size, color=WHITE, outline=0, alpha=1):
    font(ctx, size); xb, yb, tw, th, _, _ = ctx.text_extents(s)
    ctx.move_to(x - (tw / 2 + xb), y + th / 2 - (th + yb)); ctx.text_path(s)
    if outline:
        ctx.set_source_rgba(0, 0, 0, 0.9 * alpha); ctx.set_line_width(outline)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke_preserve()
    ctx.set_source_rgba(*color, alpha); ctx.fill()

def rrect(ctx, x, y, w, h, r):
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0); ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi); ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi); ctx.close_path()

def circle(ctx, x, y, r, color, a=1):
    ctx.arc(x, y, max(r, 0.01), 0, 2 * math.pi); ctx.set_source_rgba(*color, a); ctx.fill()

def glow(ctx, x, y, r0, r1, color, a):
    g = cairo.RadialGradient(x, y, r0, x, y, r1)
    g.add_color_stop_rgba(0, *color, a); g.add_color_stop_rgba(1, *color, 0)
    ctx.arc(x, y, r1, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()

def tag(ctx, s, x, y, size=38, color=YEL, a=1):
    """Small dark label pill inside a scene (e.g. LAST LIGHT). Don't repeat the captions."""
    if a <= 0: return
    font(ctx, size); tw = ctx.text_extents(s)[2]
    rrect(ctx, x - tw / 2 - 22, y - size * 0.75, tw + 44, size * 1.5, size * 0.5)
    ctx.set_source_rgba(0.03, 0.04, 0.10, 0.80 * a); ctx.fill()
    text(ctx, s, x, y, size, color, alpha=a)

def big_word(ctx, s, t, t0, y=820, size=150, color=WHITE, dur=1.6):
    """Huge impact word that pops in once at t0 (use for the key moment only)."""
    if t < t0 or t > t0 + dur: return
    k = back((t - t0) / 0.25); a = 1 - clamp((t - t0 - dur + 0.3) / 0.3)
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(k, k)
    glow(ctx, 0, 0, 20, 420, color, 0.25 * a)
    text(ctx, s, 0, 0, size, color, outline=18, alpha=a); ctx.restore()

def dashed_circle(ctx, x, y, r, color, a, w=4):
    ctx.set_dash([14, 12]); ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.set_line_width(w); ctx.set_source_rgba(*color, a); ctx.stroke(); ctx.set_dash([])

def flash(ctx, a):
    if a > 0:
        ctx.rectangle(-200, -200, W + 400, H + 400); ctx.set_source_rgba(1, 1, 1, a); ctx.fill()

# ---------------- backgrounds ----------------
def bg_space(ctx, t, drift=(0, 0), star_a=1):
    g = cairo.LinearGradient(0, 0, 0, H); g.add_color_stop_rgb(0, *NAVY1); g.add_color_stop_rgb(1, *NAVY2)
    ctx.rectangle(-200, -200, W + 400, H + 400); ctx.set_source(g); ctx.fill()
    glow(ctx, 260, 700, 0, 700, (0.35, 0.2, 0.6), 0.18); glow(ctx, 860, 1400, 0, 600, (0.1, 0.35, 0.6), 0.15)
    for x, y, r, p, dep in STARS:
        xx = (x + drift[0] * dep) % W; yy = (y + drift[1] * dep) % H
        a = (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 2.2 + p))) * star_a
        circle(ctx, xx, yy, r * dep, WHITE, a)

def bg_sky(ctx, t, dark=0, cold=0, clouds=True):
    top = mix(mix((0.25, 0.58, 0.95), NAVY1, dark), (0.05, 0.06, 0.12), cold)
    bot = mix(mix((0.70, 0.88, 1.0), NAVY2, dark), (0.16, 0.19, 0.30), cold)
    g = cairo.LinearGradient(0, 0, 0, 1250); g.add_color_stop_rgb(0, *top); g.add_color_stop_rgb(1, *bot)
    ctx.rectangle(-200, -200, W + 400, H + 400); ctx.set_source(g); ctx.fill()
    sa = clamp(max(dark, cold) * 2 - 1)
    if sa > 0:
        for x, y, r, p, dep in STARS:
            if y < 1150: circle(ctx, x, y, r * dep, WHITE, sa * (0.5 + 0.5 * math.sin(t * 2 + p)))
    if clouds and dark < 0.5 and cold == 0:
        for cx, cy, s in [(200, 600, 1.0), (880, 900, 0.8), (520, 700, 0.6)]:
            x = (cx + t * 14 * s) % (W + 300) - 150
            for dx, dy, r in [(0, 0, 55), (55, 10, 45), (-50, 12, 40), (20, -25, 42)]:
                circle(ctx, x + dx * s, cy + dy * s, r * s, WHITE, 0.75 * (1 - dark * 2))

def ground(ctx, dark=0, frost=0):
    c1 = mix(mix((0.30, 0.72, 0.42), (0.06, 0.10, 0.09), dark), ICE, frost)
    c2 = mix(mix((0.19, 0.53, 0.31), (0.03, 0.07, 0.06), dark), (0.70, 0.82, 0.92), frost)
    ctx.move_to(-200, 1200); ctx.curve_to(300, 1130, 700, 1250, W + 200, 1170)
    ctx.line_to(W + 200, H + 200); ctx.line_to(-200, H + 200); ctx.close_path(); ctx.set_source_rgb(*c1); ctx.fill()
    ctx.move_to(-200, 1330); ctx.curve_to(400, 1280, 800, 1360, W + 200, 1300)
    ctx.line_to(W + 200, H + 200); ctx.line_to(-200, H + 200); ctx.close_path(); ctx.set_source_rgb(*c2); ctx.fill()

def tree(ctx, x, y, s, leaf=GREEN, a=1):
    rrect(ctx, x - 14 * s, y - 170 * s, 28 * s, 170 * s, 10 * s); ctx.set_source_rgb(0.33, 0.22, 0.16); ctx.fill()
    for dx, dy, r in [(0, -230, 85), (-60, -180, 65), (60, -180, 65), (0, -150, 70)]:
        circle(ctx, x + dx * s, y + dy * s, r * s, leaf, a)

BLD = [(0, 340, 150), (140, 520, 120), (250, 410, 140), (380, 600, 130), (500, 460, 120), (610, 700, 150), (750, 430, 130), (870, 560, 120), (980, 380, 140)]
def city(ctx, t, lights_on=0.45, ground_y=1240, seed=8):
    rr = random.Random(seed)
    for bx, bh, bw in BLD:
        top = ground_y - bh
        ctx.rectangle(bx, top, bw, bh + 20); ctx.set_source_rgb(0.06, 0.07, 0.14); ctx.fill()
        for wy in range(int(top) + 20, ground_y - 20, 46):
            for wx in range(bx + 16, bx + bw - 20, 34):
                if rr.random() < lights_on:
                    ctx.rectangle(wx, wy, 18, 26); ctx.set_source_rgba(*YEL, 0.85); ctx.fill()

def streetlamp(ctx, x, y=1080, h=230):
    ctx.rectangle(x - 5, y, 10, h); ctx.set_source_rgb(0.15, 0.16, 0.22); ctx.fill()
    glow(ctx, x, y, 0, 165, YEL, 0.48); circle(ctx, x, y, 15, (1, 0.95, 0.7))

def frost(ctx, k, seed=11):
    rr = random.Random(seed)
    for _ in range(int(70 * k)):
        cx = rr.choice([rr.uniform(-20, 240), rr.uniform(W - 240, W + 20)]); cy = rr.uniform(480, 1800)
        r = rr.uniform(18, 60) * k
        ctx.save(); ctx.translate(cx, cy)
        for a in range(6):
            ctx.move_to(0, 0); ctx.line_to(math.cos(a * math.pi / 3) * r, math.sin(a * math.pi / 3) * r)
        ctx.set_line_width(3); ctx.set_source_rgba(*ICE, 0.6); ctx.stroke(); ctx.restore()

def snow(ctx, t, a=1, n=70):
    rr = random.Random(4)
    for _ in range(n):
        x0, sp, ph, r = rr.uniform(0, W), rr.uniform(60, 140), rr.uniform(0, 2000), rr.uniform(2, 6)
        y = (ph + t * sp) % (H + 100) - 50; x = x0 + 25 * math.sin(t + ph)
        circle(ctx, x, y, r, WHITE, 0.7 * a)

def burst(ctx, x, y, k, color=YEL, n=40, spread=700, seed=5):
    """Particle burst, k = 0..1 progress."""
    rr = random.Random(seed)
    for _ in range(n):
        ang = rr.uniform(0, 6.28); sp = rr.uniform(spread * 0.3, spread)
        circle(ctx, x + math.cos(ang) * sp * eout(k), y + math.sin(ang) * sp * eout(k), rr.uniform(3, 8), color, 1 - k)

# ---------------- bodies ----------------
def sun(ctx, x, y, r, t, a=1):
    if r <= 0.5 or a <= 0: return
    glow(ctx, x, y, r * 0.8, r * 3.0, ORG, 0.40 * a); glow(ctx, x, y, r * 0.9, r * 1.7, YEL, 0.45 * a)
    for i in range(16):
        ang = i * math.pi / 8 + t * 0.35; L = 1.35 + 0.10 * math.sin(t * 4 + i * 1.7)
        ctx.move_to(x + math.cos(ang) * r * 1.12, y + math.sin(ang) * r * 1.12)
        ctx.line_to(x + math.cos(ang) * r * L, y + math.sin(ang) * r * L)
        ctx.set_line_width(r * (0.08 if i % 2 else 0.05)); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_source_rgba(*YEL, a); ctx.stroke()
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
    g.add_color_stop_rgba(0, 1, 0.98, 0.85, a); g.add_color_stop_rgba(0.55, *YEL, a); g.add_color_stop_rgba(1, *ORG, a)
    ctx.arc(x, y, r, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()

CONT = [(-0.35, -0.25, 0.42, 0.30), (0.25, 0.05, 0.38, 0.45), (-0.25, 0.45, 0.30, 0.22), (0.45, -0.5, 0.25, 0.18)]
def earth(ctx, x, y, r, t=0, lit=1.0, frozen=0.0, lights=0.0, crack=0.0):
    """lit 0..1 (sunlight), frozen 0..1 (ice from both poles), lights = city lights, crack = ice cracks."""
    glow(ctx, x, y, r * 0.95, r * 1.35, mix((0.4, 0.7, 1.0), ICE, frozen), 0.40 * max(lit, frozen))
    ctx.save(); ctx.arc(x, y, r, 0, 2 * math.pi); ctx.clip()
    g = cairo.RadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r * 1.05)
    oc = mix(BLUE, (0.04, 0.07, 0.17), 1 - lit)
    g.add_color_stop_rgb(0, *mix(oc, WHITE, 0.25)); g.add_color_stop_rgb(1, *mix(oc, (0, 0, 0), 0.35))
    ctx.arc(x, y, r, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()
    rot = t * 0.04 * r
    for cx, cy, rx, ry in CONT:
        px = x + ((cx * r + rot + r * 1.2) % (r * 2.4)) - r * 1.2
        ctx.save(); ctx.translate(px, y + cy * r); ctx.scale(rx * r, ry * r)
        ctx.arc(0, 0, 1, 0, 2 * math.pi); ctx.restore()
        ctx.set_source_rgb(*mix(GREEN, (0.03, 0.09, 0.07), 1 - lit)); ctx.fill()
    if lit > 0.5:
        for i in range(5):
            cx = x + ((i * 0.37 * r * 2 + rot * 1.6) % (r * 2.6)) - r * 1.3; cy = y + (i - 2) * r * 0.32
            ctx.save(); ctx.translate(cx, cy); ctx.scale(r * 0.38, r * 0.06); ctx.arc(0, 0, 1, 0, 2 * math.pi); ctx.restore()
            ctx.set_source_rgba(1, 1, 1, 0.45 * lit); ctx.fill()
    if lights > 0:
        rr = random.Random(3)
        for _ in range(40):
            cx, cy, rx, ry = rr.choice(CONT)
            px = x + ((cx * r + rot + r * 1.2) % (r * 2.4)) - r * 1.2 + rr.uniform(-rx, rx) * r * 0.7
            py = y + (cy + rr.uniform(-ry, ry) * 0.7) * r
            circle(ctx, px, py, r * 0.022, YEL, lights * (0.6 + 0.4 * math.sin(t * 7 + px)))
    if frozen > 0:
        h = r * 2 * ease(frozen) * 0.55
        for sgn in (-1, 1):
            yy = y + sgn * r
            ctx.move_to(x - r, yy)
            for k in range(0, 25):
                ctx.line_to(x - r + k * r / 12, yy - sgn * (h + 18 * math.sin(k * 1.7 + t)))
            ctx.line_to(x + r, yy); ctx.close_path(); ctx.set_source_rgba(*ICE, 0.97); ctx.fill()
        if frozen > 0.85: circle(ctx, x, y, r, ICE, (frozen - 0.85) / 0.15)
    if crack > 0:
        rr = random.Random(9)
        for _ in range(9):
            ctx.move_to(x + rr.uniform(-0.6, 0.6) * r, y + rr.uniform(-0.6, 0.6) * r)
            for _ in range(4): ctx.rel_line_to(rr.uniform(-0.18, 0.18) * r, rr.uniform(-0.18, 0.18) * r)
            ctx.set_line_width(4); ctx.set_source_rgba(0.55, 0.75, 0.95, crack); ctx.stroke()
    g2 = cairo.LinearGradient(x - r, y - r, x + r, y + r)
    g2.add_color_stop_rgba(0.45, 0, 0, 0, 0); g2.add_color_stop_rgba(1, 0, 0, 0.05, 0.55 * max(lit, frozen))
    ctx.rectangle(x - r, y - r, 2 * r, 2 * r); ctx.set_source(g2); ctx.fill()
    ctx.restore()
    ctx.arc(x, y, r, 0, 2 * math.pi); ctx.set_line_width(r * 0.04)
    ctx.set_source_rgba(0.6, 0.85, 1, 0.5 * max(lit, frozen)); ctx.stroke()

def moon(ctx, x, y, r, dark=0.0):
    c = mix((0.88, 0.90, 0.94), (0.09, 0.10, 0.15), dark)
    glow(ctx, x, y, r, r * 2.0, (0.9, 0.92, 1.0), 0.3 * (1 - dark))
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
    g.add_color_stop_rgb(0, *mix(c, WHITE, 0.2)); g.add_color_stop_rgb(1, *mix(c, (0, 0, 0), 0.25))
    ctx.arc(x, y, r, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()
    for dx, dy, cr in [(-0.3, -0.2, 0.2), (0.3, 0.25, 0.15), (0.05, 0.45, 0.1), (0.35, -0.35, 0.09)]:
        circle(ctx, x + dx * r, y + dy * r, cr * r, mix(c, (0, 0, 0), 0.2))
    if dark > 0.6:
        ctx.arc(x, y, r, 0, 2 * math.pi); ctx.set_line_width(3); ctx.set_source_rgba(0.5, 0.55, 0.7, 0.5); ctx.stroke()

# ---------------- people ----------------
def person(ctx, x, y, s, t, pose="stand", color=INK, coat=None, phase=0):
    """Flat person, feet at (x, y), ~230*s tall. pose: stand | point | shield | shiver."""
    jit = 3 * math.sin(t * 60 + phase) if pose == "shiver" else 0
    bob = 2 * math.sin(t * 3 + phase)
    ctx.save(); ctx.translate(x + jit, y); ctx.scale(s, s)
    body = coat or color
    def arm(ang, ln=70, sx=0):
        ctx.move_to(sx, -135); ctx.line_to(sx + math.sin(ang) * ln, -135 + math.cos(ang) * ln)
        ctx.set_line_width(20); ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_source_rgb(*body); ctx.stroke()
    rrect(ctx, -26, -55, 22, 55, 10); ctx.set_source_rgb(*color); ctx.fill()
    rrect(ctx, 4, -55, 22, 55, 10); ctx.fill()
    if pose == "point": arm(math.radians(30), 70, -24); arm(math.radians(-160), 85, 24)
    elif pose == "shield": arm(math.radians(150), 75, -24); arm(math.radians(-150), 75, 24)
    elif pose == "shiver": arm(math.radians(-60), 55, -24); arm(math.radians(60), 55, 24)
    else: arm(math.radians(15 + 4 * math.sin(t * 2 + phase)), 75, -24); arm(math.radians(-15), 75, 24)
    rrect(ctx, -32, -155 + bob, 64, 108, 30); ctx.set_source_rgb(*body); ctx.fill()
    hy = -190 + bob - (6 if pose in ("point", "shield") else 0)
    circle(ctx, 4 if pose == "point" else 0, hy, 34, color)
    if coat:
        rrect(ctx, -30, -160 + bob, 60, 18, 9); ctx.set_source_rgb(0.85, 0.25, 0.25); ctx.fill()
    ctx.restore()

def breath(ctx, x, y, t, t0, phase=0):
    """Breath fog puffs from a mouth at (x, y), starting at t0."""
    if t < t0: return
    for k in range(3):
        lt = (t - t0 + phase + k * 0.55) % 1.6
        circle(ctx, x + lt * 70, y - lt * 40, 14 + lt * 30, (0.92, 0.95, 1), 0.55 * (1 - lt / 1.6))

# ---------------- camera, transitions, finishing ----------------
SC = None  # the job's scene module (set by make.py)

def shake(t):
    dx = dy = 0
    for bt, amp in SC.BOOMS:
        if bt <= t < bt + 0.6:
            k = t - bt; a = amp * 22 * math.exp(-k * 8)
            dx += a * math.sin(k * 90); dy += a * math.cos(k * 77)
    return dx, dy

def camera(ctx, t, sid, lt, dur):
    still = getattr(SC, "LOOP", None) is not None and t >= SC.LOOP
    z = 1.0 if still else 1 + 0.07 * ease(lt / max(dur, 0.1))
    dx, dy = shake(t)
    cuts = [x["start"] for x in J.TIM[1:]] + list(getattr(SC, "CUTS", []))
    last_cut = max([c for c in cuts if c <= t] or [-9])
    sl = t - last_cut
    slide = 260 * (1 - eout(sl / 0.2)) if sl < 0.2 else 0
    ctx.translate(W / 2 + dx + slide, 960 + dy); ctx.scale(z, z); ctx.translate(-W / 2, -960)
    return sl

def speedlines(ctx, sl):
    if sl >= 0.22: return
    a = 1 - sl / 0.22; rr = random.Random(int(sl * 1000))
    for _ in range(26):
        y = rr.uniform(0, H); x = rr.uniform(-200, W); ln = rr.uniform(200, 700)
        ctx.move_to(x, y); ctx.line_to(x + ln, y); ctx.set_line_width(rr.uniform(2, 6)); ctx.set_source_rgba(1, 1, 1, 0.5 * a); ctx.stroke()

def vignette(ctx):
    g = cairo.RadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1200)
    g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, 0.45)
    ctx.rectangle(0, 0, W, H); ctx.set_source(g); ctx.fill()

def dust(ctx, t):
    for x, y, r, p, sp in DUST:
        circle(ctx, (x + t * sp) % W, (y - t * sp * 0.6) % H, r, WHITE, 0.10 + 0.08 * math.sin(t * 2 + p))

# ---------------- HUD ----------------
def fmt_ms(sec):
    sec = max(0, int(round(sec))); return f"{sec // 60}:{sec % 60:02d}"

def hud(ctx, t):
    """Hook banner + live counter + stage tracker. Content comes from the scene module:
    SC.HOOK = [(text, color), ...]; SC.counter(t) -> dict(label, value, red, bar, flash);
    SC.STAGES = [...]; SC.stage(t) -> (index, label_override_or_None)."""
    rrect(ctx, 80, 110, W - 160, 104, 32); ctx.set_source_rgba(0.02, 0.03, 0.08, 0.86); ctx.fill()
    font(ctx, 50)
    total = sum(ctx.text_extents(p)[4] for p, _ in SC.HOOK); fs = min(50, 50 * 860 / max(total, 1))
    font(ctx, fs); total = sum(ctx.text_extents(p)[4] for p, _ in SC.HOOK); x = W / 2 - total / 2
    for p, c in SC.HOOK:
        ctx.move_to(x, 162 + fs * 0.36); ctx.text_path(p); ctx.set_source_rgb(*c); ctx.fill(); x += ctx.text_extents(p)[4]
    c = SC.counter(t)
    red, bar, fl = c.get("red", False), c.get("bar"), c.get("flash", False)
    rrect(ctx, 300, 232, 480, 132, 28)
    ctx.set_source_rgba(*(mix((0.02, 0.03, 0.08), (0.5, 0.02, 0.02), 0.85 if fl else 0)), 0.86); ctx.fill()
    text(ctx, c["label"], W / 2, 264, 25, (0.75, 0.80, 0.95))
    text(ctx, c["value"], W / 2, 318, 66, RED if red else WHITE)
    if bar is not None:
        rrect(ctx, 340, 350, 400, 7, 3.5); ctx.set_source_rgba(1, 1, 1, 0.18); ctx.fill()
        rrect(ctx, 340, 350, max(7, 400 * bar), 7, 3.5); ctx.set_source_rgb(*(RED if red else YEL)); ctx.fill()
    st = getattr(SC, "STAGES", None)
    if not st: return
    si, over = SC.stage(t); n = len(st); gap = 720 / max(n - 1, 1); xs = [180 + i * gap for i in range(n)]; y = 420
    ctx.move_to(xs[0], y); ctx.line_to(xs[-1], y); ctx.set_line_width(4); ctx.set_source_rgba(1, 1, 1, 0.25); ctx.stroke()
    if si > 0:
        ctx.move_to(xs[0], y); ctx.line_to(xs[si], y); ctx.set_line_width(4); ctx.set_source_rgba(*YEL, 0.8); ctx.stroke()
    for i, (x, s) in enumerate(zip(xs, st)):
        lab = over if (over and i == si) else s
        font(ctx, 26); tw = ctx.text_extents(lab)[2]
        rrect(ctx, x - tw / 2 - 16, y - 22, tw + 32, 44, 22)
        if i == si:
            ctx.set_source_rgb(*YEL); ctx.fill(); text(ctx, lab, x, y, 26 * (1 + 0.06 * math.sin(t * 8)), INK)
        elif i < si:
            ctx.set_source_rgba(0.2, 0.22, 0.32, 0.95); ctx.fill(); text(ctx, lab, x, y, 26, (0.7, 0.72, 0.8))
        else:
            ctx.set_source_rgba(0.02, 0.03, 0.08, 0.85); ctx.fill_preserve(); ctx.set_line_width(2)
            ctx.set_source_rgba(1, 1, 1, 0.35); ctx.stroke(); text(ctx, lab, x, y, 26, WHITE)

# ---------------- captions ----------------
CAP_Y = 1400
def captions(ctx, t):
    """Karaoke captions: 3-word chunks, spoken word yellow, gap 36 px, shrink to fit 920 px."""
    for sid in J.IDS:
        line = J.WT[sid]
        if line[0][1] - 0.02 <= t < line[-1][2] + 0.10:
            chunks = [line[i:i + 3] for i in range(0, len(line), 3)]
            for ch in chunks:
                if ch[0][1] <= t < ch[-1][2] + 0.10 or (ch is chunks[-1] and t >= ch[0][1]):
                    font(ctx, 72); sp = 36
                    widths = [ctx.text_extents(w)[4] for w, _, _ in ch]
                    tot = sum(widths) + sp * (len(ch) - 1); fit = min(1.0, 920 / tot)
                    x = W / 2 - tot * fit / 2; widths = [w_ * fit for w_ in widths]; sp *= fit
                    for (w, a, b), wd in zip(ch, widths):
                        on = a <= t < b
                        k = fit * (1 + 0.08 * (1 - clamp((t - a) / 0.12))) if on else fit
                        ctx.save(); ctx.translate(x + wd / 2, CAP_Y); ctx.scale(k, k)
                        text(ctx, w, 0, 0, 72, YEL if on else WHITE, outline=14); ctx.restore()
                        x += wd + sp
                    return
            return

# ---------------- frame + render ----------------
def frame(ctx, t):
    sid = J.IDS[0]
    for x in J.TIM:
        if t >= x["start"]: sid = x["id"]
    i = J.IDS.index(sid); st = J.S[sid]; dur = scene_end(i) - st; lt = t - st
    ctx.save(); sl = camera(ctx, t, sid, lt, dur); SC.SCENES[sid](ctx, t, lt); ctx.restore()
    if getattr(SC, "dust_on", None) and SC.dust_on(sid, t): dust(ctx, t)
    if getattr(SC, "overlay", None): SC.overlay(ctx, t)
    speedlines(ctx, sl); vignette(ctx); hud(ctx, t); captions(ctx, t)

def render_scene(i, outdir):
    st = 0 if i == 0 else J.TIM[i]["start"]; en = scene_end(i)
    f0, f1 = int(round(st * FPS)), int(round(en * FPS))
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    tmp = f"{outdir}/{i:02d}.tmp.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                          "-pix_fmt", "yuv420p", "-f", "mp4", tmp], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        ctx.save(); ctx.set_source_rgb(0, 0, 0); ctx.paint(); frame(ctx, f / FPS); ctx.restore()
        surf.flush(); p.stdin.write(bytes(surf.get_data()))
    p.stdin.close()
    if p.wait() == 0: os.rename(tmp, f"{outdir}/{i:02d}.mp4")
    else: raise RuntimeError(f"ffmpeg failed on scene {i}")

def still(t, path):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf); frame(ctx, t); surf.write_to_png(path)
