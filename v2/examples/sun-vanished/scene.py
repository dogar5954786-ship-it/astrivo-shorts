"""Example v2 Short: "What If the Sun Vanished?" (the v2 reference).

A scene file must define:
  HOOK            banner text parts [(text, color)]
  setup(J)        turn spoken words into event times (wstart) and set BOOMS, CUTS, LOOP
  counter(t)      -> dict(label, value, red, bar, flash)   the always-moving number
  STAGES, stage(t) -> (index, override_label)              the progress tracker with "?"
  SCENES          {"s01": fn(ctx, t, lt), ...} one function per script line (lt = time inside the line)
  dust_on(sid,t)  where floating dust is drawn (optional)
  overlay(ctx,t)  big impact words (optional)
  sound(A)        every SFX / beat / music cue, keyed to the same event times
Copy this file for a new Short, keep the structure, change the content.
"""
import math, random, cairo
from lib import *

HOOK = [("WHAT IF THE ", WHITE), ("SUN", YEL), (" VANISHED?", WHITE)]

def setup(J):
    global T_ZERO, T_LIGHTS, T_MOON, T_CITY, T_ORBIT, T_BREATH, T_WHITE, LOOP, BOOMS, CUTS, S
    S = J.S
    T_ZERO = wstart("s04", "ZERO"); T_LIGHTS = wstart("s04", "LIGHTS")
    T_MOON = wstart("s05", "DARK"); T_CITY = wstart("s06", "ONLY")
    T_ORBIT = wstart("s03", "EARTH"); T_BREATH = wstart("s08", "YOUR"); T_WHITE = wstart("s09", "WHITE")
    LOOP = S["s12"] + 1.3                       # cut back to the opening frame -> seamless loop
    BOOMS = [(0.28, 1.0), (T_LIGHTS, 1.3), (T_MOON, 0.5), (T_WHITE, 1.2), (LOOP, 0.6)]   # (time, shake strength)
    CUTS = [T_ORBIT, LOOP]                      # extra cuts inside a line (get the swipe too)

# ---------------- HUD content ----------------
def counter(t):
    if t < T_ZERO or t >= LOOP:
        rem = 500 if (t < 0.3 or t >= LOOP) else 500 * (1 - (t - 0.3) / (T_ZERO - 0.3))
        red = 0 < rem < 60 and t < LOOP
        return dict(label="LIGHT RUNS OUT IN", value=fmt_ms(rem), red=red, bar=rem / 500, flash=red and int(t * 6) % 2 == 0)
    fl = T_ZERO <= t < T_ZERO + 0.4 and int(t * 10) % 2 == 0
    if t < S["s06"]: v = f"0:{int(clamp(t - T_ZERO, 0, 99)):02d}"
    elif t < S["s07"]: v = f"{int(lerp(1, 12, ease((t - S['s06']) / 3)))} HOURS"
    elif t < S["s08"]: v = f"{int(lerp(12, 72, ease((t - S['s07']) / 3.4)))} HOURS"
    elif t < S["s09"]: v = f"DAY {int(lerp(3, 7, ease((t - S['s08']) / 2)))}"
    elif t < S["s11"]: v = f"DAY {int(lerp(7, 365, ease((t - S['s09']) / 2.4)))}"
    else: return dict(label="THE SUNLIGHT YOU SEE LEFT", value="8:20 AGO")
    return dict(label="TIME WITHOUT SUN", value=v, flash=fl)

STAGES = ["8:20", "DARK", "1 WEEK", "1 YEAR", "?"]
def stage(t):
    if t >= LOOP: return 0, None
    if t >= S["s11"]: return 4, "NOW"
    if t >= S["s09"]: return 3, None
    if t >= S["s08"]: return 2, None
    if t >= T_ZERO: return 1, None
    return 0, None

