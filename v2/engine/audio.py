"""Astrivo v2 sound kit: SFX recipes, beat, music pad and the final mix.

scene.py defines `sound(A)` and calls A.add(A.sfx | A.beat | A.mus, time, clip, gain)
with the recipes below. make.py then calls A.mix(voice_path, out_dir).
Real SFX files can be used too: A.load("file.wav") returns a clip.
"""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

SR = 48000

class Audio:
    def __init__(self, total, seed=1):
        self.N = int(total * SR); self.total = total
        self.rng = np.random.default_rng(seed)
        self.sfx = np.zeros(self.N); self.mus = np.zeros(self.N); self.beat = np.zeros(self.N)
        n = int(1.6 * SR)
        ir = self.rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 4.0)
        ir = self.lp(ir, 5000); self.IR = ir / np.sqrt(np.sum(ir ** 2))
        self.ducks = []  # (t0, t1): music almost silent then back

    # ---- helpers ----
    def tt(self, d): return np.arange(int(d * SR)) / SR
    def env(self, n, a=0.005, r=0.2):
        e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
        if ai: e[:ai] = np.linspace(0, 1, ai)
        if ri: e[-ri:] *= np.linspace(1, 0, ri)
        return e
    def lp(self, x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
    def hp(self, x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
    def bp(self, x, lo, hi): return sosfilt(butter(2, [lo, min(hi, 20000)], 'band', fs=SR, output='sos'), x)
    def add(self, buf, t, x, g=1.0):
        i = int(t * SR); j = min(self.N, i + len(x))
        if 0 <= i < self.N: buf[i:j] += x[: j - i] * g
    def verb(self, x, wet=0.35): return x * (1 - wet) + fftconvolve(x, self.IR)[: len(x)] * wet * 0.6
    def load(self, path):
        x, sr = sf.read(path)
        if x.ndim > 1: x = x.mean(1)
        return resample_poly(x, SR, sr) if sr != SR else x
    def noise(self, n): return self.rng.standard_normal(n)

    # ---- SFX recipes ----
    def impact(self, d=2.5, f0=120, f1=30, size=1.0):
        """Big layered boom: sub drop + distorted mid + crack + rumble, with reverb."""
        t = self.tt(d)
        sub = np.sin(2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 7)) / SR) * np.exp(-t * 1.8)
        mid = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(70 + 160 * np.exp(-t * 12)) / SR)) * np.exp(-t * 6) * 0.5
        crack = self.hp(self.noise(len(t)), 1500) * np.exp(-t * 30) * 0.6
        rumble = self.lp(self.noise(len(t)), 180) * np.exp(-t * 1.5) * 1.5
        x = sub + mid + crack + rumble * size
        return self.verb(x / np.max(np.abs(x)), 0.3)
    def whoosh(self, d=0.5, up=True):
        t = self.tt(d); n = self.noise(len(t)); out = np.zeros(len(t)); seg = 960
        for k in range(0, len(t), seg):
            p = k / len(t); fc = 250 + 4000 * (p if up else 1 - p)
            out[k:k + seg] = self.bp(n[k:k + seg], fc * 0.55, fc * 1.5)
        return self.verb(out * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.4 * 1.6, 0.25)
    def tick(self):
        t = self.tt(0.035)
        return (np.sin(2 * np.pi * 2600 * t) * 0.7 + self.hp(self.noise(len(t)), 4000) * 0.6) * np.exp(-t * 200)
    def kick(self):
        t = self.tt(0.35); x = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 35)) / SR) * np.exp(-t * 9)
        return np.tanh(x * 2.2)
    def hat(self):
        t = self.tt(0.06); return self.hp(self.noise(len(t)), 7000) * np.exp(-t * 80) * 0.5
    def beep(self, f=1250, d=0.16):
        t = self.tt(d); return np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * self.env(len(t), 0.002, 0.03)
    def implode(self):
        t = self.tt(0.32); f = 200 + 2800 * (t / 0.32) ** 2
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / 0.32) ** 2 * 0.5
        return x + self.hp(self.noise(len(t)), 2000) * (t / 0.32) ** 3 * 0.5
    def chime(self, base=1318):
        t = self.tt(2.0)
        x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (1.6 + k)) / (k + 1) for k, f in enumerate([base, base * 1.5, base * 2, base * 3]))
        return self.verb(x * self.env(len(t), 0.003, 0.6) * 0.6, 0.45)
    def crackle(self, d=2.6, dens=70):
        x = np.zeros(int(d * SR))
        for _ in range(int(d * dens)):
            i = self.rng.integers(0, len(x) - 800); L = self.rng.integers(80, 700)
            x[i:i + L] += self.hp(self.noise(L), 3000) * np.exp(-np.arange(L) / (L / 4)) * self.rng.uniform(0.2, 1)
        return x
    def ice_crack(self):
        t = self.tt(0.6); x = self.hp(self.noise(len(t)), 1500) * np.exp(-t * 16)
        return self.verb(x + np.sin(2 * np.pi * 160 * t) * np.exp(-t * 9) * 0.7, 0.35)
    def bubbles(self, d=2.9):
        x = np.zeros(int(d * SR))
        for _ in range(int(d * 11)):
            i = self.rng.integers(0, len(x) - 4000); tb = self.tt(0.06); f = self.rng.uniform(400, 900) * (1 + tb * 12)
            x[i:i + len(tb)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tb * 50) * 0.5
        return self.lp(x, 2500)
    def riser(self, d=2.0):
        t = self.tt(d); f = 110 + 1000 * (t / d) ** 2
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + self.bp(self.noise(len(t)), 600, 7000) * 0.35
        return self.verb(x * (t / d) ** 2, 0.3)
    def zap(self):
        t = self.tt(0.09); return np.sign(np.sin(2 * np.pi * 90 * t)) * np.exp(-t * 30) * 0.3
    def wind(self, d):
        t = self.tt(d); x = self.lp(self.noise(len(t)), 600) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))
        return x * self.env(len(t), 0.5, 0.6)
    def hum(self, d, f=60):
        t = self.tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t)) * self.env(len(t), 0.2, 0.3) * 0.3

    # ---- beat + music ----
    def countdown(self, t0, t1, fast_last=2.0):
        """Ticks + kick/hat pulse that double speed in the last `fast_last` seconds before t1."""
        t = t0
        while t < t1:
            self.add(self.sfx, t, self.tick(), 0.35); t += 0.25 if t < t1 - 1.6 else 0.125
        t = t0 + 0.15
        while t < t1:
            self.add(self.beat, t, self.kick(), 1.0); self.add(self.beat, t + 0.25, self.hat(), 0.6)
            t += 0.5 if t < t1 - fast_last else 0.25
    def pulse(self, t0, t1, gain=0.7, hats=True, speedup_last=1.2):
        t = t0
        while t < t1:
            self.add(self.beat, t, self.kick(), gain)
            if hats: self.add(self.beat, t + 0.25, self.hat(), 0.5)
            t += 0.5 if t < t1 - speedup_last else 0.25
    def pad(self, freqs, d):
        t = self.tt(d); x = np.zeros(len(t))
        for f in freqs:
            for det in (-0.7, 0.0, 0.7):
                ph = 2 * np.pi * (f + det) * t; x += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) / len(freqs)
        return self.lp(x, 1600) * self.env(len(t), 0.35, 0.35)
    def bass(self, f, d):
        t = self.tt(d); return self.lp(np.tanh(2 * np.sin(2 * np.pi * f * t)), 300) * self.env(len(t), 0.05, 0.2)
    def music_plan(self, plan):
        """plan = [(start, [chord freqs], bass_freq), ...] — one chord per section."""
        for i, (st, ch, bf) in enumerate(plan):
            en = plan[i + 1][0] if i + 1 < len(plan) else self.total
            self.add(self.mus, st, self.pad(ch, en - st + 0.3), 1.0); self.add(self.mus, st, self.bass(bf, en - st + 0.2), 0.5)
    CHORDS = {"A": ([110, 130.8, 164.8], 55), "F": ([87.3, 110, 130.8], 43.65), "Dm": ([73.4, 110, 146.8], 36.7),
              "C": ([130.8, 164.8, 196], 65.4), "Em": ([82.4, 123.5, 164.8], 41.2), "G": ([98, 123.5, 146.8], 49)}

    # ---- final mix ----
    def mix(self, voice_path, out_dir):
        def norm(x, p): return x / (np.max(np.abs(x)) + 1e-9) * p
        N = self.N
        v, vsr = sf.read(voice_path)
        if v.ndim > 1: v = v.mean(1)
        v = resample_poly(v, SR, vsr) if vsr != SR else v
        vb = np.zeros(N); vb[:min(N, len(v))] = v[:N]
        ve = self.lp(np.abs(vb), 8); ve = ve / (ve.max() + 1e-9)
        duck = 1 - 0.55 * np.clip(ve * 4, 0, 1)
        music = (norm(self.mus, 1.0) * 0.6 + norm(self.beat, 1.0) * 0.55) * duck
        for t0, t1 in self.ducks:
            i0, i1 = int(t0 * SR), min(N, int(t1 * SR)); music[i0:i1] *= np.linspace(0.1, 1, i1 - i0)
        m = norm(vb, 0.80) + norm(self.sfx, 0.45) + music * 0.20
        m = np.tanh(m * 1.15) / np.tanh(1.15)
        f = int(0.03 * SR); m[:f] *= np.linspace(0, 1, f); m[-f:] *= np.linspace(1, 0, f)
        sf.write(f"{out_dir}/mix.wav", np.stack([m, m], 1).astype(np.float32), SR)
        nv = norm(norm(self.sfx, 0.5) + norm(self.mus, 0.6) * 0.25 + norm(self.beat, 0.6) * 0.25, 0.9)
        sf.write(f"{out_dir}/mix_no_voice.wav", np.stack([nv, nv], 1).astype(np.float32), SR)
