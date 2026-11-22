// Astrivo Short 2026-11-22-2: "Why the Moon Looks Huge This Week" (Beaver supermoon, Tue Nov 24 2026)
// Scenes: A orbit (circle -> oval, farthest -> Tuesday, counter) | sweep | B city: supermoon vs smallest moon, moonrise
//         | whiteout | C orbit again: December even closer, zoom into the Moon for the loop.
(function () {
  const { TAU, cl, lerp, seg, eo, eio, back, C, PL, rr, glow, spark, arrow, line, text, pill, flare, burst,
    sky, planet, moonGlow, earth, city, buddy, badge, sweep, whiteout } = FLAT;
  let TL = null, COLD = false;

  function init(T) {
    const s = T.s, w = (q, i) => T.word(q, i);
    TL = {
      intro: s(1), circ: [s(1) - 0.4, s(1) + 0.5], circle: w('circle', 1), oval: w('oval', 1),
      far: w('farthest', 2), distNum: w('406,000', 2), awayPill: w('away', 2),
      swing: [w('swings', 3) - 0.2, w('360,765', 3) + 0.25], tues: w("tuesday's", 3), n360: w('360,765', 3),
      n45: w('45,000', 4), push: [s(4), T.e(4)],
      sweep: [s(5) - 0.25, s(5) + 0.5], rise: [s(5) + 0.25, s(5) + 1.3], superW: w('supermoon', 5),
      split: [s(6) - 0.1, s(6) + 0.6], smallest: w('smallest', 6), n14: w('14%', 6), bigger: w('bigger', 6),
      n30: w('30%', 6), bright: w('brighter', 6),
      low: [s(7) - 0.2, s(7) + 1.0], look7: w('look', 7), rises: w('rises', 7), glowing: w('glowing', 7), horizon: w('horizon', 7),
      white: [s(8) - 0.4, s(8) + 0.35], cut3: s(8), first: w('first', 8), dec: w('december', 8), n356: w('356,738', 8),
      fin: [s(9) - 0.1, T.D], tue9: w('tuesday', 9), lookUp: w('look', 9), closer9: w('closer', 9),
      D: T.D,
    };
  }

  // ---------- orbit geometry (cartoon, eccentricity exaggerated) ----------
  const OC = [360, 560], OA = 300, OB = 270, FOC = Math.sqrt(OA * OA - OB * OB); // vertical major axis
  const EX = 360, EY = OC[1] - FOC, ER = 62;                                   // Earth sits at the upper focus
  const R0 = 250;                                                               // the "circle" before the morph
  // shape: m = 0 circle round Earth, 1 = the oval
  const shape = (m) => ({ cx: EX, cy: lerp(EY, OC[1], m), rx: lerp(R0, OB, m), ry: lerp(R0, OA, m) });
  const onShape = (S, phi) => [S.cx + S.rx * Math.sin(phi), S.cy - S.ry * Math.cos(phi)]; // phi 0 = top (perigee)

  function moonPhi(t) {
    let p = lerp(0.7, 2.1, seg(t, TL.intro - 0.4, TL.distNum - 0.4));
    p = lerp(p, Math.PI, eio(seg(t, TL.far - 0.3, TL.distNum + 0.1)));
    p = lerp(p, TAU, eio(seg(t, TL.swing[0], TL.swing[1])));
    return p;
  }
  function distVal(t) {
    return Math.round(lerp(406000, 360765, H.ease.inOut(seg(t, TL.swing[0], TL.swing[1]))));
  }

  function dottedOval(x, S, prog, col, a) {
    if (prog <= 0) return;
    x.save(); x.globalAlpha *= a; x.strokeStyle = col; x.lineWidth = 7; x.lineCap = 'round'; x.setLineDash([0.01, 17]);
    x.beginPath(); x.ellipse(S.cx, S.cy, S.rx, S.ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * prog); x.stroke(); x.restore();
  }

  // ================= SCENE A: the orbit =================
  function exA(x, W, H_, t) {
    const ein = eo(seg(t, TL.intro - 0.4, TL.intro + 0.7));
    const pz = 1 + 0.08 * eio(seg(t, TL.push[0], TL.push[1]));
    sky(x, W, H_, t, { z: (1 + 1.2 * (1 - ein)) * pz, x: t * 9, y: -t * 4 });
    planet(x, 120 + t * 2, 1180 - t * 3, 30, PL.teal, { glowA: 0.2 });
    x.save(); x.translate(W / 2, 560); x.scale(pz, pz); x.translate(-W / 2, -560);

    const m = eio(seg(t, TL.oval - 0.1, TL.oval + 0.55)), S = shape(m);
    const draw = eio(seg(t, TL.circ[0], TL.circ[1]));
    const ovalK = Math.max(0, 1 - Math.abs(t - TL.oval - 0.4) / 0.6);
    dottedOval(x, S, draw, H.mix('#7ff0ff', C.yellow, ovalK), 0.9);

    // Earth
    const es = back(seg(t, TL.intro - 0.4, TL.intro + 0.1), 1.3);
    glow(x, EX, EY, ER * 2.2, '#56e8ff', 0.25 * es);
    earth(x, EX, EY, ER * es, { spin: t * 0.25, t });

    // Moon on the orbit
    const phi = moonPhi(t), [mx, my] = onShape(S, phi);
    const close = eio(seg(t, TL.swing[0], TL.swing[1]));
    const mr = lerp(30, 42, close) * back(seg(t, TL.intro - 0.3, TL.intro + 0.2), 1.4);
    moonGlow(x, mx, my, mr, 0.3 + 0.3 * close);
    planet(x, mx, my, mr, PL.moon);

    // distance line Earth -> Moon
    const dA = eio(seg(t, TL.distNum - 0.35, TL.distNum + 0.1));
    if (dA > 0) {
      const ang = Math.atan2(my - EY, mx - EX), a0 = [EX + Math.cos(ang) * (ER + 14), EY + Math.sin(ang) * (ER + 14)], a1 = [mx - Math.cos(ang) * (mr + 12), my - Math.sin(ang) * (mr + 12)];
      arrow(x, line(a0, a1), dA, '#7ff0ff', 7, { dots: true, a: 0.85 });
    }

    // circle X, then oval tick
    const xb = back(seg(t, TL.circle, TL.circle + 0.3), 1.6) * (1 - seg(t, TL.oval - 0.1, TL.oval + 0.1));
    if (xb > 0) badge(x, EX, EY + 175, 46, false, xb);
    const op = back(seg(t, TL.oval + 0.2, TL.oval + 0.5)) * (1 - seg(t, TL.far - 0.3, TL.far));
    pill(x, EX, EY + 185, 'oval orbit', 38, { s: op, bg: C.yellow });

    // labels on the Moon
    const fp = back(seg(t, TL.far + 0.15, TL.far + 0.45)) * (1 - seg(t, TL.swing[0], TL.swing[0] + 0.3));
    pill(x, mx + 155, my, 'farthest', 32, { s: fp, bg: '#ffffff' });
    const tp = back(seg(t, TL.n360 + 0.15, TL.n360 + 0.45));
    pill(x, mx + 150, my + 6, 'Tuesday', 32, { s: tp, bg: C.yellow });
    x.restore();

    // counter (top)
    if (t > TL.distNum - 0.2) {
      const ia = back(seg(t, TL.distNum - 0.2, TL.distNum + 0.15), 1.6);
      const land = seg(t, TL.n360, TL.n360 + 0.35), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      const v = distVal(t), s = (land <= 0 && t < TL.swing[0] ? 'about ' : '') + v.toLocaleString('en-US') + ' km';
      x.save(); x.translate(W / 2, 128); x.scale(ia * pop, ia * pop);
      text(x, s, 0, 0, land > 0 ? 74 : 64, land > 0 ? C.yellow : '#ffffff'); x.restore();
      text(x, 'Moon distance', W / 2, 62, 30, '#bfe9ff', { a: ia });
      if (land > 0) burst(x, W / 2, 128, land * 1.2, 41, 220);
    }
    // -45,000 km
    const n4 = back(seg(t, TL.n45 - 0.05, TL.n45 + 0.3), 1.6);
    if (n4 > 0) {
      const age = t - TL.n45;
      flare(x, W / 2, 790, Math.max(0, 1 - Math.abs(age - 0.15) / 0.7) * 0.6, t);
      const pop = 1 + 0.18 * Math.sin(seg(t, TL.n45, TL.n45 + 0.35) * Math.PI);
      x.save(); x.translate(W / 2, 790); x.scale(n4 * pop, n4 * pop);
      text(x, '-45,000 km', 0, 0, 104, C.yellow); text(x, 'closer!', 0, 82, 48, '#ffffff'); x.restore();
      burst(x, W / 2, 790, age * 1.1, 77, 300);
    }
  }

  // ================= SCENE B: over the city =================
  const G = 1085;
  function drawCity(x, W) {
    for (const b of city(W)) {
      const top = G - b.h;
      x.fillStyle = b.c; rr(x, b.x, top, b.w, b.h + 260, 8); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.08)'; rr(x, b.x + 4, top + 4, b.w * 0.3, b.h, 6); x.fill();
      const q = H.rng(b.win);
      for (let wy = top + 18; wy < G + 200; wy += 30) for (let wx = b.x + 10; wx < b.x + b.w - 16; wx += 20) {
        if (!q.chance(0.55)) continue;
        x.fillStyle = q.chance(0.8) ? 'rgba(255,214,90,0.9)' : 'rgba(150,230,255,0.8)'; rr(x, wx, wy, 9, 13, 3); x.fill();
      }
    }
  }
  function goldMoon(x, cx, cy, r, gold, glowA) {
    moonGlow(x, cx, cy, r, glowA);
    if (gold > 0) glow(x, cx, cy, r * 1.9, '#ffb347', glowA * gold);
    planet(x, cx, cy, r, PL.moon);
    if (gold > 0) { x.save(); x.globalAlpha = 0.45 * gold; x.globalCompositeOperation = 'multiply'; x.fillStyle = '#ffb35a'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.restore(); }
  }
  function exB(x, W, H_, t) {
    const hitK = Math.max(0, 1 - Math.abs(t - TL.bright - 0.15) / 0.8) * (t > TL.bright ? 1 : 0);
    const shk = t > TL.bright ? Math.sin(t * 61) * 11 * Math.max(0, 1 - (t - TL.bright) / 0.45) : 0;
    x.save(); x.translate(shk, shk * 0.4);
    sky(x, W, H_, t, { x: 200 + t * 8, y: 40, z: 1 + 0.04 * seg(t, TL.sweep[1], TL.white[0]) });
    const lowK = eio(seg(t, TL.low[0], TL.low[1]));
    glow(x, W / 2, 1080, 640, H.mix('#6a4cff', '#ff8a50', lowK * 0.6), 0.35 + 0.15 * lowK);

    // the supermoon: rises, slides right for the comparison, grows 14 %, then sinks to the horizon
    const ri = back(seg(t, TL.rise[0], TL.rise[1]), 1.1), sp = eio(seg(t, TL.split[0], TL.split[1]));
    const g14 = back(seg(t, TL.n14, TL.n14 + 0.4), 1.4);
    let MX = lerp(360, 495, sp), MY = lerp(lerp(1200, 500, ri), 560, sp), MR = lerp(165, 104, sp) * (1 + 0.14 * g14);
    MX = lerp(MX, 450, lowK); MY = lerp(MY, 850, lowK); MR = lerp(MR, 165, lowK);
    const bk = seg(t, TL.bright, TL.bright + 0.3);
    const glowPulse = Math.max(0, 1 - Math.abs(t - TL.glowing - 0.3) / 0.8);
    goldMoon(x, MX, MY, MR, lowK, 0.3 + 0.45 * bk + 0.3 * hitK + 0.25 * glowPulse);
    if (bk > 0 && lowK < 1) glow(x, MX, MY, MR * 2.6, '#fff6d0', (0.22 * bk + 0.3 * hitK) * (1 - lowK));

    // the smallest full Moon (left)
    const sa = sp * (1 - eio(seg(t, TL.low[0], TL.low[0] + 0.5)));
    if (sa > 0) {
      const sx = lerp(-150, 205, sp);
      x.save(); x.globalAlpha *= sa;
      moonGlow(x, sx, 560, 104, 0.2); planet(x, sx, 560, 104, PL.moon);
      x.restore();
      pill(x, sx, 708, 'smallest', 30, { s: back(seg(t, TL.smallest, TL.smallest + 0.3)) * sa, bg: '#ffffff' });
      pill(x, MX, 708, 'supermoon', 30, { s: back(seg(t, TL.smallest + 0.25, TL.smallest + 0.55)) * sa, bg: C.yellow });
    }
    drawCity(x, W);

    // SUPERMOON title
    const sw = back(seg(t, TL.superW, TL.superW + 0.35), 1.6) * (1 - seg(t, TL.split[0], TL.split[0] + 0.3));
    if (sw > 0) {
      flare(x, W / 2, 230, Math.max(0, 1 - Math.abs(t - TL.superW - 0.2) / 0.7) * 0.5, t);
      x.save(); x.translate(W / 2, 230); x.scale(sw, sw); text(x, 'SUPERMOON', 0, 0, 96, C.yellow); x.restore();
      burst(x, W / 2, 230, (t - TL.superW) * 1.1, 23, 260);
    }
    // +14 % bigger, then +30 % brighter (the key hit)
    const out = 1 - seg(t, TL.low[0], TL.low[0] + 0.35);
    const a14 = back(seg(t, TL.n14 - 0.05, TL.n14 + 0.3), 1.6) * out;
    if (a14 > 0) {
      const up = eio(seg(t, TL.n30 - 0.2, TL.n30 + 0.15));
      if (up < 1) {
        const pop = 1 + 0.18 * Math.sin(seg(t, TL.n14, TL.n14 + 0.35) * Math.PI), k = a14 * pop * (1 - up);
        x.save(); x.globalAlpha *= 1 - up; x.translate(W / 2, 205); x.scale(k, k); text(x, '+14%', 0, 0, 120, C.yellow); x.restore();
        const bw = back(seg(t, TL.bigger, TL.bigger + 0.3)) * out * (1 - up);
        x.save(); x.translate(W / 2, 296); x.scale(bw, bw); text(x, 'bigger', 0, 0, 50, '#ffffff'); x.restore();
      }
      if (up > 0) { x.save(); x.translate(W / 2, 128); x.scale(up * out, up * out); text(x, '+14% bigger', 0, 0, 48, '#ffffff'); x.restore(); }
    }
    const a30 = back(seg(t, TL.n30 - 0.05, TL.n30 + 0.3), 1.6) * out;
    if (a30 > 0) {
      flare(x, W / 2, 250, hitK * 0.85, t);
      const pop = 1 + 0.22 * Math.sin(seg(t, TL.bright, TL.bright + 0.35) * Math.PI);
      x.save(); x.translate(W / 2, 250); x.scale(a30 * pop, a30 * pop); text(x, '+30%', 0, 0, 132, C.yellow); x.restore();
      const bw = back(seg(t, TL.bright, TL.bright + 0.3), 1.6) * out;
      x.save(); x.translate(W / 2, 348); x.scale(bw, bw); text(x, 'brighter!', 0, 0, 56, '#ffffff'); x.restore();
      if (t > TL.bright) burst(x, W / 2, 250, (t - TL.bright) * 1.0, 97, 330);
    }

    // moonrise: buddy looks up, label
    const bd = back(seg(t, TL.look7 - 0.1, TL.look7 + 0.3), 1.4);
    if (bd > 0) buddy(x, 130, 862, 46 * bd, { t, look: [0.7, -0.6], happy: true, armUp: seg(t, TL.rises, TL.rises + 0.4) });
    const rp = back(seg(t, TL.rises, TL.rises + 0.3)) * (1 - seg(t, TL.white[0], TL.white[0] + 0.2));
    pill(x, 450, 610, 'moonrise', 34, { s: rp, bg: '#ffb347', ptr: true });
    if (t > TL.glowing) for (let i = 0; i < 6; i++) { const q = H.rng(300 + i); spark(x, q.range(300, 620), q.range(640, 800), q.range(7, 13) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#fff3c4', seg(t, TL.glowing, TL.glowing + 0.4)); }
    x.restore();
    const fl = Math.max(0, 1 - Math.abs(t - (TL.bright + 0.05)) / 0.25);
    if (fl > 0) { x.fillStyle = H.rgba('#fff6d0', 0.35 * fl); x.fillRect(0, 0, W, H_); }
  }

  // ================= SCENE C: December, even closer + loop =================
  function exC(x, W, H_, t) {
    const S = shape(1);
    const decK = eio(seg(t, TL.dec, TL.n356 + 0.2));
    const [nx, ny] = onShape(S, 0);
    const mx = nx, my = lerp(ny, ny + 28, decK);          // December's Moon swings in even closer
    const zk = eio(seg(t, TL.fin[0], TL.closer9 + 0.3)), z = lerp(1, 2.2, zk);
    const zc = eio(seg(t, TL.closer9, TL.closer9 + 0.6));
    sky(x, W, H_, t, { x: 400 + t * 10, y: 30, z: z * (1 + 0.3 * zc) });
    x.save();
    const fx = lerp(W / 2, mx, zk), fy = lerp(560, my, zk);
    x.translate(W / 2, lerp(560, 560, zk)); x.scale(z, z); x.translate(-fx, -fy);
    dottedOval(x, S, 1, '#7ff0ff', 0.75 * (1 - zk));
    earth(x, EX, EY, ER, { spin: t * 0.25, t });
    // November ghost
    if (decK > 0) { x.save(); x.globalAlpha *= 0.35 * (1 - zk); planet(x, nx, ny, 42, PL.moon); x.restore(); }
    const mr = 42 * (1 + 0.06 * decK) * (1 + 0.5 * zc);
    moonGlow(x, mx, my, mr, 0.4 + 0.3 * zc);
    planet(x, mx, my, mr, PL.moon);
    x.restore();
    const lab = 1 - seg(t, TL.fin[0], TL.fin[0] + 0.3);
    pill(x, W / 2 + 175, 262, 'supermoon #1', 30, { s: back(seg(t, TL.first, TL.first + 0.3)) * (1 - seg(t, TL.dec - 0.2, TL.dec)) * lab, bg: C.yellow });
    pill(x, W / 2 + 165, 262, 'Nov 24', 30, { s: back(seg(t, TL.dec, TL.dec + 0.3)) * lab, bg: '#ffffff' });
    pill(x, W / 2 - 165, 300, 'Dec 23', 30, { s: back(seg(t, TL.dec + 0.3, TL.dec + 0.6)) * lab, bg: C.cyan });
    // counter
    const ia = lab;
    if (ia > 0) {
      const land = seg(t, TL.n356, TL.n356 + 0.35), pop = 1 + 0.2 * Math.sin(land * Math.PI) * (land > 0 ? 1 : 0);
      const v = Math.round(lerp(360765, 356738, H.ease.inOut(seg(t, TL.dec, TL.n356))));
      x.save(); x.globalAlpha *= ia; x.translate(W / 2, 128); x.scale(pop, pop);
      text(x, v.toLocaleString('en-US') + ' km', 0, 0, land > 0 ? 74 : 64, land > 0 ? C.yellow : '#ffffff'); x.restore();
      text(x, 'Moon distance', W / 2, 62, 30, '#bfe9ff', { a: ia });
      if (land > 0) burst(x, W / 2, 128, land * 1.2, 51, 220);
      pill(x, W / 2, 760, 'even closer!', 38, { s: back(seg(t, TL.n356 + 0.2, TL.n356 + 0.5)) * lab, bg: C.yellow });
    }
    // final lines
    const l1 = back(seg(t, TL.tue9, TL.tue9 + 0.4)), l2 = back(seg(t, TL.lookUp, TL.lookUp + 0.4));
    x.save(); x.translate(W / 2, 170); x.scale(l1, l1); text(x, 'TUESDAY', 0, 0, 92, C.yellow); x.restore();
    x.save(); x.translate(W / 2, 262); x.scale(l2, l2); text(x, 'look up!', 0, 0, 64, '#ffffff'); x.restore();
    if (t > TL.lookUp + 0.3) for (let i = 0; i < 7; i++) { const q = H.rng(500 + i); spark(x, q.range(60, 620), q.range(110, 380), q.range(8, 15) * (0.5 + 0.5 * Math.sin(t * 3 + i)), '#ffffff', seg(t, TL.lookUp + 0.3, TL.lookUp + 0.7)); }
  }

  function draw(x, W, H_, t, T, L, o) {
    COLD = !!(o && o.cold);
    const sw = eio(seg(t, TL.sweep[0], TL.sweep[1])), spx = lerp(W + 1000, -1000, sw);
    if (t < TL.sweep[0] || (t < TL.sweep[1] && spx > W / 2)) exA(x, W, H_, t);
    else if (t < TL.cut3) exB(x, W, H_, t);
    else exC(x, W, H_, t);
    sweep(x, W, H_, sw, PL.moon);
    whiteout(x, W, H_, seg(t, TL.white[0], TL.cut3) * (1 - seg(t, TL.cut3, TL.white[1])));
  }

  function sound(k, T, L, S) {
    const { backPeak, pan, pluck, boop, air, chord, shimmer, tocksAlong, whoosh, hit } = S;
    // A: orbit
    boop(backPeak(TL.intro - 0.4, TL.intro + 0.1, 1.3), 300, 0.9, 0);
    tocksAlong(TL.circ[0], TL.circ[1], 6, 520, 30, 0.3, 0);
    k.play('tock', TL.circle + 0.05, { f: 220, gain: 0.5, minor: true });
    pluck(backPeak(TL.circle, TL.circle + 0.3, 1.6), 'D#4', 0.7, 0);
    air(TL.oval - 0.1, 0.65, 1200, 0.5, 0, 0.5, true);
    pluck(backPeak(TL.oval + 0.2, TL.oval + 0.5), 'E4', 0.9, 0); pluck(backPeak(TL.oval + 0.2, TL.oval + 0.5) + 0.07, 'B4', 0.7, 0);
    air(TL.far - 0.3, 0.5, 900, 0.4, 0, 0.5, true);
    pluck(backPeak(TL.far + 0.15, TL.far + 0.45), 'G4', 0.6, pan(515), true);
    tocksAlong(TL.distNum - 0.35, TL.distNum + 0.1, 5, 520, 40, 0.3, 0);
    pluck(backPeak(TL.distNum - 0.2, TL.distNum + 0.15, 1.6), 'E4', 1.0, 0);
    // counter runs down while the Moon swings in
    air(TL.swing[0], TL.swing[1] - TL.swing[0], 1500, 0.8, 0, 0.5);
    for (let tt = TL.swing[0], last = -1, lb = 41; tt < TL.swing[1] - 0.03; tt += 1 / 120) {
      const b = Math.floor(distVal(tt) / 4000);
      if (b !== lb && tt - last >= 1 / 11) { k.play('tock', tt, { f: 700 + (101 - b) * 25, gain: 0.4, minor: true }); lb = b; last = tt; }
    }
    pluck(TL.n360, 'A3', 1.1, 0); pluck(TL.n360 + 0.07, 'E4', 0.9, 0); pluck(TL.n360 + 0.14, 'A4', 0.7, 0);
    pluck(backPeak(TL.n360 + 0.15, TL.n360 + 0.45), 'C5', 0.5, pan(510), true);
    k.play('impact', TL.n45, { gain: 0.5 });
    chord(TL.n45, ['C3', 'G3', 'C4', 'E4'], 0.9, 1.4);
    k.play('sparkle', TL.n45 + 0.1, { gain: 0.6, n: 5 });
    // sweep
    whoosh(TL.sweep[0], 0.8);
    // B: city
    k.noise(TL.sweep[1], { dur: TL.white[1] - TL.sweep[1], color: 'pink', filter: 'bandpass', f: 700, q: 0.4, gain: 0.025, a: 0.5, hold: Math.max(0.1, TL.white[1] - TL.sweep[1] - 1.2), bus: 'amb' });
    air(TL.rise[0], 1.0, 900, 0.5, 0, 0.7, true);
    const sw = backPeak(TL.superW, TL.superW + 0.35, 1.6);
    chord(sw, ['C3', 'G3', 'C4', 'E4', 'G4'], 1.0, 1.8); pluck(sw, 'C5', 0.8, 0); k.play('sparkle', sw + 0.05, { gain: 0.8, n: 6 });
    air(TL.split[0], 0.7, 1100, 0.5, 0, 0.5, true);
    pluck(backPeak(TL.smallest, TL.smallest + 0.3), 'G4', 0.6, pan(205), true);
    pluck(backPeak(TL.smallest + 0.25, TL.smallest + 0.55), 'C5', 0.6, pan(495), true);
    const p14 = backPeak(TL.n14 - 0.05, TL.n14 + 0.3, 1.6);
    pluck(p14, 'A3', 1.0, 0); pluck(p14 + 0.07, 'E4', 0.8, 0); boop(p14, 420, 0.8, pan(495));
    pluck(backPeak(TL.bigger, TL.bigger + 0.3), 'E4', 0.6, 0, true);
    hit(TL.bright);                                         // THE key hit (silence before it: no sounds in the last 0.3 s)
    pluck(backPeak(TL.bright, TL.bright + 0.3, 1.6) + 0.1, 'E5', 0.6, 0, true);
    // moonrise
    k.play('swish', TL.low[0], { gain: 0.45, minor: true });
    boop(backPeak(TL.look7 - 0.1, TL.look7 + 0.3, 1.4), 520, 0.8, pan(130));
    pluck(backPeak(TL.rises, TL.rises + 0.3), 'D4', 0.8, pan(450));
    shimmer(TL.glowing + 0.1, ['E5', 'G5', 'B5', 'E6'], 0.5, 0.25);
    // whiteout into space
    air(TL.white[0], TL.white[1] - TL.white[0] + 0.1, 2200, 1.1, 0, 0.55);
    chord(TL.cut3, ['C3', 'G3', 'E4'], 0.6, 1.4);
    pluck(backPeak(TL.first, TL.first + 0.3), 'G4', 0.7, pan(535));
    pluck(backPeak(TL.dec, TL.dec + 0.3), 'E4', 0.6, pan(525), true);
    pluck(backPeak(TL.dec + 0.3, TL.dec + 0.6), 'A4', 0.6, pan(195), true);
    tocksAlong(TL.dec, TL.n356, 6, 600, 30, 0.3, 0);
    pluck(TL.n356, 'A3', 1.0, 0); pluck(TL.n356 + 0.08, 'E4', 0.8, 0);
    pluck(backPeak(TL.n356 + 0.2, TL.n356 + 0.5), 'C5', 0.6, 0, true);
    // ending: zoom into the Moon, loops into the hook
    air(TL.fin[0], 1.2, 1000, 0.6, 0, 0.5, true);
    const l1 = backPeak(TL.tue9, TL.tue9 + 0.4);
    pluck(l1, 'C4', 1.0, 0);
    const l2 = backPeak(TL.lookUp, TL.lookUp + 0.4);
    chord(l2, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], 1.0, 2.2);
    k.play('sparkle', l2 + 0.2, { gain: 0.7, n: 6 });
    k.play('riser', TL.closer9 - 0.1, { dur: 0.8, gain: 0.5 });
  }

  SCENE({
    init,
    cold: () => TL.bright + 0.12,   // hook over the "+30% brighter" supermoon moment
    coldSpeed: 0.35,
    draw,
    sound,
  });
})();