# ---------------- scenes ----------------
def sc01(ctx, t, lt=None):
    bg_space(ctx, t)
    sx, sy, sr = 540, 820, 140
    earth(ctx, 540, 1250, 85, t)
    if t < 0.25: sun(ctx, sx, sy, sr * (1 + 0.04 * t / 0.25), t)
    elif t < 0.55: sun(ctx, sx, sy, sr * (1 - ease((t - 0.25) / 0.30)), t)
    if 0.25 <= t < 0.9:
        k = (t - 0.25) / 0.65
        glow(ctx, sx, sy, 0, 120 + 500 * eout(k), WHITE, 0.55 * (1 - k) ** 2)
        ctx.arc(sx, sy, 60 + 650 * eout(k), 0, 2 * math.pi); ctx.set_line_width(6); ctx.set_source_rgba(1, 1, 1, 0.8 * (1 - k)); ctx.stroke()
        burst(ctx, sx, sy, k)
    if t >= 0.3:
        dashed_circle(ctx, sx, sy, sr, YEL, 0.4)
        R = sr + (t - 0.3) * 95
        ctx.arc(sx, sy, R, 0, 2 * math.pi); ctx.set_line_width(34); ctx.set_source_rgba(*YEL, 0.2); ctx.stroke()
        ctx.arc(sx, sy, R, 0, 2 * math.pi); ctx.set_line_width(10); ctx.set_source_rgba(*YEL, 0.95); ctx.stroke()
        tag(ctx, "LAST LIGHT", sx + R * 0.72 + 30, sy - R * 0.72, 32, YEL, ease((t - 0.9) / 0.3))

def sc02(ctx, t, lt):
    bg_space(ctx, t, drift=(-lt * 220, 0))
    dashed_circle(ctx, -60, 980, 260, YEL, 0.5)
    earth(ctx, W + 40, 980, 230, t)
    x = lerp(160, 700, lt / 2.3)
    for i in range(11):
        yy = 730 + i * 50; ln = 120 + 70 * ((i * 37) % 5)
        ctx.move_to(x - ln - 40, yy); ctx.line_to(x - 40, yy); ctx.set_line_width(5); ctx.set_source_rgba(*YEL, 0.5); ctx.stroke()
    glow(ctx, x, 980, 0, 220, YEL, 0.35)
    rrect(ctx, x - 10, 700, 20, 560, 10); ctx.set_source_rgb(1, 0.95, 0.7); ctx.fill()
    tag(ctx, f"{int(lerp(150, 105, lt / 2.3))},000,000 KM TO GO", W / 2, 1290, 38, WHITE)

def park(ctx, t, dark=0, sun_a=1, poses=("point", "stand"), sun_xy=(740, 790), sr=95):
    bg_sky(ctx, t, dark)
    if sun_a > 0: sun(ctx, sun_xy[0], sun_xy[1], sr, t, sun_a)
    ground(ctx, dark)
    tree(ctx, 930, 1210, 1.0, mix(GREEN, (0.05, 0.1, 0.08), dark))
    col = mix(INK, (0.02, 0.03, 0.05), dark)
    person(ctx, 330, 1240, 1.0, t, poses[0], col, phase=0)
    person(ctx, 520, 1255, 0.92, t, poses[1], col, phase=1.3)

def sc03(ctx, t, lt):
    if t < T_ORBIT:
        park(ctx, t); tag(ctx, "STILL SHINING?!", 740, 960, 34, YEL, ease(lt / 0.3))
    else:
        bg_space(ctx, t); cx, cy, R = 540, 900, 330
        dashed_circle(ctx, cx, cy, 110, YEL, 0.35); text(ctx, "?", cx, cy, 90, (0.6, 0.6, 0.75))
        dashed_circle(ctx, cx, cy, R, WHITE, 0.25, 3)
        ang = -0.6 + (t - T_ORBIT) * 1.1
        earth(ctx, cx + math.cos(ang) * R, cy + math.sin(ang) * R, 75, t)

def sc04(ctx, t, lt):
    d = 0 if t < T_LIGHTS else ease((t - T_LIGHTS) / 0.12)
    park(ctx, t, dark=d, sun_a=1 - d, poses=("shield", "shield") if t >= T_LIGHTS else ("point", "stand"))

def sc05(ctx, t, lt):
    bg_sky(ctx, t, 1); moon(ctx, 720, 800, 105, ease((t - T_MOON) / 0.35))
    ground(ctx, 1); tree(ctx, 930, 1210, 1.0, (0.04, 0.08, 0.06))
    person(ctx, 330, 1240, 1.0, t, "point", (0.02, 0.03, 0.05)); person(ctx, 520, 1255, 0.92, t, "stand", (0.02, 0.03, 0.05), phase=1.3)

