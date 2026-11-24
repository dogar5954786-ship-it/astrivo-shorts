// Runner for flat-style Shorts. Loads a job (job.json + scene.js) and the voice timing (timing.json),
// then draws any frame with window.seek(t) and scores sound with window.scoreStem(k, 'music' | 'sfx').
// It adds the parts every Short shares: the cold-open hook, title slam, rewind, captions, music bed, grain.
(function () {
  const L = window.FLAT, { cl, lerp, seg, eo, eio, back, text, F, C } = L;
  const W = 720, H_ = 1280;
  let JOB = null, T = null, SC = null;
  window.SCENE = (def) => { SC = def; };

  // ---------- timing helpers handed to the scene ----------
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  function makeT(tm) {
    const T = { D: tm.D, segs: tm.segs, words: tm.words, caps: tm.caps };
    T.n = tm.segs.length;
    T.s = (i) => tm.segs[Math.max(0, Math.min(T.n - 1, i))].t0;            // segment start
    T.e = (i) => tm.segs[Math.max(0, Math.min(T.n - 1, i))].t1;            // segment end (= next start)
    T.at = (i, f) => lerp(T.s(i), T.e(i), f);                              // fraction through a segment
    T.w = (i, k) => { const ws = tm.words.filter((w) => w.s === i); return ws.length ? ws[Math.max(0, Math.min(ws.length - 1, k < 0 ? ws.length + k : k))].t0 : T.s(i); };
    // time a word starts: T.word('thousand') or T.word('rings', 7) (only in/after segment 7)
    T.word = (q, fromSeg = 0, fb) => {
      const n = norm(q), t0 = T.s(fromSeg);
      const hit = tm.words.find((w) => w.t0 >= t0 - 0.01 && (norm(w.w) === n || (n.length > 3 && norm(w.w).startsWith(n))));
      return hit ? hit.t0 : (fb == null ? t0 : fb);
    };
    T.wordEnd = (q, fromSeg = 0, fb) => { const t = T.word(q, fromSeg, -1); if (t < 0) return fb == null ? T.s(fromSeg) : fb; const w = tm.words.find((w) => Math.abs(w.t0 - t) < 1e-6); return w ? w.t1 : t; };
    return T;
  }

  // ---------- the shared hook ----------
  const REW = 0.32;                      // rewind length (s)
  const hookEnd = () => (T.n > 1 ? T.s(1) : Math.min(2.5, T.D));
  const coldAt = () => (SC.cold ? SC.cold(T, L) : null);
  // which scene time to draw at real time t
  function sceneTime(t) {
    const c = coldAt(); if (c == null) return { te: t, rew: 0 };
    const h = hookEnd(), sp = SC.coldSpeed == null ? 0.35 : SC.coldSpeed;
    if (t < h - REW) return { te: c + t * sp, rew: 0 };
    if (t < h) { const u = (t - (h - REW)) / REW; return { te: lerp(c + (h - REW) * sp, h, eio(u)), rew: Math.sin(u * Math.PI) }; }
    return { te: t, rew: 0 };
  }
  function hookTitle(x, t) {
    const hk = JOB.hook || {}; if (!hk.text) return;
    const h = hookEnd(), lines = String(hk.text).split('\n');
    const out = eio(seg(t, h - REW, h)); if (out >= 1) return;
    const y0 = hk.y || 800, px0 = hk.px || 86;
    x.save(); x.font = F(900, px0);
    const wmax = Math.max(...lines.map((l) => x.measureText(l).width)), px = Math.min(px0, px0 * 660 / wmax);
    const lh = px * 1.08, s = back(seg(t, 0, 0.22), 2.2);
    x.translate(W / 2, y0 - out * 260); x.scale(s * (1 + out * 0.4), s * (1 + out * 0.4)); x.globalAlpha = 1 - out;
    lines.forEach((ln, i) => {
      const yy = (i - (lines.length - 1) / 2) * lh, last = i === lines.length - 1;
      // flat sticker plate behind each line for contrast over any frame
      x.font = F(900, px); const w = x.measureText(ln).width;
      x.fillStyle = 'rgba(10,8,46,0.55)'; L.rr(x, -w / 2 - px * 0.3, yy - px * 0.62 + px * 0.08, w + px * 0.6, px * 1.24, px * 0.3); x.fill();
      text(x, ln, 0, yy, px, last ? C.yellow : '#ffffff');
    });
    x.restore();
  }
  function rewindFx(x, t, a) {
    if (a <= 0) return;
    x.save(); x.fillStyle = `rgba(120,230,255,${0.22 * a})`; x.fillRect(0, 0, W, H_);
    const r = H.rng(Math.floor(t * 60));
    for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(255,255,255,${0.25 * a})`; x.fillRect(0, r.range(0, H_), W, r.range(3, 14)); }
    // flat rewind chevrons
    x.globalAlpha = a; x.fillStyle = '#ffffff';
    for (const dx of [0, 46]) { x.beginPath(); x.moveTo(W / 2 - 10 + dx - 46, 300); x.lineTo(W / 2 + 36 + dx - 46, 270); x.lineTo(W / 2 + 36 + dx - 46, 330); x.closePath(); x.fill(); }
    x.restore();
    L.speedLines(x, W, H_, 0.6 * a, t);
  }

  // ---------- captions: 1-3 words, pop on the spoken word, numbers + highlight words in yellow ----------
  function captions(x, t) {
    if (!T.caps || !T.caps.length) return;
    if (coldAt() != null && t < hookEnd()) return;          // the hook title is the caption during the cold open
    if (JOB.hook && JOB.hook.text && t < hookEnd()) return;
    const c = T.caps.find((c) => t >= c.t0 && t < c.t1 + 0.12); if (!c) return;
    const hl = new Set((JOB.highlight || []).map(norm));
    const words = c.text.split(' '), y = JOB.caption_y || 1000;
    let px = 66; x.font = F(900, px);
    const sp = x.measureText(' ').width; let tot = words.reduce((a, w) => a + x.measureText(w).width, 0) + sp * (words.length - 1);
    if (tot > 650) { px = px * 650 / tot; x.font = F(900, px); tot = 650; }
    const s = back(seg(t, c.t0, c.t0 + 0.16), 2.0);
    x.save(); x.translate(W / 2, y); x.scale(s, s);
    let wx = -tot / 2;
    for (const w of words) {
      const ww = x.measureText(w).width, yellow = /\d/.test(w) || hl.has(norm(w));
      // dark outline for readability over bright frames
      x.save(); x.font = F(900, px); x.lineJoin = 'round'; x.lineWidth = px * 0.2; x.strokeStyle = 'rgba(10,8,46,0.85)'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.strokeText(w, wx, 0); x.restore();
      text(x, w, wx, 0, px, yellow ? C.yellow : '#ffffff', { align: 'left' });
      wx += ww + sp;
    }
    x.restore();
  }

  // ---------- frame ----------
  let ctx = null, scale = 1;
  function draw(t) {
    t = Math.max(0, Math.min(T.D - 1e-3, t));
    const x = ctx; x.setTransform(scale, 0, 0, scale, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
    const { te, rew } = sceneTime(t);
    x.save();
    // frame-0 punch: start zoomed in and shaking, settle in 0.35 s
    if (t < 0.6) { const z = 1 + 0.22 * (1 - eo(seg(t, 0, 0.35))); x.translate(W / 2 + L.shake(t, 0, 14, 0.5), H_ / 2); x.scale(z, z); x.translate(-W / 2, -H_ / 2); }
    SC.draw(x, W, H_, te, T, L, { real: t, cold: coldAt() != null && t < hookEnd() });
    x.restore();
    rewindFx(x, t, rew);
    if (t < 0.1) L.flash(x, W, H_, 1 - t / 0.1);
    hookTitle(x, t);
    captions(x, t);
    L.finish(x, W, H_, t);
  }

  // ---------- sound ----------
  function kitFx(k) {
    const hz = k.hz;
    const when = (t0, t1, ease, u) => { for (let i = 0; i <= 400; i++) { const tt = t0 + ((t1 - t0) * i) / 400; if (ease(i / 400) >= u - 1e-6) return tt; } return t1; };
    const backPeak = (t0, t1, s = 1.5) => when(t0, t1, (u) => back(u, s), 1);
    const pan = (px) => cl((px / W) * 2 - 1, -1, 1) * 0.6;
    const pluck = (t, n, g = 1, p = 0, minor = false) => { const f = hz(n); k.tone(t, { f, dur: 0.9, gain: 0.2 * g, a: 0.003, pan: p, verb: 0.25, minor }); k.tone(t, { f: f * 4, dur: 0.09, gain: 0.04 * g, a: 0.001, pan: p, minor }); k.tone(t, { f: f * 2, type: 'triangle', dur: 0.32, gain: 0.045 * g, a: 0.003, pan: p, minor }); };
    const boop = (t, f0, g = 1, p = 0, minor = true) => { k.tone(t, { f: [[0, f0], [0.07, f0 * 1.45], [0.16, f0 * 1.3]], dur: 0.2, gain: 0.17 * g, a: 0.008, pan: p, verb: 0.15, minor }); k.tone(t, { f: [[0, f0 * 0.5], [0.08, f0 * 0.72]], type: 'triangle', dur: 0.14, gain: 0.06 * g, a: 0.006, pan: p, minor }); };
    const air = (t, dur, top, g = 1, p = 0, peak = 0.55, minor = false) => k.noise(t, { dur, color: 'pink', filter: 'bandpass', f: [[0, 260], [dur * peak, top], [dur, 340]], q: 0.55, gain: 0.26 * g, a: dur * peak, pan: p, verb: 0.3, minor });
    const chord = (t, notes, g = 1, dur = 2.2) => notes.forEach((n, i) => { k.tone(t + i * 0.012, { f: n, type: 'triangle', dur, gain: 0.07 * g, a: 0.02, verb: 0.35, filter: 'lowpass', f2: 1800, pan: (i / Math.max(1, notes.length - 1) - 0.5) * 0.6 }); k.tone(t + i * 0.012, { f: hz(n) * 1.003, dur, gain: 0.06 * g, a: 0.03, verb: 0.35 }); });
    const shimmer = (t, notes, g = 1, p = 0) => k.withMinor(() => notes.forEach((n, i) => k.tone(t + i * 0.055, { f: n, dur: 0.7, gain: 0.07 * g, a: 0.004, verb: 0.4, pan: p + (i % 2 ? 0.25 : -0.25) })));
    const tocksAlong = (t0, t1, n, f0, df, g = 0.35, p = 0) => { for (let i = 1; i <= n; i++) k.play('tock', when(t0, t1, eio, i / n), { f: f0 + i * df, gain: g, pan: p, minor: true }); };
    // the big hit: impact + low chord + shimmer, with a short swell leading in
    const hit = (t, g = 1) => { k.noise(t - 0.7, { dur: 0.72, color: 'pink', filter: 'bandpass', f: [[0, 250], [0.7, 1800]], q: 0.8, gain: 0.2 * g, a: 0.68, verb: 0.3 }); k.play('impact', t, { gain: 0.85 * g }); chord(t, ['A2', 'E3', 'A3', 'C4', 'E4', 'B4'], 1.4 * g, 2.0); shimmer(t + 0.08, ['E5', 'A5', 'C6', 'E5', 'B5'], 0.7 * g, 0.2); };
    const whoosh = (t, dur = 0.8, g = 1) => { air(t, dur, 1400, 1.2 * g, 0, 0.5); k.noise(t + 0.08, { dur, color: 'brown', filter: 'lowpass', f: 260, gain: 0.3 * g, a: dur * 0.45, verb: 0.2 }); };
    return { when, backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh };
  }
  function scoreStem(k, stem) {
    const D = T.D, h = hookEnd(), S = kitFx(k);
    if (stem === 'music') {
      const m = JOB.music || {};
      k.music(m.kind || 'pulse', 0, D, { bpm: m.bpm || 100, gain: m.gain == null ? 0.55 : m.gain, chords: m.chords || [['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['C3', 'E3', 'G3', 'B3'], ['G3', 'B3', 'D4', 'F4']] });
      return;
    }
    // shared hook sounds: hit on frame 0, title stamp, rewind, landing whoosh
    k.play('impact', 0.0, { gain: 0.9 }); S.chord(0.0, ['A2', 'E3', 'A3', 'E4'], 1.2, 1.6);
    k.play('stamp', 0.02, { gain: 0.6 });
    if (coldAt() != null) {
      k.noise(h - REW, { dur: REW + 0.05, color: 'pink', filter: 'bandpass', f: [[0, 3200], [REW, 400]], q: 1.4, gain: 0.32, a: 0.03 });
      k.tone(h - REW, { f: [[0, 900], [REW, 120]], type: 'sawtooth', dur: REW, gain: 0.05, filter: 'lowpass', f2: 1800 });
      k.play('thud', h, { f: 110, gain: 0.5 }); k.play('swish', h - 0.02, { gain: 0.6 });
    }
    if (SC.sound) SC.sound(k, T, L, S);
  }

  // ---------- boot ----------
  async function boot() {
    const q = new URLSearchParams(location.search);
    const jobDir = q.get('job'), tmUrl = q.get('timing');
    JOB = window.JOB || await (await fetch('/' + jobDir + '/job.json')).json();
    const tm = window.TIMING || await (await fetch('/' + tmUrl)).json();
    T = makeT(tm);
    if (!SC) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/' + jobDir + '/scene.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    if (SC.init) SC.init(T, L);
    try { await Promise.all(['900 66px "Nunito"', '800 36px "Nunito"', '700 28px "Nunito"', '600 28px "Fredoka"'].map((f) => document.fonts.load(f, 'AaZz09×~'))); await document.fonts.ready; } catch (e) {}
    const cv = document.getElementById('cv'); ctx = cv.getContext('2d');
    window.DURATION = T.D;
    window.seek = (t) => draw(t);
    window.setRenderScale = (s) => { scale = s; cv.width = Math.round(W * s); cv.height = Math.round(H_ * s); };
    window.scoreStem = scoreStem;
    window.scoreSound = (k) => { scoreStem(k, 'music'); scoreStem(k, 'sfx'); };
    draw(0.5); window.READY = true;
  }
  window.FLAT_BOOT = () => boot().catch((e) => { window.BOOT_ERROR = String(e && e.stack || e); console.error(e); });
})();
