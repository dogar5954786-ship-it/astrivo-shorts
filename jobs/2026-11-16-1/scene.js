// "How Long You'd Last on Each Planet"  Flat style, structure copied from flat/examples/moon-closer.
// Scene A: you stand on Mercury (stopwatch 15 s -> 2 min), a Mars sweep, Mars (2 min again).
// Scene B (whiteout): Venus. Pressure x90, 465 C, lead melts, KEY HIT: crushed + cooked in < 1 second.
// Scene C (sweep): the 4 giant planets, no ground; you sink through Jupiter's clouds and get squashed.
// Scene D (whiteout): Earth, the only planet where you last a lifetime. You are here.
(function () {
  const { TAU, lerp, seg, eo, eio, back, C, PL, glow, spark, arrow, line, text, pill, flare, burst,
    sky, planet, earth, buddy, badge, shake, whiteout } = FLAT;
  let TL = null, COLD = false;
  const RED = ['#ffb3a6', '#ff5d4f', '#9c1638'];
  const MERC = { c: ['#e6dfd8', '#a8988c', '#4a3a48'], craters: true, glow: '#c8b8ff' };
  const URANUS = { c: ['#d8fff8', '#7fe0e0', '#2a6a8a'], glow: '#9ff7ff', tilt: 0.5, atmo: [210, 255, 250],
    bands: [[-0.3, -0.18, '#c8fff6', 0.4], [0.2, 0.32, '#5ac0c8', 0.4]] };

  function init(T) {
    const s = T.s, w = (q, i, fb) => T.word(q, i, fb);
    const hit = w('less', 6, T.at(6, 0.55));
    TL = {
      intro: s(1), merc: w('mercury', 1), noAir: w('air', 1), pass: w('pass', 1), n15: w('15', 1, T.at(1, 0.85)),
      gone: w('gone', 2), min2: w('2', 2, T.at(2, 0.6)),
      sweep: [s(3) - 0.25, s(3) + 0.5], cutM: s(3) + 0.13, mars: w('mars', 3), thin: w('thin', 3), min2b: w('2', 3, T.at(3, 0.8)),
      white: [s(4) - 0.4, s(4) + 0.35], cutV: s(4), venus: w('venus', 4), deadly: w('deadliest', 4), n90: w('90', 4, T.at(4, 0.7)),
      n465: w('465', 5, T.s(5)), lead: w('lead', 5, T.at(5, 0.85)), melt: w('melt', 5, T.at(5, 0.75)),
      crushed: w('crushed', 6), cooked: w('cooked', 6), hit, word: w('second', 6, hit + 0.4),
      sweep2: [s(7) - 0.25, s(7) + 0.5], cutG: s(7) + 0.13,
      jup: w('jupiter', 7), sat: w('saturn', 7), ura: w('uranus', 7), nep: w('neptune', 7), ground: w('ground', 7),
      dive: [s(8) - 0.2, s(8) + 0.5], cutI: s(8), sink: w('sink', 8), clouds: w('clouds', 8), pressure: w('pressure', 8), crush2: w('crushes', 8),
      white2: [s(9) - 0.4, s(9) + 0.35], cutE: s(9), life: w('lifetime', 9), right: w('right', 9),
      D: T.D,
    };
  }

  // the character, standing with its feet at (cx, feetY); sq squashes it flat; red tints it
  function you(x, cx, feetY, r, o = {}) {
    const sq = o.sq || 0, sx = 1 + 0.9 * sq, sy = 1 - 0.72 * sq;
    x.save(); x.translate(cx, feetY); x.rotate(o.rot || 0); x.scale(sx, sy); x.translate(0, -r * 1.1);
    buddy(x, 0, 0, r, { col: C.teal, look: o.look || [0, 0], worry: o.worry, happy: o.happy, armUp: o.armUp, t: o.t, ph: 0.4 });
    if ((o.red || 0) > 0) { x.globalAlpha *= o.red; buddy(x, 0, 0, r, { col: RED, look: o.look || [0, 0], worry: 1, t: o.t }); }
    x.restore();
  }
  const mmss = (sec) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  // stopwatch: white dial + big time readout
  function stopwatch(x, cx, cy, s, sec, col) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    glow(x, 0, 0, 170, col, 0.25);
    x.fillStyle = '#ffffff'; FLAT.rr(x, -26, -112, 52, 26, 10); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, 92, 0, TAU); x.fill();
    x.fillStyle = H.rgba(col, 0.25); x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 80, -Math.PI / 2, -Math.PI / 2 + TAU * ((sec % 60) / 60)); x.closePath(); x.fill();
    x.strokeStyle = C.ink; x.lineWidth = 7; x.lineCap = 'round'; const a = -Math.PI / 2 + TAU * (sec / 60);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 70, Math.sin(a) * 70); x.stroke();
    x.fillStyle = C.ink; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill();
    x.restore();
    if (s > 0.3) { x.save(); x.translate(cx, cy + 150); x.scale(s, s); text(x, mmss(sec), 0, 0, 84, col); x.restore(); }
  }

  // ================= SCENE A: Mercury, then Mars =================
  function exA(x, W, H_, t) {
    const mars = t >= TL.cutM;
    const t0 = mars ? TL.cutM : TL.intro;
    const pin = eo(seg(t, t0 - 0.4, t0 + 0.7));
    sky(x, W, H_, t, { z: (1 + 1.2 * (1 - pin)) * (1 + 0.04 * (t - t0)), x: t * 10, y: t * 5 });
    const PR = 400, PY = lerp(1500, 1260, pin), top = PY - PR;
    if (mars) planet(x, W / 2, PY, PR, PL.mars, { glowA: 0.3 });
    else planet(x, W / 2, PY, PR, MERC, { glowA: 0.22 });
    // background sun far away (Mercury is close to it)
    if (!mars) FLAT.sun(x, 600, 150, 46 * pin, t);

    // you land
    const yin = back(seg(t, t0 - 0.3, t0 + 0.25), 1.4);
    const passK = mars ? 0 : seg(t, TL.pass, TL.pass + 0.4);
    const goneK = mars ? seg(t, TL.min2b, TL.min2b + 0.4) : seg(t, TL.min2, TL.min2 + 0.4);
    const ly = lerp(-200, top + 6, yin);
    x.save(); x.globalAlpha *= 1 - 0.55 * goneK;
    you(x, 250, ly, 74, { look: [0.4, -0.3], worry: passK > 0.5 || mars ? 1 : 0, t, rot: -0.5 * goneK + 0.06 * Math.sin(t * 5) * passK, armUp: 0.2 });
    x.restore();
    if (passK > 0 && goneK < 1) for (let i = 0; i < 3; i++) { const a = t * 4 + (i * TAU) / 3; spark(x, 250 + Math.cos(a) * 46, ly - 185 + Math.sin(a) * 14, 10, C.yellow, passK * (1 - goneK)); }

    // planet name
    const nm = mars ? TL.mars : TL.merc, nameS = back(seg(t, nm - 0.1, nm + 0.25), 1.6);
    pill(x, W / 2, 200, mars ? 'MARS' : 'MERCURY', 48, { s: nameS, bg: mars ? '#ff8f6a' : '#e6dfd8' });
    // the air problem
    const ap = mars ? TL.thin : TL.noAir, apS = back(seg(t, ap, ap + 0.3));
    pill(x, 250, top - 215, mars ? 'air: < 1% of ours' : 'no air', 32, { s: apS, bg: C.cyan, ptr: true });

    // stopwatch: counts on its own clock; jumps to 0:15 then 2:00 on the words
    let sec;
    if (!mars) {
      const c15 = eio(seg(t, TL.intro + 0.3, TL.n15)), c120 = eio(seg(t, TL.gone, TL.min2));
      sec = lerp(lerp(0, 15, c15), 120, c120);
    } else sec = lerp(0, 120, eio(seg(t, TL.cutM + 0.2, TL.min2b)));
    const swS = back(seg(t, t0 - 0.1, t0 + 0.3), 1.5);
    stopwatch(x, 500, 470, swS, sec, goneK > 0 ? C.red : C.yellow);
    // pops on the numbers
    if (!mars) {
      const p15 = back(seg(t, TL.n15, TL.n15 + 0.3), 1.6) * (1 - seg(t, TL.gone - 0.2, TL.gone));
      pill(x, 500, 760, 'passed out', 32, { s: p15, bg: C.yellow });
      if (t > TL.n15) burst(x, 500, 620, (t - TL.n15) * 1.2, 31, 160);
    }
    const g = mars ? TL.min2b : TL.min2;
    badge(x, 345, top - 150, 34, false, back(seg(t, g, g + 0.3), 1.6));
    if (t > g) burst(x, 500, 620, (t - g) * 1.2, 44, 180);
  }

  // ================= SCENE B: Venus, the key hit =================
  function exB(x, W, H_, t) {
    const sk = shake(t, TL.hit, 14, 0.55) + shake(t, TL.crushed, 6, 0.3);
    x.save(); x.translate(sk, sk * 0.5);
    const zin = eo(seg(t, TL.cutV, TL.cutV + 0.9));
    sky(x, W, H_, t, { z: lerp(1.5, 1.05, zin) + 0.03 * (t - TL.cutV), x: 200 + t * 8, y: t * 4 });
    // heat haze grows over the scene
    const heat = seg(t, TL.n465 - 0.2, TL.n465 + 0.6);
    if (heat > 0) { x.fillStyle = H.rgba('#ff6a2c', 0.18 * heat); x.fillRect(0, 0, W, H_); glow(x, W / 2, 900, 700, '#ff8d3f', 0.35 * heat); }
    const PR = 420, PY = lerp(1500, 1300, zin), top = PY - PR;
    planet(x, W / 2, PY, PR, PL.venus, { glowA: 0.4 + 0.3 * heat });
    // lava glow cracks on the surface when hot
    if (heat > 0) for (let i = 0; i < 6; i++) { const q = H.rng(150 + i); glow(x, q.range(100, 620), q.range(top + 60, top + 200), 40, '#ff5a1f', 0.5 * heat * (0.7 + 0.3 * Math.sin(t * 5 + i))); }

    const nameS = back(seg(t, TL.venus - 0.1, TL.venus + 0.25), 1.6) * (1 - seg(t, TL.n90 - 0.3, TL.n90));
    pill(x, W / 2, 210, 'VENUS', 48, { s: nameS, bg: '#ffd27a' });
    const dS = back(seg(t, TL.deadly, TL.deadly + 0.3)) * (1 - seg(t, TL.n90 - 0.3, TL.n90));
    pill(x, W / 2, 300, 'the deadliest', 36, { s: dS, bg: C.red, fg: '#ffffff' });

    // you, then squashed and cooked
    const yin = back(seg(t, TL.cutV + 0.1, TL.cutV + 0.6), 1.4);
    const ly = lerp(-200, top + 10, yin);
    const sq = eio(seg(t, TL.crushed - 0.05, TL.crushed + 0.25)), red = seg(t, TL.cooked, TL.cooked + 0.35);
    const press = seg(t, TL.n90 - 0.1, TL.n90 + 0.4);
    you(x, W / 2, ly, 82, { look: [0, -0.6], worry: press > 0.3 ? 1 : 0, t, sq: Math.max(sq, 0.12 * press), red, armUp: 0.5 * (1 - sq) });

    // pressure arrows push down from above
    const arOut = 1 - seg(t, TL.n465 - 0.35, TL.n465 - 0.05);
    if (press > 0 && arOut > 0) for (let i = 0; i < 5; i++) {
      const ax = W / 2 + (i - 2) * 95, bob = 10 * Math.sin(t * 6 + i);
      arrow(x, line([ax, 420 + bob], [ax, 560 + bob + Math.abs(i - 2) * 30]), eio(seg(t, TL.n90 - 0.1 + i * 0.05, TL.n90 + 0.3 + i * 0.05)), C.cyan, 12, { a: arOut });
    }
    if (!COLD) bigNumber90(x, t, W, arOut);
    // 465 C
    const hs = back(seg(t, TL.n465 - 0.05, TL.n465 + 0.25), 1.6) * (1 - seg(t, TL.hit - 0.4, TL.hit - 0.15));
    if (hs > 0 && !COLD) { x.save(); x.translate(W / 2, 640); x.scale(hs, hs); text(x, '465°C', 0, 0, 104, '#ff8d3f'); x.restore(); }
    // lead melts: a grey bar droops into a puddle
    const lp = back(seg(t, TL.melt - 0.3, TL.melt), 1.4) * (1 - seg(t, TL.hit - 0.4, TL.hit - 0.15));
    if (lp > 0 && !COLD) {
      const m = eio(seg(t, TL.melt, TL.melt + 0.8)), bx = 560, by = top + 6;
      x.save(); x.translate(bx, by); x.scale(lp, lp);
      x.fillStyle = '#9aa0c0'; x.beginPath(); x.ellipse(0, -6, 40 + 40 * m, 10 + 4 * m, 0, 0, TAU); x.fill();
      const hgt = lerp(90, 8, m);
      x.fillStyle = '#c8cce6'; FLAT.rr(x, -26 - 10 * m, -hgt, 52 + 20 * m, hgt, 10); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.4)'; FLAT.rr(x, -18, -hgt + 6, 10, Math.max(4, hgt - 16), 5); x.fill();
      x.restore();
      pill(x, bx - 20, by - 160, 'lead melts', 30, { s: back(seg(t, TL.lead, TL.lead + 0.3)), bg: '#ffffff', ptr: true });
    }

    // THE KEY HIT: crushed and cooked in less than a second
    if (t > TL.hit - 0.05) {
      const hk = Math.max(0, 1 - Math.abs(t - TL.hit - 0.15) / 0.75);
      flare(x, W / 2, 560, hk * 0.9, t);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.hit, TL.hit + 0.35) * Math.PI), s = back(seg(t, TL.hit - 0.05, TL.hit + 0.25), 1.6) * pop;
      x.save(); x.translate(W / 2, 560); x.scale(s, s); text(x, '< 1 SEC', 0, 0, 140, C.red); x.restore();
      const ws = back(seg(t, TL.word, TL.word + 0.3));
      if (!COLD) { x.save(); x.translate(W / 2, 672); x.scale(ws, ws); text(x, 'crushed + cooked', 0, 0, 48, '#ffffff'); x.restore(); }
      burst(x, W / 2, 560, (t - TL.hit) * 1.0, 97, 330);
    }
    x.restore();
    const fl = Math.max(0, 1 - Math.abs(t - (TL.hit + 0.05)) / 0.25);
    if (fl > 0) { x.fillStyle = H.rgba('#fff0c8', 0.4 * fl); x.fillRect(0, 0, W, H_); }
  }
  function bigNumber90(x, t, W, a) {
    const s = back(seg(t, TL.n90 - 0.05, TL.n90 + 0.25), 1.6) * (1 - seg(t, TL.n465 - 0.3, TL.n465 - 0.05));
    if (s <= 0) return;
    x.save(); x.translate(W / 2, 260); x.scale(s, s); text(x, '×90', 0, 0, 120, C.yellow); text(x, 'air pressure', 0, 84, 44, '#ffffff'); x.restore();
    if (t > TL.n90) burst(x, W / 2, 260, (t - TL.n90) * 1.1, 12, 220);
  }

  // ================= SCENE C: the giant planets, then sinking into the clouds =================
  function exC(x, W, H_, t) {
    if (t >= TL.cutI) return exC2(x, W, H_, t);
    sky(x, W, H_, t, { z: 1.1 + 0.05 * (t - TL.cutG), x: 400 + t * 10, y: -t * 6 });
    const P = [[TL.jup, 200, 300, 125, PL.jupiter, 'Jupiter'], [TL.sat, 525, 520, 80, PL.saturn, 'Saturn'], [TL.ura, 195, 690, 72, URANUS, 'Uranus'], [TL.nep, 500, 750, 74, PL.neptune, 'Neptune']];
    const zoom = eio(seg(t, TL.dive[0], TL.cutI));
    for (const [tw, px, py, r, pal, name] of P) {
      const s = back(seg(t, tw - 0.15, tw + 0.25), 1.5);
      if (s <= 0) continue;
      const fy = py + Math.sin(t * 1.3 + px) * 6;
      planet(x, px, fy, r * s * (pal === PL.jupiter ? 1 + 8 * zoom : 1), pal);
      pill(x, px, fy + r + 34, name, 30, { s: back(seg(t, tw, tw + 0.3)) * (1 - seg(t, TL.ground - 0.2, TL.ground)), bg: '#ffffff' });
    }
    const gs = back(seg(t, TL.ground, TL.ground + 0.3), 1.6);
    if (gs > 0) {
      x.save(); x.translate(W / 2, 170); x.scale(gs, gs); text(x, 'NO GROUND!', 0, 0, 76, C.yellow); x.restore();
      for (const [tw, px, py, r] of P) badge(x, px + r * 0.7, py - r * 0.7, 26, false, back(seg(t, TL.ground + 0.05, TL.ground + 0.35), 1.6));
    }
  }
  function exC2(x, W, H_, t) {
    // inside Jupiter: cloud bands stream upward as you sink, getting darker and denser
    const d = seg(t, TL.cutI, TL.white2[0]), sp = (t - TL.cutI) * 260;
    const bandsC = ['#fff0d8', '#e8a36a', '#c4643a', '#f6c890', '#b85030', '#ffe2b8', '#7a3f2a'];
    for (let i = -1; i < 12; i++) {
      const y = ((i * 130 - sp) % (13 * 130) + 13 * 130) % (13 * 130) - 130;
      x.fillStyle = bandsC[((i % 7) + 7) % 7]; x.beginPath(); x.moveTo(0, y);
      for (let k = 0; k <= 12; k++) x.lineTo((k / 12) * W, y + Math.sin(k * 0.9 + t * 1.5 + i) * 14);
      x.lineTo(W, y + 150); x.lineTo(0, y + 150); x.closePath(); x.fill();
    }
    x.fillStyle = H.rgba('#2a0f1a', 0.55 * d); x.fillRect(0, 0, W, H_);
    // wisps rushing past
    for (let i = 0; i < 16; i++) { const q = H.rng(500 + i), u = ((t - TL.cutI) * q.range(0.5, 1.1) + q()) % 1; x.fillStyle = 'rgba(255,240,220,0.35)'; FLAT.rr(x, q.range(-40, 660), lerp(1300, -100, u), q.range(80, 200), 16, 8); x.fill(); }
    const sq = eio(seg(t, TL.crush2 - 0.05, TL.crush2 + 0.3)), press = seg(t, TL.pressure - 0.1, TL.pressure + 0.4);
    const yy = 640 + Math.sin(t * 2) * 10;
    you(x, W / 2, yy, 86, { look: [0, 0.8], worry: 1, t, sq: Math.max(sq, 0.12 * press), armUp: 0.9 * (1 - sq), rot: Math.sin(t * 2.5) * 0.08 });
    // pressure arrows squeeze from both sides
    if (press > 0) for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const ay = 480 + i * 90;
      arrow(x, line([W / 2 + sd * 320, ay], [W / 2 + sd * 140, ay + 20]), eio(seg(t, TL.pressure + i * 0.06, TL.pressure + 0.4 + i * 0.06)), C.cyan, 11, { a: 0.95 });
    }
    pill(x, W / 2, 230, 'sinking...', 40, { s: back(seg(t, TL.sink, TL.sink + 0.3)) * (1 - seg(t, TL.pressure - 0.2, TL.pressure)), bg: '#ffffff' });
    const ps = back(seg(t, TL.crush2, TL.crush2 + 0.3), 1.6);
    if (ps > 0) { x.save(); x.translate(W / 2, 230); x.scale(ps, ps); text(x, 'SQUASHED!', 0, 0, 80, C.yellow); x.restore(); burst(x, W / 2, 640, (t - TL.crush2) * 1.1, 77, 220); }
  }

  // ================= SCENE D: Earth, the twist =================
  function exD(x, W, H_, t) {
    const zin = eo(seg(t, TL.cutE, TL.cutE + 0.9));
    sky(x, W, H_, t, { z: lerp(1.5, 1.05, zin) + 0.03 * (t - TL.cutE), x: 700 + t * 8, y: t * 4 });
    const PR = 420, PY = lerp(1500, 1290, zin), top = PY - PR;
    earth(x, W / 2, PY, PR, { spin: t * 0.2, t });
    const yin = back(seg(t, TL.cutE + 0.1, TL.cutE + 0.6), 1.4), ly = lerp(-200, top + 8, yin);
    const happy = t > TL.life ? 1 : 0;
    you(x, W / 2, ly, 82, { look: [0, -0.5], happy, t, armUp: happy ? 0.9 : 0.3 });
    const ls = back(seg(t, TL.life, TL.life + 0.3), 1.6);
    if (ls > 0) { x.save(); x.translate(W / 2, 250); x.scale(ls, ls); text(x, 'a whole', 0, -50, 52, '#ffffff'); text(x, 'LIFETIME', 0, 34, 104, C.green); x.restore(); burst(x, W / 2, 260, (t - TL.life) * 1.1, 23, 280); }
    badge(x, W / 2 + 170, 480, 34, true, back(seg(t, TL.life + 0.15, TL.life + 0.45), 1.6));
    const hs = back(seg(t, TL.right, TL.right + 0.3), 1.6);
    pill(x, W / 2, top - 235, 'YOU ARE HERE', 40, { s: hs, bg: C.yellow, ptr: true });
    if (t > TL.right + 0.4) for (let i = 0; i < 7; i++) { const q = H.rng(400 + i); spark(x, q.range(60, 660), q.range(120, 420), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.right + 0.4, TL.right + 0.8)); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    const sw2 = eio(seg(t, TL.sweep2[0], TL.sweep2[1])), spx2 = lerp(W + 1000, -1000, sw2);
    if (t < TL.cutV) exA(x, W, H_, t);
    else if (t < TL.cutG) exB(x, W, H_, t);
    else if (t < TL.cutE) exC(x, W, H_, t);
    else exD(x, W, H_, t);
    if (sw > 0 && sw < 1) planet(x, spx, 640 + (sw - 0.5) * 140, 900, PL.mars, { glowA: 0.4 });
    if (sw2 > 0 && sw2 < 1) planet(x, spx2, 640 + (sw2 - 0.5) * 140, 900, PL.jupiter, { glowA: 0.4 });
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cutV) * (1 - seg(t, TL.cutV, TL.white[1])));
    whiteout(x, W, H_, seg(t, TL.dive[0], TL.cutI) * (1 - seg(t, TL.cutI, TL.dive[1])));
    whiteout(x, W, H_, seg(t, TL.white2[0], TL.cutE) * (1 - seg(t, TL.cutE, TL.white2[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // A: Mercury
    boop(backPeak(TL.intro - 0.3, TL.intro + 0.25, 1.4), 360, 0.9, pan(250));
    pluck(backPeak(TL.merc - 0.1, TL.merc + 0.25, 1.6), 'E4', 0.9, 0);
    pluck(backPeak(TL.noAir, TL.noAir + 0.3), 'C5', 0.6, pan(250), true);
    tocksAlong(TL.intro + 0.3, TL.n15, 8, 900, 0, 0.25, pan(500));
    k.tone(TL.pass, { f: [[0, 520], [0.5, 300]], type: 'triangle', dur: 0.6, gain: 0.07, a: 0.05 });
    pluck(backPeak(TL.n15, TL.n15 + 0.3, 1.6), 'A4', 0.9, pan(500));
    tocksAlong(TL.gone, TL.min2, 6, 700, -40, 0.3, pan(500));
    k.play('stamp', TL.min2, { gain: 0.6 });
    // sweep to Mars
    whoosh(TL.sweep[0]);
    pluck(backPeak(TL.mars - 0.1, TL.mars + 0.25, 1.6), 'D4', 0.9, 0);
    pluck(backPeak(TL.thin, TL.thin + 0.3), 'A4', 0.6, pan(250), true);
    tocksAlong(TL.cutM + 0.2, TL.min2b, 8, 760, -20, 0.22, pan(500));
    k.play('stamp', TL.min2b, { gain: 0.6 });
    // whiteout to Venus
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.2, 0, 0.55);
    chord(TL.cutV, ['C3', 'G3', 'E4'], 0.6, 1.2);
    pluck(backPeak(TL.venus - 0.1, TL.venus + 0.25, 1.6), 'G4', 0.9, 0);
    k.tone(TL.deadly, { f: [[0, 220], [0.5, 165]], type: 'triangle', dur: 0.6, gain: 0.09, a: 0.05 });
    tocksAlong(TL.n90 - 0.1, TL.n90 + 0.4, 5, 500, -40, 0.35, 0);
    k.play('thud', backPeak(TL.n90 - 0.05, TL.n90 + 0.25, 1.6), { f: 70, gain: 0.5 });
    pluck(backPeak(TL.n465 - 0.05, TL.n465 + 0.25, 1.6), 'E4', 1.0, 0);
    k.noise(TL.n465, { dur: 1.6, color: 'pink', filter: 'bandpass', f: 1200, q: 0.5, gain: 0.08, a: 0.3, verb: 0.2 });
    k.tone(TL.melt, { f: [[0, 600], [0.7, 200]], type: 'triangle', dur: 0.8, gain: 0.06, a: 0.05 });
    k.play('riser', TL.crushed - 0.1, { dur: Math.max(0.3, TL.hit - 0.35 - (TL.crushed - 0.1)), gain: 0.7 });
    k.play('thud', TL.crushed + 0.1, { f: 90, gain: 0.45 });
    // THE key hit (gap of 0.3 s before it)
    hit(TL.hit);
    pluck(backPeak(TL.word, TL.word + 0.3), 'E4', 0.7, 0, true);
    // sweep to the giant planets
    whoosh(TL.sweep2[0]);
    boop(backPeak(TL.jup - 0.15, TL.jup + 0.25, 1.5), 300, 0.9, pan(220));
    boop(backPeak(TL.sat - 0.15, TL.sat + 0.25, 1.5), 380, 0.9, pan(520));
    boop(backPeak(TL.ura - 0.15, TL.ura + 0.25, 1.5), 460, 0.9, pan(210));
    boop(backPeak(TL.nep - 0.15, TL.nep + 0.25, 1.5), 540, 0.9, pan(500));
    chord(backPeak(TL.ground, TL.ground + 0.3, 1.6), ['D3', 'A3', 'F4'], 0.8, 1.2);
    // dive into the clouds
    air(TL.dive[0], 1.0, 1800, 1.0, 0, 0.6);
    k.noise(TL.cutI, { dur: TL.white2[0] - TL.cutI, color: 'brown', filter: 'lowpass', f: 400, gain: 0.12, a: 0.4, verb: 0.2 });
    tocksAlong(TL.pressure, TL.pressure + 0.45, 5, 480, -30, 0.3, 0);
    k.play('impact', TL.crush2 + 0.1, { gain: 0.5 });
    // whiteout to Earth
    air(TL.white2[0], TL.white2[1] - TL.white2[0] + 0.1, 2200, 1.2, 0, 0.55);
    boop(backPeak(TL.cutE + 0.1, TL.cutE + 0.6, 1.4), 400, 0.9, 0, false);
    const lp = backPeak(TL.life, TL.life + 0.3, 1.6);
    chord(lp, ['C3', 'G3', 'C4', 'E4', 'G4'], 1.0, 2.0); k.play('sparkle', lp + 0.05, { gain: 0.8, n: 6 });
    const rp = backPeak(TL.right, TL.right + 0.3, 1.6);
    pluck(rp, 'C5', 0.9, 0); pluck(rp + 0.09, 'G5', 0.7, 0.1); shimmer(rp + 0.1, ['E5', 'G5', 'C6'], 0.6, 0.2);
  }

  SCENE({
    init,
    // cold open: the hook plays over you being crushed on Venus with the giant "< 1 SEC", in slow motion
    cold: () => TL.hit + 0.1,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