def sc06(ctx, t, lt):
    bg_sky(ctx, t, 1)
    on = ease((t - T_CITY) / 0.25)
    city(ctx, t, lights_on=0.45 + 0.3 * on)
    glow(ctx, 540, 1150, 0, 600, ORG, 0.18 * (0.4 + on))
    ground(ctx, 1)
    k = clamp(lt / 2.2); leaf = mix(GREEN, (0.55, 0.38, 0.18), k)   # plants dying: leaves brown and fall
    for tx in (160, 880): tree(ctx, tx, 1300, 0.95, leaf, 1 - 0.5 * k)
    rr = random.Random(6)
    for _ in range(26):
        x0 = rr.choice([160, 880]) + rr.uniform(-90, 90); ph = rr.uniform(0, 1); f = (lt * 0.5 + ph) % 1
        if lt > ph * 1.5: circle(ctx, x0 + 30 * math.sin(f * 9 + ph * 7), 1050 + f * 330, 9, leaf)
    for lx in (380, 700): streetlamp(ctx, lx)

def sc07(ctx, t, lt):
    bg_space(ctx, t, drift=(-lt * 160, lt * 110))
    cx, cy, R = 380, 1150, 300
    ctx.set_dash([14, 12]); ctx.arc(cx, cy, R, math.pi * 1.05, math.pi * 1.62)
    ctx.set_line_width(3); ctx.set_source_rgba(1, 1, 1, 0.3); ctx.stroke(); ctx.set_dash([])
    p0 = (cx, cy - R); k = ease(lt / 3.5); ex, ey = lerp(p0[0], 820, k), lerp(p0[1], 700, k)
    g = cairo.LinearGradient(*p0, ex, ey); g.add_color_stop_rgba(0, *YEL, 0); g.add_color_stop_rgba(1, *YEL, 0.8)
    ctx.move_to(*p0); ctx.line_to(ex, ey); ctx.set_line_width(8); ctx.set_source(g); ctx.stroke()
    earth(ctx, ex, ey, lerp(130, 100, k), t, lit=0.38, lights=1.0)
    tag(ctx, f"DRIFTING: {k * 10.5:.1f} MILLION KM", W / 2, 1290, 38, WHITE)

def sc08(ctx, t, lt):
    bg_sky(ctx, t, cold=1); snow(ctx, t, 0.6)
    ground(ctx, 1, frost=ease(lt / 2.5) * 0.8)
    for lx in (200, 880): streetlamp(ctx, lx, 1060, 250)
    for i, (px, s) in enumerate([(380, 1.0), (560, 0.95), (720, 0.9)]):
        person(ctx, px, 1250, s, t, "shiver", INK, coat=(0.20, 0.30, 0.55), phase=i * 2)
        breath(ctx, px + 30 * s, 1250 - 195 * s, t, T_BREATH - 0.2, phase=i * 0.5)
    temp = lerp(15, -18, eout(lt / 2.0))
    text(ctx, f"{int(round(temp))}°C", W / 2, 700, 170, mix(RED, (0.6, 0.85, 1.0), eout(lt / 2.0)), outline=12)
    frost(ctx, ease(lt / 3) * 0.7)

def sc09(ctx, t, lt):   # CLIMAX: Earth freezes white
    bg_space(ctx, t)
    fz = ease(lt / (T_WHITE - S["s09"] + 0.3))
    earth(ctx, 540, 900, 270, t, lit=0.55, frozen=fz, crack=clamp((t - T_WHITE) / 0.3))
    rr = random.Random(12)
    for _ in range(30):
        ang = rr.uniform(0, 6.28); d = 290 + ((lt * 60 + rr.uniform(0, 200)) % 200)
        circle(ctx, 540 + math.cos(ang) * d, 900 + math.sin(ang) * d, rr.uniform(2, 5), ICE, 0.6 * fz)
    text(ctx, f"{int(round(lerp(-18, -73, eout(lt / 2.0))))}°C", W / 2, 1270, 120, (0.65, 0.88, 1.0), outline=12)
    if T_WHITE <= t < T_WHITE + 0.25: flash(ctx, 0.6 * (1 - (t - T_WHITE) / 0.25))

