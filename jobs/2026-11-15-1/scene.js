// "What If You Fell Into a Black Hole?"  Flat style, structure copied from flat/examples/moon-closer.
// Scene A: you fall toward a black hole, your friend watches your clock slow, you turn red and freeze.
// Scene B (whiteout): close-up, feet pulled harder than head, you stretch into a noodle, 20,000,000x hit.
// Scene C (sweep): a giant black hole, you fall in feeling nothing... then deep inside, still spaghetti.
(function () {
  const { TAU, lerp, seg, eo, eio, back, C, PL, glow, spark, arrow, line, text, pill, flare, burst,
    sky, sun, blackhole, buddy, badge, shake, whiteout } = FLAT;
  let TL = null, COLD = false;
  const RED = ['#ffb3a6', '#ff5d4f', '#9c1638'];
  const PINK = ['#ffd0e4', '#ff7fb0', '#a8326e'];

  function init(T) {
    const s = T.s, w = (q, i, fb) => T.word(q, i, fb);
    const hit = w('20,000,000', 7, T.wordEnd('hits', 7));
    TL = {
      intro: s(1), hole: [s(1) - 0.4, s(1) + 0.5], ten: w('times', 1) - 0.15, sunIn: w('sun', 1),
      fall: [s(1), w('freeze', 3)], friend: w('friend', 2), clock: w('clock', 2), slow: w('slow', 2),
      red: w('red', 3), freeze: w('freeze', 3), forever: w('forever', 3),
      white: [s(4) - 0.4, s(4) + 0.35], cutB: s(4),
      feet: w('feet', 4), head: w('head', 4),
      stretch: [w('stretches', 5), w('noodle', 5) + 0.3], noodle: w('noodle', 5),
      spag: w('spaghettification', 6), spagOut: s(7) + 0.2,
      edge: w('edge', 7), hit, word: hit + 0.35,
      sweep: [s(8) - 0.2, s(8) + 0.55], cutC: s(8) + 0.17,
      twist: w('twist', 8), giant: w('giant', 8), fallC: [s(8) + 0.3, w('nothing', 8) + 0.2], nothing: w('nothing', 8),
      dive: [s(9), w('inside', 9) + 0.3], spag2: w('spaghetti', 9),
      D: T.D,
    };
  }

  // a clock face whose hand slows to a stop (angle integrates a falling speed: pure function of t)
  function clockAngle(t) {
    const a = TL.clock - 0.3, b = TL.freeze, r0 = 7;
    if (t < a) return r0 * (t - a);
    const u = Math.min(t, b) - a;
    return r0 * u - (r0 * u * u) / (2 * (b - a));
  }
  function clock(x, cx, cy, r, ang, s) {
    if (s <= 0.01) return;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    glow(x, 0, 0, r * 2, '#ffffff', 0.25);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.fillStyle = C.ink;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.beginPath(); x.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.06, 0, TAU); x.fill(); }
    x.strokeStyle = C.ink; x.lineCap = 'round';
    x.lineWidth = r * 0.12; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ang / 12 - 1.2) * r * 0.45, Math.sin(ang / 12 - 1.2) * r * 0.45); x.stroke();
    x.strokeStyle = C.red; x.lineWidth = r * 0.08; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ang - Math.PI / 2) * r * 0.7, Math.sin(ang - Math.PI / 2) * r * 0.7); x.stroke();
    x.fillStyle = C.ink; x.beginPath(); x.arc(0, 0, r * 0.1, 0, TAU); x.fill();
    x.restore();
  }
  // buddy, optionally stretched (sy) with its top kept at `top`; red tint k
  function you(x, cx, top, r, sx, sy, o = {}) {
    const cy = top + r * sy;
    x.save(); x.translate(cx, cy); x.rotate(o.rot || 0); x.scale(sx, sy);
    buddy(x, 0, 0, r, { col: o.col || C.teal, look: o.look || [0, 0.6], worry: o.worry, happy: o.happy, armUp: o.armUp, t: o.t });
    if ((o.red || 0) > 0) { x.globalAlpha *= o.red; buddy(x, 0, 0, r, { col: RED, look: o.look || [0, 0.6], worry: 1, t: o.t }); }
    x.restore();
    return cy;
  }

  // ================= SCENE A: falling toward the hole, seen by your friend =================
  function exA(x, W, H_, t) {
    const hin = back(seg(t, TL.hole[0], TL.hole[1]), 1.2), z = 1 + 0.12 * seg(t, TL.intro, TL.cutB);
    sky(x, W, H_, t, { z: z * (1 + 0.8 * (1 - eo(seg(t, TL.intro - 0.4, TL.intro + 0.9)))), x: t * 8, y: t * 4 });
    const BX = W / 2, BY = 620, BR = 112 * hin;
    if (BR > 1) blackhole(x, BX, BY, BR, t, { tilt: -0.14 });

    // the Sun for scale on "10 times heavier"
    const si = back(seg(t, TL.ten - 0.1, TL.ten + 0.25), 1.6) * (1 - seg(t, TL.friend - 0.3, TL.friend));
    if (si > 0) {
      sun(x, 140, 860, 34 * si, t);
      pill(x, 470, 860, 'mass = 10 Suns', 34, { s: back(seg(t, TL.ten, TL.ten + 0.3)) * (1 - seg(t, TL.friend - 0.3, TL.friend)), bg: C.yellow });
    }

    // you: fall along a shrinking swirl, stop at the edge on "freeze"
    const fu = eio(seg(t, TL.fall[0], TL.fall[1]));
    const ang = lerp(-2.0, -1.45, fu) + 0.25 * Math.sin(fu * 5), d = lerp(470, 195, fu);
    const yx = BX + Math.cos(ang) * d * 0.9, yy = BY + Math.sin(ang) * d;
    const red = seg(t, TL.red, TL.red + 0.5), frz = seg(t, TL.freeze, TL.freeze + 0.4);
    const yr = 46 * back(seg(t, TL.intro - 0.4, TL.intro + 0.2), 1.4);
    if (yr > 1) {
      x.save(); x.globalAlpha *= 1 - 0.45 * frz;
      you(x, yx, yy - yr, yr, 1, 1, { look: [0.3, 0.8], worry: red > 0.3 ? 1 : 0, red, t: frz > 0 ? TL.freeze : t, armUp: 0.3 + 0.3 * Math.sin(t * 3) * (1 - frz) });
      x.restore();
      if (frz > 0) { glow(x, yx, yy, 90, '#9fe8ff', 0.35 * frz); for (let i = 0; i < 4; i++) { const q = H.rng(60 + i); spark(x, yx + q.range(-55, 55), yy + q.range(-55, 55), q.range(6, 11) * (0.6 + 0.4 * Math.sin(t * 4 + i)), '#dff8ff', frz); } }
    }
    // the clock beside you
    const cs = back(seg(t, TL.clock - 0.3, TL.clock + 0.05), 1.6);
    clock(x, yx + 100, yy - 60, 40, clockAngle(t), cs * (1 - 0.3 * frz));
    pill(x, yx + 100, yy - 140, 'time slows', 30, { s: back(seg(t, TL.slow, TL.slow + 0.3)) * (1 - seg(t, TL.red - 0.2, TL.red + 0.1)), bg: C.yellow, ptr: true });

    // your friend, far away, watching
    const fs = back(seg(t, TL.friend - 0.25, TL.friend + 0.15), 1.5);
    if (fs > 0) {
      const fx = 120, fy = 830 + Math.sin(t * 2) * 6;
      glow(x, fx, fy + 40, 50, '#ffb070', 0.5 * fs);
      x.save(); x.translate(fx, fy); x.scale(fs, fs); buddy(x, 0, 0, 38, { col: PINK, look: [0.8, -0.6], worry: red > 0.5 ? 1 : 0, t, ph: 1.3 }); x.restore();
      pill(x, fx + 20, fy + 78, 'friend', 28, { s: back(seg(t, TL.friend, TL.friend + 0.3)), ptr: 'up' });
      // sight line from friend to you
      arrow(x, line([fx + 40, fy - 30], [yx - 40, yy + 30]), eio(seg(t, TL.friend + 0.1, TL.friend + 0.6)), '#ffffff', 6, { dots: true, a: 0.6, head: false });
    }
    // "frozen forever"
    const fp = back(seg(t, TL.forever, TL.forever + 0.3), 1.6);
    if (fp > 0) { x.save(); x.translate(W / 2, 255); x.scale(fp, fp); text(x, 'FROZEN', 0, -38, 78, '#bff3ff'); text(x, 'FOREVER?', 0, 42, 78, C.yellow); x.restore(); }
    const ep = back(seg(t, TL.freeze, TL.freeze + 0.3)) * (1 - seg(t, TL.white[0], TL.white[0] + 0.2));
    pill(x, BX + 190, BY + 150, 'the edge', 30, { s: ep, bg: '#ffffff', ptr: 'up' });
  }

  // ================= SCENE B: close-up, the stretch =================
  function exB(x, W, H_, t) {
    const sk = shake(t, TL.hit, 12, 0.5);
    x.save(); x.translate(sk, sk * 0.4);
    const zin = eio(seg(t, TL.cutB, TL.cutB + 0.9));
    sky(x, W, H_, t, { z: lerp(1.6, 1.1, zin) + 0.1 * seg(t, TL.cutB, TL.cutC), x: 300 + t * 6, y: -t * 20 });
    const BX = W / 2, BY = 1150, BR = 130;
    blackhole(x, BX, BY, BR, t, { tilt: 0, k: 1 + 0.4 * Math.max(0, 1 - Math.abs(t - TL.hit) / 0.6) });

    // stretch amounts: first into a noodle, then the key hit pulls it all the way down
    const st = eio(seg(t, TL.stretch[0], TL.stretch[1]));
    const st2 = eio(seg(t, TL.edge, TL.hit + 0.6));
    const r = 62, top = lerp(470, 330, st) + 60 * st2 + Math.sin(t * 1.4) * 6 * (1 - st);
    const sy = 1 + 2.1 * st + 2.6 * st2, sx = 1 - 0.5 * st - 0.2 * st2;
    const cy = you(x, BX + Math.sin(t * 2.2) * 6 * st, top, r, sx, sy, { look: [0, 0.9], worry: 1, t, armUp: 0.8, rot: Math.sin(t * 3) * 0.04 * st });
    const feetY = cy + r * sy, headY = top;

    // pull arrows: long one at the feet, short one at the head
    const aOut = 1 - seg(t, TL.stretch[0], TL.stretch[0] + 0.3);
    if (aOut > 0) {
      const fa = eio(seg(t, TL.feet, TL.feet + 0.45)), ha = eio(seg(t, TL.head, TL.head + 0.35));
      arrow(x, line([BX + 120, feetY - 20], [BX + 120, feetY + 230]), fa, C.yellow, 14, { a: aOut });
      pill(x, BX + 230, feetY + 90, 'feet', 32, { s: back(seg(t, TL.feet, TL.feet + 0.3)) * aOut, bg: C.yellow });
      arrow(x, line([BX - 120, headY + 10], [BX - 120, headY + 80]), ha, '#7ff0ff', 10, { a: aOut });
      pill(x, BX - 230, headY + 40, 'head', 32, { s: back(seg(t, TL.head, TL.head + 0.3)) * aOut, bg: C.cyan });
    }
    // falling dust streaming into the hole
    for (let i = 0; i < 14; i++) {
      const q = H.rng(300 + i), u = (t * q.range(0.25, 0.5) + q()) % 1, px = lerp(q.range(40, 680), BX, u * u), py = lerp(q.range(150, 600), BY, u * u);
      spark(x, px, py, q.range(4, 8) * (1 - u), '#ffe9c7', 0.7);
    }

    // SPAGHETTIFICATION
    const sp = back(seg(t, TL.spag, TL.spag + 0.35), 1.6) * (1 - seg(t, TL.spagOut, TL.spagOut + 0.25));
    if (sp > 0 && !COLD) { x.save(); x.translate(W / 2, 200); x.scale(sp, sp); text(x, 'SPAGHETTI-', 0, -40, 72, C.yellow); text(x, 'FICATION', 0, 40, 72, C.yellow); x.restore(); }

    // the key hit
    if (t > TL.hit - 0.05 && !COLD) {
      const hk = Math.max(0, 1 - Math.abs(t - TL.hit - 0.15) / 0.75);
      flare(x, W / 2, 200, hk * 0.8, t);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.hit, TL.hit + 0.35) * Math.PI), s = back(seg(t, TL.hit - 0.05, TL.hit + 0.25), 1.6) * pop;
      x.save(); x.translate(W / 2, 175); x.scale(s, s); text(x, '20,000,000×', 0, 0, 112, C.yellow); x.restore();
      const ws = back(seg(t, TL.word, TL.word + 0.3));
      x.save(); x.translate(W / 2, 268); x.scale(ws, ws); text(x, "Earth's gravity", 0, 0, 50, '#ffffff'); x.restore();
      burst(x, W / 2, 190, (t - TL.hit) * 1.0, 97, 320);
    }
    x.restore();
    const fl = Math.max(0, 1 - Math.abs(t - (TL.hit + 0.05)) / 0.25);
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE C: a giant black hole, then deep inside =================
  function exC(x, W, H_, t) {
    const gin = eo(seg(t, TL.sweep[0] + 0.3, TL.sweep[1] + 0.6));
    sky(x, W, H_, t, { z: lerp(1.3, 1.05, gin) + 0.15 * seg(t, TL.cutC, TL.dive[0]), x: 600 + t * 5, y: t * 6 });
    const BX = W / 2, BY = 720, BR = lerp(150, 190, gin);
    blackhole(x, BX, BY, BR, t, { tilt: -0.1 });
    pill(x, W / 2, 300, 'giant black hole', 36, { s: back(seg(t, TL.giant, TL.giant + 0.3)) * (1 - seg(t, TL.nothing - 0.2, TL.nothing)), bg: C.violet, fg: '#ffffff' });

    // tiny you drifts in calmly, happy
    const fu = eio(seg(t, TL.fallC[0], TL.fallC[1]));
    const yx = BX + lerp(-40, 0, fu), yy = lerp(330, BY - 10, fu), yr = lerp(40, 24, fu) * back(seg(t, TL.fallC[0] - 0.3, TL.fallC[0]), 1.4);
    if (yr > 1 && t < TL.dive[0] + 0.2) you(x, yx, yy - yr, yr, 1, 1, { happy: seg(t, TL.giant, TL.giant + 0.2) > 0.5 ? 1 : 0, look: [0, 0.6], t, armUp: 0.6 });
    const nb = back(seg(t, TL.nothing, TL.nothing + 0.3), 1.6) * (1 - seg(t, TL.dive[0], TL.dive[0] + 0.3));
    badge(x, W / 2 + 140, 430, 34, true, nb);
    pill(x, W / 2, 330, 'feels nothing', 36, { s: nb, bg: C.green });

    // the dive inside: darkness spreads from the hole
    const dv = eio(seg(t, TL.dive[0], TL.dive[1]));
    if (dv > 0) {
      const R = lerp(BR, 1500, dv);
      x.fillStyle = '#05040f'; x.beginPath(); x.arc(BX, BY, R, 0, TAU); x.fill();
      x.save(); x.beginPath(); x.arc(BX, BY, R, 0, TAU); x.clip();
      // swirling glowing rings inside
      for (let i = 0; i < 5; i++) {
        x.save(); x.translate(W / 2, 640); x.rotate(t * (0.4 + i * 0.15) * (i % 2 ? -1 : 1));
        x.strokeStyle = H.rgba(i % 2 ? '#8b5cff' : '#ff8d3f', 0.35); x.lineWidth = 6; x.setLineDash([10, 30]);
        x.beginPath(); x.ellipse(0, 0, 120 + i * 70, (120 + i * 70) * 0.8, 0, 0, TAU); x.stroke(); x.restore();
      }
      glow(x, W / 2, 640, 300, '#8b5cff', 0.3);
      // you, stretching into spaghetti again
      const s2 = eio(seg(t, TL.spag2 - 0.3, TL.spag2 + 0.6)), ii = back(seg(t, TL.dive[0] + 0.3, TL.dive[0] + 0.7), 1.4);
      if (ii > 0) you(x, W / 2, lerp(560, 400, s2), 46 * ii, 1 - 0.55 * s2, 1 + 3.2 * s2, { worry: 1, look: [0, 0.9], t, armUp: 0.8, rot: Math.sin(t * 3) * 0.05 * s2 });
      x.restore();
      const sp = back(seg(t, TL.spag2, TL.spag2 + 0.35), 1.6);
      if (sp > 0) {
        flare(x, W / 2, 240, Math.max(0, 1 - Math.abs(t - TL.spag2 - 0.2) / 0.8) * 0.5, t);
        x.save(); x.translate(W / 2, 230); x.scale(sp, sp); text(x, 'STILL', 0, -50, 62, '#ffffff'); text(x, 'SPAGHETTI!', 0, 32, 92, C.yellow); x.restore();
        burst(x, W / 2, 230, (t - TL.spag2) * 1.1, 23, 280);
      }
    }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.cutB) exA(x, W, H_, t);
    else if (t < TL.sweep[0] || (t < TL.sweep[1] && spx > W / 2)) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    if (sw > 0 && sw < 1) planet(x, spx, 640 + (sw - 0.5) * 140, 900, PL.magenta, { glowA: 0.4 });
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cutB) * (1 - seg(t, TL.cutB, TL.white[1])));
  }
  const planet = FLAT.planet;

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, hit, whoosh } = S;
    // A: hole appears, the Sun for scale
    air(TL.hole[0], 0.9, 900, 0.7, 0, 0.6, true);
    k.tone(TL.hole[0], { f: [[0, 55], [0.9, 42]], dur: 1.6, gain: 0.14, a: 0.3 });
    boop(backPeak(TL.ten - 0.1, TL.ten + 0.25, 1.6), 380, 0.9, pan(140));
    pluck(backPeak(TL.ten, TL.ten + 0.3), 'E4', 0.8, pan(470));
    // friend, clock ticking and slowing
    boop(backPeak(TL.friend - 0.25, TL.friend + 0.15, 1.5), 460, 0.8, pan(120));
    tocksAlong(TL.friend + 0.1, TL.friend + 0.6, 4, 640, 30, 0.25, -0.2);
    pluck(backPeak(TL.clock - 0.3, TL.clock + 0.05, 1.6), 'G4', 0.7, 0.2);
    { let tt = TL.clock, gap = 0.18; while (tt < TL.freeze) { k.play('tick', tt, { f: 2200, gain: 0.32, pan: 0.2, minor: true }); gap *= 1.22; tt += gap; } }
    pluck(backPeak(TL.slow, TL.slow + 0.3), 'C5', 0.6, 0.2, true);
    k.tone(TL.red, { f: [[0, 330], [0.6, 220]], type: 'triangle', dur: 0.7, gain: 0.08, a: 0.05 });
    k.play('sparkle', TL.freeze + 0.05, { gain: 0.7, n: 5 });
    chord(backPeak(TL.forever, TL.forever + 0.3, 1.6), ['D3', 'A3', 'F4', 'A4'], 0.9, 1.6);
    // whiteout into the close-up
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.2, 0, 0.55);
    chord(TL.cutB, ['C3', 'G3', 'E4'], 0.6, 1.2);
    // B: pull arrows
    tocksAlong(TL.feet, TL.feet + 0.45, 5, 520, -30, 0.35, pan(480));
    pluck(backPeak(TL.feet, TL.feet + 0.3), 'D4', 0.8, pan(590));
    tocksAlong(TL.head, TL.head + 0.35, 3, 760, 20, 0.25, pan(240));
    pluck(backPeak(TL.head, TL.head + 0.3), 'A4', 0.6, pan(130), true);
    // the stretch: a rising rubbery tone
    k.tone(TL.stretch[0], { f: [[0, 180], [TL.stretch[1] - TL.stretch[0], 520]], type: 'triangle', dur: TL.stretch[1] - TL.stretch[0] + 0.1, gain: 0.09, a: 0.1 });
    air(TL.stretch[0], TL.stretch[1] - TL.stretch[0], 1600, 0.6, 0, 0.7);
    const sp = backPeak(TL.spag, TL.spag + 0.35, 1.6);
    pluck(sp, 'C4', 1.0, 0); pluck(sp + 0.07, 'G4', 0.8, 0); k.play('sparkle', sp + 0.05, { gain: 0.6, n: 4 });
    k.play('riser', TL.edge, { dur: Math.max(0.3, TL.hit - 0.3 - TL.edge), gain: 0.7 });
    // THE key hit (0.3 s gap before it)
    hit(TL.hit);
    pluck(backPeak(TL.word, TL.word + 0.3), 'E4', 0.7, 0, true);
    // sweep to the giant hole
    whoosh(TL.sweep[0]);
    pluck(backPeak(TL.giant, TL.giant + 0.3), 'G4', 0.8, 0);
    air(TL.fallC[0], TL.fallC[1] - TL.fallC[0], 800, 0.4, 0, 0.6, true);
    const nb = backPeak(TL.nothing, TL.nothing + 0.3, 1.6);
    chord(nb, ['C3', 'G3', 'C4', 'E4', 'G4'], 0.9, 1.6); boop(nb, 520, 0.9, pan(500), false);
    // dive inside, still spaghetti
    air(TL.dive[0], TL.dive[1] - TL.dive[0] + 0.2, 1800, 1.1, 0, 0.6);
    k.tone(TL.dive[0], { f: [[0, 90], [0.8, 45]], dur: 1.2, gain: 0.15, a: 0.2 });
    const s2 = backPeak(TL.spag2, TL.spag2 + 0.35, 1.6);
    chord(s2, ['A2', 'E3', 'A3', 'C4', 'E4'], 1.0, 2.2); pluck(s2, 'A4', 0.9, 0); k.play('sparkle', s2 + 0.05, { gain: 0.8, n: 6 });
  }

  SCENE({
    init,
    // cold open: the hook line plays over you being stretched into a noodle above the hole, in slow motion
    cold: () => TL.hit + 0.1,
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