def sc10(ctx, t, lt):
    g = cairo.LinearGradient(0, 600, 0, H); g.add_color_stop_rgb(0, 0.05, 0.16, 0.34); g.add_color_stop_rgb(1, 0.01, 0.03, 0.08)
    ctx.rectangle(-200, -200, W + 400, H + 400); ctx.set_source(g); ctx.fill()
    ctx.rectangle(-200, -200, W + 400, 860); ctx.set_source_rgb(*ICE); ctx.fill()
    ctx.move_to(-200, 660)
    for xx in range(-200, W + 260, 60): ctx.line_to(xx, 660 + (25 if (xx // 60) % 2 else 5))
    ctx.line_to(W + 200, 600); ctx.line_to(-200, 600); ctx.close_path(); ctx.set_source_rgb(0.75, 0.88, 0.97); ctx.fill()
    for i in range(6):
        rx = 100 + i * 180
        g2 = cairo.LinearGradient(rx, 680, rx + 60, 1300); g2.add_color_stop_rgba(0, 0.5, 0.7, 1, 0.12); g2.add_color_stop_rgba(1, 0.5, 0.7, 1, 0)
        ctx.move_to(rx, 680); ctx.line_to(rx + 70, 680); ctx.line_to(rx + 200, 1300); ctx.line_to(rx + 100, 1300); ctx.close_path(); ctx.set_source(g2); ctx.fill()
    ctx.move_to(-200, 1340); ctx.curve_to(300, 1300, 700, 1370, W + 200, 1320); ctx.line_to(W + 200, H + 200); ctx.line_to(-200, H + 200)
    ctx.close_path(); ctx.set_source_rgb(0.16, 0.10, 0.08); ctx.fill()
    vx = 600
    ctx.move_to(vx - 90, 1345); ctx.line_to(vx - 30, 1130); ctx.line_to(vx + 30, 1130); ctx.line_to(vx + 90, 1345)
    ctx.close_path(); ctx.set_source_rgb(0.26, 0.17, 0.13); ctx.fill()
    glow(ctx, vx, 1120, 10, 260, ORG, 0.6 + 0.15 * math.sin(t * 6))
    rr = random.Random(2)
    for i in range(22):
        ph = rr.uniform(0, 1); sp = rr.uniform(0.25, 0.45)
        yy = 1110 - ((t * sp + ph) % 1) * 420; xx = vx + rr.uniform(-40, 40) + 12 * math.sin(t * 3 + i)
        ctx.arc(xx, yy, rr.uniform(5, 12), 0, 2 * math.pi); ctx.set_line_width(3); ctx.set_source_rgba(0.7, 0.9, 1, 0.7); ctx.stroke()
    for i, wx in enumerate([360, 400, 440, 470, 760, 800, 840]):
        hgt = 110 + (i % 3) * 35; sw = 12 * math.sin(t * 2.5 + i)
        ctx.move_to(wx, 1340); ctx.curve_to(wx, 1340 - hgt / 2, wx + sw, 1340 - hgt, wx + sw, 1340 - hgt)
        ctx.set_line_width(14); ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_source_rgb(0.95, 0.95, 0.9); ctx.stroke()
        circle(ctx, wx + sw, 1340 - hgt, 12, RED)
    for i in range(3):
        fx = (200 + i * 260 + t * 60 * (1 if i % 2 else -1)) % (W + 100) - 50; fy = 900 + i * 90
        ctx.save(); ctx.translate(fx, fy); ctx.scale(1 if i % 2 else -1, 1)
        ctx.save(); ctx.scale(30, 14); ctx.arc(0, 0, 1, 0, 2 * math.pi); ctx.restore(); ctx.set_source_rgba(1, 0.7, 0.5, 0.85); ctx.fill()
        ctx.move_to(-26, 0); ctx.line_to(-46, -12); ctx.line_to(-46, 12); ctx.close_path(); ctx.fill(); ctx.restore()
    tag(ctx, "HOT VENT: 400°C", vx, 1030, 34, ORG, ease(lt / 0.4))

def sc11(ctx, t, lt):
    park(ctx, t, sun_xy=(780, 760), poses=("point", "stand"))
    ex, ey = 336, 1052
    ctx.set_dash([18, 14]); ctx.move_to(780, 760); ctx.line_to(ex, ey); ctx.set_line_width(5)
    ctx.set_source_rgba(*YEL, 0.85); ctx.stroke(); ctx.set_dash([])
    for j in range(3):
        k = (lt * 0.8 + j / 3) % 1
        glow(ctx, lerp(780, ex, k), lerp(760, ey, k), 0, 40, YEL, 0.7); circle(ctx, lerp(780, ex, k), lerp(760, ey, k), 12, WHITE)
    tag(ctx, "LEFT THE SUN 8:20 AGO", 600, 1290, 38, YEL, ease(lt / 0.3))

def sc12(ctx, t, lt):
    if t < LOOP:
        z = 1 + 0.6 * ease(lt / 1.2)
        ctx.save(); ctx.translate(780, 760); ctx.scale(z, z); ctx.translate(-780, -760)
        park(ctx, t, sun_xy=(780, 760), sun_a=1 if int(t * 12) % 3 else 0.2)
        ctx.restore()
    else:
        sc01(ctx, 0.0)   # exact opening frame -> loop

SCENES = {"s01": sc01, "s02": sc02, "s03": sc03, "s04": sc04, "s05": sc05, "s06": sc06, "s07": sc07,
          "s08": sc08, "s09": sc09, "s10": sc10, "s11": sc11, "s12": sc12}

def dust_on(sid, t):
    return sid in ("s01", "s02", "s07", "s09") or (sid == "s03" and t >= T_ORBIT) or (sid == "s12" and t >= LOOP)

def overlay(ctx, t):
    big_word(ctx, "LIGHTS OUT", t, T_LIGHTS, 780, 140)

# ---------------- sound ----------------
def sound(A):
    J_TIM = __import__("lib").J.TIM
    A.add(A.sfx, 0.0, A.implode(), 0.8); A.add(A.sfx, 0.27, A.impact(2.0, 150, 40), 1.0); A.add(A.sfx, 0.27, A.chime(), 0.35)
    A.countdown(0.4, T_ZERO)                                   # ticks + speeding beat
    for c in [x["start"] for x in J_TIM[1:]] + [T_ORBIT]:      # whoosh before every cut
        A.add(A.sfx, c - 0.12, A.whoosh(0.4, True), 0.7)
    A.add(A.sfx, 3.4, A.whoosh(2.0, True), 0.3)
    A.add(A.sfx, T_ZERO, A.beep(), 0.7); A.add(A.sfx, T_ZERO + 0.16, A.beep(), 0.7)
    A.add(A.sfx, T_LIGHTS, A.impact(3.0, 110, 26, 1.4), 1.35); A.ducks.append((T_LIGHTS + 0.02, T_LIGHTS + 1.2))
    A.add(A.sfx, T_MOON, A.impact(1.8, 70, 30), 0.6)
    A.add(A.sfx, S["s06"] + 0.2, A.wind(3.0), 0.25); A.add(A.sfx, T_CITY, A.hum(1.8), 0.6)
    A.add(A.sfx, S["s07"] + 0.1, A.whoosh(3.2, True), 0.4)
    A.add(A.sfx, S["s08"] + 0.1, A.wind(3.3), 0.5); A.add(A.sfx, S["s08"] + 0.1, A.crackle(3.0), 0.3); A.add(A.sfx, S["s08"] + 0.2, A.chime(1760), 0.18)
    A.add(A.sfx, S["s09"] + 0.2, A.crackle(3.6, 110), 0.35)
    for i in range(4): A.add(A.sfx, lerp(S["s09"] + 0.6, T_WHITE - 0.2, i / 3), A.ice_crack(), 0.7)
    A.pulse(S["s09"], T_WHITE - 0.1, 0.8, hats=False)
    A.add(A.sfx, T_WHITE, A.impact(2.6, 130, 30, 1.2), 1.2); A.add(A.sfx, T_WHITE, A.chime(1046), 0.35)
    A.add(A.sfx, S["s10"] - 0.05, A.impact(1.5, 60, 32), 0.55); A.add(A.sfx, S["s10"] + 0.15, A.bubbles(2.9), 0.55)
    A.add(A.sfx, S["s11"] + 0.05, A.chime(1568), 0.5); A.pulse(S["s11"], S["s12"] + 1.2, 0.6, speedup_last=0)
    A.add(A.sfx, S["s12"] - 1.9, A.riser(2.0), 0.8)
    z = S["s12"] + 0.35
    while z < LOOP - 0.1: A.add(A.sfx, z, A.zap(), 1.0); z += 0.25
    A.add(A.sfx, LOOP - 0.1, A.whoosh(0.3), 0.8); A.add(A.sfx, LOOP, A.impact(1.3, 140, 50), 0.6)
    C = A.CHORDS
    A.music_plan([(0.0, *C["A"]), (S["s03"], *C["F"]), (T_LIGHTS, *C["Dm"]), (S["s07"], *C["Em"]),
                  (S["s09"], *C["Dm"]), (S["s10"], *C["F"]), (S["s11"], *C["C"]), (LOOP, *C["A"])])
